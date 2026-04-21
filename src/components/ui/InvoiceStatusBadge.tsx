import type { InvoiceStatus } from '@/lib/types'
import { INVOICE_STATUS_LABELS } from '@/lib/types'
import { Badge } from './Badge'

const toneFor: Record<InvoiceStatus, 'emerald' | 'amber' | 'red' | 'neutral'> = {
  betald: 'emerald',
  skickad: 'amber',
  forfallen: 'red',
  utkast: 'neutral',
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge tone={toneFor[status]}>{INVOICE_STATUS_LABELS[status]}</Badge>
}
