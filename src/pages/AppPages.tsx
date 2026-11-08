import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  addDays, addMonths, addWeeks, differenceInCalendarDays, endOfMonth, endOfWeek, format,
  isSameDay, parseISO, startOfMonth, startOfWeek,
} from 'date-fns'
import {
  Avatar, Box, Button, Card, CardActionArea, CardContent, Checkbox, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem,
  Select, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, ToggleButton,
  ToggleButtonGroup, Tooltip, Typography, Autocomplete,
} from '@mui/material'
import Add from '@mui/icons-material/Add'
import ArrowBack from '@mui/icons-material/ArrowBack'
import ArrowForward from '@mui/icons-material/ArrowForward'
import CalendarMonth from '@mui/icons-material/CalendarMonth'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Close from '@mui/icons-material/Close'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import EventBusy from '@mui/icons-material/EventBusy'
import FolderOpen from '@mui/icons-material/FolderOpen'
import Groups from '@mui/icons-material/Groups'
import PersonAddAlt1 from '@mui/icons-material/PersonAddAlt1'
import Search from '@mui/icons-material/Search'
import Visibility from '@mui/icons-material/Visibility'
import { useAppData } from '../context/AppData'
import { formatDate, initials } from '../utils/formatting'
import {
  type AppData, type Person, type Project, type ProjectStatus, type Squad, type SquadAssignment,
  type Team, type UnavailabilityReason,
} from '../types'
import {
  ConfirmationModal, ConflictNotice, EmptyState, PageHeading,
  PersonFormDialog, ProjectFormDialog, RoleLabel, SquadDetailsDialog, StatusChip, TeamFormDialog,
} from '../components/Shared'
import { getPersonReservations, getSchedulingConflicts } from '../utils/scheduling'

const todayDate = () => new Date()
const timestampNow = () => new Date().toISOString()
const nowIsoDay = () => format(todayDate(), 'yyyy-MM-dd')
const uid = () => crypto.randomUUID()

function teamName(data: AppData, teamId: string) {
  return data.teams.find((team) => team.id === teamId)?.name ?? 'Unknown team'
}

function projectName(data: AppData, projectId: string) {
  return data.projects.find((project) => project.id === projectId)?.name ?? 'Unknown project'
}

function StatCard({ label, value, icon, tint }: { label: string; value: number; icon: React.ReactNode; tint: string }) {
  return <Card className="stat-card"><Box display="flex" justifyContent="space-between" alignItems="center"><Typography className="stat-label">{label}</Typography><Box className="stat-icon" sx={{ background: tint, color: '#2563EB' }}>{icon}</Box></Box><Typography className="stat-number">{value}</Typography></Card>
}

function AvatarGroup({ people }: { people: Person[] }) {
  return <Tooltip title={people.map((person) => person.name).join(', ') || 'No members assigned'}><Box className="avatar-stack">{people.slice(0, 4).map((person) => <Avatar key={person.id} sx={{ bgcolor: '#E0E7FF', color: '#3730A3' }}>{initials(person.name)}</Avatar>)}{people.length > 4 && <Avatar sx={{ bgcolor: '#F1F5F9', color: '#475569' }}>+{people.length - 4}</Avatar>}</Box></Tooltip>
}

export function DashboardPage() {
  const { data } = useAppData()
  const [detailId, setDetailId] = useState<string | null>(null)
  const today = nowIsoDay()
  const active = data.squads.filter((squad) => squad.startDate <= today && squad.endDate >= today
    && data.projects.some((project) => project.id === squad.projectId && project.status === 'In Progress'))
  const activePersonIds = new Set(data.assignments.filter((assignment) => active.some((squad) => squad.id === assignment.squadId)).map((assignment) => assignment.personId))

  return <>
    <PageHeading title="Good morning" description="Here’s an overview of your team’s delivery and capacity." action={<Button component={Link} to="/squads" variant="contained" startIcon={<Add />}>Create squad</Button>} />
    <Box className="stat-grid">
      <StatCard label="Total projects" value={data.projects.length} icon={<FolderOpen fontSize="small" />} tint="#EFF6FF" />
      <StatCard label="Active squads" value={active.length} icon={<Groups fontSize="small" />} tint="#ECFDF5" />
      <StatCard label="Completed projects" value={data.projects.filter((project) => project.status === 'Completed').length} icon={<CheckCircle fontSize="small" />} tint="#F0FDF4" />
      <StatCard label="People in squads" value={activePersonIds.size} icon={<PersonAddAlt1 fontSize="small" />} tint="#F5F3FF" />
    </Box>
    <Box className="section-heading"><Box><Typography variant="h6">Currently active squads</Typography><Typography variant="body2" color="text.secondary">People collaborating on work today</Typography></Box><Button component={Link} to="/squads" endIcon={<ArrowForward />}>All squads</Button></Box>
    {active.length ? <Box className="active-squad-grid">
      {active.map((squad) => {
        const project = data.projects.find((item) => item.id === squad.projectId)!
        const members = data.assignments.filter((assignment) => assignment.squadId === squad.id).map((assignment) => data.people.find((person) => person.id === assignment.personId)).filter((person): person is Person => Boolean(person))
        return <Card key={squad.id} className="squad-card" onClick={() => setDetailId(squad.id)}>
          <CardActionArea><CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Box><Typography fontWeight={650}>{project.name}</Typography><Typography variant="caption" color="text.secondary">{teamName(data, project.teamId)}</Typography></Box><Chip size="small" label="Active" icon={<Box sx={{ width: 7, height: 7, bgcolor: '#16A34A', borderRadius: '50%', ml: 1 }} />} sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 650 }} /></Stack>
            <Typography variant="body2" sx={{ mt: 2 }}>{formatDate(squad.startDate)} – {formatDate(squad.endDate)}</Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}><AvatarGroup people={members} /><Typography variant="caption" color="text.secondary">{members.length} {members.length === 1 ? 'person' : 'people'}</Typography></Stack>
          </CardContent></CardActionArea>
        </Card>
      })}
    </Box> : <Card><EmptyState title="No active squads today" description="Create a squad to start planning project work." icon={<Groups />} /></Card>}
    <SquadDetailsDialog open={Boolean(detailId)} squadId={detailId} onClose={() => setDetailId(null)} onEdit={(id) => window.location.assign(`/squads?edit=${id}`)} />
  </>
}

