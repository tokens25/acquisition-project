# Acquisition Coach Architecture v2

Owner's brief, 2026-09-02, verbatim. Supersedes the parts of
[ACQUISITION_COACH_BRIEF.md](ACQUISITION_COACH_BRIEF.md) and
[ACQUISITION_BASELINE.md](ACQUISITION_BASELINE.md) it contradicts.

---

I want you to improve the existing DAZN Acquisition Journey Coach architecture.
Do not rebuild the product or redesign the UI. The Acquisition Journey Builder and its flow already exist.
The purpose of this work is to strengthen the intelligence behind Coach: how it understands an acquisition journey, what sciences it uses, what it is allowed to conclude, how it separates evidence from inference, how goals affect its reasoning, how it scores journeys, and when it should recommend an A/B test.

The most important principle is: **EVIDENCE BEATS OPINION.**

However, be careful with how this principle is interpreted. Lack of DAZN-specific experimental evidence does NOT mean Coach is forbidden from making recommendations. Established science can support recommendations about clarity, comprehension, cognitive difficulty, consistency, trust, choice architecture and similar mechanisms. What Coach must NOT do without DAZN-specific causal evidence is claim that a change will improve a DAZN business outcome such as conversion, revenue, ARPU, retention, package uptake or churn by any amount.

Allowed: "Inconsistent terminology creates unnecessary comprehension difficulty. Use one term consistently."
Allowed: "The preselected option receives a choice-architecture advantage. Because Annual is the configured business priority, this is worth testing."
Not allowed: "Making Annual the default will increase conversion."
Not allowed: "Annual will perform 12% better."

The system must always distinguish between: WHAT WE OBSERVE · WHAT EVIDENCE SUPPORTS IT · WHAT SCIENCE SUGGESTS MAY BE HAPPENING · WHAT WE RECOMMEND · WHAT BUSINESS OUTCOME REMAINS UNKNOWN · HOW CONFIDENT WE ARE · WHETHER AN A/B TEST IS WARRANTED

## 1. The object Coach is reviewing

Coach reviews the complete acquisition journey, not isolated screens: entry/campaign context, landing, package selection, cadence selection, account creation, sign-in, eligibility/ZIP checks, payment, checkout, confirmation. Coach must understand the journey as a connected decision system and continuously reason: What brought the user here? What was promised? What does the user now expect? What are they being asked to decide? What information do they currently have? What must they remember from earlier? What has changed? What is receiving prominence? What is selected by default? What does the user believe will happen after the next action? Does the next screen satisfy that expectation? Does the journey continue supporting the configured business direction?

## 2. Do not redesign the UI

Coach is NOT a visual-design critic. It should not propose new layouts, new visual components, different card designs, new navigation patterns, visual styling changes. It works with things market teams can realistically configure: copy, labels, package ordering, defaults, recommended packages, content emphasis, offer emphasis, benefit emphasis, journey messaging, package descriptions, CTA language, information sequencing where configurable, campaign continuity, content/package alignment.

Prices are particularly protected. Coach may evaluate how a price is explained, whether price units contradict each other, whether billing cadence is understandable, whether prices can be compared, whether existing verified savings are communicated. Coach may NOT invent a price, raise a price, lower a price, recommend an economically optimal price, invent a discount, predict price elasticity, unless actual DAZN evidence specifically supports such analysis in the future.

## 3. The Acquisition Baseline is always on

Do not make these selectable goals. Every acquisition journey must always be evaluated against the baseline:

1. Completion. Can the user successfully progress toward subscription?
2. Decision clarity. Can the user understand the decision currently being asked of them?
3. Package comprehension and comparison. Can the user understand meaningful differences between available packages?
4. Decision friction. Is unnecessary cognitive or interaction effort interfering with progression?
5. Purchase confidence. Does the user understand what they are getting and what happens next?
6. Offer comprehension. Are verified offers, trials and benefits communicated correctly and understandably?
7. Journey consistency. Does each stage maintain expectations and terminology established earlier?
8. Informed choice and trust. Are important conditions visible and understandable? Are claims, defaults, recommendations and persuasion truthful?
9. Goal alignment. Does the journey support the configured DAZN business direction?

Remove "Evidence Integrity" from the Journey Health score. Evidence Integrity evaluates COACH, not the acquisition journey. A poor Coach inference must never make a good journey receive a worse Journey Health score. Evidence integrity should instead operate as an internal Coach reliability mechanism.

## 4. Configurable business directions

Keep configurable goals/directions limited to things Coach can actually reason about without pretending to know DAZN's economics.

