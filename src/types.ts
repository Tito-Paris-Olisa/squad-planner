export const PROJECT_STATUSES = [
  'Unassigned',
  'To Do',
  'In Progress',
  'Completed',
] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const ROLE_NAMES = [
  'Frontend',
  'Backend',
  'BI2',
  'Architect',
  'Project Manager',
] as const

export type RoleName = (typeof ROLE_NAMES)[number]

export interface Team {
  id: string
  name: string
  description?: string
  createdAt: string
}

export interface Person {
  id: string
  name: string
  teamId: string
  roleIds: string[]
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: string
  name: RoleName
}

export interface Project {
  id: string
  name: string
  description: string
  teamId: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}

export interface Squad {
  id: string
  projectId: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}

export interface SquadAssignment {
  id: string
  squadId: string
  personId: string
  roleId: string
}

export type UnavailabilityReason =
  | 'Leave / Holiday'
  | 'Training / Workshop'
  | 'Other work-related engagement'
  | 'Personal commitment'
  | 'Other'

export interface Unavailability {
  id: string
  personId: string
  startDate: string
  endDate: string
  reason: UnavailabilityReason
  createdAt: string
  updatedAt: string
}

export interface AppData {
  teams: Team[]
  people: Person[]
  roles: Role[]
  projects: Project[]
  squads: Squad[]
  assignments: SquadAssignment[]
  unavailabilities: Unavailability[]
}
