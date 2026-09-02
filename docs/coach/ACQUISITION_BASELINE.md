# Acquisition Baseline — the doctrine that always runs

Owner's brief, 2026-09-02, verbatim. Companion to [ACQUISITION_COACH_BRIEF.md](ACQUISITION_COACH_BRIEF.md)
and [ACQUISITION_SCIENCE_STACK.md](ACQUISITION_SCIENCE_STACK.md).

1. **Completion** — can the user successfully reach subscription?
2. **Decision clarity** — can they understand what they are choosing?
3. **Package comprehension & comparison** — are differences clear?
4. **Decision friction** — is unnecessary cognitive/interaction effort getting in the way?
5. **Purchase confidence** — does the user understand what they get and what happens next?
6. **Offer comprehension** — are applicable offers/trials communicated correctly?
7. **Journey consistency** — does each step maintain the promise and expectations established earlier?
8. **Informed choice & trust** — no misleading defaults, hidden conditions, unsupported claims, artificial pressure, etc.
9. **Commercial alignment** — does the journey support the stated DAZN business objective?
10. **Evidence integrity** — are Coach's conclusions and recommendations actually supported?

These are the baseline acquisition doctrine. They run 100% of the time, just like truth rules run regardless of the selected Hero goal in the existing system. (Reference: DAZN-Copy-Coach-Sciences.pdf — not yet in this folder.)

Then, separately, we can define actual business goals that change what Coach prioritizes — for example maximize paid acquisition, steer toward a priority package, increase trial starts, improve package mix, etc.

So the architecture should be:

```
Acquisition Baseline — always ON
+
Business Goal — changes priorities
+
Market / Audience / Journey Context
+
Evidence
→
Coach
```
