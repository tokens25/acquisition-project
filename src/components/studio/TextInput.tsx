import './studio.css'

import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import type { CopyStatus } from './copy'

/**
 * The studio's borderless filled field, from Project A.
 *
 * Denser than the design system's `TextField` — 40px against 56, 13px text, no
 * resting border — because it is for a panel of many fields rather than a form
 * a customer fills in. The two are meant to coexist: this is not a replacement
 * for `dz-field`.
 *
 * Only `over` marks the field. `warn` — past the comfortable length but inside
 * the hard limit — is a perfectly ordinary state, and colouring it would read
 * as an error about something that is not wrong.
 */

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  status?: CopyStatus
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { status = 'empty', className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={['st-input', className].filter(Boolean).join(' ')}
      data-status={status === 'over' ? 'over' : undefined}
      {...props}
    />
  )
})

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  status?: CopyStatus
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { status = 'empty', className, rows = 2, value, ...props },
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement>(null)
  useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement)

  /*
   * Grows to its text, so the box always fits what is in it and nothing is
   * clipped or hidden behind an inner scrollbar.
   *
   * Re-measured when the value changes and when the field's *width* changes —
   * the panel resizing, or fonts settling after mount — because a first
   * measure taken before wrapping is final locks in a height that is too
   * short. Width only: refitting sets the height, so watching the height would
   * retrigger the observer forever.
   */
  useLayoutEffect(() => {
    const el = innerRef.current
    if (!el) return
    const fit = () => {
      el.style.height = 'auto'
      // scrollHeight is the content and its padding, with no border in it. The
      // field is border-box here, so setting the height to that figure alone
      // takes the two border pixels out of the text and clips the last line's
      // descenders by exactly that much.
      const borders = el.offsetHeight - el.clientHeight
      el.style.height = `${el.scrollHeight + borders}px`
    }
    fit()
    let lastWidth = el.clientWidth
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === lastWidth) return
      lastWidth = el.clientWidth
      fit()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [value])

  return (
    <textarea
      ref={innerRef}
      rows={rows}
      value={value}
      className={['st-input', 'st-input--area', className].filter(Boolean).join(' ')}
      data-status={status === 'over' ? 'over' : undefined}
      {...props}
    />
  )
})
