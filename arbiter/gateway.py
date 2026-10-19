"""Arbiter Gateway: the FastAPI front door every agent action passes through (fail-closed in the SDK),
plus the ShopCo demo and the Live Dashboard.

Run:  python -m arbiter.gateway        → http://127.0.0.1:8000
"""
from __future__ import annotations

import asyncio
import json
import os
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .audit import AuditLog
from .policy_engine import Engine
from .llm import make_intent_judge, make_translator
from .polyglot_scanner import PolyglotScanner

ROOT = Path(__file__).resolve().parent.parent


class CheckReq(BaseModel):
    agent_id: str
    token: str | None = None
    tool: str
    args: dict = {}
    session_id: str = "default"
    chain: list[str] = []
    content: list[str] = []
    content_source: str | None = None


class MessageReq(BaseModel):
    agent_id: str
    token: str | None = None
    to_agent: str
    content: str = ""
    summary: str | None = None
    session_id: str = "default"
    chain: list[str] = []


class ScanReq(BaseModel):
    text: str
    source: str = "untrusted content"
    agent_id: str | None = None
    session_id: str = "default"
    preview: bool = False


class DecideReq(BaseModel):
    action: str            # approve | reject | approve_and_learn
    by: str = "Manager"
    note: str = ""


class KillReq(BaseModel):
    scope: str             # all | agent | tool
    target: str | None = None
    on: bool = True


class ModeReq(BaseModel):
    enforce: bool


