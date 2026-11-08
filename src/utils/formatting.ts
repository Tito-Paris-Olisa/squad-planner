import { format, parseISO } from 'date-fns'

export const formatDate = (date: string) => format(parseISO(date), 'MMM d, yyyy')

export function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
}
