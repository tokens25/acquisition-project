import type { SectionStatus } from '../../rules/pipeline'
import { STATUS_LABEL } from '../../rules/pipeline'

/**
 * The 16px `</>` square beside a section's name in a list.
 *
 * Nothing for a draft: a marker on every row would say nothing about any of
 * them. Its colour is the section's status, so a list of sections reads as a
 * list of where the handoff stands.
 */
export function SectionMarker({ status }: { status: SectionStatus }) {
  if (status === 'draft') return null
  return (
    <span className="pl-marker" data-status={status} title={STATUS_LABEL[status]} aria-label={STATUS_LABEL[status]}>
      &lt;/&gt;
    </span>
  )
}
