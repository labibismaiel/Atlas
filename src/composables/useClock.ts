import { onScopeDispose, ref } from 'vue'

const format = (date: Date) => date.toTimeString().slice(0, 8)

/** The current time as HH:MM:SS, updated every second. */
export function useClock() {
  const time = ref(format(new Date()))
  const timer = setInterval(() => (time.value = format(new Date())), 1000)
  onScopeDispose(() => clearInterval(timer))
  return time
}
