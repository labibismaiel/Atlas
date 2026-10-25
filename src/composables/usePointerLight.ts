import { onScopeDispose, watch, type Ref } from 'vue'

/**
 * Exposes the pointer position over an element as CSS custom properties, for light effects:
 * `--mx` / `--my` in px from the top-left, `--px` / `--py` from -1 to 1 around the centre.
 * Mouse and pen only (touch has no hover), throttled to one write per animation frame.
 */
export function usePointerLight(target: Ref<HTMLElement | null>) {
  let frame = 0

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return
    const el = event.currentTarget as HTMLElement
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      const box = el.getBoundingClientRect()
      const x = event.clientX - box.left
      const y = event.clientY - box.top
      el.style.setProperty('--mx', `${x}px`)
      el.style.setProperty('--my', `${y}px`)
      el.style.setProperty('--px', ((x / box.width) * 2 - 1).toFixed(3))
      el.style.setProperty('--py', ((y / box.height) * 2 - 1).toFixed(3))
    })
  }

  const onLeave = (event: PointerEvent) => {
    cancelAnimationFrame(frame)
    const el = event.currentTarget as HTMLElement
    for (const name of ['--mx', '--my', '--px', '--py']) el.style.removeProperty(name)
  }

  watch(
    target,
    (el, previous) => {
      previous?.removeEventListener('pointermove', onMove)
      previous?.removeEventListener('pointerleave', onLeave)
      el?.addEventListener('pointermove', onMove)
      el?.addEventListener('pointerleave', onLeave)
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    cancelAnimationFrame(frame)
    target.value?.removeEventListener('pointermove', onMove)
    target.value?.removeEventListener('pointerleave', onLeave)
  })
}
