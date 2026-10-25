import { onScopeDispose, ref, watch, type Ref } from 'vue'
import { prefersReducedMotion } from '@/utils/motion'

export const SHUFFLE_MIN_MS = 1300
export const LOCK_STEP_MS = 260
export const FRAME_MS = 45

const randomDigit = () => String(Math.floor(Math.random() * 10))

/**
 * A number that "decodes": its digits shuffle while the value is unknown (so the shuffle is
 * also the loading state), then lock onto the real value one digit at a time from the left.
 * It never shows an invented value as if it were real. With reduced motion, the value is shown
 * as soon as it is known.
 */
export function useScrambledNumber(
  value: Ref<number | null>,
  { placeholderDigits = 2, startDelayMs = 0 } = {},
) {
  const display = ref(''.padStart(placeholderDigits, '0'))
  const settled = ref(false)

  let timer: ReturnType<typeof setTimeout> | undefined
  const startedAt = Date.now() + startDelayMs
  let lockFrom = 0

  function frame(): void {
    const now = Date.now()
    const target = value.value === null ? null : String(value.value)

    if (now < startedAt) {
      timer = setTimeout(frame, FRAME_MS)
      return
    }
    if (target === null) {
      display.value = Array.from({ length: placeholderDigits }, randomDigit).join('')
      timer = setTimeout(frame, FRAME_MS)
      return
    }

    lockFrom ||= Math.max(now, startedAt + SHUFFLE_MIN_MS)
    const locked = Math.max(0, Math.floor((now - lockFrom) / LOCK_STEP_MS) + 1)
    display.value = [...target].map((digit, i) => (i < locked ? digit : randomDigit())).join('')
    if (locked >= target.length) {
      display.value = target
      settled.value = true
      return
    }
    timer = setTimeout(frame, FRAME_MS)
  }

  function restart(): void {
    clearTimeout(timer)
    settled.value = false
    lockFrom = 0
    if (prefersReducedMotion()) {
      if (value.value !== null) {
        display.value = String(value.value)
        settled.value = true
      }
      return
    }
    frame()
  }

  watch(value, restart, { immediate: true })
  onScopeDispose(() => clearTimeout(timer))

  /** Stop shuffling without a value, e.g. when the request failed. */
  function halt(text: string): void {
    clearTimeout(timer)
    display.value = text
  }

  return { display, settled, halt }
}

const GLYPHS = '█▓▒░<>/|=+*#ΛΞΣ'

/** Text that decodes once from random glyphs into place, left to right. */
export function useDecodedText(text: string) {
  const display = ref(text)
  if (prefersReducedMotion()) return { display }

  let step = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  const run = () => {
    display.value = [...text]
      .map((char, i) =>
        char === ' ' || i < step / 2 ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      )
      .join('')
    if (step++ < text.length * 2) timer = setTimeout(run, 40)
    else display.value = text
  }
  run()
  onScopeDispose(() => clearTimeout(timer))
  return { display }
}