- **DRIVE SPECIFIC PACKAGE.** DAZN specifies which package it wants to prioritize. Coach evaluates whether copy, ordering, recommendation, defaults, benefits and journey continuity support that priority. The goal does NOT automatically mean the package must be first, defaulted, or badged "recommended". Those are possible strategies, not requirements.
- **DRIVE ANNUAL PLAN.** Coach evaluates whether the journey communicates Annual clearly and whether existing choice architecture supports or works against that direction. Annual being the goal does NOT automatically mean Annual must be default. A Monthly default can create a scientifically interesting conflict worth testing without being objectively "wrong."
- **ACQUIRE FOR SPECIFIC CONTENT.** DAZN supplies a sport, competition, team, athlete, event or content proposition. Coach traces that acquisition reason through the journey and identifies where it disappears or becomes disconnected.
- **ACQUIRE SPECIFIC AUDIENCE.** Coach evaluates whether language, proposition, benefits and journey information address that audience. Coach must NOT pretend it knows that audience's preferences unless actual research/data supports them.
- **DRIVE SPECIFIC OFFER.** An existing verified offer. Coach evaluates whether it is clearly communicated and maintained. Coach never changes the economics.
- **DRIVE SPECIFIC BENEFIT.** Coach evaluates whether the verified benefit is clear, relevant to the decision and carried through the journey.
- **DRIVE BUNDLE / ADD-ON.** Coach evaluates whether the existing structure, copy, ordering and emphasis support it.
- **MAINTAIN CAMPAIGN PROPOSITION.** Coach traces the proposition from entry through acquisition and identifies where the promise becomes diluted, contradicted or lost.

## 5. Some things are not goals

Do NOT make configurable goals of: Content-to-Package Match, Campaign consistency, Clarity, Trust, Reduce friction, Package comprehension. These are evaluation responsibilities. Content-to-Package Match runs automatically when entitlement/package information exists. The science explains WHY this may matter. DAZN entitlement information establishes WHAT is true.

## 6. Goal is not strategy

A GOAL tells Coach what DAZN wants prioritized. A STRATEGY is a possible way of supporting that goal. Goal: Drive Annual Plan. Possible strategies: default Annual, place Annual first, explain verified Annual benefits, improve the Annual versus Monthly comparison, change Annual copy, carry Annual messaging through checkout, emphasize a verified Annual saving. Do not hard-code any strategy as a mandatory consequence of selecting the goal. A goal gives Coach direction. It does not give Coach permission to manufacture the answer.

## 7. Specialist brains

