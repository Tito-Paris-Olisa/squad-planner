import { describe, expect, it } from 'vitest'
import type { Role, Squad } from '../types'
import {
  getPersonReservations,
  getSchedulingConflicts,
  getSquadReservationRange,
  isPersonAvailable,
  type SchedulingData,
} from './scheduling'

const roles: Role[] = [
  { id: 'frontend', name: 'Frontend' },
  { id: 'backend', name: 'Backend' },
  { id: 'architect', name: 'Architect' },
  { id: 'pm', name: 'Project Manager' },
]

const squad = (
  id: string,
  startDate: string,
  endDate: string,
): Squad => ({
  id,
  projectId: 'project',
  startDate,
  endDate,
  createdAt: '',
  updatedAt: '',
})

const emptyData = (overrides: Partial<SchedulingData> = {}): SchedulingData => ({
  squads: [],
  assignments: [],
  roles,
  unavailabilities: [],
  ...overrides,
})

describe('squad reservation ranges', () => {
  it.each(['Frontend', 'Backend', 'Project Manager'] as const)(
    '%s is reserved for the full inclusive squad range',
    (roleName) => {
      expect(
        getSquadReservationRange(
          squad('squad', '2026-01-10', '2026-01-15'),
          roleName,
        ),
      ).toEqual({ startDate: '2026-01-10', endDate: '2026-01-15' })
    },
  )

  it('reserves an Architect for kickoff only', () => {
    expect(
      getSquadReservationRange(
        squad('squad', '2026-01-10', '2026-01-15'),
        'Architect',
      ),
    ).toEqual({ startDate: '2026-01-10', endDate: '2026-01-10' })
  })

  it('keeps multiple roles as separate reservations for one person', () => {
    const data = emptyData({
      squads: [squad('squad', '2026-01-10', '2026-01-15')],
      assignments: [
        { id: 'a1', squadId: 'squad', personId: 'person', roleId: 'frontend' },
        { id: 'a2', squadId: 'squad', personId: 'person', roleId: 'architect' },
      ],
    })

    expect(getPersonReservations('person', data)).toEqual([
      {
        type: 'squad',
        startDate: '2026-01-10',
        endDate: '2026-01-15',
        squadId: 'squad',
        roleId: 'frontend',
      },
      {
        type: 'squad',
        startDate: '2026-01-10',
        endDate: '2026-01-10',
        squadId: 'squad',
        roleId: 'architect',
      },
    ])
  })
})

describe('scheduling conflicts', () => {
  it('detects an overlapping squad reservation and returns its inclusive overlap', () => {
    const data = emptyData({
      squads: [squad('existing', '2026-01-10', '2026-01-15')],
      assignments: [
        { id: 'a1', squadId: 'existing', personId: 'person', roleId: 'frontend' },
      ],
    })

    expect(
      getSchedulingConflicts(
        'person',
        { startDate: '2026-01-14', endDate: '2026-01-20' },
        data,
      ),
    ).toEqual([
      {
        type: 'squad',
        startDate: '2026-01-14',
        endDate: '2026-01-15',
        squadId: 'existing',
        roleId: 'frontend',
      },
    ])
  })

  it('allows adjacent dates because reservations do not overlap across a day boundary', () => {
    const data = emptyData({
      squads: [squad('existing', '2026-01-10', '2026-01-15')],
      assignments: [
        { id: 'a1', squadId: 'existing', personId: 'person', roleId: 'frontend' },
      ],
    })

    expect(
      isPersonAvailable(
        'person',
        { startDate: '2026-01-16', endDate: '2026-01-20' },
        data,
      ),
    ).toBe(true)
  })

  it('checks manual unavailability inclusively', () => {
    const data = emptyData({
      unavailabilities: [{
        id: 'leave',
        personId: 'person',
        startDate: '2026-02-03',
        endDate: '2026-02-04',
        reason: 'Leave / Holiday',
        createdAt: '',
        updatedAt: '',
      }],
    })

    expect(
      getSchedulingConflicts(
        'person',
        { startDate: '2026-02-01', endDate: '2026-02-03' },
        data,
      ),
    ).toEqual([
      {
        type: 'unavailability',
        startDate: '2026-02-03',
        endDate: '2026-02-03',
        unavailabilityId: 'leave',
        reason: 'Leave / Holiday',
      },
    ])
  })

  it('uses only kickoff when checking a proposed Architect assignment', () => {
    const data = emptyData({
      squads: [squad('existing', '2026-03-11', '2026-03-12')],
      assignments: [
        { id: 'a1', squadId: 'existing', personId: 'person', roleId: 'frontend' },
      ],
    })
    const range = { startDate: '2026-03-10', endDate: '2026-03-15' }

    expect(
      getSchedulingConflicts('person', range, data, { roleId: 'architect' }),
    ).toHaveLength(0)
    expect(
      getSchedulingConflicts('person', range, data, { roleId: 'pm' }),
    ).toHaveLength(1)
    expect(
      getSchedulingConflicts('person', range, data, { roleId: 'pm' })[0],
    ).toMatchObject({ startDate: '2026-03-11', endDate: '2026-03-12' })
  })

  it("excludes an edited squad's old reservation while checking the extended range", () => {
    const data = emptyData({
      squads: [squad('editing', '2026-04-01', '2026-04-05')],
      assignments: [
        { id: 'a1', squadId: 'editing', personId: 'person', roleId: 'frontend' },
      ],
    })

    expect(getPersonReservations('person', data)).toHaveLength(1)
    expect(
      isPersonAvailable(
        'person',
        { startDate: '2026-04-01', endDate: '2026-04-10' },
        data,
        { excludeSquadId: 'editing' },
      ),
    ).toBe(true)
    expect(
      getSchedulingConflicts(
        'person',
        { startDate: '2026-04-01', endDate: '2026-04-10' },
        data,
      ),
    ).toHaveLength(1)
  })

  it('detects a conflict in a newly extended part of the range', () => {
    const data = emptyData({
      squads: [
        squad('editing', '2026-04-01', '2026-04-05'),
        squad('other', '2026-04-08', '2026-04-09'),
      ],
      assignments: [
        { id: 'a1', squadId: 'editing', personId: 'person', roleId: 'frontend' },
        { id: 'a2', squadId: 'other', personId: 'person', roleId: 'pm' },
      ],
    })

    expect(
      getSchedulingConflicts(
        'person',
        { startDate: '2026-04-01', endDate: '2026-04-10' },
        data,
        { excludeSquadId: 'editing' },
      ),
    ).toMatchObject([
      {
        type: 'squad',
        startDate: '2026-04-08',
        endDate: '2026-04-09',
        squadId: 'other',
      },
    ])
  })
})
