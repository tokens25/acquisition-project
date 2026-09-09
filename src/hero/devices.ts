/**
 * The devices the hero studio reviews a banner on, and what the hero is drawn
 * at inside each.
 *
 * Ported from `dazn-lab`: `data/deviceConfigs.ts` and `components/hero/
 * heroMetrics.ts`, trimmed to the fields the pieces on /hero actually read.
 * The numbers are theirs — a device is its real internal resolution, so a hero
 * drawn at these sizes feels the size it will feel — and the studio scales the
 * whole thing down to fit rather than drawing it small.
 */

export type DeviceId = 'tv' | 'desktop' | 'tablet' | 'mobile'
export type FrameKind = 'tv' | 'laptop' | 'tablet' | 'phone'

export interface Device {
  id: DeviceId
  label: string
  width: number
  height: number
  frame: FrameKind
  note: string
}

export const DEVICES: Device[] = [
  { id: 'tv', label: 'TV', width: 1920, height: 1080, frame: 'tv', note: '1920 × 1080 · a ten-foot review' },
  { id: 'desktop', label: 'Desktop', width: 1440, height: 810, frame: 'laptop', note: '1440 × 810 · 16:9' },
  { id: 'tablet', label: 'Tablet', width: 768, height: 1024, frame: 'tablet', note: '768 × 1024 · portrait' },
  { id: 'mobile', label: 'Mobile', width: 375, height: 812, frame: 'phone', note: '375 × 812 · the phone the flow is drawn on' },
]

export const deviceOf = (id: DeviceId) => DEVICES.find((d) => d.id === id) ?? DEVICES[3]

/**
 * What the hero reserves on each device, in that device's own pixels.
 *
 * Only the parts the ported pieces use: the room the chrome takes at the top,
 * the nav at the bottom, and the size of the carousel dots. The studio's own
 * table carries the type ramp and spacing as well.
 */
export interface HeroMetrics {
  /** Room at the top for a status bar or a web header. */
  topInset: number
  /** The bottom nav's height, where one is shown. */
  navHeight: number
  /** The inactive dot's diameter; the active pill is four times as wide. */
  dotSize: number
}

const METRICS: Record<DeviceId, HeroMetrics> = {
  tv: { topInset: 0, navHeight: 96, dotSize: 14 },
  desktop: { topInset: 72, navHeight: 72, dotSize: 10 },
  tablet: { topInset: 64, navHeight: 64, dotSize: 8 },
  mobile: { topInset: 56, navHeight: 56, dotSize: 6 },
}

export const metricsOf = (id: DeviceId): HeroMetrics => METRICS[id]

/**
 * The part of a screen a banner's words must stay inside.
 *
 * From `data/safeZones.ts`, as fractions of the screen rather than pixels, so
 * one number reads the same whatever the device is scaled to.
 */
export interface SafeZone {
  top: number
  right: number
  bottom: number
  left: number
}

const SAFE: Record<DeviceId, SafeZone> = {
  // A television is the strict one: overscan takes the edges on real sets.
  tv: { top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 },
  desktop: { top: 0.08, right: 0.06, bottom: 0.1, left: 0.06 },
  tablet: { top: 0.07, right: 0.06, bottom: 0.09, left: 0.06 },
  mobile: { top: 0.07, right: 0.05, bottom: 0.12, left: 0.05 },
}

export const safeZoneOf = (id: DeviceId): SafeZone => SAFE[id]
