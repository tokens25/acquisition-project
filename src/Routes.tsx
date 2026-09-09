import { useEffect, useState } from 'react'
import { App } from './App'
import { DemoApp } from './demo/DemoApp'
import { HeroGallery } from './hero/HeroGallery'
import { Index } from './Index'
import { Preparing } from './progress/Preparing'
import type { Job } from './progress/prepare'

/**
 * Five routes, one deployment.
 *
 * `/` asks which product and which situation you are writing for and opens the
 * tool; `/demo` is the tool on the whole flow, `/landing` the same tool on the
 * landing page alone. `/hero` shows the pieces ported out of the hero studio,
 * to be chosen from. `/demo2` is the first iteration, kept reachable by
 * address but no longer offered — the front door stopped being a choice between
 * the two when the second one stopped being a candidate.
 *
 * Hand-rolled rather than react-router: five static paths do not justify a
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
    path === '/demo' ? (
      <DemoApp />
    ) : path === '/landing' ? (
      /* The same tool, on the landing page alone and open on it. */
      <DemoApp product="landing" />
    ) : path === '/hero' ? (
      /* The pieces ported out of the hero studio, to be looked at before any
         of them is taken up. Nothing else in the tool imports them. */
      <HeroGallery />
    ) : path === '/demo2' ? (
      <App />
    ) : (
      <Index onCreate={setJob} />
    )

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
