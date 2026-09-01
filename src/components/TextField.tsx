import './textfield.css'

import { FieldMarkNote } from './FieldMark'
import { useFieldMark } from './fieldMarks'

import type { ChangeEvent, ReactNode } from 'react'
import { useId } from 'react'

/**
 * Form/TextField — DS component set 4758:68049.
 *
 * A single-line input with a floating label: the label sits centred while the
 * field is empty and rises to caption size once it holds a value, so the field
 * never loses its name the way a placeholder does.
 *
 * Figma draws 23 variants across State x Content x Validation. They are not 23
 * components — State is the browser's (`:hover`, `:focus-visible`, `:disabled`,
 * `readonly`), Content is "does it have a value", and only Validation is a real
 * prop. Building the matrix out would mean re-implementing focus in React.
 */

export interface TextFieldProps {
  label: string
  value: string
  onChange?: (value: string) => void
  helpText?: ReactNode
  /** Turns the border and help text to the error colour. */
  error?: boolean
  disabled?: boolean
  readOnly?: boolean
  /** 20px leading element; 24px trailing, per the DS. */
  leading?: ReactNode
  trailing?: ReactNode
  type?: 'text' | 'number'
  step?: number
  min?: number
  max?: number
  /** Renders a textarea that grows, keeping the same shell. */
  rows?: number
  inputId?: string
  /**
   * The string's key in the Market → Dev handoff. With one, the field shows
   * its own change since dev received it, and the way back.
   */
  pipelineKey?: string
}

export function TextField({
  label,
  value,
  onChange,
  helpText,
  error,
  disabled,
  readOnly,
  leading,
  trailing,
  type = 'text',
  step,
  min,
  max,
  rows,
  inputId,
  pipelineKey,
}: TextFieldProps) {
  const generated = useId()
  const id = inputId ?? generated
  const filled = value !== '' && value !== undefined && value !== null
  const mark = useFieldMark(pipelineKey)

  const shared = {
    id,
    className: 'dz-field__control',
    value,
    disabled,
    readOnly,
    // The label is the accessible name; it is visually a floating label rather
    // than a placeholder, so no placeholder is set.
    'aria-invalid': error || undefined,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange?.(e.target.value),
  }

  return (
    <div
      className="dz-field"
      data-filled={filled || undefined}
      data-error={error || undefined}
      data-changed={mark ? '' : undefined}
    >
      <div className="dz-field__input" data-multiline={rows ? '' : undefined}>
        {leading && <span className="dz-field__leading">{leading}</span>}

        <span className="dz-field__body">
          <label className="dz-field__label" htmlFor={id}>
            {label}
          </label>
          {rows ? (
            <textarea {...shared} rows={rows} />
          ) : (
            <input {...shared} type={type} step={step} min={min} max={max} />
          )}
        </span>

        {trailing && <span className="dz-field__trailing">{trailing}</span>}
      </div>

      {helpText && <p className="dz-field__help">{helpText}</p>}
      {mark && (
        <FieldMarkNote mark={mark} onRevert={onChange && !readOnly ? () => onChange(mark.before) : undefined} />
      )}
    </div>
  )
}
