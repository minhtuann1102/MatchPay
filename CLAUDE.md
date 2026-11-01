# MatchPay

Shared platform for a group of legal entities: AI reads and matches incoming invoices, a Rule Engine admits clean ones to a payment batch, and authorised people sign consolidated payment requests. Start with [README.md](README.md), then [the session handoff](docs/handoff/session-handoff.md), which holds the current state and next step.

## Rules

- **All files are 100% English.** The only exception is the Vietnamese brief at the repo root, which is the source document. Never edit it. Write legal references without diacritics (QD-TCT, ND-CP). UI copy in the static wireframes is also English. The interactive prototype in `prototype/` has a Vietnamese UI at the user's request (D-187): Vietnamese text lives only in `prototype/src/i18n/` (UI copy) and `prototype/src/mock/` (sample free text); code, comments, and docs stay English.
- **Talk to the user in Vietnamese.** Documents stay in English.
- **Work in the fixed step order** (see the handoff). Stop and report after each step. A step is approved only when the user says so; until then its status is `draft for review`.
- **Never present a call you made as the user's decision.** Record it in the step's `00-decisions.md` as awaiting review.
- **Never silently change the brief.** Record any difference in `00-decisions.md`: what the brief says, what the documents say, and why.
- **Keep IDs stable.** BR-xx, UC-xx, US-xx, AC-xx, D-xx, DF-xx, and O-xx keep their numbers. Add new numbers at the end of a range. US-nn always matches UC-nn.
- **Cite only pages you actually opened.** Mark anything else `Unverified`, saying what would confirm it.
- **Use they/them** for anyone whose pronouns are not stated, including fictional sample people.

## How to work

- Use Opus only for planning. Use one Sonnet worker for everything else, and pass `model: "sonnet"` explicitly when you spawn it.
- Do not run parallel agents. One worker at a time.
- Consult the advisor, if the tool is available, before locking a plan, after the same error twice, and before calling a task done.
- Read a worker's output yourself. Checks that pass do not prove the content is right.

## Presentation sample

Match the structure, header blocks, table and ID style, and depth of the public sample repository. Copy none of its content.

```bash
git clone --depth 1 https://github.com/minhtuann1102/HelpdeskAI.git /tmp/HelpdeskAI
```

Keep the clone outside this repo. It has documents for Steps 1 to 5 only.

## Checks

Run from the repo root before reporting a step:

```bash
python -X utf8 tools/check_docs.py
```

It covers Vietnamese letters, IDs, relative links, story dependencies, priority totals, and pronouns. Extend it when a step adds a new ID family. Its Mermaid check is a structural lint and does not parse diagrams.
