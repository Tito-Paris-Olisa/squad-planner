import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { format, getISOWeek } from 'date-fns'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCalendarScroll } from './useCalendarScroll'

function Calendar({ view = 'month' }: { view?: 'week' | 'month' }) {
  const { viewportRef, onScroll, days, dayWidth, anchorDate, navigate, goToDate, setView } = useCalendarScroll(view)
  return <>
    <div ref={viewportRef} onScroll={onScroll} role="region" aria-label="Calendar"
      data-first={format(days[0], 'yyyy-MM-dd')}
      data-count={days.length} data-width={dayWidth}>
      <span>{format(anchorDate, 'MMMM yyyy')} W{getISOWeek(anchorDate)}</span>
    </div>
    <button onClick={() => navigate(1)}>Next</button>
    <button onClick={() => goToDate(new Date())}>Today</button>
    <button onClick={() => setView('week')}>Week</button>
  </>
}

function viewport() {
  const element = screen.getByRole('region', { name: 'Calendar' })
  Object.defineProperties(element, {
    clientWidth: { configurable: true, value: 900 },
    scrollWidth: { configurable: true, get: () => 220 + Number(element.dataset.count) * Number(element.dataset.width) },
  })
  return element
}

describe('continuous calendar scrolling', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 9))
  })
  afterEach(() => { cleanup(); vi.useRealTimers() })

  it('starts on the current month and changes its label when scrolling into the next month', () => {
    render(<Calendar />)
    const element = viewport()
    expect(element).toHaveTextContent('November 2026')
    const position = element.scrollLeft
    element.scrollLeft = position + 21 * 112
    fireEvent.scroll(element)
    expect(element).toHaveTextContent('December 2026')
  })

  it('updates the week when scrolling one Monday–Friday group forward', () => {
    render(<Calendar view="week" />)
    const element = viewport()
    expect(element).toHaveTextContent('W46')
    element.scrollLeft += 5 * 112
    fireEvent.scroll(element)
    expect(element).toHaveTextContent('W47')
  })

  it('recycles dates to the left without moving the visible date or vertical position', () => {
    render(<Calendar />)
    const element = viewport()
    const count = element.dataset.count
    element.scrollTop = 200
    const initialFirst = element.dataset.first
    element.scrollLeft = 2 * 112
    fireEvent.scroll(element)
    expect(element.dataset.first).not.toBe(initialFirst)
    expect(element.scrollLeft).toBe(42 * 112)
    expect(element.scrollTop).toBe(200)
    expect(element.dataset.count).toBe(count)
    const label = element.textContent
    fireEvent.scroll(element)
    expect(element.textContent).toBe(label)
  })

  it('keeps extending to the right with bounded date columns', () => {
    render(<Calendar />)
    const element = viewport()
    const count = element.dataset.count
    for (let step = 0; step < 8; step++) {
      const initialFirst = element.dataset.first
      element.scrollLeft = 110 * 112
      fireEvent.scroll(element)
      expect(element.dataset.first).not.toBe(initialFirst)
      expect(element.scrollLeft).toBe(70 * 112)
      expect(element.dataset.count).toBe(count)
    }
    expect(element.textContent).toContain('2028')
  })

  it('keeps navigation and Today jumps working after scrolling and switching views', () => {
    render(<Calendar />)
    const element = viewport()
    fireEvent.click(screen.getByText('Next'))
    expect(element).toHaveTextContent('December 2026')
    fireEvent.click(screen.getByText('Today'))
    expect(element).toHaveTextContent('November 2026')
    fireEvent.click(screen.getByText('Week'))
    expect(element).toHaveTextContent('W45')
    fireEvent.click(screen.getByText('Today'))
    expect(element).toHaveTextContent('W46')
  })
})
