import type { Mode } from '../../rules/pipeline'
import { CodeIcon } from './icons'

/**
 * Market | Dev. One screen, two modes; the segment that is on says which.
 *
 * The thumb slides between the two rather than each segment lighting up in
 * place, so the eye follows the mode from one side to the other. Market is the
 * yellow the rest of the tool uses for its primary action; Dev is the green
 * the status chips use for "ready", so the mode and what it shows agree.
 */
export function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div className="pl-mode" role="group" aria-label="Mode" title="Switch with Shift+D" data-mode={mode}>
      <span className="pl-mode__thumb" aria-hidden="true" />
      <button
        type="button"
        className="pl-mode__seg"
        data-on={mode === 'market' || undefined}
        aria-pressed={mode === 'market'}
        onClick={() => onChange('market')}
      >
        Market
      </button>
      <button
        type="button"
        className="pl-mode__seg"
        data-on={mode === 'dev' || undefined}
        aria-pressed={mode === 'dev'}
        onClick={() => onChange('dev')}
      >
        <CodeIcon size={12} />
        Dev
      </button>
    </div>
  )
}
