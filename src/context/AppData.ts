import { createContext, useContext } from 'react'
import type { AppData } from '../types'

export interface AppDataContextValue {
  data: AppData
  updateData: (update: (current: AppData) => AppData) => void
  resetDemoData: () => void
}

export const AppDataContext = createContext<AppDataContextValue | null>(null)

export function useAppData(): AppDataContextValue {
  const value = useContext(AppDataContext)
  if (!value) throw new Error('useAppData must be used within AppDataProvider')
  return value
}
