# UI tasks

Fill in the list below. One line each: **where — what you want.**
Then hand the file back and say *"work through TASKS.md"*.

Leave everything under "The rules" alone — that part is for me.

---

## Tasks

<!--
  One line per task. Two things: where, and what.

    - [ ] /landing · footer links — make the rows sit closer together
    - [ ] /demo · top bar — Preview button should be the same height as Market
    - [ ] Edit subscription popup — title should say "Edit subscription"

  "Where" can be as loose as you like — a route, a button, a class name, "the
  left panel". If I cannot find it I will ask rather than guess.

  Only if it helps, add indented lines under a task:

    - [ ] /landing · hero — price sits too close to the button
      see screenshot 2
      Figma 708:173738
      should match the spacing in Meet the teams

  Screenshots: attach them in the message and say which task they belong to.
-->

- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 

---

## Notes back

<!-- I fill this in as I go. One line per task. -->

| # | What happened |
| --- | --- |
|  |  |

---

# The rules

*Mine, not yours. Here so they are written down rather than remembered.*

**One task at a time, in order.** The next one does not start before the
current one is ticked.

**A box is ticked only after it is verified** — seen working in the browser, or
the command run and its output read. Not "the code looks right".

**Every task ends with all four of these passing:**

```bash
npx tsc -b && npm run lint && npm run console:check && npm run build
```

`console:check` is the drift check: a new CSS class needs a row in
`console/areas.js` and a shape in `console/maps.js`, and names must be unique
across areas. It is the one most likely to fail.

This project uses **npm** — there is a `package-lock.json` and no pnpm
lockfile. There is no test script; the browser is the test.

**If a task is blocked, or turns out to be wrong, I say so and move on.** No
guessing at what was meant, no quietly narrowing the scope. What happened goes
in *Notes back*.

**Use what is already there** — existing tokens, components and classes. A new
class earns its place; a second way of drawing a button does not.

**No hardcoded values.** No hex, no raw px, no font sizes or weights by hand.
They come from `src/tokens/tokens.css`: `--color-*`, `--space-*`,
`--font-size-*`, `--font-weight-*`, `--radius-*`, `--border-*`. Where the design
uses a value the token export does not carry, the design's own value goes in
with a comment saying so, rather than the nearest wrong token.

**Logical CSS properties** — `inline-size`, `block-size`, `margin-inline-end`,
`inset-block-start`. The codebase is written that way throughout.

**Match the surrounding code** — its comment density, its naming, its idiom.
Comments explain why, not what.

**Never run Prettier.** No config here; it reformats whole files and buries the
change.

**Flag a dependency before adding one.** This project ships with `react`,
`react-dom` and one other. Each addition is a decision.
