# Acquisition Coach — the brief

Owner's brief, 2026-09-02, verbatim. This is the logic the Acquisition Coach is
built from; the code follows this document, not the other way round.

---

I already have two AI brains that I want to reuse: Copy AI and Coach AI.

These were originally built for the Hero Banner tool. Copy AI understands how to create and evaluate effective copy based on different goals, while Coach reviews the overall result, scores it, identifies problems and recommends improvements.

Now I want to extend these capabilities into our Acquisition Journey Builder.

The Acquisition Journey Builder is being built by another team. The actual flow and UI already exist. Market teams will use the tool to manage and adjust their acquisition journeys — for example changing packages, package order, defaults, messaging, content, steps and other configuration.

I do NOT need Coach to redesign the UI.

I want Coach to act more like an expert reviewing the acquisition journey and asking:

- Is this journey easy to understand?
- Is the structure helping the user make a decision?
- Are we presenting the right information at the right moment?
- Are packages easy to compare?
- Does the default package make sense?
- Is one package receiving unnecessary prominence?
- Are we creating unnecessary friction?
- Does each step naturally lead to the next?
- Does the copy clearly communicate what the user gets?
- Does the journey remain consistent from the original acquisition message through package selection, account creation and payment?
- Are we asking the user to make too many decisions at once?
- Are there places where we could simplify the decision?
- Are we creating uncertainty or risk immediately before purchase?

And most importantly: can every recommendation Coach makes actually be justified?

I don't want an AI that simply looks at a journey and invents optimization ideas.

For example, Coach might notice that Package B is selected by default.

It is perfectly valid for Coach to say:

> "Package B is currently preselected. Defaults are known to influence user choice, but I don't have evidence explaining why Package B should receive this advantage."

However, Coach should NOT automatically say:

> "Switch the default to Package A because this will increase conversion."

We don't know that.

The system needs to clearly separate:

**Observation → Evidence → Interpretation → Recommendation → Confidence**

This should become an Evidence-Based Recommendation Engine.

If evidence is missing, Coach should explicitly say that evidence is missing.

Sometimes the best recommendation should simply be:

> "I don't have enough evidence to recommend changing this."

I consider that a strength, not a failure.

The same applies especially to pricing.

For now, I don't want Coach recommending that we increase, decrease or invent prices unless we have actual evidence supporting that recommendation.

Coach can evaluate how an existing price is communicated, understood, compared or positioned, but it should not invent an economically optimal price.

---

## Sciences and knowledge I want to add

The current Copy and Coach brains already contain useful behavioral and copy sciences including Consumer Decision-Making, Behavioral Economics, Choice Architecture, Processing Fluency, Hick's Law, Mental Accounting, Reference Price Theory, Persuasion Research and others.

I want to keep those foundations, but Acquisition requires deeper knowledge because we are no longer evaluating one banner. We are evaluating an entire decision journey.

### Judgment & Decision Making

I want Coach to understand how humans make decisions when comparing alternatives, especially under uncertainty.

This should help Coach understand why a particular package structure, comparison or decision might be difficult.

### Choice Architecture

I want to significantly expand our existing Choice Architecture knowledge.

Coach should understand how ordering, defaults, grouping, recommendations, number of choices and presentation influence decisions.

This doesn't mean automatically changing them. It means understanding the effect they may have and identifying where evidence is needed.

### Default Effect / Status Quo Bias

Coach should understand that preselected options can strongly influence decisions.

If Package B is selected automatically, Coach should recognize that Package B has been given an important behavioral advantage.

Coach should then ask whether we have a defensible reason for doing that.

### Choice Overload / Assortment Research

Coach should understand when additional options improve choice and when they make decisions harder.

For example, six very similar packages may create more uncertainty than three clearly differentiated packages.

However, Coach should not blindly apply "fewer options = better." Context and evidence still matter.

### Attribute-Based Choice / Multi-Attribute Decision Making

Coach should understand how people compare products using attributes.

For DAZN this could include things like content access, competitions, devices, duration, package features, billing structure and other benefits.

Coach should detect situations where important differences are difficult to compare or where irrelevant differences receive disproportionate prominence.

### Information Foraging Theory

Coach should understand how people follow information cues through a journey.

At every step, users should have enough "information scent" to understand where an action is taking them and why they should continue.

### Progressive Disclosure

Coach should understand that not every piece of information needs to appear immediately.

Some information is necessary for the current decision. Other information can appear when it becomes relevant.

Coach should evaluate whether information is being introduced at the correct moment.

### Cognitive Load Theory

I want Coach to evaluate the mental effort required throughout the journey.

For example, a single screen might ask someone to understand packages, billing periods, cancellation conditions, add-ons and payment consequences simultaneously.

Even when every individual piece of information is understandable, the combined decision may become difficult.

### Processing Fluency

We already use this for Copy, but I want it expanded to the journey.

Terminology, package names, benefits, labels and explanations should remain consistent.

Equivalent concepts shouldn't suddenly be described differently on different screens.

### Mental Models / HCI

Coach should understand common expectations people have when purchasing subscriptions digitally.

It should detect moments where the journey behaves differently from what users are likely expecting and where that difference could create confusion.

### Signaling Theory

Coach should understand that structure itself communicates meaning.

