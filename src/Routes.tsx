import { useEffect, useState } from 'react'
import { App } from './App'
import { DemoApp } from './demo/DemoApp'

/**
 * Two interfaces, one deployment.
 *
 * `/` stays the interface people already have links to; `/demo` is the
 * redesign. Keeping both means the new one can be shown and argued with
 * before it replaces anything, which is the whole reason for a second route
 * rather than a branch nobody can open.
 *
 * Hand-rolled rather than react-router: two static paths do not justify a
 * dependency, and this is small enough to read in one sitting.
 */
export function Routes() {
  const [path, setPath] = useState(() => window.location.pathname.replace(/\/+$/, '') || '/')

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname.replace(/\/+$/, '') || '/')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return path === '/demo' ? <DemoApp /> : <App />
}
