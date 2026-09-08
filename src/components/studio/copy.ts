/**
 * How long a piece of copy is against the room it has.
 *
 * Ported from Project A (`src/lib/validation/copy.ts`), where the studio's
 * fields count characters as they are typed. Pure — no React, no DOM — so it
 * is the one part of the family that could be shared rather than copied if the
 * two apps ever sit in one repo.
 */

/** The room a field has: comfortable, then absolute. */
export interface CopyLimit {
  soft: number
  hard: number
}

export type CopyStatus = 'empty' | 'ok' | 'warn' | 'over'

export interface CopyCheck {
  count: number
  soft: number
  hard: number
  /** Characters left before the soft limit. Negative once it is passed. */
  remaining: number
  status: CopyStatus
}

export function checkCopy(value: string, limit: CopyLimit): CopyCheck {
  const count = value.length
  let status: CopyStatus
  if (count === 0) status = 'empty'
  else if (count <= limit.soft) status = 'ok'
  else if (count <= limit.hard) status = 'warn'
  else status = 'over'

  return { count, soft: limit.soft, hard: limit.hard, remaining: limit.soft - count, status }
}
