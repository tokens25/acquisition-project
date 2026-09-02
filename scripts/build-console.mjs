import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createContext, runInContext } from 'node:vm'

/**
 * Builds the feedback console, and checks it still matches the app.
 *
 * The console is a table of every named part of the tool. Its danger is going
 * quietly stale: someone adds a component, the console never hears about it,
 * and feedback about that component has nowhere to land. A hand-kept list of
 * 160 things drifts within a week — the first version of this table was wrong
 * about the buttons, the panel and a third of the card before anyone noticed.
 *
 * So the list is not trusted. Every run scans the components the console
 * claims to cover, and reports both directions of drift:
 *
 *   unnamed  — a class exists in the code with no row here
 *   missing  — a row points at a class the code no longer has
 *
 * Naming stays human. A scanner can find `.jf__thumb`; it cannot know to call
 * it "thumbnail" or explain that it is proportioned to a 375 by 812 phone.
 * What it can do is refuse to let the list pretend to be complete.
 *
 *   node scripts/build-console.mjs           build, report drift
 *   node scripts/build-console.mjs --check   report only, non-zero if drifted
 */

const ROOT = new URL('..', import.meta.url).pathname
const PARTS = ['console/page.head.html', 'console/maps.js', 'console/areas.js', 'console/app.js']

/**
 * The files the console covers.
 *
 * Demo 2 is deliberately absent — it is the old interface, kept only for
 * comparison, and listing its parts would double the table with things nobody
 * is going to change.
 *
 * The assistant falls under that same rule for now: it is hidden in demo 1 and
 * renders only in demo 2, so the console has nothing to point at. The
 * component and its styles are untouched — put `src/editor/Assistant.tsx` back
 * in this list when demo 1 shows it again, and the check will ask for the rows.
 */
const SCANNED = [
  'src/demo/DemoApp.tsx',
  'src/demo/DefaultPanel.tsx',
  'src/demo/EditPanel.tsx',
  'src/demo/UserFlow.tsx',
  'src/demo/SourceTabs.tsx',
  'src/demo/IconPicker.tsx',
  'src/demo/BenefitIcon.tsx',
  'src/demo/JourneyFrames.tsx',
  'src/demo/Prototype.tsx',
  'src/demo/FlowPanel.tsx',
  'src/card/FlowStep.tsx',
  'src/components/flow/FlowScreens.tsx',
  'src/card/StepPreview.tsx',
  'src/card/CardSetView.tsx',
  'src/components/TextField.tsx',
  'src/components/SelectField.tsx',
  'src/components/ToggleField.tsx',
  'src/components/Toggle.tsx',
  'src/components/Button.tsx',
  'src/components/Icon.tsx',
]

/** Plus every component of the card, which is a directory rather than a list. */
function cardFiles() {
  const dir = join(ROOT, 'src/components/acquisition')
  return readdirSync(dir)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => `src/components/acquisition/${f}`)
}

/**
 * Every class name the scanned components render.
 *
 * Covers the two forms in this codebase: a literal `className="a b"`, and the
 * array form `className={['acq-card', className]...}` that AcquisitionCard
 * uses. Anything more dynamic than that would need the type checker, and a
 * scanner that silently missed cases would be worse than none.
 */
