import { useEffect, useState } from 'react'
import { App } from './App'
import { DemoApp } from './demo/DemoApp'
import { Index } from './Index'

/**
 * Two interfaces, one deployment.
 *
 * `/` is an index of both; `/demo` is the two-stage redesign and `/demo2` the
 * first iteration. Keeping both means the new one can be shown and argued with
 * before it replaces anything, which is the whole reason for a second route
 * rather than a branch nobody can open.
 *
 * Hand-rolled rather than react-router: two static paths do not justify a
 * dependency, and this is small enough to read in one sitting.
 */
/**
 * The current route. A hash of the form `#/demo` wins over the pathname so the
 * built app also works when served as a single file from a host that owns the
 * path (an artifact, a file:// preview); otherwise the pathname is the route.
 */
function currentPath() {
  const hash = window.location.hash
  if (/^#\//.test(hash)) return hash.slice(1).replace(/\/+$/, '') || '/'
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

export function Routes() {
  const [path, setPath] = useState(currentPath)

  useEffect(() => {
    const onChange = () => setPath(currentPath())
    window.addEventListener('popstate', onChange)
    window.addEventListener('hashchange', onChange)
    return () => {
      window.removeEventListener('popstate', onChange)
      window.removeEventListener('hashchange', onChange)
    }
  }, [])

  if (path === '/demo') return <DemoApp />
  if (path === '/demo2') return <App />
  return <Index />
}
