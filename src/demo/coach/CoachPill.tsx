import type { ReactNode } from 'react'
import './coach.css'

/**
 * The Coach's pill, the same gradient-border AI affordance the hero banner
 * tool uses (its `.ai-pill-border` + cream sparkle), transcribed value for
 * value: ink #080E12 inside, a 110° beam from brand yellow through amber to
 * purple on the edge, cream #F4E5D3 lettering.
 *
 * `size="bar"` is the header row's height so it sits level with Preview and
 * the Market | Dev toggle; `size="sm"` is the hero tool's own 24px footprint,
 * for a pill inside a panel; `size="lg"` fills a sheet's width as its one
 * primary action.
 */
export function CoachPill({
  children,
  size = 'bar',
  title,
  disabled = false,
  onClick,
}: {
  children: ReactNode
  size?: 'bar' | 'sm' | 'lg'
  title?: string
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className="coach-pill"
      data-size={size}
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
    >
      <CoachSparkle size={size === 'sm' ? 13 : size === 'bar' ? 15 : 17} />
      <span className="coach-pill__label">{children}</span>
    </button>
  )
}

/** Cream 4-point sparkle, the hero tool's `AiSparkle`, path unchanged. */
export function CoachSparkle({ size = 13 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden width={size} height={size}>
      <path
        d="M17.9909 10.3742L14.8114 8.68872L13.1258 5.5092C12.9049 5.09237 12.4717 4.83176 12 4.83176C11.5283 4.83176 11.0952 5.09237 10.8742 5.5092L9.18862 8.68872L6.00908 10.3742C5.59233 10.5952 5.33163 11.0283 5.33163 11.5C5.33163 11.9717 5.59225 12.4048 6.00908 12.6258L9.18862 14.3113L10.8742 17.4908C11.0952 17.9076 11.5283 18.1682 12 18.1682C12.4717 18.1682 12.9049 17.9076 13.1258 17.4908L14.8114 14.3113L17.9909 12.6258C18.4077 12.4048 18.6684 11.9717 18.6684 11.5C18.6684 11.0283 18.4078 10.5952 17.9909 10.3742Z"
        fill="#F4E5D3"
      />
    </svg>
  )
}