export function ProjectsPage() {
  const { data, updateData } = useAppData()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [teamFilter, setTeamFilter] = useState('All teams')
  const [sortBy, setSortBy] = useState('name')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Project | undefined>()
  const [details, setDetails] = useState<Project | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Project | undefined>()
  const [notice, setNotice] = useState('')
  const projects = useMemo(() => data.projects
    .filter((project) => project.name.toLowerCase().includes(query.toLowerCase()))
    .filter((project) => statusFilter === 'All statuses' || project.status === statusFilter)
    .filter((project) => teamFilter === 'All teams' || project.teamId === teamFilter)
    .sort((a, b) => sortBy === 'createdAt' ? b.createdAt.localeCompare(a.createdAt)
      : sortBy === 'status' ? a.status.localeCompare(b.status) : a.name.localeCompare(b.name)), [data.projects, query, statusFilter, teamFilter, sortBy])

  const saveProject = (values: Pick<Project, 'name' | 'description' | 'teamId' | 'status'>) => {
    if (editing) {
      if (values.status === 'Unassigned' && data.squads.some((squad) => squad.projectId === editing.id)) {
        setNotice('Projects with squads cannot be marked Unassigned.')
        return false
      }
      updateData((current) => ({ ...current, projects: current.projects.map((project) => project.id === editing.id ? { ...project, ...values, updatedAt: timestampNow() } : project) }))
    } else {
      const timestamp = timestampNow()
      const project: Project = { id: uid(), ...values, status: 'Unassigned', createdAt: timestamp, updatedAt: timestamp }
      updateData((current) => ({ ...current, projects: [...current.projects, project] }))
    }
    setEditing(undefined)
    return true
  }

  return <>
    <PageHeading title="Projects" description={`${data.projects.length} projects across ${data.teams.length} teams`} action={<Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(undefined); setEditorOpen(true) }}>New project</Button>} />
    <Card className="table-card">
      <Box className="table-toolbar">
        <TextField size="small" placeholder="Search projects" value={query} onChange={(event) => setQuery(event.target.value)} InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: '#94A3B8' }} /> }} />
        <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Status</InputLabel><Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><MenuItem value="All statuses">All statuses</MenuItem>{['Unassigned', 'To Do', 'In Progress', 'Completed'].map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}</Select></FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}><InputLabel>Team</InputLabel><Select label="Team" value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}><MenuItem value="All teams">All teams</MenuItem>{data.teams.map((team) => <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>)}</Select></FormControl>
        <FormControl size="small" sx={{ minWidth: 160, ml: 'auto' }}><InputLabel>Sort by</InputLabel><Select label="Sort by" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><MenuItem value="name">Name</MenuItem><MenuItem value="createdAt">Creation date</MenuItem><MenuItem value="status">Status</MenuItem></Select></FormControl>
      </Box>
      {projects.length ? <Box className="table-container"><Table>
        <TableHead><TableRow><TableCell>Project</TableCell><TableCell>Team</TableCell><TableCell>Status</TableCell><TableCell>Created</TableCell><TableCell>Squads</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
        <TableBody>{projects.map((project) => {
          const squadCount = data.squads.filter((squad) => squad.projectId === project.id).length
          return <TableRow key={project.id} hover>
            <TableCell sx={{ minWidth: 250 }}><Button color="inherit" sx={{ p: 0, textAlign: 'left', justifyContent: 'flex-start', maxWidth: '100%' }} onClick={() => setDetails(project)}><Box sx={{ minWidth: 0, textAlign: 'left' }}><Typography variant="body2" fontWeight={650} noWrap>{project.name}</Typography><Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 270 }}>{project.description}</Typography></Box></Button></TableCell>
            <TableCell>{teamName(data, project.teamId)}</TableCell>
            <TableCell><FormControl size="small" variant="standard"><Select value={project.status} onChange={(event) => {
              const next = event.target.value as ProjectStatus
              if (next === 'Unassigned' && squadCount > 0) { setNotice('Remove associated squads before marking a project Unassigned.'); return }
              updateData((current) => ({ ...current, projects: current.projects.map((item) => item.id === project.id ? { ...item, status: next, updatedAt: timestampNow() } : item) }))
            }}>{['Unassigned', 'To Do', 'In Progress', 'Completed'].map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}</Select></FormControl></TableCell>
            <TableCell>{formatDate(project.createdAt.slice(0, 10))}</TableCell><TableCell>{squadCount}</TableCell>
            <TableCell align="right"><Tooltip title="Create squad"><IconButton size="small" onClick={() => navigate('/squads', { state: { projectId: project.id } })}><Add fontSize="small" /></IconButton></Tooltip><Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditing(project); setEditorOpen(true) }}><EditOutlined fontSize="small" /></IconButton></Tooltip><Tooltip title={squadCount ? 'Remove squads before deleting' : 'Delete'}><span><IconButton disabled={squadCount > 0} size="small" onClick={() => setDeleteTarget(project)}>            <DeleteOutlined fontSize="small" /></IconButton></span></Tooltip></TableCell>
          </TableRow>
        })}</TableBody>
      </Table></Box> : <EmptyState title="No projects found" description={query ? 'Try adjusting your search or filters.' : 'Create your first project to get started.'} icon={<FolderOpen />} />}
    </Card>
    <ProjectFormDialog key={`${editorOpen}-${editing?.id ?? 'new'}`} open={editorOpen} project={editing} onClose={() => { setEditorOpen(false); setEditing(undefined) }} onSave={saveProject} />
    <ProjectDetailsDialog project={details} onClose={() => setDetails(undefined)} onEdit={() => { setEditing(details); setDetails(undefined); setEditorOpen(true) }} onCreateSquad={() => details && navigate('/squads', { state: { projectId: details.id } })} />
    <ConfirmationModal open={Boolean(deleteTarget)} title="Delete project?" description={`Delete “${deleteTarget?.name}”? This cannot be undone.`} onCancel={() => setDeleteTarget(undefined)} onConfirm={() => {
      if (deleteTarget) updateData((current) => ({ ...current, projects: current.projects.filter((item) => item.id !== deleteTarget.id) }))
      setDeleteTarget(undefined)
    }} />
    <Snackbar open={Boolean(notice)} message={notice} autoHideDuration={4000} onClose={() => setNotice('')} />
  </>
}

