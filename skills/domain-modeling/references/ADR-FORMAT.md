# ADR Format

ADRs live in `docs/adr/` and use sequential numbering: `0001-slug.md`, `0002-slug.md`, etc. Create the directory lazily.

## Template

```md
# {Short title of the decision}

{1-3 sentences: context, decision, and why.}
```

## Optional sections

Only include when they add genuine value:

- **Status** frontmatter (`proposed | accepted | deprecated | superseded by ADR-NNNN`).
- **Considered Options** — when rejected alternatives are worth remembering.
- **Consequences** — when non-obvious downstream effects need to be called out.

## When to offer an ADR

All three must be true:

1. Hard to reverse.
2. Surprising without context.
3. Result of a real trade-off.

### What qualifies

- Architectural shape.
- Integration patterns between contexts.
- Technology choices that carry lock-in.
- Boundary and scope decisions.
- Deliberate deviations from the obvious path.
- Constraints not visible in the code.
- Rejected alternatives when the rejection is non-obvious.
