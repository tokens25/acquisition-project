"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ProgressBus, ProgressEvent, StampedEvent } from "./progressBus";

// The stylesheet is imported by YOU, once, wherever your app loads global CSS
// (`import "./progress-screen.css"`). Kept out of this file on purpose: not
// every build is set up to import CSS from a component, and a kit that fails at
// the bundler is no use to anyone.

/**
 * THE WAITING SCREEN: one live sentence, the parallel lanes, and the record.
 *
 * While a multi-step pipeline runs, the app shows one perfectly-set sentence
 * about what is happening right now, a strip showing every workstream's state
 * at once, and the settled history beneath it. Then it hands over a finished
 * screen. It is not a spinner and it is not a fake checklist.
 *
 * ── The four rules that make it work (learned the hard way) ───────────────
 *
 * 1. EVERY LINE NARRATES A REAL EVENT. No synthetic steps, no timer-driven
 *    percentages, no "almost there". Setbacks are stated plainly, and when a
 *    grader or a provider gives a reason, that reason is shown verbatim: it is
 *    evidence, and paraphrasing it makes the screen less honest.
 *
 * 2. IT NEVER TRAPS THE USER. If the pipeline goes quiet the screen dissolves
 *    on its own (fail-open watchdog) and there is always a Cancel that STOPS
 *    the work rather than hiding it.
 *
 * 3. IT HOLDS UNTIL THE WHOLE JOB IS DONE, and "done" is checked against your
 *    STATE, not inferred from the event stream. See `delivered`.
 *
 * 4. A QUESTION HOLDS EVERYTHING. When the pipeline needs an answer from the
 *    user, the screen stays up behind the question and the watchdog pauses:
 *    thinking time must never be mistaken for a stalled pipeline.
 *
 * Everything domain-specific is a prop. Bring your own lanes, your own event
 * kinds, your own narrator.
 */

export type Tone = "working" | "ok" | "retry";

export interface Lane {
  id: string;
  /** Shown in the lane strip and the record rows. Keep it one short word. */
  label: string;
  /** What this lane says before it has done anything ("waiting", "queued"). */
  idleStatus?: string;
}

/** What one event becomes on screen. Returned by your `narrate`. */
export interface Narration {
  lane: string;
  /** The live sentence, centre stage. */
  text: string;
  /** A quiet monospace line under it (a round counter, a bar). */
  detail?: string | null;
  /**
   * What settles into the record. Substance first, no ritual prefix: seven
   * rows all starting "The grader sent it back:" is unreadable. Defaults to
   * `text`.
   */
  record?: string;
  /** This lane's one-line status for the parallel strip. */
  laneStatus: string;
  tone: Tone;
}

export interface Timings {
  /** A run must START within this after mount, or the screen lets go. */
  armWindowMs: number;
  /**
   * No events for this long, fail open.
   *
   * DERIVE THIS FROM ONE CALL, NOT ONE ROUND. Ours was set to a round's budget
   * and fired in the middle of a healthy retrying call, dissolving the screen
   * while the work was still landing. If one attempt can legitimately stay
   * silent for 90s (three tries with backoff), this number must exceed that.
   * The way to keep it workable rather than a blind wait is to emit an event
   * BETWEEN the halves of a step, so the real unit of silence is one call.
   */
  quietDissolveMs: number;
  /**
   * How long every lane must HOLD settled before the reveal.
   *
   * The gap this covers is real: one lane can finish while another is still
   * spinning up, and leaving on the first "all quiet" drops the user into a
   * half-finished screen. Any lane going back to work inside the hold cancels
   * the reveal.
   *
   * If anything downstream is DEBOUNCED (a re-validation that announces itself
   * 1.5s after its input changes), this hold must outlast that debounce, or
   * the screen opens and then visibly starts working again. Derive it from the
   * debounce rather than hardcoding, so a change there cannot silently reopen
   * the race.
   */
  allSettledHoldMs: number;
  /** Fade duration. Must match the CSS transition in progress-screen.css. */
  fadeMs: number;
}

