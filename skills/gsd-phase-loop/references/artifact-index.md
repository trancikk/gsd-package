# GSD Artifact Index

All GSD artifacts live under `.planning/`.

```
.planning/
├── PROJECT.md                          # Project identity and core value
├── ROADMAP.md                          # Milestone + phase listing
├── REQUIREMENTS.md                     # Numbered acceptance criteria
├── STATE.md                            # Living position tracker
├── BACKLOG.md                          # Pending ideas, todos, tech debt
├── WORKSTREAMS.md                      # Parallel feature branches
├── CONVENTIONS.md                      # GSD workflow conventions
├── MILESTONES.md                       # Archived milestone summaries
├── LEARNINGS.md                        # Cross-phase learnings
├── config.json                         # Workflow configuration
├── codebase/
│   ├── MAPPING.md                      # Full codebase map
│   └── [area]-DEEP.md                  # Optional deep dives
├── debug/
│   └── <slug>.md
├── todos/
│   └── pending/
│       └── <slug>.md
└── phases/
    └── <NN>-<slug>/
        ├── <NN>-CONTEXT.md             # Locked decisions
        ├── <NN>-RESEARCH.md            # Research findings
        ├── <NN>-VALIDATION.md          # Plan validation report
        ├── <NN>-UI-SPEC.md             # UI design contract
        ├── <NN>-RETROSPECTIVE.md       # Post-phase retrospective
        ├── <NN>-<PP>-PLAN.md           # Executable plan
        ├── <NN>-<PP>-TODOS.md          # FSM-tracked task execution state
        ├── <NN>-<PP>-SUMMARY.md        # Execution record
        ├── <NN>-VERIFICATION.md        # Verification report
        └── .continue-here.md           # Resume instructions
```

## Read order

1. `STATE.md` — always read first.
2. `CONTEXT.md` for the active phase — locked decisions.
3. `PLAN.md` for the current plan — what to implement.
4. `TODOS.md` for the current plan — execution trace.
5. `RESEARCH.md` and `REQUIREMENTS.md` — supporting context.
