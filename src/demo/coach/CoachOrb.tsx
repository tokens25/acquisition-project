import { useEffect, useRef } from 'react'

/**
 * The Coach's face: the crystal-ball loop from the hero tool, masked into a
 * circle. Plays muted and looped; stays on its first frame when the person
 * prefers reduced motion.
 */
export function CoachOrb({ size = 18 }: { size?: number }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) v.pause()
    else void v.play().catch(() => {})
  }, [])
  return (
    <span className="coach-orb" style={{ inlineSize: size, blockSize: size }} aria-hidden="true">
      <video ref={ref} src="/coach/crystal-ball.mp4" muted loop playsInline autoPlay />
    </span>
  )
}
