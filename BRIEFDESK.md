# BriefDesk in the acquisition editor — brief

How to bring the BriefDesk model into the edit panel, and what it costs.

**Nothing here is built.** This is the shape of the work, the decisions it waits
on, and the order I would do it in.

---

## 1 · What BriefDesk is

A handoff tool between Marketing and Dev, built on one idea: **every piece of
copy is an addressable field with a state.** `us_rsn.lp.cavs.hero1.promo` has a
value, a status, a holder and a note. The rail, the counts and the dev queue are
all views over that one fact.

Three mechanisms carry it:

- **A handoff is an object, not an event.** Numbered, addressed, timestamped,
  holding a specific set of strings. *"Handoff #2 · 2 strings · by Sam."*
- **Drift is measured against what dev shipped.** *"1 string changed after dev
  shipped it"* — the shipped value is shown, with two choices: add it to the
  next handoff, or keep what is live.
- **Two roles see different things.** Market gets a worklist; Dev gets a queue
  of what changed since they last shipped, with copy-to-clipboard. The thesis is
  printed on the screen: *"Nothing here needs a Slack message."*

## 2 · Why it fits this editor

The acquisition editor already has the expensive half. It renders a live preview
through the same rules the product would use, it knows what is missing across
every market, and it publishes to git.

What it does not have is **granularity**. Publishing hands off everything at
once. Drift is tracked for the whole set. There is no such thing as "this field,
finished, by this person, approved by that one".

BriefDesk is that granularity.

| BriefDesk | Here today |
| --- | --- |
| Preview redraws as you type | ✅ through the real rules |
| Sections | ✅ Header / Pricing / Add-on / Competitions / Features |
| "Missing" status | ✅ the publish gate computes it across 36 contexts |
| Handoff | ◐ publish-to-git exists, all-or-nothing |
| Changed since shipped | ◐ `unpublished` exists, per *set* not per field |
| Field keys | ❌ |
| Workflow state per field | ❌ |
| Approval | ❌ |
| Dev queue | ❌ |

The two ◐ rows matter most: **the hard parts are built at the wrong grain.**

---

## 3 · The foundation: field keys

Nothing else can be built first. Approvals, handoffs and drift all attach to a
key, so the key has to exist and has to be stable.

```
es.direct.ultimate.description
es.direct.ultimate.monthly-flex.standard_price
```

Derivable from what is already stored. Two requirements:

- **Stable under renaming.** A key that changes when someone edits a plan name
  is worthless — every approval and handoff pointing at it silently detaches.
- **Scoped like the editor already scopes editing.** Market, storefront and
  cadence are part of the address, because the value differs along all three.

## 4 · Three states per field, not one

These are orthogonal and must stay separate:

```
valid    | invalid                 the rules say so
ready    | missing | changed       the work says so
approved | pending | rejected      a person says so
```

A discount price can be **ready** (someone finished it), **invalid** (it is above
the standard price) and **approved** (signed last week, before the edit) — all
three at once, all true.

Collapse them into one badge and the tool will lie. The lie will be "approved",
which is the one that carries consequences.

## 5 · Two rules that make approval real

**An approval is of a value, not of a field.** Store the value's fingerprint
alongside the approval. Edit the value and the approval lapses on its own —
nobody has to remember to revoke it.

Without this the failure is certain: Product approves a description, someone
tightens the wording on Thursday, and it ships carrying an approval that was
given to different words. This is the same drift mechanism BriefDesk already
uses for *changed after dev shipped*; pointing it at approvals costs nothing and
buys automatic invalidation.

**The approver cannot be the last editor.** One line of code. Without it,
approval is theatre.

---

## 6 · Who signs what

Three domains with clean edges:

| Field | Owner |
| --- | --- |
| plan description, feature wording, badge text | **Marketing** |
| standard price, discount, intro price, intro months | **Commercial** |
| add-on: which, sold vs bundled, price, % off | **Commercial** |
| which cadences a plan is sold at | **Commercial** |
| status / channel / visible to partners | **Commercial** (partner deals) |
| which feature lines, which competitions, "+N" total | **Product** |
| journeys, steps, rendering rules | **Product** |

**PM does not appear** — which matches the pipeline, where PM edits and tests
rather than owning a category. The likely shape is **three signers and one
operator**: PM assembles, drives and is accountable for completeness; Marketing,
Commercial and Product each sign only their own fields.

