import { eachDayOfInterval, format, getISOWeek, getISOWeekYear, isWeekend } from 'date-fns'

export function getWeekdays(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end }).filter((day) => !isWeekend(day))
}

export function groupCalendarWeeks(days: Date[]) {
  const groups: { key: string; label: string; year: number; startIndex: number; days: Date[] }[] = []
  days.forEach((day, index) => {
    const year = getISOWeekYear(day)
    const week = getISOWeek(day)
    const key = `${year}-${week}`
    const last = groups[groups.length - 1]
    if (last?.key === key) last.days.push(day)
    else groups.push({ key, label: `W${week}`, year, startIndex: index, days: [day] })
  })
  return groups
}

export function getVisibleDateSpan(days: Date[], startDate: string, endDate: string) {
  const startIndex = days.findIndex((day) => {
    const date = format(day, 'yyyy-MM-dd')
    return date >= startDate && date <= endDate
  })
  if (startIndex === -1) return undefined
  let endIndex = startIndex
  while (endIndex + 1 < days.length && format(days[endIndex + 1], 'yyyy-MM-dd') <= endDate) endIndex++
  return { startIndex, count: endIndex - startIndex + 1 }
}
