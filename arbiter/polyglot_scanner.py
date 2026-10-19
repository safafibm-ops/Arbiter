"""Polyglot Scanner: multilingual prompt-injection detection.

Three parts, run on every piece of untrusted text (emails, tool results, agent messages):

Script Detector   - script of every word (Latin, Devanagari, Kannada, Cyrillic...), language of
                    every sentence (English, Hindi, Kannada, Hinglish), hidden-text tricks.
Translate & Clean - strip invisible characters, map look-alike letters back to Latin, convert
                    Indic digits, decode base64, drop hidden HTML; translate with the open LLM
                    when one is configured (otherwise our built-in glossary gives the meaning).
Intent Judge      - match the cleaned text (and the translation) against our phrase library in
                    four languages, then weigh the signals: is this text trying to instruct an
                    AI agent? Only unclear cases are sent to the LLM for a second opinion.

Everything except the optional LLM calls is deterministic and runs in a few milliseconds.
"""
from __future__ import annotations

import base64
import binascii
import html
import re
import unicodedata
from dataclasses import asdict, dataclass, field

# ---------------------------------------------------------------- 1. character tricks

# Always suspicious in business text.
INVISIBLE = {
    "​": "zero-width space",
    "⁠": "word joiner",
    "﻿": "zero-width no-break space",
    "­": "soft hyphen",
    "᠎": "mongolian vowel separator",
    "⁡": "invisible function application",
    "⁢": "invisible times",
    "⁣": "invisible separator",
    "⁤": "invisible plus",
    "‪": "bidi override", "‫": "bidi override", "‬": "bidi override",
    "‭": "bidi override", "‮": "bidi override",
    "⁦": "bidi isolate", "⁧": "bidi isolate", "⁨": "bidi isolate", "⁩": "bidi isolate",
}
# ZWJ / ZWNJ are legitimate inside Devanagari and Kannada words, so they are only
# suspicious when they sit between Latin letters.
JOINERS = {"‌", "‍"}

# Look-alike letters (Cyrillic and Greek) that attackers use to dodge English filters.
HOMOGLYPHS = {
    "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "і": "i",
    "ј": "j", "ѕ": "s", "һ": "h", "ԁ": "d", "ԛ": "q", "ԝ": "w", "ӏ": "l", "ɡ": "g",
    "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M", "Н": "H", "О": "O", "Р": "P",
    "С": "C", "Т": "T", "Х": "X", "І": "I", "Ј": "J", "Ѕ": "S",
    "ο": "o", "α": "a", "ε": "e", "ρ": "p", "ν": "v", "τ": "t", "ι": "i", "κ": "k",
    "Α": "A", "Β": "B", "Ε": "E", "Ζ": "Z", "Η": "H", "Ι": "I", "Κ": "K", "Μ": "M",
    "Ν": "N", "Ο": "O", "Ρ": "P", "Τ": "T", "Χ": "X", "Υ": "Y",
}

INDIC_DIGITS = {**{chr(0x0966 + i): str(i) for i in range(10)},   # Devanagari ०-९
                **{chr(0x0CE6 + i): str(i) for i in range(10)}}   # Kannada ೦-೯

HIDDEN_HTML = re.compile(
    r"<(\w+)[^>]*style\s*=\s*['\"][^'\"]*(display\s*:\s*none|font-size\s*:\s*0|"
    r"color\s*:\s*(#fff\b|#ffffff|white)|visibility\s*:\s*hidden)[^'\"]*['\"][^>]*>(.*?)</\1>",
    re.I | re.S,
)
TAG = re.compile(r"<[^>]+>")
B64 = re.compile(r"(?<![A-Za-z0-9+/=])[A-Za-z0-9+/]{16,}={0,2}(?![A-Za-z0-9+/=])")


