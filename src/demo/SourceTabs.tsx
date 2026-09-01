import aiSparkle from '../assets/icons/ai-sparkle.svg?raw'

/**
 * Who writes a piece of copy — the assistant, or a person.
 *
 * One component rather than the same markup twice: it sits over the
 * Description and over the Price explainer, and two copies would have drifted
 * the first time either changed.
 *
 * The AI side is the product's own pill, gradient edge and all, rather than a
 * plain tab wearing the word — it is the affordance people already know. The
 * Custom side stays a plain tab, so the pair reads as "the AI thing, or not".
 * Which one is on is carried by aria-pressed and, visually, by the unselected
 * one standing back.
 */
export function SourceTabs({
  value,
  onChange,
  label,
}: {
  value: 'ai' | 'custom'
  onChange: (next: 'ai' | 'custom') => void
  /** Names the pair for a screen reader — "Description source". */
  label: string
}) {
  return (
    <div className="ed-source">
      <div className="ed-tabs ed-tabs--sm" role="group" aria-label={label}>
        <button
          type="button"
          className="ai-pill"
          data-on={value === 'ai' || undefined}
          aria-pressed={value === 'ai'}
          onClick={() => onChange('ai')}
        >
          {/* Inline rather than the DS Icon: that component offers 16, 20 and
              24, and the pill's sparkle is 13. Inlining also lets the glyph
              take the pill's colour through currentColor. */}
          <span
            className="ai-pill__mark"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: aiSparkle }}
          />
          <span>AI</span>
        </button>
        <button
          type="button"
          className="ed-tab"
          data-on={value === 'custom' || undefined}
          aria-pressed={value === 'custom'}
          onClick={() => onChange('custom')}
        >
          Custom
        </button>
      </div>
    </div>
  )
}
