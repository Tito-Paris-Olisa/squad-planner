import type {
  AppData,
  Role,
  RoleName,
  Squad,
  Unavailability,
} from '../types'

export type DateRange = Pick<Squad, 'startDate' | 'endDate'>

export type SchedulingData = Pick<
  AppData,
  'squads' | 'assignments' | 'roles' | 'unavailabilities'
>

export interface SchedulingConflict {
  type: 'squad' | 'unavailability'
  startDate: string
  endDate: string
  squadId?: string
  roleId?: string
  unavailabilityId?: string
  reason?: Unavailability['reason']
}

export interface SchedulingOptions {
  /** Role for the proposed reservation. Without one, the full proposed range is checked. */
  roleId?: string
  /** Omit this squad's current reservation while checking an edit to that squad. */
  excludeSquadId?: string
}

type ReservationSquad = Pick<Squad, 'id' | 'startDate' | 'endDate'>

/**
 * Architects are reserved for kickoff only. Developer roles and Project Managers
 * are reserved for the squad's full, inclusive date range.
 */
export function getSquadReservationRange(
  squad: Pick<Squad, 'startDate' | 'endDate'>,
  role: Role | RoleName,
): DateRange {
  const roleName = typeof role === 'string' ? role : role.name
  return {
    startDate: squad.startDate,
    endDate: roleName === 'Architect' ? squad.startDate : squad.endDate,
  }
}

/**
 * Returns all reservations that currently apply to a person. Multiple roles in
 * one squad remain separate reservations because their reserved dates can differ.
 */
export function getPersonReservations(
  personId: string,
  data: SchedulingData,
  options: Pick<SchedulingOptions, 'excludeSquadId'> = {},
): SchedulingConflict[] {
  const squadsById = new Map<string, ReservationSquad>(
    data.squads.map(({ id, startDate, endDate }) => [
      id,
      { id, startDate, endDate },
    ]),
  )
  const rolesById = new Map<string, Role>(
    data.roles.map((role) => [role.id, role]),
  )

  return data.assignments.flatMap((assignment) => {
    if (
      assignment.personId !== personId ||
      assignment.squadId === options.excludeSquadId
    ) {
      return []
    }

    const squad = squadsById.get(assignment.squadId)
    const role = rolesById.get(assignment.roleId)
    if (!squad || !role) return []

    const range = getSquadReservationRange(squad, role)
    return [{
      type: 'squad' as const,
      ...range,
      squadId: squad.id,
      roleId: role.id,
    }]
  })
}

function getIntersection(
  first: DateRange,
  second: DateRange,
): DateRange | undefined {
  const startDate =
    first.startDate > second.startDate ? first.startDate : second.startDate
  const endDate = first.endDate < second.endDate ? first.endDate : second.endDate
  return startDate <= endDate ? { startDate, endDate } : undefined
}

/**
 * Finds inclusive date overlaps between a proposed reservation, existing squad
 * reservations, and manual unavailability. Pass `excludeSquadId` when editing
 * an existing squad so its old reservation is not treated as a conflict.
 */
export function getSchedulingConflicts(
  personId: string,
  proposedRange: DateRange,
  data: SchedulingData,
  options: SchedulingOptions = {},
): SchedulingConflict[] {
  const role = options.roleId
    ? data.roles.find(({ id }) => id === options.roleId)
    : undefined
  const candidateRange = role
    ? getSquadReservationRange(proposedRange, role)
    : proposedRange

  const squadConflicts = getPersonReservations(personId, data, options)
    .flatMap((reservation) => {
      const overlap = getIntersection(candidateRange, reservation)
      return overlap ? [{ ...reservation, ...overlap }] : []
    })

  const unavailabilityConflicts = data.unavailabilities
    .filter(({ personId: unavailablePersonId }) => unavailablePersonId === personId)
    .flatMap((unavailability) => {
      const overlap = getIntersection(candidateRange, unavailability)
      return overlap
        ? [{
            type: 'unavailability' as const,
            ...overlap,
            unavailabilityId: unavailability.id,
            reason: unavailability.reason,
          }]
        : []
    })

  return [...squadConflicts, ...unavailabilityConflicts]
}

export function isPersonAvailable(
  personId: string,
  proposedRange: DateRange,
  data: SchedulingData,
  options: SchedulingOptions = {},
): boolean {
  return getSchedulingConflicts(personId, proposedRange, data, options).length === 0
}