function ProjectDetailsDialog({ project, onClose, onEdit, onCreateSquad }: { project?: Project; onClose: () => void; onEdit: () => void; onCreateSquad: () => void }) {
  const { data } = useAppData()
  const navigate = useNavigate()
  const [detailSquadId, setDetailSquadId] = useState<string | null>(null)
  const squads = data.squads.filter((squad) => squad.projectId === project?.id)
  const close = () => { setDetailSquadId(null); onClose() }
  return <Dialog open={Boolean(project)} onClose={close} maxWidth="sm" fullWidth>
    {project && <>
      <DialogTitle>{project.name}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">{project.description}</Typography><Stack direction="row" spacing={1} alignItems="center"><StatusChip status={project.status} /><Typography variant="body2">{teamName(data, project.teamId)}</Typography></Stack>
        <Box><Typography variant="caption" color="text.secondary">ASSOCIATED SQUADS ({squads.length})</Typography>
          {squads.map((squad) => {
            const names = data.assignments.filter((assignment) => assignment.squadId === squad.id).map((assignment) => data.people.find((person) => person.id === assignment.personId)?.name).filter(Boolean)
            return <Button key={squad.id} color="inherit" onClick={() => setDetailSquadId(squad.id)} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', textAlign: 'left', textTransform: 'none', width: '100%', py: 1.2, px: 0, borderBottom: '1px solid #E2E8F0' }}><Box><Typography variant="body2" fontWeight={600}>{formatDate(squad.startDate)} – {formatDate(squad.endDate)}</Typography><Typography variant="caption" color="text.secondary">{names.join(', ') || 'No members assigned'}</Typography></Box><Visibility fontSize="small" sx={{ mt: .5, color: '#64748B' }} /></Button>
          })}
          {!squads.length && <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>No squads scheduled.</Typography>}
        </Box>
      </Stack></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={close} color="inherit">Close</Button><Button onClick={() => { close(); onEdit() }} startIcon={<EditOutlined />}>Edit project</Button><Button onClick={() => { close(); onCreateSquad() }} variant="contained" startIcon={<Add />}>Create squad</Button></DialogActions>
    </>}
    <SquadDetailsDialog open={Boolean(detailSquadId)} squadId={detailSquadId} onClose={() => setDetailSquadId(null)} onEdit={(id) => { close(); navigate(`/squads?edit=${id}`) }} />
  </Dialog>
}

export function SquadsPage() {
  const { data, updateData } = useAppData()
  const location = window.history.state?.usr as { projectId?: string } | undefined
  const query = new URLSearchParams(window.location.search)
  const requestedEditId = query.get('edit')
  const [formOpen, setFormOpen] = useState(Boolean(location?.projectId || requestedEditId))
  const [projectId, setProjectId] = useState(location?.projectId)
  const [editing, setEditing] = useState<Squad | undefined>(data.squads.find((item) => item.id === requestedEditId))
  const [detailId, setDetailId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Squad | undefined>()
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState('')
  const squads = data.squads.filter((squad) => projectName(data, squad.projectId).toLowerCase().includes(filter.toLowerCase()))
  const startCreate = (preselected?: string) => { setEditing(undefined); setProjectId(preselected); setFormOpen(true) }
  const saveSquad = (squad: Squad, assignments: SquadAssignment[]) => {
    updateData((current) => ({
      ...current,
      squads: editing
        ? current.squads.map((item) => item.id === editing.id ? { ...item, ...squad, updatedAt: timestampNow() } : item)
        : [...current.squads, squad],
      assignments: [...current.assignments.filter((item) => item.squadId !== squad.id), ...assignments],
    }))
    setFormOpen(false)
    setEditing(undefined)
    setNotice(editing ? 'Squad updated.' : 'Squad created.')
  }

  return <>
    <PageHeading title="Squads" description="Plan and staff project teams around availability." action={<Button variant="contained" startIcon={<Add />} onClick={() => startCreate()}>Create squad</Button>} />
    <Card className="table-card"><Box className="table-toolbar"><TextField size="small" placeholder="Search by project" value={filter} onChange={(event) => setFilter(event.target.value)} InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: '#94A3B8' }} /> }} /><Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>{squads.length} squads</Typography></Box>
      {squads.length ? <Box className="table-container"><Table><TableHead><TableRow><TableCell>Project</TableCell><TableCell>Owning team</TableCell><TableCell>Schedule</TableCell><TableCell>Members</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
        <TableBody>{squads.map((squad) => {
          const project = data.projects.find((item) => item.id === squad.projectId)
          const members = data.assignments.filter((assignment) => assignment.squadId === squad.id).map((assignment) => data.people.find((person) => person.id === assignment.personId)).filter((person): person is Person => Boolean(person))
          return <TableRow key={squad.id} hover><TableCell><Typography variant="body2" fontWeight={650}>{projectName(data, squad.projectId)}</Typography><Typography variant="caption" color="text.secondary">{project?.status}</Typography></TableCell><TableCell>{project ? teamName(data, project.teamId) : 'Unknown team'}</TableCell><TableCell>{formatDate(squad.startDate)} – {formatDate(squad.endDate)}</TableCell><TableCell><Stack direction="row" spacing={1} alignItems="center"><AvatarGroup people={members} /><Typography variant="caption">{members.length}</Typography></Stack></TableCell><TableCell align="right"><IconButton size="small" aria-label="View squad" onClick={() => setDetailId(squad.id)}><Visibility fontSize="small" /></IconButton><IconButton size="small" aria-label="Edit squad" onClick={() => { setEditing(squad); setFormOpen(true) }}><EditOutlined fontSize="small" /></IconButton><IconButton size="small" aria-label="Delete squad" onClick={() => setDeleteTarget(squad)}><DeleteOutlined fontSize="small" /></IconButton></TableCell></TableRow>
        })}</TableBody></Table></Box> : <EmptyState title="No squads found" description="Start by scheduling a squad for one of your projects." icon={<Groups />} />}
    </Card>
    <SquadFormDialog key={editing?.id ?? `${formOpen}-${projectId ?? 'new'}`} open={formOpen} squad={editing} preselectedProjectId={projectId} onClose={() => { setFormOpen(false); setEditing(undefined); setProjectId(undefined) }} onSave={saveSquad} />
    <SquadDetailsDialog open={Boolean(detailId)} squadId={detailId} onClose={() => setDetailId(null)} onEdit={(id) => { const squad = data.squads.find((item) => item.id === id); if (squad) { setEditing(squad); setDetailId(null); setFormOpen(true) } }} />
    <ConfirmationModal open={Boolean(deleteTarget)} title="Delete squad?" description="This removes the squad and its member reservations. The project will remain." onCancel={() => setDeleteTarget(undefined)} onConfirm={() => {
      if (deleteTarget) updateData((current) => ({ ...current, squads: current.squads.filter((squad) => squad.id !== deleteTarget.id), assignments: current.assignments.filter((item) => item.squadId !== deleteTarget.id) }))
      setDeleteTarget(undefined)
    }} />
    <Snackbar open={Boolean(notice)} message={notice} autoHideDuration={3500} onClose={() => setNotice('')} />
  </>
}

