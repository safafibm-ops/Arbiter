"""Policy Engine: every tool call and every agent-to-agent message passes here.

    1 Identify      which agent, valid token, not paused by the kill switch
    2 Language scan untrusted content in any language (Polyglot Shield)
    3 Permissions   is this tool, with these arguments, allowed for this agent? default deny
    4 Rules         built-in rule pack + the company's YAML rules + rules learned from approvals
    5 Chain check   no borrowed powers, who-may-message-whom, loops
    6 Risk score    0-100, every point explained
    7 Decide & log  allow / allow + alert / ask a human / block, with a plain-language reason
"""
from __future__ import annotations

import copy
import hashlib
import hmac
import math
import re
import threading
import time
import uuid
from collections import defaultdict
from pathlib import Path
from typing import Any, Callable

import yaml

from . import expr
from .audit import AuditLog
from .polyglot_scanner import PolyglotScanner, ScanResult

SECRET_PATTERNS = re.compile(r"(sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|password\s*[:=]\s*\S+|-----BEGIN [A-Z ]*PRIVATE KEY)", re.I)
STEP_NAMES = ["Identify", "Language scan", "Permissions", "Rules", "Chain check", "Risk score", "Decide"]


class AttrDict(dict):
    """dict that also allows attribute access, for '{order.total:,}' in reason templates."""

    def __getattr__(self, k):
        v = self.get(k)
        return AttrDict(v) if isinstance(v, dict) else v


def fmt(template: str, ctx: dict) -> str:
    wrapped = {k: AttrDict(v) if isinstance(v, dict) else v for k, v in ctx.items()}
    try:
        return template.format(**wrapped)
    except (KeyError, ValueError, TypeError, AttributeError, IndexError):
        return re.sub(r"\{[^}]*\}", "?", template)


def money(n: Any) -> str:
    try:
        return f"₹{int(n):,}"
    except (TypeError, ValueError):
        return str(n)