def create_app(policy: str | Path | None = None, learned: str | Path | None = None, db: str | None = None,
               approval_timeout: float | None = None) -> FastAPI:
    from shopco.business import ShopCo
    from shopco.scenarios import BY_ID, SCENARIOS, Ctx

    shop = ShopCo()
    translator = make_translator()
    engine = Engine(policy or ROOT / "policies" / "shopco.yaml",
                    learned if learned is not None else ROOT / "policies" / "learned.yaml",
                    scanner=PolyglotScanner(translator, make_intent_judge()), audit=AuditLog(db or ":memory:"),
                    context_provider=shop.context, secret=os.getenv("ARBITER_SECRET", "arbiter-demo-secret"))
    if approval_timeout is not None:
        engine.policy["settings"]["approval_timeout_seconds"] = approval_timeout

    app = FastAPI(title="Arbiter", description="Checks every AI agent action before it runs.")
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
    app.state.engine, app.state.shop = engine, shop

    subscribers: set[asyncio.Queue] = set()
    waiters: dict[str, asyncio.Future] = {}
    loop_holder: dict = {}

    def broadcast(kind: str, data: dict) -> None:
        loop = loop_holder.get("loop")
        if not loop:
            return
        msg = json.dumps({"type": kind, "data": data}, ensure_ascii=False, default=str)
        for q in list(subscribers):
            loop.call_soon_threadsafe(q.put_nowait, msg)

    engine.listeners.append(broadcast)

    @app.on_event("startup")
    async def _startup():
        loop_holder["loop"] = asyncio.get_running_loop()

    # ---------------------------------------------------------------- the checkpoint

    @app.post("/api/check")
    async def check(req: CheckReq):
        loop_holder.setdefault("loop", asyncio.get_running_loop())
        t0 = time.perf_counter()
        v = engine.evaluate_action(req.model_dump())
        v["latency_ms"] = round((time.perf_counter() - t0) * 1000, 2)
        if v["decision"] != "hold":
            return v
        fut = asyncio.get_running_loop().create_future()
        waiters[v["id"]] = fut
        try:
            return await asyncio.wait_for(fut, timeout=v.get("timeout", 120))
        except asyncio.TimeoutError:
            return engine.resolve(v["id"], "timeout", by="Arbiter") or {"decision": "block", "reason": "timed out"}
        finally:
            waiters.pop(v["id"], None)

    @app.post("/api/message")
    async def message(req: MessageReq):
        return engine.check_message(req.model_dump())

    @app.post("/api/scan")
    async def scan(req: ScanReq):
        if req.preview:
            return engine.scanner.scan(req.text, req.source).to_dict()
        return engine.scan_content(req.session_id, req.text, req.source, req.agent_id).to_dict()

    @app.get("/api/approvals")
    async def approvals():
        return list(engine.pending.values())

    @app.post("/api/approvals/{vid}")
    async def decide(vid: str, req: DecideReq):
        if req.action not in ("approve", "reject", "approve_and_learn"):
            raise HTTPException(400, "action must be approve, reject or approve_and_learn")
        v = engine.resolve(vid, req.action, by=req.by, note=req.note)
        if not v:
            raise HTTPException(404, "No such pending approval (already decided or timed out)")
        fut = waiters.get(vid)
        if fut and not fut.done():
            fut.set_result(v)
        broadcast("state", engine.state())
        return v

    # ---------------------------------------------------------------- control

    @app.get("/api/state")
    async def state():
        st = engine.state()
        st["llm"] = getattr(translator, "backend", None)
        return st

    @app.get("/api/feed")
    async def feed():
        return list(reversed(engine.feed[-150:]))

    @app.post("/api/kill")
    async def kill(req: KillReq):
        return engine.kill(req.scope, req.target, req.on)

    @app.post("/api/mode")
    async def mode(req: ModeReq):
        return engine.set_enforce(req.enforce)

    @app.get("/api/audit")
    async def audit(limit: int = 100):
        return {"entries": engine.audit.entries(limit), "verify": engine.audit.verify()}

    @app.get("/api/audit/verify")
    async def verify():
        return engine.audit.verify()

    @app.post("/api/audit/tamper")
    async def tamper():
        eid = engine.audit.tamper()
        if eid is None:
            raise HTTPException(404, "No blocked action in the log to tamper with yet")
        return {"tampered": eid, "verify": engine.audit.verify()}

    @app.get("/api/policy")
    async def policy():
        return {"yaml": engine.policy_text(), "learned": engine.learned}

    @app.delete("/api/rules/learned")
    async def forget():
        engine.forget_learned()
        broadcast("state", engine.state())
        return {"ok": True}

    @app.post("/api/reset")
    async def reset():
        for fut in waiters.values():
            if not fut.done():
                fut.set_result({"decision": "block", "reason": "Demo reset"})
        engine.reset_state()
        engine.forget_learned()
        engine.audit.clear()
        shop.reset()
        broadcast("reset", {})
        broadcast("state", engine.state())
        return {"ok": True}

    @app.get("/api/token/{agent_id}")
    async def token(agent_id: str, request: Request):
        # Demo convenience so external agents can join. A real deployment issues tokens out of band.
        if request.client and request.client.host not in ("127.0.0.1", "localhost", "testclient", "::1"):
            raise HTTPException(403, "tokens are only handed out locally")
        if agent_id not in engine.policy["agents"]:
            raise HTTPException(404, "unknown agent")
        return {"agent_id": agent_id, "token": engine.token_for(agent_id)}

    # ---------------------------------------------------------------- ShopCo demo

    @app.get("/api/shopco")
    async def shopco():
        return shop.summary()

    @app.get("/api/scenarios")
    async def scenarios():
        return [{"id": s.id, "title": s.title, "group": s.group, "blurb": s.blurb, "expect": s.expect, "tags": s.tags}
                for s in SCENARIOS]

    @app.post("/api/scenarios/{sid}/run")
    async def run_scenario(sid: str, request: Request):
        sc = BY_ID.get(sid)
        if not sc:
            raise HTTPException(404, "unknown scenario")
        import httpx
        # Scenario agents call this same server. When hosted (HOST set, e.g. on Render) go over loopback,
        # not back out through the public proxy.
        base = f"http://127.0.0.1:{os.getenv('PORT', '8000')}" if os.getenv("HOST") else str(request.base_url).rstrip("/")
        story: list[dict] = []

        def say(text: str, kind: str = "info"):
            item = {"scenario": sid, "title": sc.title, "text": text, "kind": kind, "ts": time.time()}
            story.append(item)
            broadcast("story", item)

        def work():
            with httpx.Client(base_url=base, timeout=600) as client:
                ctx = Ctx(shop, client, engine.token_for, say)
                say(f"▶ {sc.title}", "start")
                try:
                    sc.run(ctx)
                except Exception as e:  # keep the demo alive and show what broke
                    say(f"Scenario error: {type(e).__name__}: {e}", "harm")
                broadcast("shopco", shop.summary())
                return {"executed": ctx.executed, "final": ctx.final}

        asyncio.get_running_loop().run_in_executor(None, work)
        return {"started": sid}

    # ---------------------------------------------------------------- live updates

    @app.get("/api/stream")
    async def stream(request: Request):
        loop_holder.setdefault("loop", asyncio.get_running_loop())
        q: asyncio.Queue = asyncio.Queue()
        subscribers.add(q)

        async def gen():
            try:
                yield "retry: 2000\n\n"
                while True:
                    if await request.is_disconnected():
                        break
                    try:
                        msg = await asyncio.wait_for(q.get(), timeout=15)
                        yield f"data: {msg}\n\n"
                    except asyncio.TimeoutError:
                        yield ": ping\n\n"
            finally:
                subscribers.discard(q)

        return StreamingResponse(gen(), media_type="text/event-stream",
                                 headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    # ---------------------------------------------------------------- dashboard

    dist = ROOT / "dashboard" / "dist"
    if dist.exists():
        app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")

        @app.get("/")
        async def index():
            return FileResponse(dist / "index.html")

    return app


def main():
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    print(f"\n  Arbiter is running → http://127.0.0.1:{port}\n")
    uvicorn.run(create_app(), host=os.getenv("HOST", "127.0.0.1"), port=port, log_level="warning")


if __name__ == "__main__":
    main()
