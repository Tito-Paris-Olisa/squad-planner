import { lazy, Suspense, useMemo, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  AppBar, Avatar, Box, Button, CssBaseline, Divider, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Tooltip, Typography,
} from '@mui/material'
import AccessTime from '@mui/icons-material/AccessTime'
import Dashboard from '@mui/icons-material/Dashboard'
import Groups from '@mui/icons-material/Groups'
import EventAvailable from '@mui/icons-material/EventAvailable'
import FolderOpen from '@mui/icons-material/FolderOpen'
import MenuBook from '@mui/icons-material/MenuBook'
import RestartAlt from '@mui/icons-material/RestartAlt'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { AppDataProvider } from './context/AppDataContext'
import { useAppData } from './context/AppData'
import { ConfirmationModal } from './components/Shared'
import './index.css'

const DashboardPage = lazy(() => import('./pages/AppPages').then((pages) => ({ default: pages.DashboardPage })))
const ProjectsPage = lazy(() => import('./pages/AppPages').then((pages) => ({ default: pages.ProjectsPage })))
const SquadsPage = lazy(() => import('./pages/AppPages').then((pages) => ({ default: pages.SquadsPage })))
const TimelinePage = lazy(() => import('./pages/AppPages').then((pages) => ({ default: pages.TimelinePage })))
const AvailabilityPage = lazy(() => import('./pages/AppPages').then((pages) => ({ default: pages.AvailabilityPage })))
const PeoplePage = lazy(() => import('./pages/AppPages').then((pages) => ({ default: pages.PeoplePage })))

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB', dark: '#1D4ED8' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#64748B' },
    success: { main: '#16A34A' },
    warning: { main: '#D97706' },
    error: { main: '#DC2626' },
    divider: '#E2E8F0',
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.035em' },
    h5: { fontWeight: 700, letterSpacing: '-0.025em' },
    h6: { fontWeight: 650 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCard: { styleOverrides: { root: { border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, .04)' } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 8, minHeight: 40 } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 8 } } },
  },
})

const navigation = [
  { label: 'Dashboard', path: '/', icon: <Dashboard /> },
  { label: 'Projects', path: '/projects', icon: <FolderOpen /> },
  { label: 'Squads', path: '/squads', icon: <Groups /> },
  { label: 'Squad Timeline', path: '/timeline', icon: <AccessTime /> },
  { label: 'Availability', path: '/availability', icon: <EventAvailable /> },
  { label: 'People & Teams', path: '/people', icon: <MenuBook /> },
]
const currentDateLabel = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())

function Shell() {
  const location = useLocation()
  const { resetDemoData } = useAppData()
  const [resetOpen, setResetOpen] = useState(false)
  const currentPage = useMemo(
    () => navigation.find((item) => item.path === location.pathname)?.label ?? 'Dashboard',
    [location.pathname],
  )

  return (
    <Box className="app-shell">
      <Box component="aside" className="sidebar">
        <Box className="brand">
          <Box className="brand-mark"><Groups fontSize="small" /></Box>
          <Box>
            <Typography fontWeight={750} fontSize={16} lineHeight={1.2}>Squad Planner</Typography>
            <Typography variant="caption" color="text.secondary">Workforce planning</Typography>
          </Box>
        </Box>
        <Typography className="nav-caption">WORKSPACE</Typography>
        <List disablePadding className="navigation-list">
          {navigation.map((item) => (
            <Tooltip key={item.path} title={item.label} placement="right">
              <ListItemButton
                component={NavLink}
                to={item.path}
                end={item.path === '/'}
                aria-label={item.label}
                className="nav-item"
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </Tooltip>
          ))}
        </List>
        <Box className="sidebar-bottom">
          <Divider />
          {import.meta.env.DEV && <Button
            startIcon={<RestartAlt />}
            onClick={() => setResetOpen(true)}
            color="inherit"
            className="reset-button"
            fullWidth
          >
            Reset demo data
          </Button>}
          <Box className="profile">
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#DBEAFE', color: '#1D4ED8', fontSize: 13, fontWeight: 700 }}>SP</Avatar>
            <Box>
              <Typography variant="body2" fontWeight={650}>Shared workspace</Typography>
              <Typography variant="caption" color="text.secondary">Planning team</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box className="main-column">
        <AppBar position="sticky" elevation={0} className="topbar">
          <Toolbar className="topbar-content">
            <Typography variant="h6" component="h1">{currentPage}</Typography>
            <Box className="topbar-right">
              <Typography variant="body2" color="text.secondary" className="today-label">{currentDateLabel}</Typography>
              <Tooltip title="Demo workspace">
                <IconButton size="small" aria-label="Demo workspace"><Avatar sx={{ width: 32, height: 32, bgcolor: '#EFF6FF', color: '#2563EB', fontSize: 12, fontWeight: 700 }}>T</Avatar></IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>
        <Box component="main" className="page-content">
          <Suspense fallback={<Typography color="text.secondary">Loading workspace…</Typography>}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/squads" element={<SquadsPage />} />
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/availability" element={<AvailabilityPage />} />
              <Route path="/people" element={<PeoplePage />} />
              <Route path="*" element={<DashboardPage />} />
            </Routes>
          </Suspense>
        </Box>
      </Box>
      <ConfirmationModal
        open={resetOpen}
        title="Reset demo data?"
        description="This replaces your current workspace data with the original fictional demo data."
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          resetDemoData()
          setResetOpen(false)
        }}
        confirmLabel="Reset data"
      />
    </Box>
  )
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppDataProvider>
        <BrowserRouter><Shell /></BrowserRouter>
      </AppDataProvider>
    </ThemeProvider>
  )
}
