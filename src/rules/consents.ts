import type { AccountScreen, Consent } from './flow'

/**
 * The permissions the account screen asks for.
 *
 * Content published before there were several carries a single body and note
 * instead of a list. That is one consent, so it is read as one rather than as
 * none: a screen that quietly stopped asking permission for something would be
 * a worse answer to an old shape than reading it.
 */
export function consentsOf(account: AccountScreen): Consent[] {
  if (account.consents) return account.consents
  if (!account.consentBody) return []
  return [
    { id: 'consent-1', body: account.consentBody, note: account.consentNote ?? '', on: false },
  ]
}

/** A new one, off until someone says otherwise. */
export function blankConsent(existing: Consent[]): Consent {
  let n = existing.length + 1
  while (existing.some((c) => c.id === `consent-${n}`)) n += 1
  return { id: `consent-${n}`, body: '', note: '', on: false }
}
