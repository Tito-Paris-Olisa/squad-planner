import { useState } from 'react'
import {
  Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, Switch, TextField,
  Typography,
} from '@mui/material'
import Groups from '@mui/icons-material/Groups'
import WarningAmber from '@mui/icons-material/WarningAmber'
import { PROJECT_STATUSES, type Person, type Project, type ProjectStatus, type RoleName, type Team } from '../types'
import { useAppData } from '../context/AppData'
import { formatDate } from '../utils/formatting'

export function PageHeading({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <Box className="page-heading">
      <Box><Typography variant="h5">{title}</Typography><Typography variant="body2" color="text.secondary">{description}</Typography></Box>
      {action}
    </Box>
  )
}

export function StatusChip({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, { bg: string; color: string }> = {
    'Unassigned': { bg: '#F1F5F9', color: '#475569' },
    'To Do': { bg: '#EFF6FF', color: '#1D4ED8' },
    'In Progress': { bg: '#FEF3C7', color: '#B45309' },
    'Completed': { bg: '#DCFCE7', color: '#15803D' },
  }
  return <Chip size="small" label={status} sx={{ bgcolor: styles[status].bg, color: styles[status].color, fontWeight: 650, height: 24 }} />
}

export function EmptyState({ title, description, icon = <Groups /> }: { title: string; description: string; icon?: React.ReactNode }) {
  return <Box className="empty-state"><Box className="empty-state-icon">{icon}</Box><Typography fontWeight={650}>{title}</Typography><Typography variant="body2" sx={{ mt: .5 }}>{description}</Typography></Box>
}

export function ConfirmationModal({
  open, title, description, onCancel, onConfirm, confirmLabel = 'Delete', danger = true,
}: {
  open: boolean
  title: string
  description: string
  onCancel: () => void
  onConfirm: () => void
  confirmLabel?: string
  danger?: boolean
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent><Typography variant="body2" color="text.secondary">{description}</Typography></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onCancel} color="inherit">Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color={danger ? 'error' : 'primary'}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  )
}

export function ProjectFormDialog({ open, project, onClose, onSave }: {
  open: boolean
  project?: Project
  onClose: () => void
  onSave: (values: Pick<Project, 'name' | 'description' | 'teamId' | 'status'>) => boolean | void
}) {
  const { data } = useAppData()
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [teamId, setTeamId] = useState(project?.teamId ?? '')
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'Unassigned')
  const [error, setError] = useState('')

  const submit = () => {
    if (!name.trim() || !description.trim() || !teamId) {
      setError('Enter a project name and description, and choose an owning team.')
      return
    }
    if (onSave({ name: name.trim(), description: description.trim(), teamId, status }) === false) return
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{project ? 'Edit project' : 'Create project'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField autoFocus required label="Project name" value={name} onChange={(event) => setName(event.target.value)} />
          <TextField required multiline minRows={3} label="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          <FormControl required>
            <InputLabel>Owning team</InputLabel>
            <Select label="Owning team" value={teamId} onChange={(event) => setTeamId(event.target.value)}>
              {data.teams.map((team) => <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>)}
            </Select>
          </FormControl>
          {project && <FormControl>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}>
              {PROJECT_STATUSES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </Select>
          </FormControl>}
          {error && <Typography color="error" variant="body2">{error}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}><Button color="inherit" onClick={onClose}>Cancel</Button><Button variant="contained" onClick={submit}>Save project</Button></DialogActions>
    </Dialog>
  )
}

