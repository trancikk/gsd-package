---
phase: <NN>
generated: "<TIMESTAMP>"
confidence: HIGH | MEDIUM | LOW
---

# Phase <NN>: [Name] - Research

**Researched:** [date]
**Domain:** [primary technology/problem domain]
**Confidence:** [HIGH/MEDIUM/LOW]

## User Constraints
<!-- Copy verbatim from CONTEXT.md locked decisions — this section MUST BE FIRST -->

- [D-<NN>-01]: [decision text]
- [D-<NN>-02]: [decision text]

## Summary
[2-3 paragraph executive summary]

**Primary recommendation:** [one-liner actionable guidance]

## Architectural Responsibility Map
| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| [capability] | [tier] | [tier or —] | [why this tier owns it] |

## Standard Stack
### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| [name] | [ver] | [what it does] | [why experts use it] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| [name] | [ver] | [what it does] | [use case] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| [standard] | [alternative] | [when alternative makes sense] |

## Package Legitimacy Audit
| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| [name] | npm/PyPI/crates | [e.g., 8 yrs] | [e.g., 50M/wk] | [github.com/org/repo] | [OK/SUS/ASSUMED] | Approved / Reject / Verify |

## Architecture Patterns
### Recommended Project Structure
```
src/
├── [folder]/        # [purpose]
├── [folder]/        # [purpose]
└── [folder]/        # [purpose]
```

### Pattern 1: [Pattern Name]
**What:** [description]
**When to use:** [conditions]
**Example:**
```typescript
// Source: [official docs URL]
[code]
```

### Anti-Patterns to Avoid
- **[Anti-pattern]:** [why it's bad, what to do instead]

## Don't Hand-Roll
| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| [problem] | [what you'd build] | [library] | [edge cases, complexity] |

## Common Pitfalls
### Pitfall 1: [Name]
**What goes wrong:** [description]
**Why it happens:** [root cause]
**How to avoid:** [prevention strategy]
**Warning signs:** [how to detect early]

## Code Examples
Verified patterns from official sources:

### [Common Operation 1]
```typescript
// Source: [official docs URL]
[code]
```

## Assumptions Log
| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | [assumed claim] | [which section] | [impact] |

## Open Questions
1. **[Question]**
   - What we know: [partial info]
   - What's unclear: [the gap]
   - Recommendation: [how to handle]

## Validation Architecture
### Test Framework
| Property | Value |
|----------|-------|
| Framework | {framework name + version} |
| Config file | {path or "none — see Wave 0"} |
| Quick run command | `{command}` |
| Full suite command | `{command}` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-XX | {behavior} | unit | `{command}` | ✅ / ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `{quick run command}`
- **Per wave merge:** `{full suite command}`
- **Phase gate:** Full suite green before verify

## Sources
### Primary (HIGH confidence)
- [Official docs URL] - [what was checked]

### Secondary (MEDIUM confidence)
- [WebSearch verified with official source]

### Tertiary (LOW confidence)
- [WebSearch only, marked for validation]

## Metadata
**Confidence breakdown:**
- Standard stack: [level] - [reason]
- Architecture: [level] - [reason]
- Pitfalls: [level] - [reason]

**Research date:** [date]
**Valid until:** [estimate - 30 days for stable, 7 for fast-moving]