def script_of(ch: str) -> str | None:
    cp = ord(ch)
    if 0x0900 <= cp <= 0x097F:
        return "Devanagari"
    if 0x0C80 <= cp <= 0x0CFF:
        return "Kannada"
    if 0x0400 <= cp <= 0x04FF:
        return "Cyrillic"
    if 0x0370 <= cp <= 0x03FF:
        return "Greek"
    if ch.isascii() and ch.isalpha():
        return "Latin"
    if ch.isalpha():
        return "Other"
    return None


# ---------------------------------------------------------------- 2. phrase library
# signal -> language -> list of (pattern, English meaning)
# Patterns are substrings for Indic scripts and regexes for Latin text.

LEX: dict[str, dict[str, list[tuple[str, str]]]] = {
    "override": {
        "en": [(r"\bignore (all |any |the )?(previous|prior|above|earlier|your) (instructions|rules|prompts?|guidelines)", "ignore previous instructions"),
               (r"\bdisregard (your|all|the|any) (rules|instructions|guidelines|policies)", "disregard your rules"),
               (r"\bforget (your|all|the) (rules|instructions)", "forget your rules"),
               (r"\bnew instructions?\s*:", "new instructions:"),
               (r"\boverride (the )?(policy|rules|limits?)", "override the limits")],
        "hi": [("पिछले सभी निर्देश", "all previous instructions"), ("पिछले निर्देश", "previous instructions"),
               ("निर्देशों को अनदेखा", "ignore the instructions"), ("नियमों को अनदेखा", "ignore the rules"),
               ("अनदेखा करें", "ignore"), ("अनदेखा करो", "ignore"), ("नियम भूल", "forget the rules"),
               ("निर्देश भूल", "forget the instructions")],
        "kn": [("ಹಿಂದಿನ ಸೂಚನೆಗಳನ್ನು", "the previous instructions"), ("ಸೂಚನೆಗಳನ್ನು ನಿರ್ಲಕ್ಷಿಸಿ", "ignore the instructions"),
               ("ನಿಯಮಗಳನ್ನು ನಿರ್ಲಕ್ಷಿಸಿ", "ignore the rules"), ("ನಿರ್ಲಕ್ಷಿಸಿ", "ignore"), ("ಮರೆತುಬಿಡಿ", "forget")],
        "hinglish": [(r"\b(pichle|purane|saare|sabhi|sab)\s+(instructions?|nirdesh|rules?|niyam)\s+(ignore|bhool|bhul)", "ignore all previous instructions"),
                     (r"\bignore\s+kar(o|do|ein|na)\b", "ignore (it)"),
                     (r"\b(rules?|niyam)\s+bh(oo|u)l\s+jao\b", "forget the rules")],
    },
    "impersonation": {
        "en": [(r"\bsystem\s*(:|override|message|notice)", "system message"), (r"\[\s*system\s*\]", "[system]"),
               (r"\bthis is (the |your )?(admin|administrator|manager|ceo|developer)\b", "this is the admin"),
               (r"\byou are now\b", "you are now ...")],
        "hi": [("मैनेजर की ओर से", "on behalf of the manager"), ("सिस्टम संदेश", "system message"),
               ("प्रबंधक का आदेश", "manager's order")],
        "kn": [("ವ್ಯವಸ್ಥಾಪಕರ ಆದೇಶ", "manager's order"), ("ಸಿಸ್ಟಮ್ ಸಂದೇಶ", "system message")],
        "hinglish": [(r"\bmanager\s+(ka|ki)\s+(order|aadesh|hukum)\b", "manager's order")],
    },
    "ai_address": {
        "en": [(r"\b(ai|a\.i\.|assistant|agent|chatbot|bot|llm|language model)\b", "addresses the AI")],
        "hi": [("एआई", "AI"), ("सहायक", "assistant"), ("एजेंट", "agent"), ("बॉट", "bot")],
        "kn": [("ಎಐ", "AI"), ("ಸಹಾಯಕ", "assistant"), ("ಏಜೆಂಟ್", "agent"), ("ಬಾಟ್", "bot")],
        "hinglish": [],
    },
    "money": {
        "en": [(r"\b(refund|transfer|wire|pay|credit|send)\b[^.\n]{0,40}(₹|rs\.?\s*\d|inr|rupees|\d[\d,]{3,})", "move money")],
        "hi": [("रिफंड कर", "refund"), ("रिफंड भेज", "send a refund"), ("पैसे भेज", "send money"),
               ("रुपये भेज", "send rupees"), ("ट्रांसफर कर", "transfer"), ("खाते में डाल", "put into the account"),
               ("खाते में भेज", "send to the account"), ("जमा कर", "deposit"), ("भुगतान कर", "pay")],
        "kn": [("ಮರುಪಾವತಿ ಮಾಡಿ", "refund"), ("ಹಣ ಕಳುಹಿಸಿ", "send money"), ("ಖಾತೆಗೆ ಜಮಾ", "deposit to the account"),
               ("ಖಾತೆಗೆ ಕಳುಹಿಸಿ", "send to the account"), ("ವರ್ಗಾಯಿಸಿ", "transfer"), ("ರೀಫಂಡ್ ಮಾಡಿ", "refund"),
               ("ಪಾವತಿ ಮಾಡಿ", "pay")],
        "hinglish": [(r"\brefund\s+kar\s*(do|dena|o|ein|de)\b", "refund it"), (r"\bpaise\s+bhej", "send money"),
                     (r"\b(account|khate|khaate)\s+(me|mein|mai|main)\s+(transfer|daal|dal|bhej|jama)", "send to the account"),
                     (r"\btransfer\s+kar\s*(do|o|dena|de)\b", "transfer it")],
    },
    "exfil": {
        "en": [(r"\b(all|entire|full|every|complete) (the )?(customer|user|client)s?('s)? ?(list|data|records|emails|details|database)?", "all customer data"),
               (r"\bexport (the |all )?(customer|user|client)", "export customer data"), (r"\bcustomer list\b", "customer list")],
        "hi": [("सभी ग्राहकों", "all customers"), ("सारे ग्राहकों", "all customers"), ("ग्राहकों की सूची", "list of customers"),
               ("ग्राहक सूची", "customer list")],
        "kn": [("ಎಲ್ಲಾ ಗ್ರಾಹಕರ", "all customers'"), ("ಗ್ರಾಹಕರ ಪಟ್ಟಿ", "customer list")],
        "hinglish": [(r"\b(saare|sabhi|sab)\s+customers?\b", "all customers"), (r"\bcustomer\s+list\s+bhej", "send the customer list")],
    },
    "destroy": {
        "en": [(r"\bdelete (all|every|the entire|everything)", "delete everything"), (r"\b(drop|truncate) table\b", "drop table"),
               (r"\bwipe (the |all )", "wipe")],
        "hi": [("सभी रिकॉर्ड हटा", "delete all records"), ("रिकॉर्ड डिलीट", "delete records"), ("सब हटा दो", "delete everything")],
        "kn": [("ಎಲ್ಲಾ ದಾಖಲೆಗಳನ್ನು ಅಳಿಸಿ", "delete all records"), ("ದಾಖಲೆಗಳನ್ನು ಅಳಿಸಿ", "delete records")],
        "hinglish": [(r"\b(saare|sab|sabhi)\s+records?\s+(delete|hata)", "delete all records")],
    },
    "secrecy": {
        "en": [(r"\b(don'?t|do not|never) (tell|inform|mention|notify|alert)\b", "don't tell anyone"),
               (r"\bkeep (this|it) (secret|confidential|between us)", "keep it secret"), (r"\bwithout (telling|informing)\b", "without telling")],
        "hi": [("किसी को मत बता", "don't tell anyone"), ("किसी को न बता", "don't tell anyone"), ("किसी को नहीं बता", "don't tell anyone"),
               ("गुप्त रख", "keep it secret")],
        "kn": [("ಯಾರಿಗೂ ಹೇಳಬೇಡಿ", "don't tell anyone"), ("ರಹಸ್ಯವಾಗಿ", "secretly")],
        "hinglish": [(r"\bkisi\s+ko\s+(mat|nahi|na)\s+bata", "don't tell anyone")],
    },
    "urgency": {
        "en": [(r"\b(immediately|urgent(ly)?|right now|asap)\b", "immediately")],
        "hi": [("तुरंत", "immediately"), ("फौरन", "at once")],
        "kn": [("ತಕ್ಷಣ", "immediately"), ("ಈಗಲೇ", "right now")],
        "hinglish": [(r"\b(turant|jaldi|fatafat)\b", "immediately")],
    },
    "new_destination": {
        "en": [(r"\b(new|different|another|this) (bank )?account\b", "a new account")],
        "hi": [("नए खाते", "new account"), ("नया खाता", "new account"), ("खाता संख्या", "account number")],
        "kn": [("ಹೊಸ ಖಾತೆ", "new account"), ("ಖಾತೆ ಸಂಖ್ಯೆ", "account number")],
        "hinglish": [(r"\bnaye?\s+(account|khate|khata)\b", "new account")],
    },
}

