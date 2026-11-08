import { describe, expect, it } from 'vitest'
import { seedData } from '../data/seed'
import { synchronizeProjectStatuses } from './projectStatus'

function fixture() {
  const data = structuredClone(seedData)
  data.projects[0].status = 'Unassigned'
  data.squads = [{ ...data.squads[0], startDate: '2026-11-10', endDate: '2026-11-12' }]
  return data
}

describe('automatic project statuses', () => {
  it('sets a scheduled Unassigned project to To Do, without changing unscheduled projects', () => {
    const data = fixture()
    const result = synchronizeProjectStatuses(data, new Date(2026, 10, 9))
    expect(result.projects[0].status).toBe('To Do')
    expect(result.projects[4]).toBe(data.projects[4])
    expect(data.projects[0].status).toBe('Unassigned')
  })

  it('starts work on the kickoff calendar day and does not auto-complete after the end date', () => {
    const data = fixture()
    expect(synchronizeProjectStatuses(data, new Date(2026, 10, 10)).projects[0].status).toBe('In Progress')
    expect(synchronizeProjectStatuses(data, new Date(2026, 10, 20)).projects[0].status).toBe('In Progress')
  })

  it('preserves Completed and In Progress statuses even when another squad is scheduled', () => {
    for (const status of ['Completed', 'In Progress'] as const) {
      const data = fixture()
      data.projects[0].status = status
      expect(synchronizeProjectStatuses(data, new Date(2026, 10, 9))).toBe(data)
      expect(synchronizeProjectStatuses(data, new Date(2026, 10, 15))).toBe(data)
    }
  })

  it('starts a project when any of its multiple squads has started', () => {
    const data = fixture()
    data.squads.push({ ...data.squads[0], id: 'later-squad', startDate: '2026-12-01', endDate: '2026-12-10' })
    expect(synchronizeProjectStatuses(data, new Date(2026, 10, 11)).projects[0].status).toBe('In Progress')
  })

  it('returns the same data when no status needs changing', () => {
    const data = fixture()
    data.projects[0].status = 'To Do'
    expect(synchronizeProjectStatuses(data, new Date(2026, 10, 9))).toBe(data)
  })
})
