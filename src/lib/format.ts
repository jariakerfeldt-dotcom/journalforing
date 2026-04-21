const currencyFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('sv-SE', {
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('sv-SE', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const shortDateFormatter = new Intl.DateTimeFormat('sv-SE', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const monthFormatter = new Intl.DateTimeFormat('sv-SE', { month: 'short' })

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value))
}

export function formatShortDate(value: string | Date): string {
  return shortDateFormatter.format(new Date(value))
}

export function formatMonth(value: string | Date): string {
  return monthFormatter.format(new Date(value))
}

export function daysFromNow(iso: string): number {
  const now = new Date()
  const target = new Date(iso)
  const ms = target.getTime() - now.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysISO(days: number, base = new Date()): string {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
