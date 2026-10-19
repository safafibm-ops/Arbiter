# Slide 8 · Additional Links

**Status:** first version built (18 Oct). Drive link added; GitHub link still missing.

## Current version on the slide (as built)
- Multilingual research references at the top: Brown University "Low-Resource Languages Jailbreak GPT-4" (79% vs under 1%), the UPenn/Microsoft guardrail benchmark (92 → 43 F1), IndicJR (45,216 prompts, 70% transfer into Hindi/Urdu), Palo Alto Unit 42 (multilingual instructions, 1 of 22 techniques), and Scientific Reports "Detection and analysis of prompt injection in Indian multilingual LLMs"
- Then the template's links: GitHub Repo (empty), Google Drive (filled), Deployment (optional, empty)

## Improvements to make
1. **Add a "References" sub-heading** above the research items, so it's clear they are sources, and keep the template's three links visually separate.
2. **Make fonts consistent:** the first reference is in a bigger font than the rest.
3. **Link Unit 42:** https://unit42.paloaltonetworks.com/ai-agent-prompt-injection/ (Mar 2026). It's the only agent-specific, in-the-wild item, so it deserves a link.
4. **Add the Problem slide's sources here too** (Euronews, Security Magazine, Cloud Security Alliance), so every number in the deck has a reference.
5. **Shorten each reference to one line**, e.g. "Brown Univ. (2023): GPT-4 safety bypassed 79% of the time in low-resource languages vs <1% in English."
6. **Check the Drive folder** opens for "anyone with the link" in a private/incognito window, and that it contains the demo video.
7. **GitHub link** is still needed before submission (MVP code).


| Template field | Link |
|---|---|
| GitHub Repo link | _TBD: create repo, MVP code_ |
| Google Drive link | https://drive.google.com/drive/folders/1qJzW1d8atzniQiI8Q_szhLJFV3oYMYKQ?usp=sharing |
| Deployment link (optional) | _TBD: dashboard demo if hosted_ |

## Before submitting
- [ ] Rename the PPT file to your **team name**
- [ ] Make the Drive link viewable by anyone with the link
- [ ] Make sure the GitHub repo is accessible to judges (ask organisers if it must be public)
- [ ] Submit on **Unstop** by **20 Oct 2026**

## Demo video plan (2–3 min)
1. 15 s: the problem (9-second database deletion headline)
2. 30 s: normal request passes, dashboard shows it
3. 45 s: attack in a Hindi email blocked, with plain-language card shown
4. 30 s: high-risk refund held, then **Approve & make it a rule**
5. 20 s: Support → Billing delegation blocked (no borrowed powers), agent map turns red
6. 10 s: kill switch, then closing tagline

---

## 7. Suggested build order

**Round 1 (by 20 Oct):** A1, A5, B1, C, D1 (small), D2, D6, E, F3 (patterns), G1, H1 to H3, H8 basic, I1, I2, I3, I4, F5, J1, J2, K1 to K4, L1. Demo video: ShopCo with Support + Billing agents, 5 attack scenarios blocked, one approval.

**Note:** the offline finale has a separate problem statement, so Round 1 is the whole build for this idea.

**After Round 1 (if shortlisted, before 4 Nov):** everything marked F, plus wrapping the DBOS and OpenAI demo agents and the with/without scorecard.

**If time remains:** undo, "did it really do it?", plain-English rules, notifications, MCP proxy.

---

## Slide 8 as built in the Canva deck (saved 19 Oct 2026)
- Headline: "Try Arbiter yourself, and check every number in this deck."
- Tiles: GitHub (github.com/safafibm-ops/Arbiter, "MVP code · 29 tests · runs in 3 commands") · Demo video (Google Drive folder) · Documentation (link still to add).
- Deployment line: not hosted; runs locally with `python -m arbiter.gateway` at localhost:8000.
- References (each line hyperlinked): 1 Euronews 2026 database deletion · 2 SailPoint 2025 · 3 Arkose Labs 2026 · 4 IBM 2025 · 5 Brown 2023 · 6 UPenn & Microsoft 2024 · 7 IndicJR 2026 · 8 Unit 42 2026 · 9 Scientific Reports 2026 · 10 Air Canada tribunal 2024.
- Placeholders for Faf: three QR codes; docs website link.
