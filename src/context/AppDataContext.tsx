import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { format } from 'date-fns'
import { loadAppData, resetAppData, saveAppData } from '../data/storage'
import { AppDataContext, type AppDataContextValue } from './AppData'
import type { AppData } from '../types'
import { synchronizeProjectStatuses } from '../utils/projectStatus'

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => synchronizeProjectStatuses(loadAppData()))
  const [today, setToday] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    const synchronize = () => {
      const now = new Date()
      setToday(format(now, 'yyyy-MM-dd'))
      setData((current) => synchronizeProjectStatuses(current, now))
    }
    const interval = window.setInterval(synchronize, 60_000)
    window.addEventListener('focus', synchronize)
    document.addEventListener('visibilitychange', synchronize)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', synchronize)
      document.removeEventListener('visibilitychange', synchronize)
    }
  }, [])

  useEffect(() => {
    saveAppData(data)
  }, [data])

  const value = useMemo<AppDataContextValue>(() => ({
    data,
    today,
    updateData: (update) => setData((current) => synchronizeProjectStatuses(update(current))),
    resetDemoData: () => setData(synchronizeProjectStatuses(resetAppData())),
  }), [data, today])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
