export type TreatmentType = 'skoning' | 'verkning' | 'hovvard' | 'kontroll' | 'annat'

export const TREATMENT_TYPES: Record<TreatmentType, string> = {
  skoning: 'Skoning',
  verkning: 'Verkning',
  hovvard: 'Hovvård',
  kontroll: 'Kontroll',
  annat: 'Annat',
}

export const DEFAULT_PRICES: Record<TreatmentType, number> = {
  skoning: 1800,
  verkning: 800,
  hovvard: 600,
  kontroll: 450,
  annat: 500,
}

export type InvoiceStatus = 'utkast' | 'skickad' | 'betald' | 'forfallen'

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  utkast: 'Utkast',
  skickad: 'Skickad',
  betald: 'Betald',
  forfallen: 'Förfallen',
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  orgNumber?: string
  notes?: string
  createdAt: string
}

export interface Horse {
  id: string
  customerId: string
  name: string
  breed?: string
  color?: string
  birthYear?: number
  discipline?: string
  notes?: string
  createdAt: string
}

export interface TreatmentPhoto {
  key: string
  uploadedAt: string
}

export interface Treatment {
  id: string
  horseId: string
  customerId: string
  type: TreatmentType
  date: string
  notes?: string
  price: number
  photos: TreatmentPhoto[]
  invoiceId?: string
  followUpDate?: string
  createdAt: string
}

export interface InvoiceLine {
  treatmentId?: string
  description: string
  amount: number
}

export interface Invoice {
  id: string
  number: string
  customerId: string
  issuedDate: string
  dueDate: string
  paidDate?: string
  status: InvoiceStatus
  lines: InvoiceLine[]
  subtotal: number
  vat: number
  total: number
  notes?: string
  createdAt: string
}

export interface DashboardStats {
  activeCustomers: number
  totalHorses: number
  treatmentsThisMonth: number
  unpaidTotal: number
  unpaidCount: number
  revenueThisMonth: number
  monthlyRevenue: Array<{ month: string; amount: number }>
}
