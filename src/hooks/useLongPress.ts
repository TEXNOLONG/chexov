import { useCallback, useRef } from 'react'

interface Options {
  delay?: number
  onLongPress: () => void
  onClick?: () => void
}

export function useLongPress({ delay = 450, onLongPress, onClick }: Options) {
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firedRef   = useRef(false)
  const scrolledRef = useRef(false)   // did the finger scroll before lift?
  const startPosRef = useRef({ x: 0, y: 0 })

  const start = useCallback((clientX: number, clientY: number) => {
    firedRef.current    = false
    scrolledRef.current = false
    startPosRef.current = { x: clientX, y: clientY }
    timerRef.current = setTimeout(() => {
      if (scrolledRef.current) return   // don't fire long-press mid-scroll
      firedRef.current = true
      onLongPress()
      if ('vibrate' in navigator) navigator.vibrate(30)
    }, delay)
  }, [delay, onLongPress])

  const cancel = useCallback((wasMoved?: boolean) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    // Fire click only if: no long-press fired AND finger didn't scroll
    if (!firedRef.current && !wasMoved && !scrolledRef.current && onClick) {
      onClick()
    }
  }, [onClick])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    start(t.clientX, t.clientY)
  }, [start])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    const dx = Math.abs(t.clientX - startPosRef.current.x)
    const dy = Math.abs(t.clientY - startPosRef.current.y)
    if (dx > 6 || dy > 6) {
      scrolledRef.current = true
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    cancel()
  }, [cancel])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    start(e.clientX, e.clientY)
  }, [start])

  const onMouseUp   = useCallback(() => { cancel() }, [cancel])
  const onMouseLeave = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  return { onTouchStart, onTouchMove, onTouchEnd, onMouseDown, onMouseUp, onMouseLeave }
}
