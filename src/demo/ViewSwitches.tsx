import type { Device } from '../rules/content'
import { DEVICE_LABEL, DEVICES } from '../rules/content'
import { PLATFORMS, type Platform } from '../rules/platform'
import './view-switches.css'

/**
 * What the screen is being looked at on, beside the language it is read in.
 *
 * Two segmented controls, ported in shape from the hero studio's command bar:
 * the device, drawn as glyphs because four names in a row is a sentence rather
 * than a switch, and the platform, drawn as words because "web" and "native"
 * have no picture anybody would recognise.
 *
 * They sit next to Translate because they are the same kind of question — not
 * what the page says, but which of its readings you are looking at.
 */
export function DeviceSwitch({
  device,
  onChange,
}: {
  device: Device
  onChange: (device: Device) => void
}) {
  return (
    <div className="vsw" role="radiogroup" aria-label="Device">
      {DEVICES.map((id) => (
        <button
          key={id}
          type="button"
          className="vsw__opt vsw__opt--icon"
          role="radio"
          aria-checked={id === device}
          aria-label={DEVICE_LABEL[id]}
          title={DEVICE_LABEL[id]}
          data-on={id === device || undefined}
          onClick={() => onChange(id)}
        >
          <DeviceGlyph device={id} />
        </button>
      ))}
    </div>
  )
}

export function PlatformSwitch({
  platform,
  onChange,
}: {
  platform: Platform
  onChange: (platform: Platform) => void
}) {
  return (
    <div className="vsw" role="radiogroup" aria-label="Platform">
      {PLATFORMS.map((p) => (
        <button
          key={p.code}
          type="button"
          className="vsw__opt"
          role="radio"
          aria-checked={p.code === platform}
          title={p.hint}
          data-on={p.code === platform || undefined}
          onClick={() => onChange(p.code)}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

/* Drawn rather than imported: the icon set carries none of these, and four
   outlines at one stroke weight is less than four files. */
function DeviceGlyph({ device }: { device: Device }) {
  return (
    <svg
      className="vsw__glyph"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {device === 'xl' && (
        <>
          <rect x="2" y="4" width="20" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </>
      )}
      {device === 'desktop' && (
        <>
          <rect x="4" y="5" width="16" height="11" rx="1.5" />
          <path d="M2 20h20l-1.5-3H3.5L2 20Z" />
        </>
      )}
      {device === 'tablet' && (
        <>
          <rect x="5" y="2.5" width="14" height="19" rx="2.2" />
          <path d="M11 18.5h2" />
        </>
      )}
      {device === 'mobile' && (
        <>
          <rect x="7" y="2" width="10" height="20" rx="2.4" />
          <path d="M10.5 18.5h3" />
        </>
      )}
    </svg>
  )
}
