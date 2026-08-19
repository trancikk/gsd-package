# CONTEXT.md Format

## Structure

```md
# {Context Name}

{One or two sentence description of what this context is and why it exists.}

## Language

**Order**:
{A one or two sentence description of the term}
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account
```

## Rules

- **Be opinionated.** Pick the best word for a concept and list others under `_Avoid_`.
- **Keep definitions tight.** One or two sentences max. Define what it IS, not what it does.
- **Only project-specific terms.** General programming concepts (timeouts, error types, utility patterns) don't belong.
- **Group terms under subheadings** when natural clusters emerge.

## Single vs multi-context repos

**Single context:** One `CONTEXT.md` at repo root.

**Multiple contexts:** A `CONTEXT-MAP.md` at repo root:

```md
# Context Map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md) — receives and tracks customer orders
- [Billing](./src/billing/CONTEXT.md) — generates invoices and processes payments

## Relationships

- **Ordering → Billing**: Shared types for `CustomerId` and `Money`
```

Infer the structure: if `CONTEXT-MAP.md` exists, read it; if only root `CONTEXT.md` exists, single context; if neither exists, create root `CONTEXT.md` lazily when the first term is resolved.
