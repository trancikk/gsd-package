# Logic Prototype

A single self-contained HTML file — a **shareable demo** — for questions about business logic, state transitions, or data shape.

## When to use

- "I'm not sure if this state machine handles the edge case where X then Y."
- "Does this data model let me represent the case where..."
- "I want to feel out what the API should look like before writing it."

If the question is "what should this look like", use [UI.md](UI.md).

## Process

### 1. State the question

Write the question at the top of the demo in a visible intro. A logic prototype answering the wrong question is pure waste.

### 2. Isolate the logic in a portable module

Put the logic in a single `<script>` block as a pure module that could be lifted into the real codebase:

- Pure reducer `(state, action) => state`.
- Explicit state machine.
- Small set of pure functions over a plain data type.
- Class/module with a clear method surface.

Keep it pure: no DOM, no `document`, no button handlers reaching inside.

### 3. Build the shareable HTML file

One file, plain HTML/CSS/JS, inline, opens by double-click. Write for a non-developer — labels in domain language.

Layout top to bottom:

1. **Title and one-line explanation** of the question.
2. **Current state** — readable panel, re-rendered after every click.
3. **Free-play buttons** — one per action, always available.
4. **Guided walkthroughs** — tabs with scenarios and step buttons.

Choose scenarios that demonstrate awkward cases: happy path, tricky edge, illegal attempt.

### 4. Hand it over

Send the file or open it. Interesting moments: "wait, that shouldn't be possible" or "I assumed X would be different."

### 5. Capture the answer

Record the answer. Lift the validated reducer/machine/function set into the real module. Move the HTML shell to a throwaway branch.

## Anti-patterns

- Don't add tests.
- Don't wire to the real database.
- Don't generalise.
- Don't blur logic and page together.
- Don't use a framework, bundler, or server.
- Don't ship the HTML shell into production.
