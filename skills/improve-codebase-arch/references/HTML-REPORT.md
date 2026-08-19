# HTML Report Format

A single self-contained HTML file in the OS temp directory. Tailwind and Mermaid from CDNs. Mermaid for graph-shaped diagrams; hand-built divs/SVG for editorial visuals.

## Scaffold

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Architecture review — {{repo name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

## Candidate card

Each candidate is one `<article>`:

- **Title** — short, names the deepening.
- **Badge row** — recommendation strength (`Strong` = emerald, `Worth exploring` = amber, `Speculative` = slate) plus dependency category.
- **Files** — monospaced list.
- **Before / After diagram** — side-by-side. Use Mermaid flowcharts, hand-built boxes-and-arrows, cross-sections, mass diagrams, or call-graph collapses.
- **Problem** — one sentence.
- **Solution** — one sentence.
- **Wins** — bullets ≤6 words, in glossary terms: *"locality: bugs concentrate in one module"*, *"leverage: one interface, N call sites"*.
- **ADR callout** (if applicable) — amber-tinted box.

## Style guidance

- Editorial, generous whitespace. Serif optional for headings.
- Colour sparingly: one accent + red for leakage + amber for warnings.
- Diagrams ~320px tall.
- Use `text-xs uppercase tracking-wider` for module labels inside diagrams.
- Only Tailwind CDN and Mermaid ESM import as scripts.

## Tone

Use exactly the codebase-design terms: **module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, locality**. Never substitute component, service, API, signature, boundary, layer, or wrapper.

No hedging. If a sentence could be a bullet, make it a bullet. If a bullet could be cut, cut it.
