import { useEffect, useRef } from 'react'

/**
 * A native dialog, told when.
 *
 * The element owns focus, Escape and the backdrop; all anything here has to do
 * is open and close it, and the two sheets in this folder both do exactly that.
 * Lifted out of them rather than written twice — the same five lines the
 * translation sheet carries.
 */
export function useDialog(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return ref
}
