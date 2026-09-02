# Acquisition Science Stack

Owner's list, 2026-09-02, verbatim. Companion to [ACQUISITION_COACH_BRIEF.md](ACQUISITION_COACH_BRIEF.md).

## The full catalogue — 50 formal sciences / theories

| # | Formal science / theory | What it should govern |
| --- | --- | --- |
| 1 | Judgment and Decision Making (JDM) | Overall human decision-making and evaluation of alternatives |
| 2 | Behavioral Decision Theory | Systematic patterns/biases affecting choices |
| 3 | Choice Architecture | How presentation and organization of choices influence decisions |
| 4 | Default Effect | Effect of preselected/default packages |
| 5 | Status Quo Bias | Preference for maintaining an existing/default state |
| 6 | Choice Overload | Effects of having too many alternatives |
| 7 | Assortment Choice / Assortment Size Research | How number and variety of packages affect choice |
| 8 | Multi-Attribute Decision Making (MADM) | How people evaluate options differing across several attributes |
| 9 | Attribute-Based Choice | Which package attributes people use to make comparisons |
| 10 | Elimination-by-Aspects Model — Tversky | How people progressively eliminate options using important attributes |
| 11 | Prospect Theory — Kahneman & Tversky | Gains, losses, risk and reference-dependent decisions |
| 12 | Loss Aversion | Sensitivity to perceived losses relative to gains |
| 13 | Reference Dependence | Evaluation relative to an existing reference point |
| 14 | Framing Effect | How equivalent information changes decisions depending on presentation |
| 15 | Anchoring Effect | How an initial value/option affects later judgments |
| 16 | Mental Accounting — Thaler | How consumers mentally categorize costs/value |
| 17 | Reference Price Theory / Reference Price Research | How users judge a price relative to expected/previous/comparison prices |
| 18 | Decoy Effect / Asymmetric Dominance Effect | How adding an inferior alternative can change preference between others |
| 19 | Compromise Effect | Tendency to prefer an intermediate option |
| 20 | Endowment Effect | Higher valuation of something perceived as already owned |
| 21 | Cognitive Load Theory — Sweller | Mental effort required to understand a screen/decision |
| 22 | Processing Fluency | Ease with which information is processed |
| 23 | Hick–Hyman Law | Relationship between number/complexity of choices and decision time |
| 24 | Progressive Disclosure | Managing complexity by revealing information when needed — primarily an HCI design principle |
| 25 | Information Foraging Theory — Pirolli & Card | How users follow cues/information scent toward desired information |
| 26 | Mental Models — HCI / Cognitive Psychology | Whether the journey matches users' expectations of how something works |
| 27 | Recognition Rather Than Recall | Reducing memory requirements by keeping necessary information available |
| 28 | Signaling Theory | How labels/prominence/recommendations communicate otherwise unobservable information |
| 29 | Social Proof / Informational Social Influence | Why claims such as "Most Popular" influence choice |
| 30 | Persuasion Knowledge Model — Friestad & Wright | How people recognize and respond to persuasion attempts |
| 31 | Psychological Reactance Theory — Brehm | Resistance when users perceive excessive pressure or manipulation |
| 32 | Perceived Risk Theory — Consumer Behavior | Uncertainty about financial/product/performance consequences |
| 33 | Trust in E-Commerce / Online Consumer Trust Research | Trust during digital transactions and purchase decisions |
| 34 | Goal-Gradient Hypothesis | Motivation increases as someone approaches a goal |
| 35 | Commitment and Consistency | Effects of previous actions/commitments on subsequent behavior |
| 36 | Behavioral Sludge / Sludge Theory | Unnecessary administrative/behavioral friction |
| 37 | Transaction Cost Theory / Search Costs | Effort required to obtain, compare and act on information |
| 38 | Expectation-Confirmation Theory (ECT) | Difference between what users expect and what the experience delivers |
| 39 | Cognitive Consistency | Preference for consistency between beliefs, expectations and subsequent information |
| 40 | Information Scent | Part of Information Foraging Theory; strength of cues suggesting where an action leads |
| 41 | Means–End Chain Theory | Connecting product attributes → benefits → personal value |
| 42 | Consumer Decision Journey / Customer Journey Research | Behavior across the acquisition journey rather than isolated screens |
| 43 | Conversion Funnel Analysis | Measurement of progression/drop-off across acquisition stages; methodology rather than behavioral science |
| 44 | Customer Acquisition / Marketing Science | Commercial acquisition performance |
| 45 | Customer Lifetime Value (CLV) Modeling | Why highest immediate conversion isn't necessarily highest-value acquisition |
| 46 | Customer Churn / Retention Modeling | Relationship between acquisition decisions and downstream retention |
| 47 | Experimental Design / Randomized Controlled Experiments | Determining whether a proposed journey change actually causes improvement |
| 48 | A/B Testing / Online Controlled Experiments | Testing alternative packages/defaults/copy/journey structures |
| 49 | Causal Inference | Separating correlation from actual causal effects |
| 50 | Bayesian Decision Theory / Bayesian Inference | Updating confidence as DAZN-specific evidence accumulates |

## But I would NOT put all 50 into the AI equally

That's important.

Having more theories doesn't automatically make Coach smarter. It can actually make it worse because the model can find some theory to justify almost anything.

I'd create a **core Acquisition Science Stack of roughly 20**:

### Decision & Choice
- Judgment and Decision Making
- Choice Architecture
- Default Effect
- Choice Overload
- Multi-Attribute Decision Making
- Prospect Theory
- Framing Effect
- Anchoring Effect
- Compromise Effect
- Mental Accounting
- Reference Price Research

### Understanding & Journey
- Cognitive Load Theory
- Processing Fluency
- Hick–Hyman Law
- Information Foraging Theory
- Mental Models
- Expectation-Confirmation Theory

### Trust & Persuasion
- Persuasion Knowledge Model
- Psychological Reactance Theory
- Perceived Risk Theory

## Above all of them

**Experimental Design + Causal Inference + A/B Testing.**

Because behavioral science can legitimately tell Coach:

> "Default Effect research suggests the preselected package may influence selection."

It cannot legitimately tell Coach:

> "Making Package A default will increase DAZN conversion by 12%."

Only DAZN-specific evidence or a properly designed experiment can establish that.

## The evidence hierarchy

1. DAZN causal/experimental evidence
2. DAZN observational/analytics evidence
3. Market/user research
4. Peer-reviewed/general scientific evidence
5. Established HCI/industry principles
6. AI inference

**And AI inference should never masquerade as science.**
