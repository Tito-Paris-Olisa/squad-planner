import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppDataProvider } from './AppDataContext'
import { useAppData } from './AppData'
import { STORAGE_KEY } from '../data/storage'
import { seedData } from '../data/seed'

describe('AppDataProvider', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => { cleanup(); vi.useRealTimers() })

  it('updates project statuses centrally and persists the change', () => {
    const { result } = renderHook(() => useAppData(), { wrapper: AppDataProvider })
    const projectId = result.current.data.projects[0].id

    act(() => result.current.updateData((current) => ({
      ...current,
      projects: current.projects.map((project) => project.id === projectId ? { ...project, status: 'Completed' } : project),
    })))

    expect(result.current.data.projects[0].status).toBe('Completed')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').projects[0].status).toBe('Completed')
  })

  it('synchronizes saved schedules on load and persists the automatic status', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 10))
    const data = structuredClone(seedData)
    data.projects[0].status = 'To Do'
    data.squads[0].startDate = '2026-11-10'
    data.squads[0].endDate = '2026-11-12'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    const { result } = renderHook(() => useAppData(), { wrapper: AppDataProvider })
    expect(result.current.data.projects[0].status).toBe('In Progress')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').projects[0].status).toBe('In Progress')
  })

  it('advances status across midnight while the app stays open', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 9, 23, 59, 30))
    const data = structuredClone(seedData)
    data.projects[0].status = 'To Do'
    data.squads[0].startDate = '2026-11-10'
    data.squads[0].endDate = '2026-11-12'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    const clearInterval = vi.spyOn(window, 'clearInterval')
    const { result, unmount } = renderHook(() => useAppData(), { wrapper: AppDataProvider })
    expect(result.current.data.projects[0].status).toBe('To Do')
    act(() => vi.advanceTimersByTime(60_000))
    expect(result.current.data.projects[0].status).toBe('In Progress')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').projects[0].status).toBe('In Progress')
    unmount()
    expect(clearInterval).toHaveBeenCalledOnce()
    clearInterval.mockRestore()
  })

  it('updates the calendar day and status when returning to a suspended app', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 9))
    const data = structuredClone(seedData)
    data.projects[0].status = 'To Do'
    data.squads[0].startDate = '2026-11-10'
    data.squads[0].endDate = '2026-11-12'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    const { result } = renderHook(() => useAppData(), { wrapper: AppDataProvider })
    vi.setSystemTime(new Date(2026, 10, 10))
    act(() => window.dispatchEvent(new Event('focus')))
    expect(result.current.today).toBe('2026-11-10')
    expect(result.current.data.projects[0].status).toBe('In Progress')
  })
})