function SquadFormDialog({ open, squad, preselectedProjectId, onClose, onSave }: {
  open: boolean
  squad?: Squad
  preselectedProjectId?: string
  onClose: () => void
  onSave: (squad: Squad, assignments: SquadAssignment[]) => void
}) {
  const { data } = useAppData()
  const originalAssignments = data.assignments.filter((item) => item.squadId === squad?.id)
  const [step, setStep] = useState(0)
  const [projectId, setProjectId] = useState(squad?.projectId ?? preselectedProjectId ?? '')
  const [startDate, setStartDate] = useState(squad?.startDate ?? '')
  const [endDate, setEndDate] = useState(squad?.endDate ?? '')
  const [selected, setSelected] = useState<Record<string, string>>(() => Object.fromEntries(originalAssignments.map((item) => [item.personId, item.roleId])))
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [error, setError] = useState('')

  const range = { startDate, endDate }
  const currentProject = data.projects.find((item) => item.id === projectId)
  const people = data.people.filter((person) => person.active
    && person.name.toLowerCase().includes(search.toLowerCase())
    && (teamFilter === 'all' || person.teamId === teamFilter)
    && (roleFilter === 'all' || person.roleIds.includes(roleFilter)))

  const conflictsFor = (person: Person, roleId: string) => startDate && endDate
    ? getSchedulingConflicts(person.id, range, data, { roleId, excludeSquadId: squad?.id })
    : []

  const detailForConflict = (conflict: ReturnType<typeof getSchedulingConflicts>[number]) => {
    const role = data.roles.find((item) => item.id === conflict.roleId)?.name
    if (conflict.type === 'unavailability') return `Unavailability: ${conflict.reason ?? 'Unavailable'} · ${formatDate(conflict.startDate)}–${formatDate(conflict.endDate)}`
    return `Squad conflict: ${projectName(data, data.squads.find((item) => item.id === conflict.squadId)?.projectId ?? '')} (${role ?? 'Squad'}) · ${formatDate(conflict.startDate)}–${formatDate(conflict.endDate)}`
  }

  const togglePerson = (person: Person, roleId: string) => {
    setSelected((current) => {
      const next = { ...current }
      if (next[person.id]) delete next[person.id]
      else next[person.id] = roleId
      return next
    })
  }

  const canContinue = () => {
    if (step === 0 && !projectId) { setError('Choose a project to continue.'); return false }
    if (step === 1 && (!startDate || !endDate || endDate < startDate)) { setError('Choose valid dates. The end date must be on or after the start date.'); return false }
    if (step === 2 && Object.keys(selected).length === 0) { setError('Select at least one active squad member.'); return false }
    setError('')
    return true
  }

  const save = () => {
    if (!currentProject || !startDate || !endDate || endDate < startDate) { setError('Review the project and date range.'); return }
    if (currentProject.status === 'Unassigned') { setError('Change the project status from Unassigned before scheduling a squad.'); return }
    if (Object.keys(selected).length === 0) { setError('Select at least one squad member.'); return }
    const invalid = Object.entries(selected).flatMap(([personId, roleId]) => getSchedulingConflicts(personId, range, data, { roleId, excludeSquadId: squad?.id }).map((conflict) => ({ personId, conflict })))
    if (invalid.length) { setError(`${invalid.length} selected assignment conflict${invalid.length === 1 ? '' : 's'} must be resolved before saving.`); return }
    const id = squad?.id ?? uid()
    const now = timestampNow()
    const savedSquad: Squad = { id, projectId, startDate, endDate, createdAt: squad?.createdAt ?? now, updatedAt: now }
    onSave(savedSquad, Object.entries(selected).map(([personId, roleId]) => ({ id: `assignment-${id}-${personId}`, squadId: id, personId, roleId })))
  }

  const stepTitles = ['Select project', 'Choose dates', 'Select members', 'Review']
  return <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>{squad ? 'Edit squad' : 'Create squad'} <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Step {step + 1} of 4 · {stepTitles[step]}</Typography></DialogTitle>
    <DialogContent dividers sx={{ minHeight: 420 }}>
      {step === 0 && <Stack spacing={2} sx={{ pt: 1 }}><Typography variant="body2" color="text.secondary">Choose an existing project for this squad.</Typography>
        <Autocomplete options={data.projects} getOptionLabel={(project) => project.name} value={data.projects.find((project) => project.id === projectId) ?? null} onChange={(_, value) => setProjectId(value?.id ?? '')} renderInput={(params) => <TextField {...params} label="Search projects" required />} />
        {currentProject && <Card variant="outlined"><CardContent><Stack direction="row" justifyContent="space-between"><Box><Typography fontWeight={650}>{currentProject.name}</Typography><Typography variant="body2" color="text.secondary">{teamName(data, currentProject.teamId)}</Typography></Box><StatusChip status={currentProject.status} /></Stack><Typography variant="body2" sx={{ mt: 1 }}>{currentProject.description}</Typography></CardContent></Card>}
      </Stack>}
      {step === 1 && <Stack spacing={2} sx={{ pt: 1 }}><Typography variant="body2" color="text.secondary">Select a date range. Team members are reserved for full calendar days.</Typography><Stack direction="row" spacing={2}><TextField type="date" label="Start date" InputLabelProps={{ shrink: true }} value={startDate} onChange={(event) => setStartDate(event.target.value)} fullWidth /><TextField type="date" label="End date" InputLabelProps={{ shrink: true }} value={endDate} onChange={(event) => setEndDate(event.target.value)} inputProps={{ min: startDate }} fullWidth /></Stack>{endDate && startDate && endDate < startDate && <ConflictNotice>End date cannot be before start date.</ConflictNotice>}</Stack>}
      {step === 2 && <Stack spacing={1.5} sx={{ pt: 1 }}>
        <Stack direction="row" gap={1} flexWrap="wrap"><TextField size="small" placeholder="Search people" value={search} onChange={(event) => setSearch(event.target.value)} /><FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Team</InputLabel><Select label="Team" value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}><MenuItem value="all">All teams</MenuItem>{data.teams.map((team) => <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>)}</Select></FormControl><FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Role</InputLabel><Select label="Role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><MenuItem value="all">All roles</MenuItem>{data.roles.map((role) => <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}</Select></FormControl></Stack>
        <Typography variant="caption" color="text.secondary">Availability for {startDate && endDate ? `${formatDate(startDate)} – ${formatDate(endDate)}` : 'the selected dates'}</Typography>
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}><Table size="small"><TableHead><TableRow><TableCell>Person</TableCell><TableCell>Team & roles</TableCell><TableCell>Assignment role</TableCell><TableCell>Availability</TableCell></TableRow></TableHead><TableBody>
          {people.map((person) => {
            const availableRoles = data.roles.filter((role) => person.roleIds.includes(role.id))
            const selectedRoleId = selected[person.id] ?? availableRoles[0]?.id ?? ''
            const conflicts = selectedRoleId ? conflictsFor(person, selectedRoleId) : []
            const chosen = Boolean(selected[person.id])
            return <TableRow key={person.id} sx={{ opacity: conflicts.length && !chosen ? .62 : 1 }}>
              <TableCell><FormControlLabel control={<Checkbox checked={chosen} disabled={!chosen && conflicts.length > 0} onChange={() => togglePerson(person, selectedRoleId)} />} label={<Typography variant="body2" fontWeight={600}>{person.name}</Typography>} /></TableCell>
              <TableCell><Typography variant="caption" display="block">{teamName(data, person.teamId)}</Typography><Stack direction="row" gap={.5} flexWrap="wrap" sx={{ mt: .5 }}>{availableRoles.map((role) => <RoleLabel key={role.id} roleName={role.name} />)}</Stack></TableCell>
              <TableCell><FormControl size="small" sx={{ minWidth: 132 }}><Select value={selectedRoleId} onChange={(event) => setSelected((current) => current[person.id] ? { ...current, [person.id]: event.target.value } : current)}>{availableRoles.map((role) => <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}</Select></FormControl></TableCell>
              <TableCell>{conflicts.length ? <Tooltip title={<Box>{conflicts.map((item, index) => <Typography key={index} variant="caption" display="block">{detailForConflict(item)}</Typography>)}</Box>}><Chip size="small" color="error" label={chosen ? 'Conflict' : 'Unavailable'} /></Tooltip> : <Chip size="small" color="success" label="Available" />}</TableCell>
            </TableRow>
          })}
          {!people.length && <TableRow><TableCell colSpan={4}>No active people match these filters.</TableCell></TableRow>}
        </TableBody></Table></Box>
        <Typography variant="caption" color="text.secondary">{Object.keys(selected).length} members selected · Architects are reserved only on kickoff day.</Typography>
      </Stack>}
      {step === 3 && <Stack spacing={2} sx={{ pt: 1 }}><Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">PROJECT</Typography><Typography fontWeight={650}>{currentProject?.name}</Typography><Typography variant="caption">{teamName(data, currentProject?.teamId ?? '')}</Typography></CardContent></Card><Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">SCHEDULE</Typography><Typography fontWeight={650}>{startDate && formatDate(startDate)} – {endDate && formatDate(endDate)}</Typography></CardContent></Card>
        <Box><Typography variant="caption" color="text.secondary">MEMBERS AND AVAILABILITY</Typography>{Object.entries(selected).map(([personId, roleId]) => {
          const person = data.people.find((item) => item.id === personId)
          const role = data.roles.find((item) => item.id === roleId)
          const conflicts = getSchedulingConflicts(personId, range, data, { roleId, excludeSquadId: squad?.id })
          return <Box key={personId} sx={{ py: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}><Typography variant="body2">{person?.name} · {role?.name}</Typography><Typography variant="caption" color={conflicts.length ? 'error' : 'success.main'}>{conflicts.length ? conflicts.map(detailForConflict).join('; ') : 'Available'}</Typography></Box>
        })}</Box>
      </Stack>}
      {error && <Typography variant="body2" color="error" sx={{ mt: 2 }}>{error}</Typography>}
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button color="inherit" onClick={onClose}>Cancel</Button>
      {step > 0 && <Button onClick={() => { setError(''); setStep((current) => current - 1) }}>Back</Button>}
      {step < 3 ? <Button variant="contained" onClick={() => canContinue() && setStep((current) => current + 1)}>Continue</Button> : <Button variant="contained" onClick={save}>Save squad</Button>}
    </DialogActions>
  </Dialog>
}

