import { BUILD } from '../build'

/**
 * Which build this is, at the foot of the panel.
 *
 * There is more than one of this tool up at once — a branch alias per branch,
 * and a production alias pointing at whichever branch is configured — and all
 * of them are behind team sign-in, so the only way to tell what a page is
 * serving is to look at the page. Without a stamp that means reading the UI
 * for a feature you think ought to be there and inferring backwards, which
 * answers "probably" and not "which commit".
 *
 * The commit and the branch, because those are the two facts that settle it:
 * the branch says whose work this is, and the short sha compares against
 * `git log` in one glance. The time is the build's, not the commit's, which is
 * what says whether a push actually produced a deploy.
 *
 * Quiet on purpose. It is chrome for the person checking a deployment rather
 * than anything the work is about, so it sits under the last control at the
 * size of a caption and asks for no attention until somebody goes looking.
 */
export function VersionStamp() {
  return (
    <p className="vs" title={`${BUILD.sha}\nbuilt ${BUILD.at}`}>
      <span className="vs__sha">{BUILD.sha.slice(0, 7)}</span>
      <span className="vs__ref">{BUILD.ref}</span>
      <span className="vs__at">{when(BUILD.at)}</span>
    </p>
  )
}

/**
 * The build time as somebody reading it would say it.
 *
 * In the reader's own zone rather than the builder's: a deployment is checked
 * from wherever somebody happens to be, and a time in a zone they have to
 * convert is a time they will get wrong. The year is left off — a build old
 * enough for the year to matter has bigger problems to report than its date.
 */
function when(iso: string): string {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return 'unknown'
  return at.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
