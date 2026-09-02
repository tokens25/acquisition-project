Adds the Coach to the journey builder. It reads the whole journey as one decision and reports what it sees, what backs it, what a science suggests may follow, what to change, and what stays unknown until DAZN measures it. Nothing in the existing flow or UI was redesigned.

## What it does

Press **Coach review** in the header, say what the journey is for, and the findings open in a rail beside the screens. Each screen in the flow row carries a count. Clicking a finding opens that screen and lights up the exact words it is about.

## Two scores, never blended

- **Journey Health** is the always-on baseline (eight questions). The same journey scores the same whichever business direction is chosen.
- **Goal alignment** is scored separately, per configured direction.
- Coach reliability, how often its own readings had to be reined in, sits outside both. A weak inference by the Coach can never make a good journey score worse.

## Nine baseline questions, always asked

Completion · Decision clarity · Package comprehension and comparison · Decision friction · Purchase confidence · Offer comprehension · Journey consistency · Informed choice and trust · Goal alignment. A goal never switches one off.

## Eight configurable directions

Drive Specific Package · Drive Annual Plan · Acquire for Specific Content · Acquire Specific Audience · Drive Specific Offer · Drive Specific Benefit · Drive Bundle / Add-on · Maintain Campaign Proposition.

A goal is not a strategy. Drive Annual Plan does not mean Annual must be the default; it means a Monthly default becomes a question worth testing. Where a direction needs a target, the sheet offers the ones this set actually has: its campaigns, its add-ons, the landing page's own promise.

## Evidence discipline

Science can carry a recommendation about clarity, comprehension, consistency or choice architecture. It cannot carry a claim about conversion, revenue, ARPU or churn: that needs a DAZN experiment, and until there is one the business outcome reads as unknown. Evidence is kept as kinds, not one ladder: the content itself, DAZN analytics, DAZN experiments, research, science, established practice, AI inference. AI inference is never presented as science.

## Four action types

- **Fix** where the content proves itself wrong. These carry a one-tap change, scoped to the single field they name.
- **Test** where a mechanism is credible, two variants are defensible and the outcome is unknown. The experiment is written out: hypothesis, control, variant, primary measure, guardrail, what we learn, and two separate confidences (worth running, and which variant wins).
- **Check** where the concern is real but nothing settles it yet.
- **Note** for what is worth knowing, including what is working.

## Copy suggestions

Derived from the content wherever it can be (a plan described from its own team list), written by the Copy AI where it cannot. Either way the Coach approves it first: no new number, no unbacked claim, no urgency, no team a plan does not carry, no dash, within the field's length. Rejected copy is shown with the reason rather than offered as a fix.

## What it never touches

Prices, defaults, package order, the recommended plan and any claim stay human decisions. The Coach names the advantage a structure creates and proposes a test; it does not change one.

## Notes for review

- Scoring weights are **product-defined choices**, documented as such in `score.ts`, not measurements. They can be calibrated later against DAZN experiments, analytics or expert review.
- The AI passes need `ANTHROPIC_API_KEY`, or a signed-in `claude` CLI on a dev machine. Without either, the review runs on the deterministic rules alone and says so.
- `public/coach/crystal-ball.mp4` is 4.8MB and is the only heavy file here. Happy to swap it for an SVG if you would rather keep the repo light.
- Knowledge and the written account of how the review works are in `docs/coach/`, including a PDF.

Typecheck, lint and production build all pass.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
