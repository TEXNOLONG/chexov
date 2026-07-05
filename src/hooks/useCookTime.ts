import { useCallback, useState } from 'react'

const KEY = 'chexov:cook-times'

function load(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, number> }
  catch { return {} }
}

export function useCookTime() {
  const [times, setTimes] = useState<Record<string, number>>(load)

  const setTime = useCallback((itemId: string, minutes: number) => {
    setTimes(prev => {
      const next = { ...prev }
      if (minutes > 0) next[itemId] = minutes
      else delete next[itemId]
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { times, setTime }
}

export function loadCookTimes(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, number> }
  catch { return {} }
}
