"""Tiny, safe expression evaluator for policy rules.

Company rules are written as plain conditions, e.g.

    amount > 5000
    amount > order.total
    to_account not in customer.accounts
    recipient != customer.email and count_emails(body) >= 3

We parse them with Python's `ast` and walk only a whitelist of node types, so a policy
file can never run arbitrary code. Missing names evaluate to None and comparisons with
None are False, so a rule that doesn't apply simply doesn't fire.
"""
from __future__ import annotations

import ast
import operator
import re
from typing import Any

_CMP = {
    ast.Eq: operator.eq, ast.NotEq: operator.ne, ast.Lt: operator.lt, ast.LtE: operator.le,
    ast.Gt: operator.gt, ast.GtE: operator.ge,
    ast.In: lambda a, b: b is not None and a in b, ast.NotIn: lambda a, b: b is None or a not in b,
}
_BIN = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv}

EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
FUNCS = {
    "len": lambda x: len(x) if x is not None else 0,
    "lower": lambda x: str(x).lower() if x is not None else "",
    "domain": lambda x: str(x).rsplit("@", 1)[-1].lower() if x else "",
    "count_emails": lambda x: len(EMAIL.findall(str(x))) if x else 0,
    "contains": lambda text, word: word.lower() in str(text).lower() if text else False,
}


class RuleError(ValueError):
    pass


def compile_rule(src: str) -> ast.Expression:
    try:
        tree = ast.parse(src.strip(), mode="eval")
    except SyntaxError as e:
        raise RuleError(f"Can't read rule '{src}': {e.msg}") from e
    for node in ast.walk(tree):
        if not isinstance(node, (ast.Expression, ast.BoolOp, ast.And, ast.Or, ast.UnaryOp, ast.Not, ast.USub,
                                 ast.Compare, ast.BinOp, ast.Name, ast.Attribute, ast.Constant, ast.Load,
                                 ast.Call, ast.List, ast.Tuple, *_CMP.keys(), *_BIN.keys())):
            raise RuleError(f"Not allowed in a rule: {type(node).__name__} in '{src}'")
        if isinstance(node, ast.Call) and not (isinstance(node.func, ast.Name) and node.func.id in FUNCS):
            raise RuleError(f"Unknown function in rule '{src}'")
        if isinstance(node, ast.Attribute) and node.attr.startswith("_"):
            raise RuleError(f"Not allowed in a rule: '{node.attr}'")
    return tree


def evaluate(tree: ast.Expression, ctx: dict[str, Any]) -> Any:
    def ev(n):
        if isinstance(n, ast.Expression):
            return ev(n.body)
        if isinstance(n, ast.Constant):
            return n.value
        if isinstance(n, ast.Name):
            if n.id in ("true", "True"):
                return True
            if n.id in ("false", "False"):
                return False
            return ctx.get(n.id)
        if isinstance(n, ast.Attribute):
            base = ev(n.value)
            return base.get(n.attr) if isinstance(base, dict) else None
        if isinstance(n, (ast.List, ast.Tuple)):
            return [ev(e) for e in n.elts]
        if isinstance(n, ast.UnaryOp):
            v = ev(n.operand)
            return (not v) if isinstance(n.op, ast.Not) else (-v if v is not None else None)
        if isinstance(n, ast.BoolOp):
            vals = (ev(v) for v in n.values)
            return all(vals) if isinstance(n.op, ast.And) else any(vals)
        if isinstance(n, ast.BinOp):
            a, b = ev(n.left), ev(n.right)
            if a is None or b is None:
                return None
            return _BIN[type(n.op)](a, b)
        if isinstance(n, ast.Compare):
            left = ev(n.left)
            for op, right_n in zip(n.ops, n.comparators):
                right = ev(right_n)
                if isinstance(op, (ast.Lt, ast.LtE, ast.Gt, ast.GtE)) and (left is None or right is None):
                    return False
                try:
                    if not _CMP[type(op)](left, right):
                        return False
                except TypeError:
                    return False
                left = right
            return True
        if isinstance(n, ast.Call):
            return FUNCS[n.func.id](*[ev(a) for a in n.args])
        raise RuleError(f"Unsupported: {type(n).__name__}")

    return ev(tree)


def check(src: str, ctx: dict[str, Any]) -> bool:
    return bool(evaluate(compile_rule(src), ctx))
