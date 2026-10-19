"""Tamper-evident audit log: every entry stores the hash of the entry before it.

Editing or deleting any past row breaks the chain from that row onwards, and
`verify()` says exactly where.
"""
from __future__ import annotations

import hashlib
import json
import sqlite3
import threading
import time

GENESIS = "0" * 64


class AuditLog:
    def __init__(self, path: str = ":memory:"):
        self._db = sqlite3.connect(path, check_same_thread=False)
        self._lock = threading.Lock()
        self._db.execute(
            "CREATE TABLE IF NOT EXISTS log (id INTEGER PRIMARY KEY, ts REAL, kind TEXT, agent TEXT, "
            "decision TEXT, risk INTEGER, reason TEXT, payload TEXT, prev_hash TEXT, hash TEXT)")
        self._db.commit()

    @staticmethod
    def _digest(prev: str, ts: float, kind: str, agent: str, decision: str, risk: int, reason: str, payload: str) -> str:
        body = json.dumps([prev, round(ts, 6), kind, agent, decision, risk, reason, payload], ensure_ascii=False)
        return hashlib.sha256(body.encode()).hexdigest()

    def append(self, kind: str, agent: str, decision: str, risk: int, reason: str, payload: dict) -> dict:
        with self._lock:
            row = self._db.execute("SELECT hash FROM log ORDER BY id DESC LIMIT 1").fetchone()
            prev = row[0] if row else GENESIS
            ts = time.time()
            data = json.dumps(payload, ensure_ascii=False, sort_keys=True, default=str)
            h = self._digest(prev, ts, kind, agent, decision, risk, reason, data)
            cur = self._db.execute(
                "INSERT INTO log (ts, kind, agent, decision, risk, reason, payload, prev_hash, hash) VALUES (?,?,?,?,?,?,?,?,?)",
                (ts, kind, agent, decision, risk, reason, data, prev, h))
            self._db.commit()
            return {"id": cur.lastrowid, "ts": ts, "hash": h, "prev_hash": prev}

    def entries(self, limit: int = 200) -> list[dict]:
        with self._lock:
            rows = self._db.execute(
                "SELECT id, ts, kind, agent, decision, risk, reason, prev_hash, hash FROM log ORDER BY id DESC LIMIT ?",
                (limit,)).fetchall()
        keys = ["id", "ts", "kind", "agent", "decision", "risk", "reason", "prev_hash", "hash"]
        return [dict(zip(keys, r)) for r in rows]

    def verify(self) -> dict:
        with self._lock:
            rows = self._db.execute(
                "SELECT id, ts, kind, agent, decision, risk, reason, payload, prev_hash, hash FROM log ORDER BY id").fetchall()
        prev = GENESIS
        for (id_, ts, kind, agent, decision, risk, reason, payload, prev_hash, h) in rows:
            if prev_hash != prev or self._digest(prev, ts, kind, agent, decision, risk, reason, payload) != h:
                return {"ok": False, "entries": len(rows), "broken_at": id_,
                        "message": f"Entry #{id_} was changed after it was written. Everything from #{id_} on can't be trusted."}
            prev = h
        return {"ok": True, "entries": len(rows), "broken_at": None,
                "message": f"All {len(rows)} entries intact."}

    def tamper(self, entry_id: int | None = None) -> int | None:
        """Demo only: quietly rewrite one past decision, the way an insider might."""
        with self._lock:
            row = self._db.execute(
                "SELECT id FROM log WHERE decision='block' ORDER BY id DESC LIMIT 1" if entry_id is None
                else "SELECT id FROM log WHERE id=?", () if entry_id is None else (entry_id,)).fetchone()
            if not row:
                return None
            self._db.execute("UPDATE log SET decision='allow', reason='(edited) looked fine' WHERE id=?", (row[0],))
            self._db.commit()
            return row[0]

    def clear(self) -> None:
        with self._lock:
            self._db.execute("DELETE FROM log")
            self._db.commit()
