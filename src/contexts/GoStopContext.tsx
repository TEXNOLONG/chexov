import { createContext, useContext, type ReactNode } from 'react'
import { useGoStopList } from '../hooks/useGoStopList'
import { useCookTime } from '../hooks/useCookTime'

interface GoStopCtxType {
  goSet:       Set<string>
  stopSet:     Set<string>
  toggleGo:   (id: string) => void
  toggleStop: (id: string) => void
  cookTimes:  Record<string, number>
  setCookTime: (id: string, min: number) => void
}

const GoStopCtx = createContext<GoStopCtxType>({
  goSet: new Set(), stopSet: new Set(),
  toggleGo: () => {}, toggleStop: () => {},
  cookTimes: {}, setCookTime: () => {},
})

export function GoStopProvider({ children }: { children: ReactNode }) {
  const { goSet, stopSet, toggleGo, toggleStop } = useGoStopList()
  const { times: cookTimes, setTime: setCookTime } = useCookTime()
  return (
    <GoStopCtx.Provider value={{ goSet, stopSet, toggleGo, toggleStop, cookTimes, setCookTime }}>
      {children}
    </GoStopCtx.Provider>
  )
}

export function useGoStop() { return useContext(GoStopCtx) }
