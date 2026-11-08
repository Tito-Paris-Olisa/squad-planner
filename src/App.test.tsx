import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('GitHub Pages routing', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState(null, '', '/squad-planner/#/projects')
  })
  afterEach(() => {
    cleanup()
    window.history.replaceState(null, '', '/')
  })

  it('opens a nested hash route and keeps navigation under the deployment path', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Projects', level: 5 })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Availability' }))
    expect(await screen.findByRole('heading', { name: 'Availability', level: 5 })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/squad-planner/')
    expect(window.location.hash).toBe('#/availability')

    cleanup()
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Availability', level: 5 })).toBeInTheDocument()
  })
})