WEIGHTS = {
    "override": 3, "impersonation": 2, "ai_address": 1, "money": 1, "exfil": 2, "destroy": 2,
    "secrecy": 2, "urgency": 0.5, "new_destination": 1,
    "hidden_chars": 2, "homoglyph": 2, "hidden_html": 2, "encoded": 2, "script_mix": 0.5,
}
ACTION_SIGNALS = {"money", "exfil", "destroy"}
INJECTION_THRESHOLD = 3

HINGLISH_MARKERS = {
    "karo", "kar", "do", "mein", "mai", "bhej", "bhejo", "paise", "turant", "kisi", "mat", "bata", "jao",
    "sab", "saare", "sabhi", "hai", "hain", "ka", "ki", "ko", "nahi", "naya", "khata", "khate", "aur",
    "yeh", "ye", "woh", "mera", "meri", "aap", "apna", "jaldi", "dena", "bhool", "pichle", "wala",
}

LANG_NAMES = {"en": "English", "hi": "Hindi", "kn": "Kannada", "hinglish": "Hinglish"}

AMOUNT = re.compile(
    r"(?:₹|rs\.?|inr|रु\.?|ರೂ\.?)\s*([\d,]+(?:\.\d+)?)|([\d,]{3,}(?:\.\d+)?)\s*(?:rupees|rupaye|रुपये|रुपए|ರೂಪಾಯಿ|rs\b|inr\b)",
    re.I,
)
ACCOUNT = re.compile(r"(?:account|a/c|acct|khata|khate|खाता|खाते|ಖಾತೆ)[^\d\n]{0,30}(\d{4,18})", re.I)