function classesInCode() {
  const found = new Map()
  for (const rel of [...SCANNED, ...cardFiles()]) {
    let source
    try {
      source = readFileSync(join(ROOT, rel), 'utf8')
    } catch {
      console.error(`  ! ${rel} is listed as scanned but does not exist`)
      continue
    }
    const patterns = [
      /className="([^"]+)"/g,
      // className={['acq-card', className]…}
      /className=\{\['([a-z0-9_-]+)'/g,
      // const cls = ['dazn-btn', `dazn-btn--${appearance}`, …] — the base class
      // is a plain literal; the modifiers built by template are variants, and
      // a variant is covered by its base anyway.
      /=\s*\[\s*'([a-z][a-z0-9_-]*)'/g,
    ]
    for (const re of patterns) {
      for (const match of source.matchAll(re)) {
        for (const name of match[1].split(/\s+/)) {
          if (!/^[a-z][a-z0-9_-]*$/.test(name)) continue
          if (!found.has(name)) found.set(name, rel)
        }
      }
    }
  }
  return found
}

/** Loads the authored data without a browser. */
function loadAreas() {
  const ctx = createContext({})
  runInContext(
    readFileSync(join(ROOT, 'console/maps.js'), 'utf8') +
      readFileSync(join(ROOT, 'console/areas.js'), 'utf8'),
    ctx,
  )
  return { MAPS: ctx.MAPS, AREAS: ctx.AREAS }
}

/** The internal checks: a row must be unique, and must have a picture. */
function validate({ MAPS, AREAS }) {
  const problems = []
  const seen = new Map()
  let rows = 0

  for (const [, title, view, , list] of AREAS) {
    for (const [name, , , map] of list) {
      rows++
      if (seen.has(name)) {
        problems.push(`duplicate name "${name}" — in ${title} and ${seen.get(name)}`)
      }
      seen.set(name, title)
      if (!MAPS[map]) problems.push(`"${name}" points at map "${map}", which does not exist`)
      else if (!MAPS[map].parts[name]) problems.push(`"${name}" has no shape in map "${map}"`)
    }
    if (!['default', 'edit', 'both', 'archive'].includes(view)) {
      problems.push(`section "${title}" has an unknown view "${view}"`)
    }
  }

  for (const id of Object.keys(MAPS)) {
    const used = new Set(
      AREAS.flatMap(([, , , , list]) => list.filter((r) => r[3] === id).map((r) => r[0])),
    )
    for (const part of Object.keys(MAPS[id].parts)) {
      if (!used.has(part)) problems.push(`map "${id}" draws "${part}", which no row uses`)
    }
  }

  return { problems, rows }
}

/**
 * Drift, both ways.
 *
 * Only rows anchored to a class can be checked. Plenty are anchored to a label
 * instead — "dropdown 1", "button 2 · secondary" — because that is genuinely
 * what identifies them, and inventing a class so a script could see them would
 * be writing code for the checker rather than the app.
 */
function drift({ AREAS }, inCode) {
  const anchored = new Map()
  for (const [, title, , , list] of AREAS) {
    for (const [name, anchor] of list) {
      if (!anchor.startsWith('.')) continue
      // Anchors carry a qualifier where the class alone is ambiguous:
      // ".ed-placeholder · pricing" is one of three placeholders. Everything
      // from the separator on is prose for a human, not a selector.
      for (const token of anchor.split(' · ')[0].trim().split(/\s+/)) {
        if (!token.startsWith('.')) continue
        // ".page.demo" is one element carrying two classes.
        for (const cls of token.slice(1).split('.')) {
          if (cls) anchored.set(cls, { name, title })
        }
      }
    }
  }

  /**
   * A modifier belongs to the thing it modifies.
   *
   * `.acq-addon__status--code` is one of three ways a status prints, and
   * `.acq-addon__status--payment` another. Demanding a row each would bury the
   * table in variants, so a modifier counts as covered when its base is.
   */
  const covered = (cls) => anchored.has(cls) || anchored.has(cls.split('--')[0])

  const unnamed = []
  for (const [cls, file] of inCode) {
    if (!covered(cls)) unnamed.push({ cls, file })
  }

  const missing = []
  for (const [cls, row] of anchored) {
    if (!inCode.has(cls)) missing.push({ cls, ...row })
  }

  return { unnamed, missing }
}

function build() {
  const html = PARTS.map((p) => readFileSync(join(ROOT, p), 'utf8')).join('')
  writeFileSync(join(ROOT, 'feedback-console.html'), html)
  writeFileSync(join(ROOT, 'public/feedback.html'), html)
  return html.length
}

const TAB = { default: 'Default view', edit: 'Edit view', archive: 'Archive', both: 'Both views' }

/** The same rows as prose, for reading in the repo rather than the browser. */
function writeNaming({ AREAS }) {
  const out = [
    '# Naming — how to point at any part of the tool',
    '',
    'Say the **Name** and I know exactly what you mean. **Where** is the class or',
    'label it actually carries in the code.',
    '',
    '> Generated by `npm run console`. Edit `console/areas.js`, not this file —',
    '> hand-editing lets the two drift apart, which is how a whole pass of work',
    '> once got done against the wrong list.',
    '',
    '## The three tabs',
    '',
    '| Tab | Holds |',
    '| --- | --- |',
    '| **Default view** | Before opening a step: the situation dropdowns, the user flow, the journey tiles, and Preview · Export JSON · Settings |',
    '| **Edit view** | Once a step is open: breadcrumb, scope, six field groups, the single-screen preview, and Save changes · Exit edit mode · Settings |',
    '| **Archive** | The frame and the shared kit — shell, design system, routes |',
    '',
    'The card appears under both working tabs, since it shows in each.',
    '',
    'Unqualified requests mean **demo 1** at `/demo`.',
    '',
    '---',
    '',
  ]

  for (const [, title, view, blurb, rows] of AREAS) {
    out.push(`## ${view === 'default' || view === 'edit' ? `${TAB[view]} — ${title}` : title}`, '')
    out.push(`*${TAB[view]}*${blurb ? ` — ${blurb}` : ''}`, '')
    out.push('| Name | Where | What it is |', '| --- | --- | --- |')
    for (const [name, anchor, what] of rows) {
      out.push(`| **${name}** | \`${anchor}\` | ${what.replace(/\|/g, '\\|')} |`)
    }
    out.push('')
  }

  out.push(
    '---',
    '',
    '## Concepts, not elements',
    '',
    '| Name | Means |',
    '| --- | --- |',
    '| **context** | A country, a storefront and a way of paying together — what the edit view is scoped to |',
    '| **base** | The shared content every country starts from, before its own differences |',
    "| **override** | One country's difference from the base |",
    '| **journey** | An ordered list of steps, chosen by user status and entry point |',
    '| **step** | One screen of a journey. May be drawn in several states |',
    '| **state** | One version of a step — "default", "alternate plan selected" |',
    '| **seeded** | A step skipped because the entry point already answered it |',
    '| **offer** | A price for one plan, at one cadence, in one country |',
    '| **cadence** | How you pay — Monthly Flex, Instalments Annual, Annual Upfront |',
    '| **plan** | What the customer picks. A *tier* in the data, a *plan* everywhere in the interface |',
    '| **catalogue** | The reusable lists: features, logos, add-ons, icons |',
    '| **publish gate** | The check across every context that blocks publishing |',
    '',
    '---',
    '',
    '## How to phrase a request',
    '',
    'Good — resolves to exactly one thing:',
    '',
    '> Make the **step label** bold.',
    '> The **savings ribbon** should sit above the **plan CTA**, not inside it.',
    '> **Storefront** needs a help text.',
    '> In the **edit view**, the **plan tabs** are too tall.',
    '',
    'Ambiguous — I will have to ask:',
    '',
    '> Make the title bigger. *(product title, plan name, group title, step label?)*',
    '> The button is too small. *(there are more than twenty)*',
    '> Fix the spacing in the panel. *(which view, which group?)*',
    '',
    'If something has no name here, say what it does and where it is. I will name it,',
    'add it to `console/areas.js`, and use that name from then on.',
    '',
  )

  writeFileSync(join(ROOT, 'NAMING.md'), out.join('\n'))
}

// ── Run ───────────────────────────────────────────────────
const checkOnly = process.argv.includes('--check')
const data = loadAreas()
const { problems, rows } = validate(data)
const inCode = classesInCode()
const { unnamed, missing } = drift(data, inCode)

if (problems.length) {
  console.error('\nThe table contradicts itself:')
  for (const p of problems) console.error(`  ✗ ${p}`)
}

if (unnamed.length) {
  console.error(`\n${unnamed.length} in the code, not in the console:`)
  for (const u of unnamed) console.error(`  + .${u.cls}  (${u.file})`)
  console.error('  Add a row for each in console/areas.js, and a shape in console/maps.js.')
}

if (missing.length) {
  console.error(`\n${missing.length} in the console, not in the code:`)
  for (const m of missing) console.error(`  − .${m.cls}  ("${m.name}" in ${m.title})`)
  console.error('  Either it was renamed, or it is gone and the row should go too.')
}

const drifted = problems.length || unnamed.length || missing.length

if (checkOnly) {
  if (!drifted) console.log(`In step — ${rows} rows, ${inCode.size} classes scanned.`)
  process.exit(drifted ? 1 : 0)
}

const bytes = build()
writeNaming(data)
console.log(
  `\nBuilt feedback-console.html and NAMING.md — ${rows} rows, ${(bytes / 1024).toFixed(0)}KB.` +
    (drifted ? ' Drift above is unresolved.' : ' In step with the code.'),
)
process.exit(problems.length ? 1 : 0)
