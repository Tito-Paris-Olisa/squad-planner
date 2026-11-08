import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadAppData, resetAppData, saveAppData } from '../data/storage'
import { AppDataContext, type AppDataContextValue } from './AppData'
import type { AppData } from '../types'

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadAppData)

  useEffect(() => {
    saveAppData(data)
  }, [data])

  const value = useMemo<AppDataContextValue>(() => ({
    data,
    updateData: (update) => setData(update),
    resetDemoData: () => setData(resetAppData()),
  }), [data])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
