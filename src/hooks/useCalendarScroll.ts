import { useLayoutEffect, useMemo, useRef, useState, type UIEvent } from 'react'
import { addDays, addMonths, addWeeks, endOfWeek, format, getDay, startOfMonth, startOfWeek } from 'date-fns'
import { getWeekdays } from '../utils/calendar'

type CalendarView = 'week' | 'month'

function periodStart(date: Date, view: CalendarView) {
  if (view === 'week') return startOfWeek(date, { weekStartsOn: 1 })
  const start = startOfMonth(date)
  return addDays(start, getDay(start) === 6 ? 2 : getDay(start) === 0 ? 1 : 0)
}

function calendarWindow(date: Date) {
  return startOfWeek(addWeeks(date, -12), { weekStartsOn: 1 })
}

export function useCalendarScroll(initialView: CalendarView, monthDayWidth = 112) {
  const [state, setState] = useState(() => {
    const date = periodStart(new Date(), initialView)
    return { view: initialView, start: calendarWindow(date), anchorDate: date }
  })
  const viewportRef = useRef<HTMLDivElement>(null)
  const pendingScroll = useRef<{ date: Date } | { left: number } | null>({ date: state.anchorDate })
  const dayWidth = state.view === 'week' ? 112 : monthDayWidth
  const days = useMemo(() =>
    getWeekdays(state.start, endOfWeek(addWeeks(state.start, 24), { weekStartsOn: 1 })),
  [state.start])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const pending = pendingScroll.current
    if (!viewport || !pending) return
    const dateIndex = 'date' in pending
      ? days.findIndex((day) => format(day, 'yyyy-MM-dd') >= format(pending.date, 'yyyy-MM-dd'))
      : 0
    viewport.scrollLeft = 'left' in pending ? pending.left : Math.max(0, dateIndex) * dayWidth
    pendingScroll.current = null
  }, [days, dayWidth])

  const goToDate = (date: Date, view = state.view) => {
    const target = periodStart(date, view)
    pendingScroll.current = { date: target }
    setState({ view, start: calendarWindow(target), anchorDate: target })
  }

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    if (pendingScroll.current) return
    const viewport = event.currentTarget
    const index = Math.min(days.length - 1, Math.max(0, Math.floor(viewport.scrollLeft / dayWidth)))
    const anchorDate = days[index]
    const nearStart = viewport.scrollLeft < dayWidth * 10
    const nearEnd = viewport.scrollWidth - viewport.clientWidth - viewport.scrollLeft < dayWidth * 10
    if (nearStart || nearEnd) {
      const direction = nearStart ? -1 : 1
      // Keep the same visible date and vertical position when recycling off-screen weeks.
      pendingScroll.current = { left: viewport.scrollLeft - direction * 40 * dayWidth }
      setState((current) => ({ ...current, start: addWeeks(current.start, direction * 8), anchorDate }))
    } else {
      setState((current) => format(current.anchorDate, 'yyyy-MM-dd') === format(anchorDate, 'yyyy-MM-dd')
        ? current : { ...current, anchorDate })
    }
  }

  return {
    days,
    dayWidth,
    anchorDate: state.anchorDate,
    view: state.view,
    viewportRef,
    onScroll,
    goToDate,
    setView: (view: CalendarView) => goToDate(state.anchorDate, view),
    navigate: (direction: number) => goToDate(state.view === 'week'
      ? addWeeks(state.anchorDate, direction)
      : addMonths(state.anchorDate, direction)),
  }
}
