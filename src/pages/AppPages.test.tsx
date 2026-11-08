import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { format } from 'date-fns'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppDataProvider } from '../context/AppDataContext'
import { STORAGE_KEY } from '../data/storage'
import { AvailabilityPage, DashboardPage, SquadsPage, TimelinePage } from './AppPages'
import type { AppData } from '../types'

const savedData = (): AppData => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')

function renderPage(page: React.ReactNode) {
  return render(<AppDataProvider><MemoryRouter>{page}</MemoryRouter></AppDataProvider>)
}

describe('updated planning workflows', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 9))
    localStorage.clear()
    window.history.replaceState(null, '', '/')
  })
  afterEach(() => { cleanup(); vi.useRealTimers() })

  it('removes the dashboard create action', () => {
    renderPage(<DashboardPage />)
    expect(screen.queryByRole('link', { name: 'Create squad' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create squad' })).not.toBeInTheDocument()
  })

  it('creates a squad with project and dates on one step, automatically setting To Do', async () => {
    const user = userEvent.setup()
    renderPage(<SquadsPage />)
    await user.click(screen.getByRole('button', { name: 'Create squad' }))
    expect(screen.getByLabelText(/Start date/)).toBeInTheDocument()
    expect(screen.getByLabelText(/End date/)).toBeInTheDocument()
    await user.type(screen.getByRole('combobox', { name: 'Search projects' }), 'Revenue')
    await user.click(await screen.findByRole('option', { name: 'Revenue Forecasting' }))
    fireEvent.change(screen.getByLabelText(/Start date/), { target: { value: '2099-11-10' } })
    fireEvent.change(screen.getByLabelText(/End date/), { target: { value: '2099-11-12' } })
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('heading', { name: /Step 2 of 3.*Select members/ })).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Amara Okafor' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText(/Remember to manually mark the project Completed/)).toBeInTheDocument()
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create squad' }))
    const data = savedData()
    const project = data.projects.find((item) => item.name === 'Revenue Forecasting')
    expect(project?.status).toBe('To Do')
    const squad = data.squads.find((item) => item.projectId === project?.id)
    expect(squad?.startDate).toBe('2099-11-10')
    expect(data.assignments.some((item) => item.squadId === squad?.id && item.personId === 'person-1')).toBe(true)
  })

  it('validates dates before moving directly to members', async () => {
    const user = userEvent.setup()
    renderPage(<SquadsPage />)
    await user.click(screen.getByRole('button', { name: 'Create squad' }))
    await user.type(screen.getByRole('combobox', { name: 'Search projects' }), 'Revenue')
    await user.click(await screen.findByRole('option', { name: 'Revenue Forecasting' }))
    fireEvent.change(screen.getByLabelText(/Start date/), { target: { value: '2099-11-12' } })
    fireEvent.change(screen.getByLabelText(/End date/), { target: { value: '2099-11-10' } })
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Choose valid dates. The end date must be on or after the start date.')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Amara Okafor' })).not.toBeInTheDocument()
  })

  it.each([
    ['Revenue Forecasting', 'In Progress'],
    ['Identity Refresh', 'Completed'],
  ])('creating a squad starting today for %s leaves the project %s', async (projectName, status) => {
    const user = userEvent.setup()
    renderPage(<SquadsPage />)
    await user.click(screen.getByRole('button', { name: 'Create squad' }))
    await user.type(screen.getByRole('combobox', { name: 'Search projects' }), projectName)
    await user.click(await screen.findByRole('option', { name: projectName }))
    const today = format(new Date(), 'yyyy-MM-dd')
    fireEvent.change(screen.getByLabelText(/Start date/), { target: { value: today } })
    fireEvent.change(screen.getByLabelText(/End date/), { target: { value: today } })
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('checkbox', { name: 'Noah Thompson' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create squad' }))
    expect(savedData().projects.find((project) => project.name === projectName)?.status).toBe(status)
  })

  it('shows everyone and creates, edits, and removes time away directly from the calendar', async () => {
    const user = userEvent.setup()
    renderPage(<AvailabilityPage />)
    const table = screen.getByRole('table', { name: 'Everyone’s availability' })
    expect(within(table).getAllByRole('row')).toHaveLength(17)
    expect(screen.queryByText('Unavailable periods')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mark unavailable' }))
    await user.type(screen.getByRole('combobox', { name: 'Person' }), 'Noah')
    await user.click(await screen.findByRole('option', { name: 'Noah Thompson' }))
    const today = format(new Date(), 'yyyy-MM-dd')
    fireEvent.change(screen.getByLabelText(/Start date/), { target: { value: today } })
    fireEvent.change(screen.getByLabelText(/End date/), { target: { value: today } })
    await user.click(screen.getByRole('button', { name: 'Save dates' }))
    expect(savedData().unavailabilities.some((item) => item.personId === 'person-8' && item.startDate === today)).toBe(true)
    await user.click(screen.getByRole('button', { name: `Edit unavailability for Noah Thompson on ${today}` }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('combobox', { name: 'Person' })).toHaveValue('Noah Thompson')
    await user.click(within(dialog).getByRole('combobox', { name: /Reason/ }))
    await user.click(await screen.findByRole('option', { name: 'Personal commitment' }))
    await user.click(screen.getByRole('button', { name: 'Save dates' }))
    expect(savedData().unavailabilities.find((item) => item.personId === 'person-8' && item.startDate === today)?.reason).toBe('Personal commitment')
    await user.click(screen.getByRole('button', { name: `Edit unavailability for Noah Thompson on ${today}` }))
    await user.click(screen.getByRole('button', { name: 'Remove period' }))
    await user.click(within(screen.getByRole('dialog', { name: 'Remove unavailable period?' })).getByRole('button', { name: 'Delete' }))
    expect(savedData().unavailabilities.some((item) => item.personId === 'person-8' && item.startDate === today)).toBe(false)
  }, 15000)

  it('blocks unavailable dates that overlap squad assignments and shows the conflict', async () => {
    const user = userEvent.setup()
    renderPage(<AvailabilityPage />)
    const originalCount = savedData().unavailabilities.length
    await user.click(screen.getByRole('button', { name: 'Mark unavailable' }))
    await user.type(screen.getByRole('combobox', { name: 'Person' }), 'Amara')
    await user.click(await screen.findByRole('option', { name: 'Amara Okafor' }))
    const today = format(new Date(), 'yyyy-MM-dd')
    fireEvent.change(screen.getByLabelText(/Start date/), { target: { value: today } })
    fireEvent.change(screen.getByLabelText(/End date/), { target: { value: today } })
    expect(within(screen.getByRole('alert')).getByText(/Atlas Customer Portal/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save dates' }))
    expect(screen.getByText('Resolve the squad conflicts before saving unavailable dates.')).toBeInTheDocument()
    expect(savedData().unavailabilities).toHaveLength(originalCount)
  })

  it('makes the timeline and availability scroll regions keyboard accessible', () => {
    const view = renderPage(<TimelinePage />)
    expect(screen.getByRole('region', { name: 'Squad timeline calendar' })).toHaveAttribute('tabindex', '0')
    view.unmount()
    renderPage(<AvailabilityPage />)
    expect(screen.getByRole('region', { name: 'Team availability calendar' })).toHaveAttribute('tabindex', '0')
  })

  it('shows weekdays with ISO week groups in both calendars', async () => {
    const user = userEvent.setup()
    const view = renderPage(<TimelinePage />)
    const timeline = screen.getByRole('region', { name: 'Squad timeline calendar' })
    expect(within(timeline).getByText('W46')).toBeInTheDocument()
    expect(within(timeline).queryByText('Sat')).not.toBeInTheDocument()
    expect(within(timeline).queryByText('Sun')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Month' }))
    expect(within(timeline).getByText('W45')).toBeInTheDocument()
    expect(within(timeline).getByText('W49')).toBeInTheDocument()
    view.unmount()
    renderPage(<AvailabilityPage />)
    const table = screen.getByRole('table', { name: 'Everyone’s availability' })
    expect(within(table).getByRole('columnheader', { name: 'W46' })).toHaveAttribute('colspan', '5')
    expect(within(table).getByRole('columnheader', { name: 'W49' })).toHaveAttribute('colspan', '5')
    expect(within(table).queryByText('Sat')).not.toBeInTheDocument()
    expect(within(table).queryByText('Sun')).not.toBeInTheDocument()
  })
})
