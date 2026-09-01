import type { Mode } from '../../rules/pipeline'

/**
 * Market | Dev. One screen, two modes; the segment that is on says which.
 *
 * Market is the yellow the rest of the tool uses for the primary action. Dev
 * is the green the status chips use for "ready", so the colour of the mode
 * and the colour of the things it shows agree.
 */
export function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div className="pl-mode" role="group" aria-label="Mode" title="Switch with Shift+D">
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
        className="pl-mode__seg pl-mode__seg--dev"
        data-on={mode === 'dev' || undefined}
        aria-pressed={mode === 'dev'}
        onClick={() => onChange('dev')}
      >
        <span className="pl-mono" aria-hidden="true">
          &lt;/&gt;
        </span>
        Dev
      </button>
    </div>
  )
}
