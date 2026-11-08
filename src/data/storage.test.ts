import { beforeEach, describe, expect, it } from 'vitest'
import { seedData } from './seed'
import { loadAppData, saveAppData, STORAGE_KEY, validateAppData } from './storage'
import { getSchedulingConflicts } from '../utils/scheduling'

describe('application data storage', () => {
  beforeEach(() => localStorage.clear())

  it('initializes fictional demo data only when storage is empty', () => {
    const data = loadAppData()
    expect(data.teams).toHaveLength(4)
    expect(data.people.length).toBeGreaterThanOrEqual(15)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual(data)
    expect(loadAppData()).toEqual(data)
  })

  it('persists and reloads valid changes', () => {
    const updated = structuredClone(seedData)
    updated.projects[0].status = 'Completed'
    saveAppData(updated)
    expect(loadAppData().projects[0].status).toBe('Completed')
  })

  it('rejects broken references and invalid dates', () => {
    const data = structuredClone(seedData)
    data.assignments[0].personId = 'missing-person'
    expect(validateAppData(data)).toBe(false)

    const invalidDate = structuredClone(seedData)
    invalidDate.squads[0].startDate = '2026-99-40'
    expect(validateAppData(invalidDate)).toBe(false)
  })

  it('ships demo squads without scheduling conflicts', () => {
    for (const assignment of seedData.assignments) {
      const squad = seedData.squads.find((item) => item.id === assignment.squadId)
      expect(squad).toBeDefined()
      if (!squad) continue
      expect(getSchedulingConflicts(assignment.personId, squad, seedData, {
        roleId: assignment.roleId,
        excludeSquadId: squad.id,
      })).toEqual([])
    }
  })

  it('reports corrupt stored JSON instead of silently reseeding', () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    expect(() => loadAppData()).toThrow('Saved Squad Planner data could not be read')
  })
})
