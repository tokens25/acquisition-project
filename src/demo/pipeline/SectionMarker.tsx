import type { SectionStatus } from '../../rules/pipeline'
import { STATUS_LABEL } from '../../rules/pipeline'
import { CodeIcon } from './icons'

/**
 * The 16px code square beside a page's name in a list.
 *
 * Nothing for a draft: a marker on every row would say nothing about any of
 * them. Its colour is the page's status, so a list of pages reads as a list
 * of where the handoff stands. Re-keyed on status so the colour change plays
 * its small pulse.
 */
export function SectionMarker({ status }: { status: SectionStatus }) {
  if (status === 'draft') return null
  return (
    <span
      key={status}
      className="pl-marker"
      data-status={status}
      title={STATUS_LABEL[status]}
      aria-label={STATUS_LABEL[status]}
    >
      <CodeIcon size={10} />
    </span>
  )
}