Decide that deliberately. A fourth signature owning nothing is how approval
becomes ceremony — everyone clicks, nobody is accountable.

### Three fields with no obvious owner

These will bounce between lanes on every brief until someone is named:

- **`ultimate`** — which plan gets the gold treatment. Commercial's revenue,
  Marketing's message, Product's rule that only one may have it.
- **`plan_name`** — Marketing writes it, but it is brand-locked and it is the
  public face of the OvpSKU.
- **`display_order`** — who decides Ultimate sits left of Standard.

### Spain, for scale

```
Commercial   30 prices        ← the blocker; cannot be drafted or guessed
Marketing    ~15 copy fields
Product      feature lines, logo tiles, order
```

Commercial owns most of the outstanding work *and* the only fields nothing can
draft. That is the practical reason to settle decision ① below before building
anything.

---

## 7 · The problem BriefDesk does not have

**Their string has one value. Ours has one per market.**

`ultimate.description` is not one field — it is a base plus a difference per
market. BriefDesk's "63 strings" becomes 63 × markets × storefronts × cadences.
The counts explode and the rail stops being readable.

**Scope a handoff to a context**, the way the editor already scopes editing:

> Spain · Direct · Monthly Flex — 41 fields, 3 need you

One brief per market, not one brief for everything. This decision determines
what a key is, so it comes first.

## 8 · Where handoffs and approvals live

A git commit, with approvals as trailers:

```
content: Spain pricing, handoff #3

Approved-by: Sam Ellis <...> (marketing, 41ab…)
Approved-by: Nadia K <...> (product, 41ab…)
```

The hash is the value fingerprint. The audit trail becomes the same artifact as
the content — no second store, nothing to reconcile, and *"who approved this and
what exactly did they see"* stays answerable with `git log` for ever.

## 9 · What blocks publish

Two conditions, shown together rather than in sequence:

```
Publish blocked — Spain · Direct
  30 fields awaiting Commercial
   5 fields awaiting Marketing
   2 fields invalid
```

Each role sees its own lane and its own count — nobody scrolls past 172 fields
looking for theirs. That is the difference between a workflow tool and a
spreadsheet with extra steps.

**Approval never overrides validation.** An approved invalid field is still
invalid. Approval is permission, not proof.

---

## 10 · Sequencing

**First, and cheap.** Field keys, then counts in the panel header — *"26 ready ·
1 missing"* — computed from validation that already runs. That alone turns the
panel from a form into a worklist.

**Second.** Preview → field jump (tag each rendered element with its key; it is
what makes the tool feel alive), and the keyboard rail: ↑↓ move, ↵ edit, esc
stop. Both are interface work over data that now exists.

**Third, and only after the decisions below.** Section-level approve and reject
with notes → value-fingerprint lapsing → the two-condition gate → per-field
rejection routing back to the editor's queue with the reason attached.

**Defer indefinitely.** Notifications. BriefDesk's whole argument is that the
queue *is* the notification. Adding email undoes the idea.

## 11 · Decisions this waits on

1. **Do prices get signed inside this tool, or upstream in the spreadsheet
   before it arrives?** 30 of Spain's 172 empty fields, and the only true
   blocker. If upstream, Commercial never opens the app and there are two
   signers in the tool, not three.
2. **Is a handoff scoped to a context or global?** Everything hangs on this,
   including what a key is.
3. **What counts as "shipped"?** The last publish, or what the rule engine
   actually reads? Today those are not the same thing — the reverse adapter is
   the missing link, and drift cannot be measured against something that does
   not exist yet.
4. **Sequential or joint approval?** Sequential matches the pipeline but one
   person's absence stops everything.
5. **Can a handoff be partially approved** — 40 of 41 signed, one rejected — or
   is it all-or-nothing? Partial is far more useful and considerably more work.
6. **Owners for `ultimate`, `plan_name` and `display_order`.**

---

## 12 · What not to do

- **Do not build approval before field keys exist.** There is nothing to attach
  it to, and retrofitting keys under live approvals means throwing them away.
- **Do not start with per-field approval UI.** 172 clicks for Spain. Section and
  handoff level first; per-field rejection is the escape hatch, not the default.
- **Do not merge the three state axes** to save space in the rail. The badge
  that says "approved" has to mean it.
