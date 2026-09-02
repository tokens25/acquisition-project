import { useEffect, useState } from 'react'
import { App } from './App'
import { DemoApp } from './demo/DemoApp'
import { Index } from './Index'
import { Preparing } from './progress/Preparing'
import type { Job } from './progress/prepare'

/**
 * Three routes, one deployment.
 *
 * `/` asks which situation you are writing for and opens the tool; `/demo` is
 * the tool. `/demo2` is the first iteration, kept reachable by address but no
 * longer offered — the front door stopped being a choice between the two when
 * the second one stopped being a candidate.
 *
 * Hand-rolled rather than react-router: three static paths do not justify a
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
  /** The run between the questions and the tool, while one is happening. */
  const [job, setJob] = useState<Job | null>(null)

  useEffect(() => {
    const onChange = () => setPath(currentPath())
    window.addEventListener('popstate', onChange)
    window.addEventListener('hashchange', onChange)
    return () => {
      window.removeEventListener('popstate', onChange)
      window.removeEventListener('hashchange', onChange)
    }
  }, [])

  const page =
    path === '/demo' ? <DemoApp /> : path === '/demo2' ? <App /> : <Index onCreate={setJob} />

  return (
    <>
      {page}
      {/* Above the route rather than inside the front door: the tool mounts
          behind this while it is still opaque, so the fade uncovers the tool
          and not the questions that were just answered. */}
      {job && <Preparing job={job} onDone={() => setJob(null)} />}
    </>
  )
}