export function PersonFormDialog({ open, person, onClose, onSave }: {
  open: boolean
  person?: Person
  onClose: () => void
  onSave: (values: Pick<Person, 'name' | 'teamId' | 'roleIds' | 'active'>) => void
}) {
  const { data } = useAppData()
  const [name, setName] = useState(person?.name ?? '')
  const [teamId, setTeamId] = useState(person?.teamId ?? '')
  const [roleIds, setRoleIds] = useState<string[]>(person?.roleIds ?? [])
  const [active, setActive] = useState(person?.active ?? true)
  const [error, setError] = useState('')
  const submit = () => {
    if (!name.trim() || !teamId || roleIds.length === 0) {
      setError('Enter a name, choose a home team, and select at least one role.')
      return
    }
    onSave({ name: name.trim(), teamId, roleIds, active })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{person ? 'Edit person' : 'Add person'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField autoFocus required label="Full name" value={name} onChange={(event) => setName(event.target.value)} />
          <FormControl required>
            <InputLabel>Home team</InputLabel>
            <Select label="Home team" value={teamId} onChange={(event) => setTeamId(event.target.value)}>
              {data.teams.map((team) => <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl required>
            <InputLabel>Roles</InputLabel>
            <Select multiple label="Roles" value={roleIds} onChange={(event) => setRoleIds(event.target.value as string[])}
              renderValue={(selected) => data.roles.filter((role) => selected.includes(role.id)).map((role) => role.name).join(', ')}>
              {data.roles.map((role) => <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}
            </Select>
          </FormControl>
          {person && <FormControlLabel control={<Switch checked={active} onChange={(event) => setActive(event.target.checked)} />} label={active ? 'Active' : 'Inactive'} />}
          {error && <Typography color="error" variant="body2">{error}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}><Button color="inherit" onClick={onClose}>Cancel</Button><Button variant="contained" onClick={submit}>Save person</Button></DialogActions>
    </Dialog>
  )
}

export function TeamFormDialog({ open, team, onClose, onSave }: {
  open: boolean
  team?: Team
  onClose: () => void
  onSave: (values: Pick<Team, 'name' | 'description'>) => void
}) {
  const [name, setName] = useState(team?.name ?? '')
  const [description, setDescription] = useState(team?.description ?? '')
  const [error, setError] = useState('')
  const submit = () => {
    if (!name.trim()) { setError('Team name is required.'); return }
    onSave({ name: name.trim(), description: description.trim() })
    onClose()
  }
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{team ? 'Edit team' : 'Create team'}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <TextField autoFocus required label="Team name" value={name} onChange={(event) => setName(event.target.value)} />
        <TextField multiline minRows={2} label="Description (optional)" value={description} onChange={(event) => setDescription(event.target.value)} />
        {error && <Typography color="error" variant="body2">{error}</Typography>}
      </Stack></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}><Button color="inherit" onClick={onClose}>Cancel</Button><Button variant="contained" onClick={submit}>Save team</Button></DialogActions>
    </Dialog>
  )
}

export function SquadDetailsDialog({ squadId, open, onClose, onEdit }: { squadId: string | null; open: boolean; onClose: () => void; onEdit?: (id: string) => void }) {
  const { data } = useAppData()
  const squad = data.squads.find((item) => item.id === squadId)
  const project = data.projects.find((item) => item.id === squad?.projectId)
  const team = data.teams.find((item) => item.id === project?.teamId)
  const assignments = data.assignments.filter((item) => item.squadId === squadId)
  return (
    <Dialog open={open && Boolean(squad)} onClose={onClose} maxWidth="sm" fullWidth>
      {squad && project && <>
        <DialogTitle>{project.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">{project.description}</Typography>
            <Stack direction="row" spacing={1} alignItems="center"><StatusChip status={project.status} /><Typography variant="body2" color="text.secondary">{team?.name ?? 'Unknown team'}</Typography></Stack>
            <Box><Typography variant="caption" color="text.secondary">SQUAD DATES</Typography><Typography fontWeight={600}>{formatDate(squad.startDate)} – {formatDate(squad.endDate)}</Typography></Box>
            <Box>
              <Typography variant="caption" color="text.secondary">SQUAD MEMBERS ({assignments.length})</Typography>
              <Stack spacing={1.2} sx={{ mt: 1 }}>
                {assignments.map((assignment) => {
                  const person = data.people.find((item) => item.id === assignment.personId)
                  const role = data.roles.find((item) => item.id === assignment.roleId)
                  if (!person || !role) return null
                  return <Box key={assignment.id} className="person-chip"><Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>{person.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</Avatar><Box sx={{ flex: 1 }}><Typography variant="body2" fontWeight={600}>{person.name}</Typography><Typography variant="caption" color="text.secondary">{role.name}{role.name === 'Architect' ? ' · Kickoff only' : ''}</Typography></Box></Box>
                })}
                {assignments.length === 0 && <Typography variant="body2" color="text.secondary">No members assigned yet.</Typography>}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}><Button color="inherit" onClick={onClose}>Close</Button>{onEdit && <Button variant="contained" onClick={() => onEdit(squad.id)}>Edit squad</Button>}</DialogActions>
      </>}
    </Dialog>
  )
}

export function RoleLabel({ roleName }: { roleName: RoleName }) {
  return <Chip size="small" variant="outlined" label={roleName} sx={{ fontSize: 11, height: 23, borderColor: '#E2E8F0', color: '#475569' }} />
}

export function ConflictNotice({ children }: { children: React.ReactNode }) {
  return <Stack direction="row" spacing={1} className="conflict-text" alignItems="center"><WarningAmber fontSize="small" />{children}</Stack>
}