export function TimelinePage() {
  const { data } = useAppData()
  const [view, setView] = useState<'week' | 'month'>('week')
  const [anchorDate, setAnchorDate] = useState(todayDate)
  const start = view === 'week' ? startOfWeek(anchorDate, { weekStartsOn: 1 }) : startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 1 })
  const end = view === 'week' ? addDays(start, 6) : endOfWeek(endOfMonth(startOfMonth(anchorDate)), { weekStartsOn: 1 })
  const dayCount = differenceInCalendarDays(end, start) + 1
  const days = Array.from({ length: dayCount }, (_, index) => addDays(start, index))
  const [detailId, setDetailId] = useState<string | null>(null)

  return <>
    <PageHeading title="Squad timeline" description="See how planned squads overlap across teams and dates." action={<Stack direction="row" spacing={1} alignItems="center">
      <Button onClick={() => setAnchorDate(todayDate())}>Today</Button><IconButton aria-label="Previous range" onClick={() => setAnchorDate((date) => view === 'week' ? addWeeks(date, -1) : addMonths(date, -1))}><ArrowBack /></IconButton><IconButton aria-label="Next range" onClick={() => setAnchorDate((date) => view === 'week' ? addWeeks(date, 1) : addMonths(date, 1))}><ArrowForward /></IconButton>
      <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, value: 'week' | 'month' | null) => value && setView(value)}><ToggleButton value="week">Week</ToggleButton><ToggleButton value="month">Month</ToggleButton></ToggleButtonGroup>
    </Stack>} />
    <Card sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={650} sx={{ mb: 1 }}>{format(start, 'MMMM d')} – {format(days[days.length - 1], 'MMMM d, yyyy')}</Typography>
      <Box className="timeline-wrap"><Box className="timeline-grid" sx={{ minWidth: view === 'month' ? 1120 : 840 }}>
        <Box className="timeline-header" sx={{ gridTemplateColumns: `220px repeat(${dayCount}, minmax(32px, 1fr))` }}>
          <Box sx={{ textAlign: 'left !important', pl: 1 }}>SQUAD / PROJECT</Box>
          {days.map((day) => <Box key={day.toISOString()} sx={{ bgcolor: isSameDay(day, todayDate()) ? '#EFF6FF' : undefined, color: isSameDay(day, todayDate()) ? '#2563EB !important' : undefined }}><Typography variant="caption" display="block">{format(day, 'EEE')}</Typography>{format(day, 'd')}</Box>)}
        </Box>
        {data.squads.map((squad) => {
          const project = data.projects.find((item) => item.id === squad.projectId)
          const startOffset = Math.max(0, differenceInCalendarDays(parseISO(squad.startDate), start))
          const endOffset = Math.min(dayCount - 1, differenceInCalendarDays(parseISO(squad.endDate), start))
          const isVisible = parseISO(squad.endDate) >= start && parseISO(squad.startDate) <= days[days.length - 1]
          const members = data.assignments.filter((item) => item.squadId === squad.id).map((item) => data.people.find((person) => person.id === item.personId)?.name).filter(Boolean)
          return <Box key={squad.id} className="timeline-row" sx={{ gridTemplateColumns: `220px repeat(${dayCount}, minmax(32px, 1fr))` }}>
            <Box className="timeline-project"><Typography variant="body2" fontWeight={650}>{project?.name ?? 'Unknown project'}</Typography><Typography variant="caption" color="text.secondary" noWrap>{teamName(data, project?.teamId ?? '')} · {members.map((name) => initials(name ?? '')).join(' ') || 'No members'}</Typography></Box>
            <Box className="timeline-cells" sx={{ gridColumn: '2 / -1', '--timeline-days': dayCount }}>
              {isVisible && <Tooltip title={<>{project?.name} · {formatDate(squad.startDate)} – {formatDate(squad.endDate)}<br />{members.join(', ') || 'No members assigned'}</>}><Box component="button" className="timeline-bar" onClick={() => setDetailId(squad.id)} sx={{ left: `${(startOffset / dayCount) * 100}%`, width: `${((endOffset - startOffset + 1) / dayCount) * 100}%` }}>{project?.name}</Box></Tooltip>}
            </Box>
          </Box>
        })}
        {!data.squads.length && <EmptyState title="No squads scheduled" description="Create a squad to see it on the timeline." icon={<CalendarMonth />} />}
      </Box></Box>
    </Card>
    <SquadDetailsDialog open={Boolean(detailId)} squadId={detailId} onClose={() => setDetailId(null)} />
  </>
}