Making something larger, placing it first, preselecting it or labeling it "Most Popular" communicates something to the user.

For example, "Most Popular" implies some form of social evidence. If we cannot support that claim, Coach should flag it rather than treating it as harmless decoration.

### Persuasion Knowledge Model

Coach should understand that people recognize persuasion attempts.

Overly aggressive persuasion, artificial urgency or unsupported claims such as "Best Value" can create resistance instead of helping conversion.

### Trust & Risk Perception

Coach should understand where uncertainty appears during acquisition.

This becomes particularly important near commitment and payment.

Unexpected conditions, unclear billing, hidden requirements or information appearing too late can increase perceived risk.

### Goal-Gradient / Commitment & Consistency

Coach should understand that behavior changes as people progress through a journey.

Someone who has completed several acquisition steps is in a different psychological state from someone who just entered.

We should therefore be careful about introducing major new decisions or unexpected complexity very late in the journey.

### Friction / Behavioral Sludge

Coach should distinguish between necessary friction and unnecessary friction.

Not every additional step is automatically bad.

Some friction can increase understanding, trust or prevent mistakes.

The question should be whether the effort we are asking from the user serves a meaningful purpose.

### Conversion Funnel / Customer Journey Research

Coach needs to evaluate the relationship between screens rather than evaluating each screen independently.

The journey itself becomes the unit of analysis.

---

## Journey-level consistency

This is particularly important.

I want Coach to understand the complete acquisition chain:

**Entry source → Landing → Package selection → Account → Payment → Confirmation**

At every transition Coach should ask:

- What did we promise?
- What does the user now expect?
- What are we showing them?
- Did something unexpectedly change?

This requires knowledge around Expectation-Confirmation, Information Scent, Cognitive Consistency and Message Match.

For example:

An acquisition message might say: "Watch Champions League with DAZN."

The user clicks.

The next page asks them to choose an "Entertainment Plan."

Champions League is no longer clearly visible.

Nothing is necessarily factually incorrect.

But we may have created a gap between the promise that brought the person into the journey and the decision we are now asking them to make.

Coach should be capable of detecting this type of problem.

---

## Coach also needs business context

I don't want Coach blindly optimizing for conversion.

Acquisition is a commercial system.

Depending on the campaign or market, we may care about:

- Conversion.
- Revenue.
- Package mix.
- ARPU.
- Trial starts.
- Paid subscriptions.
- Quality of acquisition.
- Long-term retention.
- Churn propensity.
- CAC/payback.
- Offer eligibility.
- Content rights.
- Market-specific requirements.
- Operational constraints.

Therefore, before Coach judges a journey, it should understand:

**Business Goal → User Goal → Target Audience → Market → Entry Source → Desired Product/Package → Business Constraints → Available Evidence → Journey**

Then the behavioral sciences can evaluate the journey against that context.

Otherwise Coach could make a perfectly reasonable UX recommendation that damages the actual commercial objective.

For example, it might recommend emphasizing the cheapest package because it appears easier to understand or lower risk.

That might increase conversion while reducing revenue or pushing customers toward a package the business doesn't want to prioritize.

Coach needs to understand this trade-off rather than optimizing one metric in isolation.

---

## How I want the AI architecture to evolve

Today we effectively have something closer to:

Copy → Goal → Science → Coach → Score

For Acquisition I want to evolve this into:

```
Business Goal + User Goal + Journey Context + Evidence
  ↓
Journey Understanding
  ↓
Decision & Behavioral Sciences
  ↓
Copy Sciences
  ↓
Truth & Evidence Guard
  ↓
Coach
  ↓
Findings + Recommendations + Confidence
  ↓
Score
```

I also don't want to simply throw twenty additional sciences into one giant prompt.

I would rather organize the knowledge into several specialist brains.

**Decision Brain** — Understands how humans evaluate alternatives and make decisions.

**Choice Architecture Brain** — Understands packages, ordering, defaults, recommendations, grouping and comparison structures.

**Cognitive & Clarity Brain** — Understands cognitive load, processing fluency, information hierarchy, progressive disclosure and comprehension.

**Trust & Risk Brain** — Understands uncertainty, perceived risk, persuasion resistance, transparency and commitment.

**Journey / UX Brain** — Understands transitions, mental models, information scent, message match, friction and journey consistency.

**Commercial Acquisition Brain** — Understands the actual acquisition objective, package strategy, commercial constraints and which metrics we're trying to influence.

**Copy Brain** — Our existing Copy intelligence continues handling language, persuasion, clarity, goal alignment, market voice and truthful claims.

Coach then sits above these specialists.

Coach should resolve conflicts between them rather than simply adding their recommendations together.

And above everything should remain one principle:

**Evidence beats opinion.**

The sciences can tell Coach what might influence human behavior.

They cannot prove what will happen in our specific DAZN journey.

Whenever we have DAZN experiments, analytics, research, market evidence or historical performance, that evidence should outrank general behavioral theory.

When we have strong scientific evidence but no DAZN-specific evidence, Coach can make a hypothesis and explain why.

When evidence is weak, Coach should lower its confidence.

And when there is no defensible evidence, Coach should say so rather than hallucinating certainty.

The goal is not to build an AI that always has an answer.

The goal is to build an AI that knows what it knows, why it believes it, how confident it is, and when it should not make a recommendation.
