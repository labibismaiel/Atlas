import { onScopeDispose, ref } from 'vue'

/** Whether the browser believes it is online (`navigator.onLine` plus its events). */
export function useOnline() {
  const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
  const update = () => (online.value = navigator.onLine)
  window.addEventListener('online', update)
  window.addEventListener('offline', update)
  onScopeDispose(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })
  return online
}