const reasons: UnavailabilityReason[] = ['Leave / Holiday', 'Training / Workshop', 'Other work-related engagement', 'Personal commitment', 'Other']

export function AvailabilityPage() {
  const { data, updateData } = useAppData()
  const [personId, setPersonId] = useState(data.people.find((person) => person.active)?.id ?? '')
  const [month, setMonth] = useState(todayDate)
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [editing, setEditing] = useState<AppData['unavailabilities'][number] | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<AppData['unavailabilities'][number] | undefined>()
  const [notice, setNotice] = useState('')
  const person = data.people.find((item) => item.id === personId)
  const monthStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const calendarDays = Array.from({ length: 42 }, (_, index) => addDays(monthStart, index))
  const periods = data.unavailabilities.filter((item) => item.personId === personId).sort((a, b) => a.startDate.localeCompare(b.startDate))

  const openNew = () => {
    if (!personId) { setNotice('Add a person before recording availability.'); return }
    if (!rangeStart) { setNotice('Select a date or date range on the calendar first.'); return }
    setEditing(undefined)
    setRangeEnd(rangeEnd || rangeStart)
    setDialogOpen(true)
  }
  const savePeriod = (values: { startDate: string; endDate: string; reason: UnavailabilityReason }) => {
    if (values.endDate < values.startDate) { setNotice('End date must be on or after start date.'); return }
    const conflicts = getPersonReservations(personId, data, { excludeSquadId: undefined })
      .filter((conflict) => conflict.startDate <= values.endDate && conflict.endDate >= values.startDate)
    if (conflicts.length) {
      const details = conflicts.map((conflict) => {
        const conflictProject = data.squads.find((item) => item.id === conflict.squadId)
        const source = conflict.type === 'unavailability'
          ? `Unavailability: ${conflict.reason ?? 'Existing unavailability'}`
          : `Squad: ${projectName(data, conflictProject?.projectId ?? '')}`
        return `${source} · ${formatDate(conflict.startDate)}–${formatDate(conflict.endDate)}`
      })
      setNotice(`Resolve conflicting reservations first: ${details.join('; ')}`)
      return
    }
    const timestamp = timestampNow()
    if (editing) updateData((current) => ({ ...current, unavailabilities: current.unavailabilities.map((item) => item.id === editing.id ? { ...item, ...values, updatedAt: timestamp } : item) }))
    else updateData((current) => ({ ...current, unavailabilities: [...current.unavailabilities, { id: uid(), personId, ...values, createdAt: timestamp, updatedAt: timestamp }] }))
    setDialogOpen(false); setRangeStart(''); setRangeEnd(''); setEditing(undefined)
    setNotice('Unavailable dates saved.')
  }

  return <>
    <PageHeading title="Availability" description="Record and review planned time away for your people." action={<Button variant="contained" startIcon={<Add />} onClick={openNew}>Mark unavailable</Button>} />
    <Card sx={{ p: 2.5 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 240 }} size="small"><InputLabel>Person</InputLabel><Select label="Person" value={personId} onChange={(event) => { setPersonId(event.target.value); setRangeStart(''); setRangeEnd('') }}>{data.people.filter((item) => item.active).map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select></FormControl>
        <Stack direction="row" alignItems="center" spacing={1}><IconButton aria-label="Previous month" onClick={() => setMonth((value) => addMonths(value, -1))}><ArrowBack /></IconButton><Typography fontWeight={650} sx={{ minWidth: 130, textAlign: 'center' }}>{format(month, 'MMMM yyyy')}</Typography><IconButton aria-label="Next month" onClick={() => setMonth((value) => addMonths(value, 1))}><ArrowForward /></IconButton></Stack>
      </Stack>
      <Box className="availability-grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <Box key={day} sx={{ textAlign: 'center', p: 1, color: '#64748B', fontSize: 11, fontWeight: 700, borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>{day}</Box>)}
        {calendarDays.map((day) => {
          const iso = format(day, 'yyyy-MM-dd')
          const unavailability = periods.find((item) => item.startDate <= iso && item.endDate >= iso)
          const selected = iso === rangeStart || iso === rangeEnd || (rangeStart && rangeEnd && iso > rangeStart && iso < rangeEnd)
          return <Box key={iso} className={`availability-cell ${unavailability ? 'unavailable' : ''} ${isSameDay(day, todayDate()) ? 'today' : ''}`} onClick={() => {
            if (!rangeStart || (rangeStart && rangeEnd)) { setRangeStart(iso); setRangeEnd('') }
            else if (iso < rangeStart) { setRangeStart(iso); setRangeEnd('') }
            else setRangeEnd(iso)
          }} sx={{ opacity: day.getMonth() === month.getMonth() ? 1 : .45, outline: selected ? '2px solid #2563EB' : undefined, outlineOffset: '-2px' }}>
            <Typography variant="caption" fontWeight={isSameDay(day, todayDate()) ? 700 : 500}>{format(day, 'd')}</Typography>
            {unavailability && <Tooltip title={`${unavailability.reason} · ${formatDate(unavailability.startDate)} – ${formatDate(unavailability.endDate)}`}><Typography variant="caption" display="block" noWrap sx={{ mt: 1, fontSize: 10, fontWeight: 650 }}>Unavailable</Typography></Tooltip>}
          </Box>
        })}
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>Click a start date and then an end date to select a range. Select a single date for one day off.</Typography>
    </Card>
    <Box className="section-heading"><Box><Typography variant="h6">Unavailable periods</Typography><Typography variant="body2" color="text.secondary">{person?.name ?? 'Select a person'}</Typography></Box></Box>
    <Card sx={{ px: 2.5 }}>
      {periods.length ? periods.map((item) => <Box className="unavailability-item" key={item.id}><Box><Typography variant="body2" fontWeight={600}>{formatDate(item.startDate)} – {formatDate(item.endDate)}</Typography><Typography variant="caption" color="text.secondary">{item.reason}</Typography></Box><Stack direction="row"><IconButton aria-label="Edit unavailable period" size="small" onClick={() => { setEditing(item); setDialogOpen(true) }}><EditOutlined fontSize="small" /></IconButton><IconButton aria-label="Remove unavailable period" size="small" onClick={() => setRemoveTarget(item)}><DeleteOutlined fontSize="small" /></IconButton></Stack></Box>) : <EmptyState title="No unavailable dates" description="Select dates on the calendar and mark this person unavailable." icon={<EventBusy />} />}
    </Card>
    <UnavailabilityDialog key={editing?.id ?? `${rangeStart}:${rangeEnd}`} open={dialogOpen} initial={editing} startDate={editing?.startDate ?? rangeStart} endDate={editing?.endDate ?? rangeEnd} onClose={() => { setDialogOpen(false); setEditing(undefined) }} onSave={savePeriod} />
    <ConfirmationModal open={Boolean(removeTarget)} title="Remove unavailable period?" description="This will make these dates available for new squad assignments." onCancel={() => setRemoveTarget(undefined)} onConfirm={() => { if (removeTarget) updateData((current) => ({ ...current, unavailabilities: current.unavailabilities.filter((item) => item.id !== removeTarget.id) })); setRemoveTarget(undefined) }} />
    <Snackbar open={Boolean(notice)} message={notice} autoHideDuration={4500} onClose={() => setNotice('')} />
  </>
}

function UnavailabilityDialog({ open, initial, startDate, endDate, onClose, onSave }: {
  open: boolean
  initial?: AppData['unavailabilities'][number]
  startDate: string
  endDate: string
  onClose: () => void
  onSave: (values: { startDate: string; endDate: string; reason: UnavailabilityReason }) => void
}) {
  const [start, setStart] = useState(initial?.startDate ?? startDate)
  const [end, setEnd] = useState(initial?.endDate ?? (endDate || startDate))
  const [reason, setReason] = useState<UnavailabilityReason>(initial?.reason ?? reasons[0])
  const [error, setError] = useState('')
  return <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>{initial ? 'Edit unavailable period' : 'Mark unavailable'}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      <TextField type="date" label="Start date" InputLabelProps={{ shrink: true }} value={start} onChange={(event) => setStart(event.target.value)} />
      <TextField type="date" label="End date" InputLabelProps={{ shrink: true }} value={end} onChange={(event) => setEnd(event.target.value)} inputProps={{ min: start }} />
      <FormControl><InputLabel>Reason</InputLabel><Select label="Reason" value={reason} onChange={(event) => setReason(event.target.value as UnavailabilityReason)}>{reasons.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl>
      {error && <Typography color="error" variant="body2">{error}</Typography>}
    </Stack></DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5 }}><Button color="inherit" onClick={onClose}>Cancel</Button><Button variant="contained" onClick={() => {
      if (!start || !end || end < start) { setError('Choose a valid date range.'); return }
      onSave({ startDate: start, endDate: end, reason })
    }}>Save dates</Button></DialogActions>
  </Dialog>
}