const DEFAULT_TIMINGS: Timings = {
  armWindowMs: 8_000,
  quietDissolveMs: 108_000,
  allSettledHoldMs: 1_700,
  fadeMs: 420,
};

export interface ProgressScreenProps<E extends ProgressEvent> {
  bus: ProgressBus<E>;
  /** The workstreams that genuinely run in parallel, in display order. */
  lanes: Lane[];
  /**
   * Turn one bus event into a sentence, or null to ignore it. ONE place does
   * this, so the strings cannot drift apart from what the pipeline really did.
   */
  narrate(event: E): Narration | null;
  /**
   * WHICH EVENTS MEAN A LANE HAS ACTUALLY FINISHED.
   *
   * State this explicitly. Do NOT infer it from tone: we did, and two
   * mid-flight events carried a non-working tone (a provisional draft, and a
   * rejection that is followed by another attempt). Both retired their lane
   * early, so the screen left while the work was still running. Tone is
   * presentation; completion is a separate fact.
   *
   * A FAILURE IS AN ENDING. Include your error events here, or a failed lane
   * stays "working" forever and only the watchdog frees the screen.
   */
  isTerminal(event: E): boolean;
  /**
   * IS THE JOB ACTUALLY DELIVERED? Checked against your state at the moment of
   * the reveal, not against the event stream.
   *
   * Why: an event stream cannot express this. "No lane is working" is
   * ambiguous, because a lane that has not STARTED looks exactly like one that
   * has finished. And a lane can legitimately settle with a non-result ("there
   * was nothing for me to do yet"), which is terminal but is not the promise
   * being kept. So the events decide WHEN to check, and this function decides
   * WHETHER it is done: is the output actually in the fields, is the score
   * actually on the dial.
   *
   * Return true when there is genuinely nothing more coming (no input at all,
   * for instance), so such a run is not held to the watchdog.
   */
  delivered(): boolean;
  /**
   * Optional: a value that changes when `delivered()` flips to true through a
   * path that emits NO event (a cached result arriving as state). Without it,
   * such a run waits for the watchdog with a finished screen behind it.
   */
  deliveredSignal?: unknown;
  /** Recognise a "waiting for the user" event. Return the question's text. */
  askText?(event: E): { open: boolean; id: string; text?: string } | null;
  /** Sentence shown before the first event lands. Narrate the real thing. */
  openingText?: string;
  /** Re-arm the screen when this changes (a new input = a new run). */
  subject?: string | null;
  /**
   * Shows once per subject per browser session when set. Pass null to show
   * every time.
   */
  sessionKey?: string | null;
  /** Cancel STOPS the work: abort your in-flight calls here, then navigate. */
  onCancel?(): void;
  /** Called when the screen has fully left. `reason` is for your telemetry. */
  onLeave?(reason: "settled" | "watchdog" | "disarm" | "cancelled"): void;
  /** The mark at the top. Defaults to a CSS-only breathing orb, no assets. */
  mark?: ReactNode;
  cancelLabel?: string;
  timings?: Partial<Timings>;
  /** Diagnostics. Leave on: it is the only way to tell a stuck lane from a
   *  flapping one, and it is one console line per decision. */
  debug?: boolean;
}

type Phase = "armed" | "active" | "leaving" | "done";
type LaneState = "idle" | "working" | "settled";

interface Row extends Narration {
  id: number;
  at: number;
}

