import { format } from 'date-fns'
import { describe, expect, it } from 'vitest'
import { getVisibleDateSpan, getWeekdays, groupCalendarWeeks } from './calendar'

describe('weekday calendar display', () => {
  it('shows Monday to Friday and removes both weekend days', () => {
    const days = getWeekdays(new Date(2026, 9, 5), new Date(2026, 9, 11))
    expect(days.map((day) => format(day, 'EEE'))).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
    expect(groupCalendarWeeks(days).map((week) => [week.label, week.days.length])).toEqual([['W41', 5]])
  })

  it('handles partial weeks at month edges', () => {
    const days = getWeekdays(new Date(2026, 9, 1), new Date(2026, 9, 31))
    expect(groupCalendarWeeks(days).map((week) => [week.label, week.startIndex, week.days.length])).toEqual([
      ['W40', 0, 2], ['W41', 2, 5], ['W42', 7, 5], ['W43', 12, 5], ['W44', 17, 5],
    ])
  })

  it('uses ISO week years at the December/January boundary', () => {
    const weeks = groupCalendarWeeks(getWeekdays(new Date(2020, 11, 28), new Date(2021, 0, 8)))
    expect(weeks.map((week) => [week.label, week.year])).toEqual([['W53', 2020], ['W1', 2021]])
  })

  it('compresses squad bars across weekends without shifting their weekday positions', () => {
    const days = getWeekdays(new Date(2026, 9, 5), new Date(2026, 9, 16))
    expect(getVisibleDateSpan(days, '2026-10-09', '2026-10-12')).toEqual({ startIndex: 4, count: 2 })
    expect(getVisibleDateSpan(days, '2026-10-10', '2026-10-11')).toBeUndefined()
    expect(getVisibleDateSpan(days, '2026-10-10', '2026-10-14')).toEqual({ startIndex: 5, count: 3 })
    expect(getVisibleDateSpan(days, '2026-10-01', '2026-10-20')).toEqual({ startIndex: 0, count: 10 })
  })
})