class PolicyEngine:
    def __init__(self, policy_path: str | Path, learned_path: str | Path | None = None,
                 scanner: PolyglotScanner | None = None, audit: AuditLog | None = None,
                 context_provider: Callable[[str, dict], dict] | None = None, secret: str = "arbiter-demo-secret"):
        self.policy_path = Path(policy_path)
        self.learned_path = Path(learned_path) if learned_path else None
        self.scanner = scanner or PolyglotScanner()
        self.audit = audit or AuditLog()
        self.context_provider = context_provider or (lambda tool, args: {})
        self._secret = secret.encode()
        self._lock = threading.RLock()
        self.listeners: list[Callable[[str, dict], None]] = []
        self.load_policy()
        self.reset_state()

    # ------------------------------------------------------------------ setup / state

    def load_policy(self) -> None:
        self.policy = yaml.safe_load(self.policy_path.read_text(encoding="utf-8"))
        for tool in self.policy.get("tools", {}).values():
            for r in tool.get("rules", []):
                expr.compile_rule(r["when"])  # fail fast on a bad rule
        self.learned: list[dict] = []
        if self.learned_path and self.learned_path.exists():
            self.learned = yaml.safe_load(self.learned_path.read_text(encoding="utf-8")) or []

    def reset_state(self) -> None:
        with self._lock:
            self.enforce = True
            self.kill_all = False
            self.paused_agents: dict[str, str] = {}
            self.disabled_tools: set[str] = set()
            self.trust: dict[str, int] = {a: 100 for a in self.policy["agents"]}
            self.history: list[dict] = []       # every checked action
            self.executed: list[dict] = []      # actions that actually ran
            self.blocks: dict[str, list[float]] = defaultdict(list)
            self.sessions: dict[str, dict] = defaultdict(lambda: {"scans": []})
            self.pending: dict[str, dict] = {}
            self.feed: list[dict] = []
            self.edges: dict[tuple, dict] = {}

    def forget_learned(self) -> None:
        self.learned = []
        if self.learned_path and self.learned_path.exists():
            self.learned_path.unlink()

    @property
    def settings(self) -> dict:
        return self.policy.get("settings", {})

    def token_for(self, agent_id: str) -> str:
        return hmac.new(self._secret, agent_id.encode(), hashlib.sha256).hexdigest()[:32]

    def agent_name(self, agent_id: str) -> str:
        return self.policy["agents"].get(agent_id, {}).get("name", agent_id)

    def emit(self, kind: str, data: dict) -> None:
        for fn in list(self.listeners):
            try:
                fn(kind, data)
            except Exception:
                pass

    def _new_verdict(self, kind: str, req: dict) -> dict:
        return {
            "id": uuid.uuid4().hex[:10], "ts": time.time(), "kind": kind,
            "agent": req.get("agent_id"), "agent_name": self.agent_name(req.get("agent_id", "?")),
            "tool": req.get("tool"), "to_agent": req.get("to_agent"), "args": req.get("args") or {},
            "chain": list(req.get("chain") or []), "session_id": req.get("session_id") or "default",
            "steps": [{"name": n, "status": "skip", "detail": ""} for n in STEP_NAMES],
            "factors": [], "hard": [], "scans": [], "needs_approval": [], "decision": None, "risk": 0,
            "reason": "", "plain": "", "learned_rule": None, "enforced": self.enforce, "would_have": None,
        }

    @staticmethod
    def _step(v: dict, name: str, status: str, detail: str) -> None:
        for s in v["steps"]:
            if s["name"] == name:
                s["status"], s["detail"] = status, detail

    # ------------------------------------------------------------------ 1 identify

    def _identify(self, v: dict, agent_id: str, token: str | None) -> bool:
        agent = self.policy["agents"].get(agent_id)
        if not agent:
            v["hard"].append({"rule": "unknown-agent", "reason": f"'{agent_id}' is not a registered agent", "identity": True})
            self._step(v, "Identify", "fail", "unregistered agent")
            return False
        if not token or not hmac.compare_digest(token, self.token_for(agent_id)):
            v["hard"].append({"rule": "bad-token", "identity": True,
                              "reason": f"the caller claims to be {agent['name']} but its signed token doesn't match (impersonation)"})
            self._step(v, "Identify", "fail", "token doesn't match: impersonation")
            return False
        if self.kill_all:
            v["hard"].append({"rule": "kill-switch", "reason": "the kill switch is on: all agents are stopped", "identity": True})
            self._step(v, "Identify", "fail", "kill switch: all agents stopped")
            return False
        if agent_id in self.paused_agents:
            v["hard"].append({"rule": "agent-paused", "identity": True,
                              "reason": f"{agent['name']} is paused ({self.paused_agents[agent_id]})"})
            self._step(v, "Identify", "fail", "agent paused")
            return False
        self._step(v, "Identify", "pass", f"{agent['name']} · role {agent.get('role')} · token verified")
        return True

    # ------------------------------------------------------------------ 2 language scan

    def scan_content(self, session_id: str, text: str, source: str, agent_id: str | None = None,
                     emit: bool = True) -> ScanResult:
        res = self.scanner.scan(text, source)
        with self._lock:
            self.sessions[session_id or "default"]["scans"].append(res)
        if emit:
            d = {"id": uuid.uuid4().hex[:10], "ts": time.time(), "kind": "scan", "agent": agent_id,
                 "agent_name": self.agent_name(agent_id) if agent_id else "", "session_id": session_id,
                 "decision": "flag" if res.is_injection else "clean", "risk": 25 if res.is_injection else 0,
                 "reason": res.summary, "plain": res.summary, "scans": [res.to_dict()]}
            self.audit.append("scan", agent_id or "-", d["decision"], d["risk"], res.summary,
                              {"source": source, "languages": res.languages, "tricks": res.tricks})
            self._push_feed(d)
            self.emit("decision", d)
        return res

    def _taint(self, v: dict, req: dict) -> list[ScanResult]:
        sid = v["session_id"]
        for i, text in enumerate(req.get("content") or []):
            self.scan_content(sid, text, req.get("content_source") or "untrusted content", req.get("agent_id"), emit=False)
        scans = list(self.sessions[sid]["scans"]) if sid in self.sessions else []
        v["scans"] = [s.to_dict() for s in scans]
        bad = [s for s in scans if s.is_injection]
        if bad:
            s = bad[0]
            self._step(v, "Language scan", "fail", f"hidden instruction in untrusted {s.language_label} {s.source}")
        elif scans:
            langs = sorted({l for s in scans for l in s.languages})
            self._step(v, "Language scan", "pass", f"{len(scans)} untrusted text(s) scanned ({', '.join(langs)}): clean")
        else:
            self._step(v, "Language scan", "pass", "no untrusted content in this request")
        return bad

    # ------------------------------------------------------------------ the action pipeline

    def evaluate_action(self, req: dict) -> dict:
        with self._lock:
            return self._evaluate_action(req)

    def _evaluate_action(self, req: dict) -> dict:
        v = self._new_verdict("action", req)
        agent_id, tool_name, args = req.get("agent_id"), req.get("tool"), dict(req.get("args") or {})
        agents, tools = self.policy["agents"], self.policy.get("tools", {})
        tool = tools.get(tool_name)
        now = time.time()

        ok_identity = self._identify(v, agent_id, req.get("token"))
        bad_scans = self._taint(v, req)

        ctx = dict(args)
        try:
            ctx.update(self.context_provider(tool_name, args) or {})
        except Exception as e:  # unknown order etc.
            ctx["context_error"] = str(e)
        ctx["settings"] = self.settings
        ctx["agent"] = {"id": agent_id, "role": agents.get(agent_id, {}).get("role")}
        v["context"] = {k: ctx[k] for k in ("customer_name", "order_id") if k in ctx}

        # 3 permissions
        if ok_identity:
            perm = agents[agent_id].get("tools", {})
            if tool is None:
                v["hard"].append({"rule": "unknown-tool", "reason": f"'{tool_name}' isn't a known tool (default deny)"})
                self._step(v, "Permissions", "fail", "unknown tool: default deny")
            elif tool_name in self.disabled_tools:
                v["hard"].append({"rule": "tool-disabled", "reason": f"the {tool_name} tool is switched off by the kill switch"})
                self._step(v, "Permissions", "fail", "tool switched off")
            elif tool_name not in perm:
                v["hard"].append({"rule": "not-permitted", "reason": f"{self.agent_name(agent_id)} isn't allowed to use {tool_name}"})
                self._step(v, "Permissions", "fail", f"{tool_name} not in its allow-list")
            else:
                lim = perm[tool_name] or {}
                if "max_amount" in lim and (args.get("amount") or 0) > lim["max_amount"]:
                    v["hard"].append({"rule": "agent-limit",
                                      "reason": f"{self.agent_name(agent_id)}'s limit is {money(lim['max_amount'])}"})
                    self._step(v, "Permissions", "fail", f"over its {money(lim['max_amount'])} limit")
                else:
                    self._step(v, "Permissions", "pass", f"{tool_name} allowed" + (
                        f" up to {money(lim['max_amount'])}" if "max_amount" in lim else ""))

        if tool:
            v["factors"].append({"label": f"{tool_name} base risk", "points": tool.get("base_risk", 50)})

            # 4 rules: company YAML rules
            fired = []
            for r in tool.get("rules", []):
                if not expr.check(r["when"], ctx):
                    continue
                reason = fmt(r.get("reason", r["id"]), ctx)
                fired.append(r["id"])
                if r["then"] == "block":
                    v["hard"].append({"rule": r["id"], "reason": reason})
                elif r["then"] == "require_approval":
                    v["needs_approval"].append({"rule": r["id"], "reason": reason})
                    if r.get("risk"):
                        v["factors"].append({"label": reason[0].upper() + reason[1:], "points": r["risk"]})
                elif r["then"] == "score":
                    v["factors"].append({"label": reason[0].upper() + reason[1:], "points": r.get("risk", 10)})

            # 4 rules: built-in pack
            recent = [h for h in self.history if h["agent"] == agent_id and h["tool"] == tool_name and now - h["ts"] < 60]
            if tool.get("rate_limit_per_minute") and len(recent) >= tool["rate_limit_per_minute"]:
                v["hard"].append({"rule": "rate-limit", "reason": f"more than {tool['rate_limit_per_minute']} {tool_name} calls in a minute (possible scraping)"})
                fired.append("rate-limit")
            same = [h for h in recent if h["args_key"] == repr(sorted(args.items())) and h["session"] == v["session_id"]]
            if len(same) >= 3:
                v["hard"].append({"rule": "repeat-loop", "reason": "the same action was repeated 3 times in a minute (agent stuck in a loop)"})
                fired.append("repeat-loop")
            if SECRET_PATTERNS.search(repr(args)):
                v["hard"].append({"rule": "secret-in-args", "reason": "the arguments contain a password or API key"})
                fired.append("secret-in-args")
            if tool.get("budget_per_agent_per_day") and args.get("amount"):
                spent = sum(e["args"].get("amount", 0) for e in self.executed
                            if e["agent"] == agent_id and e["tool"] == tool_name and now - e["ts"] < 86400)
                if spent + args["amount"] > tool["budget_per_agent_per_day"]:
                    v["hard"].append({"rule": "daily-budget",
                                      "reason": f"it would take today's refunds past the {money(tool['budget_per_agent_per_day'])} daily budget"})
                    fired.append("daily-budget")
            base = agents.get(agent_id, {}).get("baseline", {})
            # An amount dictated by an untrusted instruction is scored by that factor below; don't count it twice.
            if base.get("avg_refund") and (args.get("amount") or 0) > 5 * base["avg_refund"] and not bad_scans:
                times = args["amount"] / base["avg_refund"]
                v["factors"].append({"label": f"About {times:.0f}× this agent's usual refund ({money(base['avg_refund'])})", "points": 14})
                fired.append("unusual-amount")

            # trust tags: high-risk action built from data in an untrusted instruction
            if bad_scans:
                s = bad_scans[0]
                from_email = []
                ents = {k: [str(x) for x in vals] for k, vals in s.entities.items()}
                if args.get("amount") and str(args["amount"]) in ents["amounts"]:
                    from_email.append(money(args["amount"]))
                for key in ("to_account", "to"):
                    if args.get(key) and str(args[key]) in ents["accounts"] + ents["emails"]:
                        from_email.append(("account " if key == "to_account" else "") + str(args[key]))
                label = f"Instruction from an untrusted {s.language_label} {s.source}"
                v["factors"].append({"label": label, "points": 25})
                if tool.get("high_risk") and from_email:
                    v["hard"].append({"rule": "tainted-arguments",
                                      "reason": f"the instruction came from an untrusted {s.language_label} {s.source} "
                                                f"({' and '.join(from_email)} come{'s' if len(from_email) == 1 else ''} from it)"})
                fired.append("untrusted-instruction")
            if v["hard"] and any(h["rule"] not in ("unknown-agent", "bad-token", "kill-switch", "agent-paused",
                                                   "unknown-tool", "tool-disabled", "not-permitted", "agent-limit")
                                 for h in v["hard"]):
                self._step(v, "Rules", "fail", ", ".join(fired))
            elif fired:
                self._step(v, "Rules", "warn", ", ".join(fired))
            else:
                self._step(v, "Rules", "pass", "no rule triggered")

        # 5 chain check: every agent in the request chain must hold the power itself
        chain = v["chain"]
        problems = []
        if chain:
            seq = chain + [agent_id]
            if len(set(seq)) < len(seq):
                problems.append({"rule": "agent-loop", "reason": "the request went round in a loop (" + " → ".join(self.agent_name(a) for a in seq) + ")"})
            if len(seq) > self.settings.get("max_chain_depth", 4):
                problems.append({"rule": "chain-too-deep", "reason": f"the request passed through {len(seq)} agents (max {self.settings.get('max_chain_depth', 4)})"})
            for a, b in zip(seq, seq[1:]):
                if a in agents and b not in agents[a].get("can_message", []):
                    problems.append({"rule": "comm-matrix", "reason": f"{self.agent_name(a)} isn't allowed to give work to {self.agent_name(b)}"})
            for requester in chain:
                ra = agents.get(requester)
                if not ra:
                    problems.append({"rule": "unknown-requester", "reason": f"the request came from unregistered agent '{requester}'"})
                    continue
                rp = ra.get("tools", {})
                if tool_name not in rp:
                    problems.append({"rule": "borrowed-power",
                                     "reason": f"{ra['name']} can't {self._verb(tool_name)} itself, so it can't get another agent to do it (no borrowed powers)"})
                elif "max_amount" in (rp[tool_name] or {}) and (args.get("amount") or 0) > rp[tool_name]["max_amount"]:
                    problems.append({"rule": "borrowed-power",
                                     "reason": f"{ra['name']} can only authorise {self._noun(tool_name)} up to {money(rp[tool_name]['max_amount'])} (no borrowed powers)"})
            v["hard"].extend(problems)
            names = " → ".join(self.agent_name(a) for a in seq)
            self._step(v, "Chain check", "fail" if problems else "pass",
                       f"{names}: " + ("power borrowed or loop" if problems else "every agent holds this power"))
        else:
            self._step(v, "Chain check", "pass", "no delegation: the agent acts on its own request")

        # 6 risk score
        trust = self.trust.get(agent_id, 100)
        if trust < 100:
            v["factors"].append({"label": f"{self.agent_name(agent_id)} trust is {trust}/100 after recent blocks",
                                 "points": round((100 - trust) / 5)})
        risk = min(100, sum(f["points"] for f in v["factors"]))
        v["risk"] = risk
        th = self.settings.get("thresholds", {"alert": 40, "hold": 70, "block": 90})
        self._step(v, "Risk score", "fail" if risk >= th["block"] else "warn" if risk >= th["alert"] else "pass",
                   " + ".join(str(f["points"]) for f in v["factors"]) + f" = {risk}")

        # 7 decide
        learned = None
        if not v["hard"] and risk < th["block"] and not bad_scans:
            for lr in self.learned:
                if lr["tool"] == tool_name and lr["agent"] == agent_id and expr.check(lr["when"], ctx):
                    learned = lr
                    break
        if v["hard"] or risk >= th["block"]:
            decision = "block"
        elif learned:
            decision = "allow"
            v["learned_rule"] = learned
        elif v["needs_approval"] or risk >= th["hold"]:
            decision = "hold"
        elif risk >= th["alert"]:
            decision = "alert"
        else:
            decision = "allow"
        self._step(v, "Decide", {"allow": "pass", "alert": "warn", "hold": "warn", "block": "fail"}[decision],
                   {"allow": "allow", "alert": "allow + alert", "hold": "ask a manager", "block": "block"}[decision])

        v["plain"] = fmt(tool.get("plain", tool_name), {**ctx, **args}) if tool else tool_name
        v["decision"] = decision
        v["reason"] = self._explain(v)

        self.history.append({"ts": now, "agent": agent_id, "tool": tool_name, "args_key": repr(sorted(args.items())),
                             "session": v["session_id"], "decision": decision})
        self.history = self.history[-2000:]
        if decision != "hold" or not self.enforce:
            self._finish(v)
        else:
            self.pending[v["id"]] = v
            v["timeout"] = self.settings.get("approval_timeout_seconds", 120)
            self.audit.append("action", agent_id or "-", "hold", risk, v["reason"], self._audit_payload(v))
            self._push_feed(v)
            self.emit("approval", v)
        return v

    @staticmethod
    def _verb(tool: str) -> str:
        return {"issue_refund": "issue refunds", "send_email": "send emails", "delete_record": "delete records",
                "lookup_customer": "look up customers"}.get(tool, f"use {tool}")

    @staticmethod
    def _noun(tool: str) -> str:
        return {"issue_refund": "refunds"}.get(tool, tool)

    def _explain(self, v: dict) -> str:
        who = v["agent_name"]
        asked = ""
        if v["chain"]:
            asked = ", asked by " + " → ".join(self.agent_name(a) for a in v["chain"])
        d = v["decision"]
        verb = {"allow": "wants to", "alert": "wants to", "hold": "wants to", "block": "tried to"}[d]
        head = f"{who} {verb} {v['plain']}{asked}."
        if d == "block":
            reasons = [h["reason"] for h in v["hard"]] or [f"risk {v['risk']}/100 is too high"]
            seen, uniq = set(), []
            for r in reasons:
                if r not in seen:
                    seen.add(r)
                    uniq.append(r)
            return f"{head} Blocked: " + "; ".join(uniq) + "."
        if d == "hold":
            reasons = [n["reason"] for n in v["needs_approval"]] or [f"risk {v['risk']}/100"]
            extra = [f["label"].lower() for f in v["factors"][1:] if f["label"].lower() not in reasons]
            return f"{head} Needs a manager: " + "; ".join(reasons + extra) + "."
        if v["learned_rule"]:
            return f"{head} Allowed by a rule a manager created: \"{v['learned_rule']['plain']}\"."
        if d == "alert":
            extra = [f["label"].lower() for f in v["factors"][1:]]
            return f"{head} Allowed, with an alert to the team: " + ("; ".join(extra) if extra else f"{v['tool']} is a sensitive tool, so every use is reported") + "."
        return f"{head} Allowed: within its permissions, no red flags."

    def _audit_payload(self, v: dict) -> dict:
        return {k: v[k] for k in ("id", "kind", "tool", "to_agent", "args", "chain", "session_id", "factors", "hard", "enforced")}

    def _finish(self, v: dict, by: str | None = None) -> None:
        """Final decision: apply shadow mode, trust, circuit breaker; log and broadcast."""
        decision = v["decision"]
        if not self.enforce and decision in ("block", "hold"):
            v["would_have"] = decision
            v["decision"] = "allow"
            v["reason"] = "Arbiter is OFF (watch-only). It would have " + ("blocked" if decision == "block" else "held") + " this: " + v["reason"]
        agent_id = v["agent"]
        identity_fail = any(h.get("identity") for h in v["hard"])
        # A blocked delegated action counts against the agent that started the chain, not the
        # agent that was asked to carry it out.
        blamed = v["chain"][0] if v["chain"] and v["chain"][0] in self.trust else agent_id
        if agent_id in self.trust and not identity_fail and self.enforce:
            if v["decision"] == "block":
                agent_id = blamed
                self.trust[agent_id] = max(0, self.trust[agent_id] - 10)
                self.blocks[agent_id].append(time.time())
                cb = self.settings.get("circuit_breaker", {"blocks": 3, "window_seconds": 300})
                recent = [t for t in self.blocks[agent_id] if time.time() - t < cb["window_seconds"]]
                if len(recent) >= cb["blocks"] and agent_id not in self.paused_agents:
                    self.paused_agents[agent_id] = f"circuit breaker: {len(recent)} blocked actions in {cb['window_seconds'] // 60} min"
                    self.audit.append("kill", agent_id, "pause", 0, self.paused_agents[agent_id], {})
                    self.emit("alert", {"level": "critical", "message": f"{self.agent_name(agent_id)} auto-paused: {self.paused_agents[agent_id]}"})
                    self.emit("state", self.state())
            elif v["decision"] in ("allow", "alert"):
                self.trust[agent_id] = min(100, self.trust[agent_id] + 1)
        if v["kind"] == "action" and v["decision"] in ("allow", "alert"):
            self.executed.append({"ts": time.time(), "agent": agent_id, "tool": v["tool"], "args": v["args"]})
        if by:
            v["decided_by"] = by
        self.audit.append(v["kind"], agent_id or "-", v["decision"], v["risk"], v["reason"], self._audit_payload(v))
        self._push_feed(v)
        self._track_edge(v)
        self.emit("decision", v)
        if v["decision"] == "block" or v["decision"] == "alert" or v.get("would_have"):
            self.emit("alert", {"level": "critical" if v["decision"] == "block" or v.get("would_have") == "block" else "warning",
                                "message": v["reason"], "verdict_id": v["id"]})

    def _push_feed(self, v: dict) -> None:
        self.feed = [x for x in self.feed if x["id"] != v["id"]]
        self.feed.append(v)
        self.feed = self.feed[-300:]

    def _track_edge(self, v: dict) -> None:
        seq = v["chain"] + [v["agent"]] if v["kind"] == "action" else v["chain"] + [v["agent"], v["to_agent"]]
        for a, b in zip(seq, seq[1:]):
            if a and b:
                self.edges[(a, b)] = {"from": a, "to": b, "decision": v["decision"], "ts": v["ts"]}

    # ------------------------------------------------------------------ approvals

    def resolve(self, verdict_id: str, action: str, by: str = "manager", note: str = "") -> dict | None:
        """action: approve | reject | approve_and_learn | timeout"""
        with self._lock:
            v = self.pending.pop(verdict_id, None)
            if not v:
                return None
            v["held"] = True
            if action in ("approve", "approve_and_learn"):
                v["decision"] = "allow"
                v["reason"] = v["reason"].replace("Needs a manager:", f"Approved by {by}. It needed a manager because:")
                if action == "approve_and_learn":
                    v["new_rule"] = self._learn(v, by)
            else:
                v["decision"] = "block"
                if action == "timeout":
                    v["reason"] += " Nobody answered in time, so it was rejected (fail closed)."
                else:
                    v["reason"] += f" Rejected by {by}" + (f": {note}" if note else ".")
                v["rejected_note"] = note
            self._finish(v, by=by)
            return v

    def _learn(self, v: dict, by: str) -> dict:
        tool, args, agent = v["tool"], v["args"], v["agent"]
        if tool == "issue_refund":
            cap = int(math.ceil(args.get("amount", 0) / 1000.0) * 1000)
            when = f"amount <= {cap} and to_account in customer.accounts"
            plain = f"{self.agent_name(agent)} may refund up to {money(cap)} to the customer's own bank account without asking"
        elif tool == "send_email":
            when = f"to == '{args.get('to')}' and count_emails(body) < 3"
            plain = f"{self.agent_name(agent)} may email {args.get('to')} without asking"
        else:
            parts = [f"{k} == {v_!r}" for k, v_ in args.items() if isinstance(v_, (str, int, float))]
            when = " and ".join(parts) or "false"
            plain = f"{self.agent_name(agent)} may repeat this exact {tool} without asking"
        rule = {"id": f"learned-{len(self.learned) + 1}", "tool": tool, "agent": agent, "when": when, "plain": plain,
                "created_by": by, "created_at": time.strftime("%Y-%m-%d %H:%M"), "from_decision": v["id"]}
        expr.compile_rule(when)
        self.learned.append(rule)
        if self.learned_path:
            self.learned_path.write_text(yaml.safe_dump(self.learned, allow_unicode=True, sort_keys=False), encoding="utf-8")
        self.audit.append("rule", by, "learned", 0, plain, rule)
        self.emit("rule", rule)
        return rule

    # ------------------------------------------------------------------ agent-to-agent messages

    def check_message(self, req: dict) -> dict:
        with self._lock:
            v = self._new_verdict("message", req)
            src, dst = req.get("agent_id"), req.get("to_agent")
            ok = self._identify(v, src, req.get("token"))
            sid = v["session_id"]
            if req.get("content"):
                self.scan_content(sid, req["content"] if isinstance(req["content"], str) else "\n".join(req["content"]),
                                  f"message from {self.agent_name(src)}", src, emit=False)
            bad = self._taint(v, {})
            agents = self.policy["agents"]
            if ok:
                if dst not in agents:
                    v["hard"].append({"rule": "unknown-agent", "reason": f"'{dst}' is not a registered agent"})
                    self._step(v, "Permissions", "fail", "unknown recipient")
                elif dst not in agents[src].get("can_message", []):
                    v["hard"].append({"rule": "comm-matrix", "reason": f"{self.agent_name(src)} isn't allowed to message {self.agent_name(dst)}"})
                    self._step(v, "Permissions", "fail", "not in the communication matrix")
                else:
                    self._step(v, "Permissions", "pass", f"{self.agent_name(src)} → {self.agent_name(dst)} allowed")
            seq = v["chain"] + [src, dst]
            if len(set(seq)) < len(seq):
                v["hard"].append({"rule": "agent-loop", "reason": "agents are passing the request in a loop (" + " → ".join(self.agent_name(a) for a in seq) + ")"})
                self._step(v, "Chain check", "fail", "loop detected")
            elif len(seq) > self.settings.get("max_chain_depth", 4):
                v["hard"].append({"rule": "chain-too-deep", "reason": f"delegation chain longer than {self.settings.get('max_chain_depth', 4)} agents"})
                self._step(v, "Chain check", "fail", "chain too deep")
            else:
                self._step(v, "Chain check", "pass", " → ".join(self.agent_name(a) for a in seq))
            v["factors"].append({"label": "agent message base risk", "points": 5})
            if bad:
                v["factors"].append({"label": f"Carries an instruction from an untrusted {bad[0].language_label} {bad[0].source}", "points": 25})
            v["risk"] = min(100, sum(f["points"] for f in v["factors"]))
            self._step(v, "Risk score", "warn" if bad else "pass", f"{v['risk']}")
            if v["hard"]:
                v["decision"] = "block"
            elif bad:
                v["decision"] = "alert"
            else:
                v["decision"] = "allow"
            self._step(v, "Decide", {"allow": "pass", "alert": "warn", "block": "fail"}[v["decision"]], v["decision"])
            self._step(v, "Rules", "pass" if not bad else "warn", "message tagged untrusted" if bad else "no rule triggered")
            summary = (req.get("summary") or (req.get("content") or "")[:80]).strip()
            head = f"{self.agent_name(src)} → {self.agent_name(dst)}: \"{summary}\"."
            v["plain"] = f"message {self.agent_name(dst)}"
            if v["decision"] == "block":
                v["reason"] = head + " Blocked: " + "; ".join(h["reason"] for h in v["hard"]) + "."
            elif bad:
                v["reason"] = head + f" Delivered, tagged untrusted: it carries an instruction from an untrusted {bad[0].language_label} {bad[0].source}, so any action it leads to gets extra checks."
            else:
                v["reason"] = head + " Delivered."
            self._finish(v)
            return v

    # ------------------------------------------------------------------ kill switch & state

    def kill(self, scope: str, target: str | None = None, on: bool = True, by: str = "manager") -> dict:
        with self._lock:
            if scope == "all":
                self.kill_all = on
            elif scope == "agent" and target:
                if on:
                    self.paused_agents[target] = f"paused by {by}"
                else:
                    self.paused_agents.pop(target, None)
                    self.blocks[target] = []
            elif scope == "tool" and target:
                (self.disabled_tools.add if on else self.disabled_tools.discard)(target)
            msg = f"Kill switch {'ON' if on else 'off'}: " + (
                "all agents" if scope == "all" else f"{self.agent_name(target) if scope == 'agent' else target}")
            self.audit.append("kill", by, "on" if on else "off", 0, msg, {"scope": scope, "target": target})
            self.emit("alert", {"level": "critical" if on else "info", "message": msg})
            st = self.state()
            self.emit("state", st)
            return st

    def set_enforce(self, on: bool) -> dict:
        with self._lock:
            self.enforce = on
            self.audit.append("mode", "manager", "on" if on else "off", 0, f"Arbiter protection {'ON' if on else 'OFF (watch-only)'}", {})
            st = self.state()
            self.emit("state", st)
            return st

    def state(self) -> dict:
        agents = []
        for aid, a in self.policy["agents"].items():
            agents.append({"id": aid, "name": a["name"], "role": a.get("role"), "tools": a.get("tools", {}),
                           "can_message": a.get("can_message", []), "trust": self.trust.get(aid, 100),
                           "paused": self.paused_agents.get(aid)})
        return {"enforce": self.enforce, "kill_all": self.kill_all, "disabled_tools": sorted(self.disabled_tools),
                "agents": agents, "edges": list(self.edges.values()), "learned_rules": self.learned,
                "tools": list(self.policy.get("tools", {}).keys()), "thresholds": self.settings.get("thresholds"),
                "pending": [self.pending[k] for k in self.pending]}

    def policy_text(self) -> str:
        return self.policy_path.read_text(encoding="utf-8")


Engine = PolicyEngine  # short alias