export function ProgressScreen<E extends ProgressEvent>(props: ProgressScreenProps<E>) {
  const {
    bus,
    lanes,
    narrate,
    isTerminal,
    delivered,
    deliveredSignal,
    askText,
    openingText = "Opening…",
    subject = null,
    sessionKey = null,
    onCancel,
    onLeave,
    mark,
    cancelLabel = "Cancel and return",
    debug = true,
  } = props;

  const timings = useMemo(() => ({ ...DEFAULT_TIMINGS, ...props.timings }), [props.timings]);

  const log = (event: string, data: Record<string, unknown>) => {
    if (!debug) return;
    try {
      console.info(`[progress] ${event}`, JSON.stringify(data));
    } catch {
      /* diagnostics must never break the reveal */
    }
  };

  const alreadyShown = useMemo(() => {
    if (!sessionKey || typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(sessionKey) === "1";
    } catch {
      return false;
    }
  }, [sessionKey]);

  const [phase, setPhase] = useState<Phase>(alreadyShown ? "done" : "armed");
  const [live, setLive] = useState<Row | null>(null);
  const [history, setHistory] = useState<Row[]>([]);
  const [laneStatuses, setLaneStatuses] = useState<
    Partial<Record<string, { status: string; tone: Tone }>>
  >({});
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [waitingAsk, setWaitingAsk] = useState<string | null>(null);

  // Everything the gate reads at DECISION time goes through a ref, never
  // through the values one render happened to close over. The subscription
  // mounts once; the decision is made much later.
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const startedAtRef = useRef<number | null>(null);
  startedAtRef.current = startedAt;
  const laneStates = useRef<Record<string, LaneState>>({});
  const openAsks = useRef(new Set<string>());
  const cancelled = useRef(false);
  const liveRef = useRef<Row | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quietTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deliveredRef = useRef(delivered);
  deliveredRef.current = delivered;

  const leave = (reason: "settled" | "watchdog" | "disarm" | "cancelled") => {
    if (phaseRef.current === "leaving" || phaseRef.current === "done") return;
    log("reveal", {
      reason,
      afterMs: startedAtRef.current ? Date.now() - startedAtRef.current : null,
      lanes: { ...laneStates.current },
    });
    if (sessionKey && typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(sessionKey, "1");
      } catch {
        /* private mode: showing it again is the harmless outcome */
      }
    }
    setPhase("leaving");
    setTimeout(() => {
      setPhase("done");
      onLeave?.(reason);
    }, timings.fadeMs);
  };
  const leaveRef = useRef(leave);
  leaveRef.current = leave;

  const armSettle = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      settleTimer.current = null;
      // Re-checked HERE, not when the hold was armed: the promise may have
      // become true (or stopped being true) during the hold.
      if (!deliveredRef.current()) {
        log("settle-dropped", { lanes: { ...laneStates.current } });
        return;
      }
      if (cancelled.current) return;
      leaveRef.current("settled");
    }, timings.allSettledHoldMs);
  };
  const armSettleRef = useRef(armSettle);
  armSettleRef.current = armSettle;

  /** Nothing is working, the promise is kept, and no question is open. */
  const maybeSettle = () => {
    const anyWorking = Object.values(laneStates.current).some((s) => s === "working");
    if (anyWorking) return false;
    if (openAsks.current.size > 0) return false;
    if (!deliveredRef.current()) return false;
    if (settleTimer.current) return true; // already holding
    armSettleRef.current();
    return true;
  };

  // ── Arm / disarm on mount ────────────────────────────────────────────────
  // The scene is visible from the first frame (no flash of the unfinished
  // screen behind it). If no event arrives shortly after mount there is no run
  // happening, so fade out gently rather than popping away.
  useEffect(() => {
    if (alreadyShown) {
      setPhase("done");
      return;
    }
    const disarm = setTimeout(() => {
      if (phaseRef.current === "armed") leaveRef.current("disarm");
    }, timings.armWindowMs);
    return () => clearTimeout(disarm);
  }, [alreadyShown, timings.armWindowMs]);

  // ── A new subject re-earns the screen ────────────────────────────────────
  // The gate used to protect only the FIRST open, so feeding the pipeline new
  // input in an already-open session ran the whole thing in front of the user:
  // skeleton fields, half-written output, and validation complaining about the
  // placeholder the pipeline was mid-way through replacing. A new subject means
  // a new run, and a new run re-earns the screen. First mount is a baseline,
  // never a re-arm; re-feeding the SAME subject re-arms nothing, because the
  // content is identical and the caches answer.
  const subjectRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const next = subject ?? null;
    const prev = subjectRef.current;
    subjectRef.current = next;
    if (prev === undefined) return; // first render is the baseline
    if (phaseRef.current !== "done" || !next || next === (prev ?? null)) return;
    laneStates.current = {};
    if (settleTimer.current) { clearTimeout(settleTimer.current); settleTimer.current = null; }
    if (quietTimer.current) { clearTimeout(quietTimer.current); quietTimer.current = null; }
    openAsks.current.clear();
    cancelled.current = false;
    setWaitingAsk(null);
    setLive(null);
    liveRef.current = null;
    setHistory([]);
    setLaneStatuses({});
    setStartedAt(null);
    setPhase("armed");
    log("rearm", { reason: "new-subject" });
    const disarm = setTimeout(() => {
      if (phaseRef.current === "armed") leaveRef.current("disarm");
    }, timings.armWindowMs);
    return () => clearTimeout(disarm);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- phase is read
    // through the ref at decision time; depending on it would re-baseline.
  }, [subject]);

  // ── The bus is the single source of what is happening ────────────────────
  useEffect(() => {
    // Mounted even when the screen is already retired: a re-armed screen needs
    // the narration, and while phase is "done" the handler exits on its first
    // line, which costs nothing.
    return bus.subscribe((stamped: StampedEvent<E>) => {
      const phaseNow = phaseRef.current;
      if (phaseNow === "leaving" || phaseNow === "done") return;

      // A QUESTION HOLDS EVERYTHING. While the ask is on screen the run is
      // waiting on the USER: the reveal must not dissolve this screen behind
      // the question, and the watchdog must not count thinking time as a stall.
      const ask = askText?.(stamped.event) ?? null;
      if (ask) {
        if (ask.open) {
          openAsks.current.add(ask.id);
          setWaitingAsk(ask.text ?? null);
          if (settleTimer.current) { clearTimeout(settleTimer.current); settleTimer.current = null; }
          if (quietTimer.current) { clearTimeout(quietTimer.current); quietTimer.current = null; }
          log("ask-open", { ask: ask.id });
        } else {
          openAsks.current.delete(ask.id);
          if (openAsks.current.size === 0) setWaitingAsk(null);
          if (quietTimer.current) clearTimeout(quietTimer.current);
          quietTimer.current = setTimeout(
            () => leaveRef.current("watchdog"),
            timings.quietDissolveMs,
          );
          // Declining an ask changes no lane state, so nothing else would
          // re-run the gate: re-check here so a settled run still reveals.
          maybeSettle();
          log("ask-done", { ask: ask.id });
        }
        return;
      }

      const narrated = narrate(stamped.event);
      if (!narrated) return;

      const row: Row = { ...narrated, id: stamped.id, at: stamped.at };
      if (phaseRef.current === "armed") setPhase("active");
      setStartedAt((prev) => prev ?? stamped.at);

      // Each lane's latest state feeds the parallel strip.
      setLaneStatuses((prev) => ({
        ...prev,
        [narrated.lane]: { status: narrated.laneStatus, tone: narrated.tone },
      }));

      // THE PREVIOUS SENTENCE IS READ FROM A REF, NOT FROM A STATE UPDATER.
      // Moving it into the record from inside `setLive(prev => …)` looks
      // tidier and is wrong: React deliberately double-invokes updaters in
      // development to surface impure ones, so every row landed in the record
      // TWICE. Updaters stay pure; the ref carries the previous value.
      const prev = liveRef.current;
      liveRef.current = row;
      setLive(row);

      // THE RECORD HOLDS OUTCOMES, NOT ACTIVITY. Transient "working" states
      // only ever occupy the live sentence: settling them as rows turned every
      // step start into record noise ("Writing…", "Checking…", "Writing…").
      // Parallel workstreams can also produce an identical outcome twice, so
      // consecutive duplicates collapse.
      if (prev && prev.tone !== "working") {
        const settled = prev.record ?? prev.text;
        setHistory((rows) =>
          (rows[0]?.record ?? rows[0]?.text) === settled ? rows : [prev, ...rows].slice(0, 8),
        );
      }

      laneStates.current[narrated.lane] = isTerminal(stamped.event) ? "settled" : "working";

      const hadPendingSettle = settleTimer.current !== null;
      if (settleTimer.current) {
        clearTimeout(settleTimer.current);
        settleTimer.current = null;
      }
      const willSettle = maybeSettle();

      // The watchdog restarts on every event: silence is what it measures.
      if (quietTimer.current) clearTimeout(quietTimer.current);
      quietTimer.current = setTimeout(
        () => leaveRef.current("watchdog"),
        timings.quietDissolveMs,
      );

      log("event", {
        kind: stamped.event.kind,
        lane: narrated.lane,
        landed: laneStates.current[narrated.lane],
        lanes: { ...laneStates.current },
        willSettle,
        // A `cancelledSettle` that keeps repeating is a flapping lane, which is
        // the thing that used to cost 108 silent seconds.
        cancelledSettle: hadPendingSettle && !willSettle,
        atMs: startedAtRef.current ? stamped.at - startedAtRef.current : 0,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- subscribe once
  }, [bus]);

  // ── A result that arrives as STATE, with no event ────────────────────────
  // A cached answer can land on your state without the bus saying a word, and
  // the gate above only re-checks when an event arrives. When the signal
  // changes and nothing is working, run the same check the events run.
  useEffect(() => {
    if (phaseRef.current === "leaving" || phaseRef.current === "done") return;
    maybeSettle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveredSignal]);

  useEffect(
    () => () => {
      if (quietTimer.current) clearTimeout(quietTimer.current);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  // Elapsed clock. It reports time PASSED, never time remaining, because a
  // remaining-time estimate here would be a fiction.
  //
  // CHANGED FROM THE KIT. It read once a second and drew nothing until the
  // first tick, so it showed 00:00 for a whole second and then, with the timer
  // coalesced under a busy first render, moved only every two — which reads as
  // a stopped clock rather than a slow one. It now reads once on the spot and
  // then four times a second. The value is still the difference between two
  // wall-clock times, so a late or dropped tick cannot make it drift; the
  // reading is only ever how stale the last paint is.
  useEffect(() => {
    if (phase !== "active" || startedAt === null) return;
    setElapsed(Date.now() - startedAt);
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 250);
    return () => clearInterval(id);
  }, [phase, startedAt]);

  if (phase === "done") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`ps-root${phase === "leaving" ? " ps-leaving" : ""}`}
      style={{ ["--ps-fade" as string]: `${timings.fadeMs}ms` }}
    >
      {/* Backdrop layers: aurora wash, inner glow, and the revolving edge. */}
      <div aria-hidden className="ps-aurora" />
      <div aria-hidden className="ps-innerglow" />
      {/* The blurred fill sits UNDER the crisp line: colour bleeding outward. */}
      <div aria-hidden className="ps-edge-bleed" />
      <div aria-hidden className="ps-edge" />

      <div className="ps-stage">
        <div className="ps-mark">
          <div aria-hidden className="ps-halo" />
          {mark ?? <div aria-hidden className="ps-orb" />}
        </div>

        {/* Incoming and outgoing sentences share one grid cell so they
            cross-fade in place, and the min-height reserves two lines so a
            swap never shoves the lanes and the record around. */}
        <div className="ps-sentence-slot">
          <p key={live?.id ?? "opening"} className="ps-sentence ps-arrive">
            {waitingAsk ?? live?.text ?? openingText}
          </p>
        </div>
        <p className="ps-detail-slot">
          {live?.detail ? (
            <span key={live.detail} className="ps-detail ps-soft">
              {live.detail}
            </span>
          ) : null}
        </p>

        {/* The indeterminate hairline: it reflects that work is happening,
            never how much. No timer-driven percentages, ever. */}
        <div className="ps-hairline">
          <div className="ps-sweep" />
        </div>

        {/* The lanes run genuinely in parallel, so show all their states at
            once instead of one line thrashing between them. */}
        <div className="ps-lanes">
          {lanes.map((lane) => {
            const s = laneStatuses[lane.id];
            const working = s?.tone === "working";
            return (
              <span key={lane.id} className="ps-lane">
                <span className={`ps-lane-label${working ? " ps-lane-label-live" : ""}`}>
                  {lane.label}
                </span>
                <span
                  key={s?.status ?? "idle"}
                  className={`ps-soft ps-lane-status ps-tone-${s ? s.tone : "idle"}`}
                >
                  {s?.status ?? lane.idleStatus ?? "waiting"}
                </span>
              </span>
            );
          })}
        </div>

        {/* The record: outcomes only, newest first. Bright at the top, fading
            with age, so the recent past reads first. */}
        {history.length > 0 ? (
          <div className="ps-record">
            {history.map((row, i) => (
              <div
                key={row.id}
                style={{ opacity: Math.max(1 - i * 0.18, 0.3) }}
                className="ps-row ps-row-anim"
              >
                <RowIcon tone={row.tone} />
                <span className="ps-row-lane">
                  {lanes.find((l) => l.id === row.lane)?.label ?? row.lane}
                </span>
                <span
                  className={`ps-row-text${i === 0 ? " ps-row-text-top" : ""}`}
                  title={row.record ?? row.text}
                >
                  {row.record ?? row.text}
                </span>
                <span className="ps-row-time">
                  {startedAt ? stamp(row.at - startedAt) : ""}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* CANCEL, NOT "SKIP". The screen covers the whole app, and a run can
          legitimately take minutes, so a user with somewhere else to be needs
          a way out. It STOPS the work rather than hiding it: abort the
          in-flight calls in `onCancel` so nothing keeps running and nothing
          keeps billing. Navigate with this overlay still opaque, so there is
          no glimpse of the half-finished screen underneath. */}
      {onCancel ? (
        <button
          type="button"
          className="ps-cancel"
          onClick={() => {
            cancelled.current = true;
            if (quietTimer.current) clearTimeout(quietTimer.current);
            if (settleTimer.current) clearTimeout(settleTimer.current);
            onCancel();
          }}
        >
          {cancelLabel}
        </button>
      ) : null}

      {startedAt !== null ? <span className="ps-clock">{mmss(elapsed)}</span> : null}
    </div>
  );
}

/** Outcome icons: a drawn check and a retry sweep, not text glyphs. */
function RowIcon({ tone }: { tone: Tone }) {
  if (tone === "ok") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="ps-icon ps-icon-ok" aria-hidden>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (tone === "retry") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ps-icon ps-icon-retry" aria-hidden>
        <path d="M3 12a9 9 0 1 0 3.5-7.1" />
        <path d="M3 3v6h6" />
      </svg>
    );
  }
  return <span className="ps-icon ps-icon-dot" aria-hidden />;
}

function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * When a row happened, at a resolution that can tell two rows apart.
 *
 * ADDED TO THE KIT. The record stamped rows in whole seconds, which is right
 * for a pipeline whose steps are seconds apart and useless for one whose steps
 * are milliseconds apart: every row read 00:00 and the column looked broken
 * rather than fast. Under a minute it now reads in seconds and hundredths, so
 * a run that takes 25ms says so instead of rounding itself away. Past a minute
 * the hundredths stop earning their place and it goes back to mm:ss.
 */
function stamp(ms: number): string {
  if (ms >= 60_000) return mmss(ms);
  return `${(Math.max(0, ms) / 1000).toFixed(2)}s`;
}
