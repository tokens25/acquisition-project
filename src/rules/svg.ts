/**
 * Making an uploaded SVG safe to render inline.
 *
 * The icons are drawn with the file's own markup so they inherit `color` the
 * way the shipped ones do — which means an uploaded file becomes live markup
 * in the page. An SVG is not a picture format for this purpose: it can carry
 * script, event handlers and references to somewhere else, and this content is
 * published for a team to open. Somebody uploading a file they were sent is
 * not an unlikely story.
 *
 * So the file is parsed, everything that can act is removed, and the result is
 * re-serialised from the parsed tree rather than patched as text. What comes
 * back is shapes, or nothing.
 */

/** Elements that do something other than draw. */
const FORBIDDEN = new Set([
  'script',
  'foreignobject',
  'iframe',
  'embed',
  'object',
  'audio',
  'video',
  'animate',
  'animatemotion',
  'animatetransform',
  'set',
  'handler',
  'listener',
  // Draws whatever it is pointed at, including a file somewhere else.
  'image',
  // A link out of the icon. Nothing in a 16px glyph needs one.
  'a',
  // Can pull in a remote stylesheet, and `url()` reaches outside the file.
  'style',
])

/** Attributes that point somewhere. Only a fragment inside this file is kept. */
const REFERENCING = ['href', 'xlink:href', 'src', 'data', 'from', 'to', 'values']

/** Big enough for any glyph; small enough that content stays openable. */
const MAX_BYTES = 64 * 1024

export interface SvgProblem {
  /** What the person should do about it, in one sentence. */
  message: string
}

export type SvgResult = { ok: true; svg: string } | { ok: false; problem: SvgProblem }

const say = (message: string): SvgResult => ({ ok: false, problem: { message } })

export function sanitiseSvg(raw: string): SvgResult {
  const text = raw.trim()
  if (!text) return say('That file was empty.')
  if (text.length > MAX_BYTES) {
    return say(`That file is ${Math.round(text.length / 1024)}KB. Icons have to be under 64KB.`)
  }

  const parsed = new DOMParser().parseFromString(text, 'image/svg+xml')
  if (parsed.querySelector('parsererror')) return say('That file is not valid SVG.')

  const root = parsed.documentElement
  if (!root || root.nodeName.toLowerCase() !== 'svg') return say('That file is not an SVG.')

  // Depth-first and collected first, because removing as we walk moves the
  // ground under the walker.
  const all: Element[] = []
  const walk = (el: Element) => {
    all.push(el)
    for (const child of el.children) walk(child)
  }
  walk(root)

  for (const el of all) {
    if (el !== root && FORBIDDEN.has(el.nodeName.toLowerCase())) {
      el.remove()
      continue
    }
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim()
      // Anything that runs on an event, whatever the event is called.
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name)
        continue
      }
      if (REFERENCING.includes(name) && value && !value.startsWith('#')) {
        el.removeAttribute(attr.name)
        continue
      }
      // `javascript:` survives inside values that are not in the list above,
      // and `url(` can reach out of the file from a presentation attribute.
      if (/javascript:/i.test(value) || /url\(\s*['"]?(?!#)/i.test(value)) {
        el.removeAttribute(attr.name)
      }
    }
  }

  if (!root.children.length) return say('There was nothing to draw in that file.')

  // The size is CSS's to decide — the shipped icons are drawn at whatever the
  // component asks for, and a file carrying its own 512px would not be.
  root.removeAttribute('width')
  root.removeAttribute('height')
  if (!root.getAttribute('viewBox')) {
    return say('That SVG has no viewBox, so it cannot be scaled to icon size.')
  }

  const out = new XMLSerializer().serializeToString(root)
  if (out.length > MAX_BYTES) return say('That file is too large once cleaned up.')
  return { ok: true, svg: out }
}
