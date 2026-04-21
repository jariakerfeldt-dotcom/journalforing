import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'amber' | 'emerald' | 'blue' | 'red' | 'stone'

const tones: Record<Tone, string> = {
  neutral: 'bg-stone-100 text-stone-700 ring-stone-200',
  amber: 'bg-amber-100 text-amber-900 ring-amber-200',
  emerald: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  blue: 'bg-blue-100 text-blue-900 ring-blue-200',
  red: 'bg-red-100 text-red-900 ring-red-200',
  stone: 'bg-stone-900 text-white ring-stone-900',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
