import { isValid, parseISO } from 'date-fns'
import { PROJECT_STATUSES, ROLE_NAMES, type AppData } from '../types'
import { seedData } from './seed'

export const STORAGE_KEY = 'squad-planner-data-v1'

const isString = (value: unknown): value is string => typeof value === 'string'
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object'
const isIsoDate = (value: unknown): value is string =>
  isString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value))

export function validateAppData(value: unknown): value is AppData {
  if (!isRecord(value)) return false
  const data = value as Record<string, unknown>
  const collections = ['teams', 'people', 'roles', 'projects', 'squads', 'assignments', 'unavailabilities']
  if (!collections.every((key) => Array.isArray(data[key]))) return false

  const teams = data.teams as unknown[]
  const people = data.people as unknown[]
  const roles = data.roles as unknown[]
  const projects = data.projects as unknown[]
  const squads = data.squads as unknown[]
  const assignments = data.assignments as unknown[]
  const unavailabilities = data.unavailabilities as unknown[]

  const validCollectionIds = (items: unknown[]) => items.every(isRecord) && new Set(items.map((item) => item.id)).size === items.length
  if (![teams, people, roles, projects, squads, assignments, unavailabilities].every(validCollectionIds)) return false
  if (!teams.every((team) => isRecord(team) && isString(team.id) && isString(team.name) && isString(team.createdAt))) return false
  if (!roles.every((role) => isRecord(role) && isString(role.id) && ROLE_NAMES.includes(role.name as (typeof ROLE_NAMES)[number]))) return false

  const teamIds = new Set(teams.map((team) => (team as Record<string, unknown>).id))
  const roleIds = new Set(roles.map((role) => (role as Record<string, unknown>).id))
  const projectIds = new Set(projects.map((project) => (project as Record<string, unknown>).id))
  const squadIds = new Set(squads.map((squad) => (squad as Record<string, unknown>).id))
  const personIds = new Set(people.map((person) => (person as Record<string, unknown>).id))

  return people.every((person) => isRecord(person)
      && isString(person.id) && isString(person.name) && teamIds.has(person.teamId)
      && Array.isArray(person.roleIds) && person.roleIds.length > 0
      && person.roleIds.every((id) => roleIds.has(id))
      && typeof person.active === 'boolean' && isString(person.createdAt) && isString(person.updatedAt))
    && projects.every((project) => isRecord(project)
      && isString(project.id) && isString(project.name) && isString(project.description)
      && teamIds.has(project.teamId) && PROJECT_STATUSES.includes(project.status as (typeof PROJECT_STATUSES)[number])
      && isString(project.createdAt) && isString(project.updatedAt))
    && squads.every((squad) => isRecord(squad)
      && isString(squad.id) && projectIds.has(squad.projectId)
      && isIsoDate(squad.startDate) && isIsoDate(squad.endDate) && squad.endDate >= squad.startDate)
    && assignments.every((assignment) => isRecord(assignment)
      && isString(assignment.id) && squadIds.has(assignment.squadId)
      && personIds.has(assignment.personId) && roleIds.has(assignment.roleId))
    && unavailabilities.every((period) => isRecord(period)
      && isString(period.id) && personIds.has(period.personId)
      && isIsoDate(period.startDate) && isIsoDate(period.endDate) && period.endDate >= period.startDate
      && ['Leave / Holiday', 'Training / Workshop', 'Other work-related engagement', 'Personal commitment', 'Other'].includes(String(period.reason))
      && isString(period.createdAt) && isString(period.updatedAt))
}

export function loadAppData(): AppData {
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === null) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData))
    return seedData
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(saved)
  } catch (error) {
    throw new Error('Saved Squad Planner data could not be read. Clear the app data and reload.', { cause: error })
  }

  if (!validateAppData(parsed)) {
    throw new Error('Saved Squad Planner data is incomplete or invalid. Clear the app data and reload.')
  }
  return parsed
}

export function saveAppData(data: AppData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function resetAppData(): AppData {
  const fresh = structuredClone(seedData)
  saveAppData(fresh)
  return fresh
}
