import { addDays, format } from 'date-fns'
import { ROLE_NAMES, type AppData, type ProjectStatus, type RoleName } from '../types'

const today = new Date()
const day = (offset: number) => format(addDays(today, offset), 'yyyy-MM-dd')
const timestamp = new Date().toISOString()

const roles = ROLE_NAMES.map((name) => ({
  id: `role-${name.toLowerCase().replaceAll(' ', '-')}`,
  name,
}))

const roleId = (name: RoleName) =>
  roles.find((role) => role.name === name)!.id

const projects: AppData['projects'] = [
  ['project-1', 'Atlas Customer Portal', 'A new self-service experience for enterprise customers.', 'team-platform', 'In Progress'],
  ['project-2', 'Northstar Analytics', 'A unified reporting platform for operational teams.', 'team-data', 'In Progress'],
  ['project-3', 'Mobile Onboarding', 'A streamlined onboarding experience for mobile users.', 'team-growth', 'To Do'],
  ['project-4', 'Identity Refresh', 'Modernize authentication and identity workflows.', 'team-platform', 'Completed'],
  ['project-5', 'Revenue Forecasting', 'Build a reliable forecasting and planning toolkit.', 'team-data', 'Unassigned'],
  ['project-6', 'Partner Integrations', 'Improve partner connectivity and developer tooling.', 'team-integrations', 'To Do'],
  ['project-7', 'Design System v2', 'An accessible, consistent component library.', 'team-growth', 'In Progress'],
].map(([id, name, description, teamId, status]) => ({
  id,
  name,
  description,
  teamId,
  status: status as ProjectStatus,
  createdAt: day(-35),
  updatedAt: timestamp,
}))

const squadSeeds: [string, string, number, number][] = [
  ['squad-1', 'project-1', -3, 10],
  ['squad-2', 'project-2', 0, 7],
  ['squad-3', 'project-3', 12, 24],
  ['squad-4', 'project-4', -22, -9],
  ['squad-5', 'project-6', 20, 34],
  ['squad-6', 'project-7', -1, 5],
]
const squads: AppData['squads'] = squadSeeds.map(([id, projectId, start, end]) => ({
  id,
  projectId,
  startDate: day(start),
  endDate: day(end),
  createdAt: day(-40),
  updatedAt: timestamp,
}))

const personSeeds: [string, string, string, RoleName[]][] = [
  ['person-1', 'Amara Okafor', 'team-platform', ['Frontend', 'Architect']],
  ['person-2', 'Theo Bennett', 'team-platform', ['Backend']],
  ['person-3', 'Priya Nair', 'team-data', ['BI2', 'Project Manager']],
  ['person-4', 'Mateo Alvarez', 'team-data', ['Backend', 'Architect']],
  ['person-5', 'Zara Williams', 'team-growth', ['Frontend']],
  ['person-6', 'Ethan Chen', 'team-growth', ['Project Manager', 'Architect']],
  ['person-7', 'Sofia Petrova', 'team-integrations', ['Backend', 'BI2']],
  ['person-8', 'Noah Thompson', 'team-integrations', ['Frontend', 'Backend']],
  ['person-9', 'Aisha Rahman', 'team-platform', ['BI2']],
  ['person-10', 'Luca Moretti', 'team-data', ['Frontend', 'Architect']],
  ['person-11', 'Maya Patel', 'team-growth', ['Backend', 'Project Manager']],
  ['person-12', 'Oliver Kim', 'team-integrations', ['Architect']],
  ['person-13', 'Camila Santos', 'team-platform', ['Project Manager']],
  ['person-14', 'Finn Murphy', 'team-data', ['Frontend', 'BI2']],
  ['person-15', 'Leila Haddad', 'team-growth', ['Backend', 'Architect']],
]
const people: AppData['people'] = personSeeds.map(([id, name, teamId, names]) => ({
  id,
  name,
  teamId,
  roleIds: names.map(roleId),
  active: true,
  createdAt: day(-100),
  updatedAt: timestamp,
}))

const assignments: AppData['assignments'] = [
  ['squad-1', 'person-1', 'Frontend'],
  ['squad-1', 'person-2', 'Backend'],
  ['squad-1', 'person-13', 'Project Manager'],
  ['squad-2', 'person-3', 'BI2'],
  ['squad-2', 'person-4', 'Architect'],
  ['squad-2', 'person-9', 'Backend'],
  ['squad-3', 'person-5', 'Frontend'],
  ['squad-3', 'person-6', 'Project Manager'],
  ['squad-3', 'person-12', 'Architect'],
  ['squad-4', 'person-7', 'Backend'],
  ['squad-4', 'person-8', 'Frontend'],
  ['squad-5', 'person-11', 'Project Manager'],
  ['squad-5', 'person-14', 'BI2'],
  ['squad-6', 'person-10', 'Architect'],
  ['squad-6', 'person-15', 'Backend'],
].map(([squadId, personId, roleName]) => ({
  id: `assignment-${squadId}-${personId}`,
  squadId,
  personId,
  roleId: roleId(roleName as RoleName),
}))

export const seedData: AppData = {
  teams: [
    { id: 'team-platform', name: 'Platform', description: 'Core services and developer experience.', createdAt: day(-180) },
    { id: 'team-data', name: 'Data & Insights', description: 'Data products and analytics.', createdAt: day(-180) },
    { id: 'team-growth', name: 'Growth', description: 'Customer acquisition and product adoption.', createdAt: day(-180) },
    { id: 'team-integrations', name: 'Integrations', description: 'Partner and ecosystem connectivity.', createdAt: day(-180) },
  ],
  people,
  roles,
  projects,
  squads,
  assignments,
  unavailabilities: [
    { id: 'unavailable-1', personId: 'person-8', startDate: day(5), endDate: day(7), reason: 'Training / Workshop', createdAt: timestamp, updatedAt: timestamp },
    { id: 'unavailable-2', personId: 'person-9', startDate: day(15), endDate: day(18), reason: 'Leave / Holiday', createdAt: timestamp, updatedAt: timestamp },
    { id: 'unavailable-3', personId: 'person-2', startDate: day(35), endDate: day(36), reason: 'Personal commitment', createdAt: timestamp, updatedAt: timestamp },
  ],
}
