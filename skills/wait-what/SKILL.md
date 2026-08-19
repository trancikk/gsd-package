---
name: wait-what
description: Stop and re-pitch the last message when it did not land. Use when the user says "wait", "what?", "I don't follow", or similar confusion signals. User-invoked only.
disable-model-invocation: true
version: 1
created: "2026-08-18"
metadata:
  source: "Adapted from mattpocock/skills (wait-what) for pi"
---

# Wait, What?

Stop. The last message did not land. Re-pitch it.

**Invoke with:** `/skill:wait-what`

---

## Re-pitch

1. Give a little context — what were we doing and why?
2. Use plain, Simplified Technical English (short sentences, active voice, one idea per sentence).
3. Prefer the project's ubiquitous language — names from `AGENTS.md`, `CONTEXT.md`, or domain docs.
4. Strip jargon that does not serve the user.
5. Keep it under 200 words unless the user asks for detail.

Do not apologise at length. Do not repeat the original message verbatim. Translate it into what the user actually needs to know to proceed.
