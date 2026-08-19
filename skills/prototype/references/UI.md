# UI Prototype

Generate several radically different UI variations on a single route, switchable from a floating bottom bar.

## When to use

- "What should this page look like?"
- "I want to see a few options for this dashboard before committing."
- "Try a different layout for the settings screen."

If the question is about logic/state, use [LOGIC.md](LOGIC.md).

## Two sub-shapes — prefer A

### Sub-shape A — adjustment to an existing page (preferred)

The route exists. Variants render on the same route, gated by `?variant=`. Existing data fetching, params, and auth stay; only rendering swaps. Default unless there's a reason not to.

### Sub-shape B — a new page (last resort)

Only when there's genuinely no existing page. Create a throwaway route following the project's routing convention. Name it obviously as a prototype.

## Process

### 1. State the question and pick N

Default to **3 variants**. Cap at 5. Write a one-line plan:

> "Three variants of the settings page, switchable via `?variant=`, on the existing `/settings` route."

### 2. Generate radically different variants

Hold each variant to:

- The page's purpose and available data.
- The project's styling system.
- A clear exported component name: `VariantA`, `VariantB`, `VariantC`.

Variants must be **structurally different** — layout, hierarchy, primary affordance — not just colour.

### 3. Wire them together

```tsx
const variant = searchParams.get('variant') ?? 'A';
return (
  <>
    {variant === 'A' && <VariantA {...data} />}
    {variant === 'B' && <VariantB {...data} />}
    {variant === 'C' && <VariantC {...data} />}
    <PrototypeSwitcher variants={['A','B','C']} current={variant} />
  </>
);
```

### 4. Build the floating switcher

Fixed-position bottom-centre bar with:

- Left/right arrows cycling variants (wraps).
- Variant label showing current key and optional name.

Behaviour:

- Updates URL search param so variant is shareable/reload-stable.
- Keyboard `←` / `→` arrow keys cycle (ignored when input focused).
- Visually distinct from the page.
- Hidden in production builds.

### 5. Hand it over

Surface the URL and variant keys. Interesting feedback is usually "I want the header from B with the sidebar from C."

### 6. Capture and clean up

- Fold the winner into the real code.
- Move losing variants and switcher to a throwaway branch, not main.
- Rewrite the winner properly under production constraints.

## Anti-patterns

- Variants that differ only in colour or copy.
- Sharing too much code between variants (defeats the point).
- Wiring variants to real mutations.
- Promoting prototype code directly to production.
