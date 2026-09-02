import { useEffect } from 'react'

/**
 * Lights up the strings a finding names, wherever they are drawn: on the
 * screen in the preview and in the field that edits them. Works by reading
 * the page rather than by wiring every screen, so any component that renders
 * the text takes part without knowing about the Coach.
 */
const CLASS = 'coach-hl'
const norm = (t: string) => t.replace(/\s+/g, ' ').trim().toLowerCase()

function clear(root: ParentNode) {
  root.querySelectorAll(`.${CLASS}`).forEach((el) => el.classList.remove(CLASS))
}

/** The smallest elements whose own text carries the needle. */
function textTargets(root: ParentNode, needle: string): HTMLElement[] {
  const n = norm(needle)
  const short = n.slice(0, 40)
  const out: HTMLElement[] = []
  const walker = document.createTreeWalker(root as Node, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    const text = norm(node.textContent ?? '')
    if (!text) continue
    if (text.includes(n) || (short.length >= 12 && text.includes(short)) || (n.length >= 12 && n.includes(text) && text.length >= 12)) {
      const el = node.parentElement
      if (el && !out.includes(el)) out.push(el)
    }
  }
  return out
}

/** Inputs whose value carries the needle. */
function fieldTargets(root: ParentNode, needle: string): HTMLElement[] {
  const n = norm(needle)
  return [...root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')].filter((el) => norm(el.value).includes(n))
}

export function useCoachHighlight(quotes: string[] | null, deps: unknown[]) {
  useEffect(() => {
    const preview = document.querySelector('.demo__preview')
    const panel = document.querySelector('.demo__panel')
    if (preview) clear(preview)
    if (panel) clear(panel)
    if (!quotes || quotes.length === 0) return

    // After paint, so a screen that was just opened is on the page.
    const id = window.setTimeout(() => {
      let first: HTMLElement | null = null
      for (const q of quotes) {
        const targets = [
          ...(preview ? textTargets(preview, q) : []),
          ...(panel ? fieldTargets(panel, q) : []),
        ]
        for (const el of targets) {
          el.classList.add(CLASS)
          first ??= el
        }
      }
      first?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
    }, 80)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes?.join('|'), ...deps])
}
