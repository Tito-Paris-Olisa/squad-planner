import { format } from 'date-fns'
import type { AppData, ProjectStatus } from '../types'

export function synchronizeProjectStatuses(data: AppData, now = new Date()): AppData {
  const today = format(now, 'yyyy-MM-dd')
  const scheduled = new Set(data.squads.map((squad) => squad.projectId))
  const started = new Set(data.squads.filter((squad) => squad.startDate <= today).map((squad) => squad.projectId))
  let changed = false
  const projects = data.projects.map((project) => {
    if (project.status === 'Completed' || project.status === 'In Progress') return project
    const status: ProjectStatus = started.has(project.id)
      ? 'In Progress'
      : scheduled.has(project.id) && project.status === 'Unassigned' ? 'To Do' : project.status
    if (status === project.status) return project
    changed = true
    return { ...project, status, updatedAt: now.toISOString() }
  })
  return changed ? { ...data, projects } : data
}
