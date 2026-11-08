import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppDataProvider } from './AppDataContext'
import { useAppData } from './AppData'
import { STORAGE_KEY } from '../data/storage'

describe('AppDataProvider', () => {
  beforeEach(() => localStorage.clear())

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
})
