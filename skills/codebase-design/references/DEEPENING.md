# Deepening

How to deepen a cluster of shallow modules safely, given its dependencies. Assumes the vocabulary in [../SKILL.md](../SKILL.md) — **module**, **interface**, **seam**, **adapter**.

## Dependency categories

| Category | Description | Test approach |
|----------|-------------|---------------|
| **In-process** | Pure computation, in-memory state, no I/O. | Test through the new interface directly. No adapter needed. |
| **Local-substitutable** | Has local test stand-ins (PGLite for Postgres, in-memory filesystem). | Test with the stand-in running in the suite. |
| **Ports & Adapters** | Your own services across a network boundary. | Define a port at the seam; production and in-memory adapters. |
| **True external** | Third-party services (Stripe, Twilio). | External dependency as injected port; tests provide mock adapter. |

## Seam discipline

- **One adapter = hypothetical seam. Two adapters = real seam.** Don't introduce a port unless at least two adapters are justified (usually production + test).
- **Internal seams vs external seams.** A deep module can have internal seams private to its implementation. Don't expose them through the interface.

## Testing strategy: replace, don't layer

- Old unit tests on shallow modules become waste once tests at the deepened module's interface exist — delete them.
- Write new tests at the deepened module's interface. The **interface is the test surface**.
- Tests assert observable outcomes, not internal state.
- Tests should survive internal refactors. If a test changes when implementation changes, it's testing past the interface.
