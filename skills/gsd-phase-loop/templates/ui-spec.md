---
phase: <NN>-<slug>
status: draft
reviewed_at: null
---

# Phase <NN>: [Name] — UI Specification

## Design System

| Property | Value |
|----------|-------|
| Component Library | [e.g., shadcn/ui, MUI, custom] |
| Styling | [e.g., Tailwind CSS, CSS Modules, styled-components] |
| shadcn Preset | [preset name or "none"] |
| Base Color | [e.g., slate, zinc, neutral] |
| Border Radius | [e.g., 0.5rem, 8px] |

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | [usage] |
| sm | 8px | [usage] |
| md | 16px | [usage] |
| lg | 24px | [usage] |
| xl | 32px | [usage] |
| 2xl | 48px | [usage] |
| 3xl | 64px | [usage] |

**Exceptions:** [any non-standard values with justification]

## Typography Scale

### Font Sizes

| Token | Size | Usage |
|-------|------|-------|
| body | 16px | [usage] |
| label | 14px | [usage] |
| heading | 20px | [usage] |
| display | 28px | [usage] |

### Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| regular | 400 | [usage] |
| semibold | 600 | [usage] |

### Line Heights

| Token | Value |
|-------|-------|
| body | 1.5 |
| heading | 1.2 |

## Color Contract

### 60/30/10 Split

| Role | Color | Usage |
|------|-------|-------|
| Dominant (60%) | [token] | [usage] |
| Secondary (30%) | [token] | [usage] |
| Accent (10%) | [token] | [reserved for: specific elements] |

### Semantic Colors

| Role | Color | Usage |
|------|-------|-------|
| Success | [token] | [usage] |
| Warning | [token] | [usage] |
| Error | [token] | [usage] |
| Info | [token] | [usage] |

## Copywriting Contract

| Element | Copy | Notes |
|---------|------|-------|
| Primary CTA | [label] | [verb + noun] |
| Empty State | [copy] | [when shown] |
| Error State | [copy] | [what went wrong + what to do] |
| Destructive Confirmation | [copy] | [confirmation approach] |

## Component Inventory

| Component | shadcn Source | Registry | Safety Gate |
|-----------|---------------|----------|-------------|
| [name] | official / custom | [registry] | [vetting status] |

## Interaction Patterns

### Loading States
- [pattern]

### Error States
- [pattern]

### Empty States
- [pattern]

### Destructive Actions
- [pattern: confirmation dialog / undo / etc.]
