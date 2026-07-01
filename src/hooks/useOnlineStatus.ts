import { useEffect, useState } from 'react'

export function useOnlineStatus(): boolean {
  // Default true — navigator.onLine can wrongly return false in proxied/PWA dev contexts.
  // We only flip state when the browser fires explicit online/offline events.
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    // Sync once on mount, but only if clearly offline
    if (!navigator.onLine) setOnline(false)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  return online
}
