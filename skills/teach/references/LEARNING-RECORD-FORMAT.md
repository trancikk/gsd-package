# Learning Record Format

Learning records live in `./learning-records/` and use sequential numbering: `0001-slug.md`, `0002-slug.md`, etc. Create the directory lazily.

## Template

```md
# {Short title of what was learned}

{1-3 sentences: what was learned and why it matters for future sessions.}
```

## Optional sections

- **Status** frontmatter (`active | superseded by LR-NNNN`).
- **Evidence** — how the user demonstrated understanding.
- **Implications** — what this unlocks or rules out.

## When to write

1. User demonstrated genuine understanding of something non-trivial.
2. User disclosed prior knowledge.
3. A misconception was corrected.
4. The mission shifted in response to learning.

### What does not qualify

- Material merely covered.
- Anything already in the glossary.
- Session activity logs.

## Supersession

When a later record contradicts an earlier one, mark the old record `Status: superseded by LR-NNNN` rather than deleting it.
