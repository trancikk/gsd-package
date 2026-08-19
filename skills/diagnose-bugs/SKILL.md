---
name: diagnose-bugs
description: Disciplined diagnosis loop for hard bugs, regressions, and performance issues. Use when the user says "diagnose", "debug this", or reports something broken, throwing, failing, or slow. User-invoked only.
disable-model-invocation: true
version: 1
created: "2026-08-18"
metadata:
  source: "Adapted from mattpocock/skills (diagnosing-bugs) for pi"
---

# Diagnose Bugs

Run a disciplined, phase-gated diagnosis loop. Skip phases only when the user explicitly justifies it.

**Invoke with:** `/skill:diagnose-bugs <symptom>`

---

## Redact first

If you show commands, outputs, or captured artifacts, **redact every secret** as `<REDACTED>`. Build loops against env vars so credentials stay in the environment. Quote only the lines that carry signal.

If redacted output is not enough to diagnose, say so and ask the user for a private channel or a scrubbed artifact.

---

## Phase 1 — Build a feedback loop

A tight, red-capable loop is the whole skill. Without a pass/fail signal that turns red on *this* bug, no amount of code reading will save you.

### Construct a loop — try in this order

1. **Failing test** at the seam that reaches the bug.
2. **Curl / HTTP call** against a running dev server.
3. **CLI invocation** with fixture input, diffing output against a known-good snapshot.
4. **Browser automation** via Playwright/Puppeteer or the Chrome DevTools MCP.
5. **Replay a captured trace** — network request, payload, event log.
6. **Throwaway harness** — minimal subset of the system with mocked deps.
7. **Property / fuzz loop** — if the bug is "sometimes wrong".
8. **Bisection harness** — if the bug appeared between two known states.
9. **Differential loop** — old vs new version, diff outputs.
10. **HITL script** — last resort; drive the human with a numbered checklist and capture their output.

### Tighten the loop

Once you have *a* loop, improve it:

- **Faster** — cache setup, skip unrelated init, narrow scope.
- **Sharper** — assert the exact symptom, not "didn't crash".
- **Deterministic** — pin time, seed RNG, isolate filesystem, freeze network.

### Non-deterministic bugs

Aim for a **higher reproduction rate**, not a clean repro. Loop 100×, parallelise, add stress, inject sleeps. 50% flake is debuggable; 1% is not.

### Cannot build a loop?

Stop and say so explicitly. List what you tried. Ask the user for:

- access to the environment that reproduces it;
- a redacted captured artifact (HAR, log dump, core dump, screen recording); or
- permission to add temporary production instrumentation.

Do **not** hypothesise without a loop.

### Completion criterion

Phase 1 is done when you can name **one command** you have already run and that is:

- [ ] **Red-capable** — drives the actual bug path and asserts the user's exact symptom.
- [ ] **Deterministic** — same verdict every run (or pinned high flake rate).
- [ ] **Fast** — seconds, not minutes.
- [ ] **Agent-runnable** — runs unattended, or via a structured HITL checklist.

If you catch yourself reading code to build a theory before the command exists, **stop**. No red-capable command, no Phase 2.

---

## Phase 2 — Reproduce + minimise

Run the loop and watch it go red.

Confirm:

- [ ] The failure matches what the **user** described.
- [ ] It is reproducible (or at a debuggable flake rate).
- [ ] You captured the exact symptom.

Then **minimise**: shrink the repro one cut at a time, re-running after each cut. Keep only what is load-bearing. Done when removing any remaining element makes the loop go green.

Do not proceed until you have reproduced **and** minimised.

---

## Phase 3 — Hypothesise

Generate **3–5 ranked hypotheses** before testing any of them. Each must be **falsifiable**:

> "If `<X>` is the cause, then `<changing Y>` will make the bug disappear / `<changing Z>` will make it worse."

If you cannot state the prediction, discard or sharpen the hypothesis.

**Show the ranked list to the user before testing.** They often have domain knowledge that re-ranks instantly. Do not block if the user is AFK — proceed with your ranking.

---

## Phase 4 — Instrument

Each probe must map to a specific prediction from Phase 3. Change **one variable at a time**.

Tool preference:

1. **Debugger / REPL inspection** if available.
2. **Targeted logs** at boundaries that distinguish hypotheses.
3. Never "log everything and grep".

Tag every debug log with a unique prefix, e.g. `[DEBUG-a4f2]`, so cleanup is one grep.

**Performance branch.** Logs are usually wrong for perf. Establish a baseline measurement first (timing harness, profiler, query plan), then bisect. Measure first, fix second.

---

## Phase 5 — Fix + regression test

Write the regression test **before the fix**, but only if there is a **correct seam**.

A correct seam exercises the real bug pattern as it occurs at the call site. If the only seam is too shallow, a regression test there gives false confidence. In that case, note that the codebase architecture prevents locking the bug down.

If a correct seam exists:

1. Turn the minimised repro into a failing test.
2. Watch it fail.
3. Apply the fix.
4. Watch it pass.
5. Re-run the Phase 1 loop against the original un-minimised scenario.

---

## Phase 6 — Cleanup

Before declaring done:

- [ ] Original repro no longer reproduces (re-run the Phase 1 loop).
- [ ] Regression test passes (or absence of seam is documented).
- [ ] All `[DEBUG-...]` instrumentation removed.
- [ ] Throwaway prototypes deleted or moved to a clearly-marked debug location.
- [ ] The correct hypothesis is stated in the commit / PR message.
