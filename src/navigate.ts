/**
 * Go to a route, in whichever of the two forms the page is already using.
 *
 * The pathname where the app owns its paths, the hash where it does not — the
 * single-file build is opened from a host that owns them, and a plain link to
 * /demo there would leave the app rather than move inside it.
 *
 * Pushed rather than followed: the front door and the tool read the same
 * content, and a reload would throw away what was just answered only to read
 * it back off disk and find the same thing.
 *
 * Its own file because Routes.tsx exports a component, and a module that
 * exports both cannot be hot-reloaded.
 */
export function go(path: string) {
  if (/^#\//.test(window.location.hash)) {
    window.location.hash = `#${path}`
    return
  }
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
