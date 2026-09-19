/**
 * Which of the landing surfaces is on screen.
 *
 * A landing page is one of four things depending on who opens it: the page
 * itself, the logged-out home, the logged-in home, and a competition's own
 * page. They are the same hero and the same components — what changes is the
 * chrome around them and, sometimes, which of them are drawn at all.
 *
 * The four are the hero studio's own, in its order, because they are the four
 * a hero is signed off against and there is nothing to be gained by naming
 * them differently here.
 *
 * This is the one-page product's version of the question the journey asks as
 * "who is buying". A journey narrows to an audience and an entry point; a
 * single page has no entry — it is the arrival — so what is left to say about
 * who is looking at it is which of these four they are looking at.
 */

export type PageView = 'landing' | 'logged-out' | 'logged-in' | 'home-of'

export const PAGE_VIEWS: { code: PageView; label: string }[] = [
  { code: 'landing', label: 'Landing page' },
  { code: 'logged-out', label: 'Logged out' },
  { code: 'logged-in', label: 'Logged in' },
  /* "Home of" and then a competition — the page a sport or a league has of its
     own. Named for the pattern rather than for any one competition. */
  { code: 'home-of', label: 'Home of' },
]

/**
 * Which views are also a state of the viewer, and the status each one means.
 *
 * Two of the four are. The logged-out home and the logged-in home differ by
 * who is in front of them, which is the axis a journey's audience already
 * sits on — so they answer the same question and belong in the same place
 * rather than in a fifth one of their own.
 *
 * The other two are not. `landing` is the page with nobody in particular
 * looking at it, and `home-of` is a different page rather than a different
 * viewer. Both pin no status, which is what makes them the copy everybody
 * gets and the thing the other two are written over.
 */
export const VIEW_STATUS: Record<string, string> = {
  'logged-out': 'logged-out',
  'logged-in': 'logged-in',
}

/** The page as it stands on its own, which is what the tool opens on. */
export const DEFAULT_PAGE_VIEW: PageView = 'landing'

export const pageViewLabel = (code: string): string =>
  PAGE_VIEWS.find((v) => v.code === code)?.label ?? code
