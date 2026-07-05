import { useCallback, useState } from 'react'

const GO_KEY  = 'chexov:go-list'
const STOP_KEY = 'chexov:stop-list'

function loadSet(key: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(key) ?? '[]') as string[]) }
  catch { return new Set() }
}
function saveSet(key: string, s: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...s]))
}

export function useGoStopList() {
  const [goSet,   setGoSet]   = useState<Set<string>>(() => loadSet(GO_KEY))
  const [stopSet, setStopSet] = useState<Set<string>>(() => loadSet(STOP_KEY))

  const toggleGo = useCallback((id: string) => {
    setGoSet(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      saveSet(GO_KEY, next)
      return next
    })
    // Remove from stop if toggling into go
    setStopSet(prev => {
      if (!prev.has(id)) return prev
      const next = new Set(prev); next.delete(id); saveSet(STOP_KEY, next); return next
    })
  }, [])

  const toggleStop = useCallback((id: string) => {
    setStopSet(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      saveSet(STOP_KEY, next)
      return next
    })
    // Remove from go if toggling into stop
    setGoSet(prev => {
      if (!prev.has(id)) return prev
      const next = new Set(prev); next.delete(id); saveSet(GO_KEY, next); return next
    })
  }, [])

  return { goSet, stopSet, toggleGo, toggleStop }
}

export function loadGoStopSets() {
  return { goSet: loadSet(GO_KEY), stopSet: loadSet(STOP_KEY) }
}
