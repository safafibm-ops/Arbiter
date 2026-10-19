"""Arbiter SDK: put Arbiter in front of any agent's tools with one line.

    guard = Guard("refund_agent", token)
    issue_refund = guard.tool(issue_refund)          # now checked before it runs

    guard.send("billing_agent", "please refund order 2240")   # agent-to-agent message, checked too

If Arbiter can't be reached, high-risk tools are refused (fail-closed); low-risk ones
run with a warning.
"""
from __future__ import annotations

import functools
import inspect
import logging
from typing import Any, Callable

import httpx

log = logging.getLogger("arbiter.sdk")


class ActionBlocked(Exception):
    def __init__(self, verdict: dict):
        self.verdict = verdict
        super().__init__(verdict.get("reason") or "blocked by Arbiter")


class Guard:
    def __init__(self, agent_id: str, token: str, client: Any = None, base_url: str = "http://127.0.0.1:8000",
                 session_id: str = "default", chain: list[str] | None = None, untrusted: list[str] | None = None,
                 timeout: float = 300):
        self.agent_id, self.token = agent_id, token
        self.client = client or httpx.Client(base_url=base_url, timeout=timeout)
        self.session_id = session_id
        self.chain = list(chain or [])
        self.untrusted = list(untrusted or [])

    def bind(self, session_id: str | None = None, chain: list[str] | None = None,
             untrusted: list[str] | None = None) -> "Guard":
        """Same agent, working on a specific request: who asked (chain) and in which session."""
        return Guard(self.agent_id, self.token, self.client, session_id=session_id or self.session_id,
                     chain=self.chain if chain is None else chain, untrusted=untrusted or [])

    def _post(self, path: str, body: dict, high_risk: bool) -> dict:
        try:
            r = self.client.post(path, json=body)
            r.raise_for_status()
            return r.json()
        except Exception as e:  # network down, Arbiter crashed, timeout...
            if high_risk:
                return {"decision": "block", "risk": 100, "reason": f"Arbiter is unreachable ({type(e).__name__}), so this high-risk action was refused (fail-closed)."}
            log.warning("Arbiter unreachable, letting low-risk %s through: %s", path, e)
            return {"decision": "allow", "risk": 0, "reason": "Arbiter unreachable; low-risk action allowed"}

    def check(self, tool: str, args: dict, high_risk: bool = True) -> dict:
        return self._post("/api/check", {"agent_id": self.agent_id, "token": self.token, "tool": tool, "args": args,
                                         "session_id": self.session_id, "chain": self.chain,
                                         "content": self.untrusted}, high_risk)

    def tool(self, fn: Callable | None = None, *, name: str | None = None, high_risk: bool = True):
        """Decorator / wrapper: the function only runs if Arbiter allows it."""
        def wrap(f):
            sig = inspect.signature(f)

            @functools.wraps(f)
            def guarded(*a, **kw):
                bound = sig.bind(*a, **kw)
                bound.apply_defaults()
                args = dict(bound.arguments)
                args.pop("self", None)
                verdict = self.check(name or f.__name__, args, high_risk)
                if verdict.get("decision") in ("allow", "alert"):
                    return f(*a, **kw)
                raise ActionBlocked(verdict)
            guarded.arbiter_guarded = True
            return guarded
        return wrap(fn) if fn else wrap

    def send(self, to_agent: str, content: str, summary: str | None = None) -> dict:
        """Send a message to another agent through Arbiter. Raises ActionBlocked if refused."""
        v = self._post("/api/message", {"agent_id": self.agent_id, "token": self.token, "to_agent": to_agent,
                                        "content": content, "summary": summary, "session_id": self.session_id,
                                        "chain": self.chain}, high_risk=True)
        if v.get("decision") not in ("allow", "alert"):
            raise ActionBlocked(v)
        return v

    def scan(self, text: str, source: str = "untrusted content") -> dict:
        """Tag text that came from outside (email, web page, tool result) and scan it in any language."""
        return self._post("/api/scan", {"agent_id": self.agent_id, "session_id": self.session_id,
                                        "text": text, "source": source}, high_risk=False)