@dataclass
class Finding:
    signal: str
    lang: str
    phrase: str
    meaning: str


@dataclass
class ScanResult:
    source: str
    original: str
    normalized: str
    translation: str | None
    scripts: dict[str, int]
    languages: list[str]
    tricks: list[str]
    findings: list[Finding]
    score: float
    is_injection: bool
    entities: dict[str, list]
    summary: str
    used_llm: bool = False

    def to_dict(self) -> dict:
        d = asdict(self)
        d["languages_named"] = [LANG_NAMES.get(l, l) for l in self.languages]
        return d

    @property
    def language_label(self) -> str:
        """Most notable non-English language, for plain-language reasons."""
        for l in ("hi", "kn", "hinglish"):
            if l in self.languages:
                return LANG_NAMES[l]
        return "English"


# ---------------------------------------------------------------- the scanner

class PolyglotScanner:
    def __init__(self, translator=None, intent_judge=None):
        # Optional LLM helpers: translator(text) -> English, intent_judge(text) -> bool.
        # If the LLM is down, the deterministic scan still stands.
        self.translator = translator
        self.intent_judge = intent_judge
        self._compiled = {
            sig: {lang: [(re.compile(p, re.I) if lang in ("en", "hinglish") else p, m) for p, m in pats]
                  for lang, pats in langs.items()}
            for sig, langs in LEX.items()
        }

    # -- stage 1 + 2
    def normalise(self, text: str) -> tuple[str, list[str], dict[str, int]]:
        tricks: list[str] = []
        t = text

        hidden = HIDDEN_HTML.findall(t)
        if hidden:
            tricks.append(f"hidden HTML text ({len(hidden)} block{'s' if len(hidden) > 1 else ''})")
        t = html.unescape(TAG.sub(" ", t))

        found_inv = sorted({INVISIBLE[c] for c in t if c in INVISIBLE})
        if found_inv:
            tricks.append("invisible characters: " + ", ".join(found_inv))
        for c in INVISIBLE:
            t = t.replace(c, "")
        bad_joiner = re.search(r"[A-Za-z][‌‍]+[A-Za-z]", t)
        if bad_joiner:
            tricks.append("zero-width joiners inside English words")
            t = re.sub(r"(?<=[A-Za-z])[‌‍]+(?=[A-Za-z])", "", t)

        # Script per word, before the look-alike letters are mapped back.
        scripts: dict[str, int] = {}
        mixed_words = []
        for word in re.findall(r"\w+", t):
            ws = {s for s in (script_of(c) for c in word) if s}
            for s in ws:
                scripts[s] = scripts.get(s, 0) + 1
            if "Latin" in ws and ws & {"Cyrillic", "Greek"}:
                mixed_words.append(word)
        if mixed_words:
            tricks.append("look-alike letters in: " + ", ".join(mixed_words[:5]))
        t = "".join(HOMOGLYPHS.get(c, c) for c in t)
        t = "".join(INDIC_DIGITS.get(c, c) for c in t)
        t = unicodedata.normalize("NFKC", t)

        decoded = []
        for tok in B64.findall(t):
            try:
                raw = base64.b64decode(tok + "=" * (-len(tok) % 4), validate=True).decode("utf-8")
            except (binascii.Error, UnicodeDecodeError, ValueError):
                continue
            if len(raw) >= 8 and sum(ch.isprintable() for ch in raw) / len(raw) > 0.9 and " " in raw:
                decoded.append(raw)
        if decoded:
            tricks.append("base64-encoded text")
            t = t + "\n" + "\n".join(decoded)

        t = re.sub(r"[ \t]+", " ", t)
        return t.strip(), tricks, scripts

    @staticmethod
    def sentence_languages(text: str) -> list[str]:
        langs: list[str] = []
        for sent in re.split(r"[.!?।\n]+", text):
            words = re.findall(r"\w+", sent)
            if not words:
                continue
            counts: dict[str, int] = {}
            for w in words:
                for c in w:
                    s = script_of(c)
                    if s:
                        counts[s] = counts.get(s, 0) + 1
            if not counts:
                continue
            main = max(counts, key=counts.get)
            if main == "Devanagari":
                lang = "hi"
            elif main == "Kannada":
                lang = "kn"
            else:
                markers = sum(1 for w in words if w.lower() in HINGLISH_MARKERS)
                lang = "hinglish" if markers >= 2 and markers / len(words) >= 0.2 else "en"
            if lang not in langs:
                langs.append(lang)
        return langs or ["en"]

    def _match(self, text: str, langs_to_try: list[str]) -> list[Finding]:
        found: list[Finding] = []
        lower = text.lower()
        for sig, by_lang in self._compiled.items():
            for lang in langs_to_try:
                for pat, meaning in by_lang.get(lang, []):
                    if isinstance(pat, str):
                        if pat in text:
                            found.append(Finding(sig, lang, pat, meaning))
                            break
                    else:
                        m = pat.search(lower)
                        if m:
                            found.append(Finding(sig, lang, m.group(0), meaning))
                            break
        return found

    @staticmethod
    def entities(text: str) -> dict[str, list]:
        amounts = []
        for a, b in AMOUNT.findall(text):
            raw = (a or b).replace(",", "")
            try:
                amounts.append(int(float(raw)))
            except ValueError:
                pass
        return {"amounts": amounts, "accounts": ACCOUNT.findall(text),
                "emails": re.findall(r"[\w.+-]+@[\w-]+\.[\w.]+", text)}

    # -- stage 3 + 4
    def scan(self, text: str, source: str = "untrusted text") -> ScanResult:
        normalized, tricks, scripts = self.normalise(text or "")
        languages = self.sentence_languages(normalized)
        findings = self._match(normalized, ["en", "hi", "kn", "hinglish"])

        translation, used_llm = None, False
        if self.translator and any(l != "en" for l in languages):
            try:
                translation = self.translator(normalized)
                used_llm = bool(translation)
            except Exception:  # LLM down: the rule-based scan above still stands
                translation = None
        if translation:
            have = {f.signal for f in findings}
            for f in self._match(translation, ["en"]):
                if f.signal not in have:
                    f.lang = "translation"
                    findings.append(f)
        elif any(l != "en" for l in languages) and findings:
            translation = "Built-in glossary: " + "; ".join(
                f"{f.phrase} = {f.meaning}" for f in findings if f.lang != "en")

        signals = {f.signal for f in findings}
        score = sum(WEIGHTS[s] for s in signals)
        for trick in tricks:
            key = ("hidden_html" if trick.startswith("hidden HTML") else
                   "homoglyph" if trick.startswith("look-alike") else
                   "encoded" if trick.startswith("base64") else "hidden_chars")
            score += WEIGHTS[key]
        mixed_scripts = len([s for s in scripts if s in ("Latin", "Devanagari", "Kannada")]) > 1
        if mixed_scripts or len(languages) > 1:
            score += WEIGHTS["script_mix"]

        has_action = bool(signals & ACTION_SIGNALS)
        is_injection = score >= INJECTION_THRESHOLD and (has_action or "override" in signals or "impersonation" in signals)
        if not is_injection and self.intent_judge and score >= 1.5:   # unclear: ask the LLM
            try:
                if self.intent_judge(normalized):
                    is_injection, used_llm = True, True
                    findings.append(Finding("llm_intent", "translation", "(LLM intent judge)", "tries to instruct the AI"))
            except Exception:
                pass

        ents = self.entities(normalized)
        summary = self._summary(source, languages, signals, tricks, is_injection, ents)
        return ScanResult(source, text, normalized, translation, scripts, languages, tricks, findings,
                          round(score, 1), is_injection, ents, summary, used_llm)

    @staticmethod
    def _summary(source, languages, signals, tricks, is_injection, ents) -> str:
        lang = ", ".join(LANG_NAMES.get(l, l) for l in languages)
        if not is_injection:
            return f"{source.capitalize()} ({lang}): no hidden instructions found."
        what = []
        if "override" in signals:
            what.append("tells the AI to ignore its rules")
        if "impersonation" in signals:
            what.append("pretends to be a system or manager message")
        if "money" in signals:
            amt = f" ₹{ents['amounts'][0]:,}" if ents["amounts"] else ""
            acc = f" to account {ents['accounts'][0]}" if ents["accounts"] else ""
            what.append(f"asks for a payment{amt}{acc}")
        if "exfil" in signals:
            what.append("asks for customer data to be sent out")
        if "destroy" in signals:
            what.append("asks for records to be deleted")
        if "secrecy" in signals:
            what.append("asks to keep it secret")
        if tricks:
            what.append("uses hidden-text tricks (" + "; ".join(tricks) + ")")
        return f"Hidden instruction in {source} ({lang}): " + ", ".join(what) + "."