Decision Brain (comparing alternatives, multiple attributes). Choice Architecture Brain (ordering, defaults, recommendations, grouping, number of alternatives, relative prominence). Cognitive & Clarity Brain (cognitive load, processing fluency, terminology, information complexity, progressive disclosure, recognition versus recall). Trust & Risk Brain (claims, conditions, contradictions, uncertainty, persuasion pressure, perceived risk, transparency). Journey / UX Brain (cross-screen expectations, information scent, mental models, message continuity, transitions, purposeful versus unnecessary friction). Goal Alignment Brain (rename of the Commercial Brain: configured direction, configured target, whether the journey supports it, trade-offs between directions). Copy Brain (not grammar checking: reuse the Hero Copy AI's intelligence: Processing Fluency, Commitment Gradient, MECLABS value framing, Persuasion Research, concrete versus abstract language, truth guards, claim verification, market voice, clear CTA language, one action / one name, unsupported urgency, benefit communication; then acquisition-specific reasoning on top).

## 8. Formal science stack

Judgment and Decision Making · Behavioral Decision Theory · Choice Architecture · Default Effect · Status Quo Bias · Choice Overload / Assortment Choice Research · Multi-Attribute Decision Making · Attribute-Based Choice · Elimination-by-Aspects Model (Tversky) · Prospect Theory (Kahneman & Tversky) · Loss Aversion · Reference Dependence · Framing Effect · Anchoring Effect · Mental Accounting (Thaler) · Reference Price Research · Compromise Effect · Cognitive Load Theory (Sweller) · Processing Fluency · Hick-Hyman Law · Information Foraging Theory (Pirolli & Card) · Information Scent · Mental Models (HCI / Cognitive Psychology) · Recognition Rather Than Recall · Expectation-Confirmation Theory · Persuasion Knowledge Model (Friestad & Wright) · Psychological Reactance Theory (Brehm) · Perceived Risk Theory · Signaling Theory · Social Proof / Informational Social Influence · Progressive Disclosure · Behavioral Sludge · Transaction / Search Costs · Means-End Chain Theory · Commitment and Consistency research.

Use contested effects carefully: Choice Overload, Compromise Effect and Goal-Gradient are not universal laws. Never use the existence of a named theory as permission to manufacture a recommendation.

## 9. Methods above the sciences

Experimental Design · Online Controlled Experiments / A/B Testing · Causal Inference. Behavioral science identifies a plausible mechanism. DAZN analytics identifies what is happening. Controlled experimentation identifies whether changing X causes Y. Do not mix these. Remove "Internal Consistency" from the science/method list (it has a specific psychometric meaning); implement it as DETERMINISTIC CROSS-SCREEN CONSISTENCY CHECKING, a system rule, not behavioral science.

## 10. Evidence model

Separate at least: TRUTH / CONTENT EVIDENCE (what objectively exists in this journey) · DAZN BEHAVIORAL EVIDENCE (analytics: what users do, not necessarily why) · DAZN CAUSAL EVIDENCE (controlled experiments) · USER / MARKET RESEARCH · SCIENTIFIC EVIDENCE (peer-reviewed mechanism) · HCI / ESTABLISHED PRACTICE · AI INFERENCE (never disguised as science).

## 11. Recommendation logic

Every meaningful finding contains: OBSERVATION · EVIDENCE · SCIENCE · INTERPRETATION · RECOMMENDATION (if evidence supports acting) · EXPECTED MECHANISM · BUSINESS OUTCOME (explicitly UNKNOWN unless DAZN evidence supports one) · CONFIDENCE · VALIDATION (whether DAZN data, research or an experiment is needed).

## 12. Action types

FIX: enough evidence that something is incorrect, contradictory, incomplete or unnecessarily unclear (contradictory billing units, incompatible renewal dates, a placeholder, different names for the same action where consistency is clearly required). TEST: a scientifically supported hypothesis, at least two defensible alternatives, and an unknown DAZN-specific causal outcome; Coach proposes an A/B test. CHECK: a credible concern without enough evidence to change or experiment; Coach explains what would settle it. NOTE: useful observation, no action; positives may be Notes.

## 13. A/B test recommendation engine

Recommend a test when: a meaningful issue or opportunity; a credible mechanism supported by science or DAZN evidence; at least two defensible variants; existing evidence does not settle it; the variable can be isolated; it matters to the configured goal; the experiment could produce actionable knowledge. Think evidence strength × goal relevance × expected behavioral importance × testability. Do not expose fake mathematical precision.

## 14. How Coach should describe a test

HYPOTHESIS · WHY THIS IS WORTH TESTING (science + observation + goal) · CONTROL · VARIANT (smallest meaningful change) · PRIMARY MEASURE (only a metric DAZN has) · GUARDRAIL (only existing metrics) · WHAT WE WILL LEARN · CONFIDENCE TEST IS WORTH RUNNING (High/Medium/Low) · CONFIDENCE VARIANT WILL WIN (Unknown unless evidence supports a direction).

## 15. Science can support action

Do NOT use "No DAZN evidence = no recommendation." Use "No DAZN causal evidence = no DAZN business-outcome claim." Established science can justify recommendations when mechanism and problem are clear. We do not need an A/B test to establish every basic comprehension improvement. Coach cannot say "This will increase conversion" unless DAZN evidence establishes it.

## 16. Scoring

JOURNEY HEALTH SCORE evaluates the always-on baseline and must be the same for a journey regardless of the selected goal. GOAL ALIGNMENT SCORE evaluates how strongly the journey supports the configured direction. Example: Journey Health 87, Drive Annual Alignment 61. Do not blend them. Do not include Coach Evidence Integrity in Journey Health.

## 17. Scoring weights are not science

Fix = 22%, Check = 9%, Likely = 0.7, Possible = 0.4 are PRODUCT-DEFINED SCORING WEIGHTS unless calibrated. Document that. Later calibrate against DAZN experiments, analytics, expert judgment, research, historical performance. No fake precision.

## 18. Confidence

Separate confidence in the diagnosis from confidence in business impact, and confidence that something should be tested from confidence in which variant wins. Do not collapse these into one score.

## 19. Defaults, ordering and recommendations

Coach may analyze these, identify the advantages they create, recommend considering a change when evidence supports it, and recommend testing alternatives. Coach should NEVER silently change a default, package order, recommended package, Most Popular badge, commercial claim or price.

## 20. Claims such as "Most Popular"

Treat labels as claims when they imply factual evidence: Most Popular, Best Value, Recommended, Save X%, Most Watched. Distinguish a business-selected recommendation from a factual popularity/performance claim. If the journey says "Most Popular," there should be evidence supporting popularity. Signaling Theory and Social Proof explain why.

## Addendum (same day)

Based on the goal, Coach should suggest which tier should be the default selection, as a strategy to consider and test, never as a silent change.
