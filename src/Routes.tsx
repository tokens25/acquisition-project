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
export function Routes() {
  const [path, setPath] = useState(() => window.location.pathname.replace(/\/+$/, '') || '/')

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname.replace(/\/+$/, '') || '/')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (path === '/demo') return <DemoApp />
  if (path === '/demo2') return <App />
  return <Index />
}