export function PeoplePage() {
  const { data, updateData } = useAppData()
  const [view, setView] = useState<'team' | 'role'>('team')
  const [query, setQuery] = useState('')
  const [personDialog, setPersonDialog] = useState(false)
  const [personEditing, setPersonEditing] = useState<Person | undefined>()
  const [teamDialog, setTeamDialog] = useState(false)
  const [teamEditing, setTeamEditing] = useState<Team | undefined>()
  const [deleteTeam, setDeleteTeam] = useState<Team | undefined>()
  const [notice, setNotice] = useState('')
  const matches = data.people.filter((person) => person.name.toLowerCase().includes(query.toLowerCase()))
  const savePerson = (values: Pick<Person, 'name' | 'teamId' | 'roleIds' | 'active'>) => {
    const timestamp = timestampNow()
    if (personEditing) updateData((current) => ({ ...current, people: current.people.map((item) => item.id === personEditing.id ? { ...item, ...values, updatedAt: timestamp } : item) }))
    else updateData((current) => ({ ...current, people: [...current.people, { id: uid(), ...values, createdAt: timestamp, updatedAt: timestamp }] }))
    setPersonEditing(undefined)
  }
  const saveTeam = (values: Pick<Team, 'name' | 'description'>) => {
    if (teamEditing) updateData((current) => ({ ...current, teams: current.teams.map((item) => item.id === teamEditing.id ? { ...item, ...values } : item) }))
    else updateData((current) => ({ ...current, teams: [...current.teams, { id: uid(), ...values, createdAt: timestampNow() }] }))
    setTeamEditing(undefined)
  }
  const togglePersonActive = (person: Person) => updateData((current) => ({ ...current, people: current.people.map((item) => item.id === person.id ? { ...item, active: !item.active, updatedAt: timestampNow() } : item) }))
  const groups = view === 'team'
    ? data.teams.map((team) => ({ id: team.id, label: team.name, people: matches.filter((person) => person.teamId === team.id) }))
    : data.roles.map((role) => ({ id: role.id, label: role.name, people: matches.filter((person) => person.roleIds.includes(role.id)) }))

  return <>
    <PageHeading title="People & teams" description={`${data.people.length} people · ${data.teams.length} teams`} action={<Button variant="contained" startIcon={<Add />} onClick={() => { setPersonEditing(undefined); setPersonDialog(true) }}>Add person</Button>} />
    <Card className="table-card">
      <Box className="table-toolbar"><TextField size="small" placeholder="Search people" value={query} onChange={(event) => setQuery(event.target.value)} InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: '#94A3B8' }} /> }} /><ToggleButtonGroup size="small" exclusive value={view} onChange={(_, value: 'team' | 'role' | null) => value && setView(value)} sx={{ ml: 'auto' }}><ToggleButton value="team">View by team</ToggleButton><ToggleButton value="role">View by role</ToggleButton></ToggleButtonGroup></Box>
      <Box className="people-groups" sx={{ p: 2.5 }}>
        {groups.map((group) => group.people.length > 0 && <Box key={group.id}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}><Typography variant="subtitle2" fontWeight={700}>{group.label}</Typography><Chip label={group.people.length} size="small" sx={{ height: 21, bgcolor: '#F1F5F9' }} /></Stack>
          {group.people.map((person) => {
            const roles = data.roles.filter((role) => person.roleIds.includes(role.id))
            return <Box className="person-chip" key={`${group.id}-${person.id}`}>
              <Avatar sx={{ width: 34, height: 34, fontSize: 12, bgcolor: person.active ? '#E0E7FF' : '#F1F5F9', color: person.active ? '#3730A3' : '#94A3B8' }}>{initials(person.name)}</Avatar>
              <Box sx={{ flex: 1, minWidth: 120 }}><Typography variant="body2" fontWeight={650}>{person.name} {!person.active && <Chip size="small" label="Inactive" sx={{ height: 19, ml: .5, fontSize: 10 }} />}</Typography><Typography variant="caption" color="text.secondary">{teamName(data, person.teamId)}</Typography></Box>
              <Stack direction="row" gap={.5} flexWrap="wrap" sx={{ flex: 1 }}>{roles.map((role) => <RoleLabel key={role.id} roleName={role.name} />)}</Stack>
              <Tooltip title="Edit person"><IconButton size="small" aria-label={`Edit ${person.name}`} onClick={() => { setPersonEditing(person); setPersonDialog(true) }}><EditOutlined fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={person.active ? 'Deactivate person' : 'Reactivate person'}><IconButton size="small" aria-label={`${person.active ? 'Deactivate' : 'Reactivate'} ${person.name}`} onClick={() => togglePersonActive(person)}>{person.active ? <Close fontSize="small" /> : <CheckCircle fontSize="small" />}</IconButton></Tooltip>
            </Box>
          })}
        </Box>)}
        {!matches.length && <EmptyState title="No people found" description="Try a different search or add a new person." icon={<Groups />} />}
      </Box>
    </Card>
    <Box className="section-heading"><Box><Typography variant="h6">Manage teams</Typography><Typography variant="body2" color="text.secondary">Organize home teams and view team capacity.</Typography></Box><Button variant="outlined" startIcon={<Add />} onClick={() => { setTeamEditing(undefined); setTeamDialog(true) }}>Add team</Button></Box>
    <Box className="active-squad-grid">
      {data.teams.map((team) => {
        const members = data.people.filter((person) => person.teamId === team.id)
        const projectCount = data.projects.filter((project) => project.teamId === team.id).length
        const inUse = members.length > 0 || projectCount > 0
        return <Card key={team.id}><CardContent>
          <Stack direction="row" justifyContent="space-between"><Box><Typography fontWeight={650}>{team.name}</Typography><Typography variant="caption" color="text.secondary">{members.length} people · {projectCount} projects</Typography></Box><Stack direction="row"><IconButton aria-label={`Edit ${team.name}`} size="small" onClick={() => { setTeamEditing(team); setTeamDialog(true) }}><EditOutlined fontSize="small" /></IconButton><Tooltip title={inUse ? 'Move people and projects before deleting this team' : 'Delete team'}><span><IconButton disabled={inUse} size="small" aria-label={`Delete ${team.name}`} onClick={() => setDeleteTeam(team)}><DeleteOutlined fontSize="small" /></IconButton></span></Tooltip></Stack></Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{team.description || 'No description provided.'}</Typography>
        </CardContent></Card>
      })}
    </Box>
    <PersonFormDialog key={`${personDialog}-${personEditing?.id ?? 'new-person'}`} open={personDialog} person={personEditing} onClose={() => { setPersonDialog(false); setPersonEditing(undefined) }} onSave={savePerson} />
    <TeamFormDialog key={`${teamDialog}-${teamEditing?.id ?? 'new-team'}`} open={teamDialog} team={teamEditing} onClose={() => { setTeamDialog(false); setTeamEditing(undefined) }} onSave={saveTeam} />
    <ConfirmationModal open={Boolean(deleteTeam)} title="Delete team?" description={`Delete ${deleteTeam?.name}? This action cannot be undone.`} onCancel={() => setDeleteTeam(undefined)} onConfirm={() => { if (deleteTeam) updateData((current) => ({ ...current, teams: current.teams.filter((team) => team.id !== deleteTeam.id) })); setDeleteTeam(undefined) }} />
    <Snackbar open={Boolean(notice)} message={notice} autoHideDuration={4000} onClose={() => setNotice('')} />
  </>
}
