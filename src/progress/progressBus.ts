/**
 * PROGRESS BUS: the pipeline's honest narration channel.
 *
 * Every workstream (a model call, a fetch, a validation pass) reports REAL
 * events here as they happen. No synthetic steps, no timers pretending to be
 * work. The waiting screen subscribes and turns them into sentences; nothing
 * else is required to listen, so emitting is always safe and free even when no
 * screen is mounted.
 *
 * Deliberately framework-free: your pure pipeline code can take `report` as a
 * dependency, while client wrappers import the singleton directly.
 *
 * ── Why a bus at all ──────────────────────────────────────────────────────
 * The alternative is threading progress state down through props or a store.
 * That couples every step of the pipeline to the screen that happens to be
 * watching, and it makes the honest-reporting rule hard to keep: the moment
 * reporting is inconvenient, someone fakes a step in the UI instead. A bus
 * makes the honest thing the easy thing.
 */

/** The shape your pipeline emits. `kind` is yours to define. */
export interface ProgressEvent {
  kind: string;
  /** Anything the narrator needs: a round number, a reason, a summary. */
  [key: string]: unknown;
}

export interface StampedEvent<E extends ProgressEvent = ProgressEvent> {
  id: number;
  /** Wall-clock ms. */
  at: number;
  event: E;
}

export interface ProgressBus<E extends ProgressEvent = ProgressEvent> {
  report(event: E): void;
  subscribe(listener: (stamped: StampedEvent<E>) => void): () => void;
}

export function createProgressBus<E extends ProgressEvent = ProgressEvent>(): ProgressBus<E> {
  const listeners = new Set<(stamped: StampedEvent<E>) => void>();
  let nextId = 1;

  return {
    /**
     * Report an event. NEVER throws: a broken observer must not be able to take
     * down the pipeline that was kind enough to narrate itself.
     */
    report(event: E): void {
      const stamped: StampedEvent<E> = { id: nextId++, at: Date.now(), event };
      for (const listener of listeners) {
        try {
          listener(stamped);
        } catch {
          /* the observer's problem, not the pipeline's */
        }
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** One shared bus for the app. Import and call `report` from anywhere. */
export const progressBus = createProgressBus();
