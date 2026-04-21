import { createServerFn } from '@tanstack/react-start'
import {
  deleteCustomer as dbDeleteCustomer,
  deleteHorse as dbDeleteHorse,
  deleteInvoice as dbDeleteInvoice,
  deleteTreatment as dbDeleteTreatment,
  getCustomer as dbGetCustomer,
  getHorse as dbGetHorse,
  getInvoice as dbGetInvoice,
  getTreatment as dbGetTreatment,
  listCustomers as dbListCustomers,
  listHorses as dbListHorses,
  listInvoices as dbListInvoices,
  listTreatments as dbListTreatments,
  saveCustomer as dbSaveCustomer,
  saveHorse as dbSaveHorse,
  saveInvoice as dbSaveInvoice,
  savePhoto,
  saveTreatment as dbSaveTreatment,
} from './storage'
import type {
  Customer,
  DashboardStats,
  Horse,
  Invoice,
  InvoiceLine,
  InvoiceStatus,
  Treatment,
  TreatmentType,
} from '@/lib/types'

const VAT_RATE = 0.25

function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now().toString(36)}-${rand}`
}

function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

// ============= Dashboard =============

export const getDashboard = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DashboardStats> => {
    const [customers, horses, treatments, invoices] = await Promise.all([
      dbListCustomers(),
      dbListHorses(),
      dbListTreatments(),
      dbListInvoices(),
    ])

    const now = new Date()
    const thisMonthKey = now.toISOString().slice(0, 7)
    const treatmentsThisMonth = treatments.filter((t) =>
      t.date.startsWith(thisMonthKey),
    ).length

    const unpaid = invoices.filter((i) => i.status !== 'betald' && i.status !== 'utkast')
    const unpaidTotal = unpaid.reduce((sum, i) => sum + i.total, 0)

    const revenueThisMonth = invoices
      .filter((i) => i.status === 'betald' && i.paidDate?.startsWith(thisMonthKey))
      .reduce((sum, i) => sum + i.total, 0)

    const monthly = new Map<string, number>()
    for (let offset = 5; offset >= 0; offset--) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthly.set(key, 0)
    }
    for (const inv of invoices) {
      if (inv.status !== 'betald' || !inv.paidDate) continue
      const key = monthKey(inv.paidDate)
      if (monthly.has(key)) {
        monthly.set(key, (monthly.get(key) ?? 0) + inv.total)
      }
    }
    const monthlyRevenue = Array.from(monthly.entries()).map(([month, amount]) => ({
      month,
      amount,
    }))

    return {
      activeCustomers: customers.length,
      totalHorses: horses.length,
      treatmentsThisMonth,
      unpaidTotal,
      unpaidCount: unpaid.length,
      revenueThisMonth,
      monthlyRevenue,
    }
  },
)

// ============= Customers =============

export const getCustomers = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Customer[]> => dbListCustomers(),
)

export const getCustomerDetail = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const [customer, horses, treatments, invoices] = await Promise.all([
      dbGetCustomer(data.id),
      dbListHorses(),
      dbListTreatments(),
      dbListInvoices(),
    ])
    if (!customer) throw new Error("Hittades inte")
    return {
      customer,
      horses: horses.filter((h) => h.customerId === data.id),
      treatments: treatments.filter((t) => t.customerId === data.id),
      invoices: invoices.filter((i) => i.customerId === data.id),
    }
  })

interface CustomerInput {
  name: string
  email?: string
  phone?: string
  address?: string
  orgNumber?: string
  notes?: string
}

export const createCustomer = createServerFn({ method: 'POST' })
  .inputValidator((data: CustomerInput) => data)
  .handler(async ({ data }): Promise<Customer> => {
    const customer: Customer = {
      id: uid('cust'),
      name: data.name.trim(),
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      address: data.address?.trim() || undefined,
      orgNumber: data.orgNumber?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    await dbSaveCustomer(customer)
    return customer
  })

export const updateCustomer = createServerFn({ method: 'POST' })
  .inputValidator((data: CustomerInput & { id: string }) => data)
  .handler(async ({ data }) => {
    const existing = await dbGetCustomer(data.id)
    if (!existing) throw new Error("Hittades inte")
    const updated: Customer = {
      ...existing,
      name: data.name.trim(),
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      address: data.address?.trim() || undefined,
      orgNumber: data.orgNumber?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    }
    await dbSaveCustomer(updated)
    return updated
  })

export const deleteCustomer = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await dbDeleteCustomer(data.id)
    return { success: true }
  })

// ============= Horses =============

export const getHorses = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Horse[]> => dbListHorses(),
)

export const getHorseDetail = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const horse = await dbGetHorse(data.id)
    if (!horse) throw new Error("Hittades inte")
    const [customer, treatments] = await Promise.all([
      dbGetCustomer(horse.customerId),
      dbListTreatments(),
    ])
    return {
      horse,
      customer,
      treatments: treatments.filter((t) => t.horseId === data.id),
    }
  })

interface HorseInput {
  customerId: string
  name: string
  breed?: string
  color?: string
  birthYear?: number
  discipline?: string
  notes?: string
}

export const createHorse = createServerFn({ method: 'POST' })
  .inputValidator((data: HorseInput) => data)
  .handler(async ({ data }): Promise<Horse> => {
    const horse: Horse = {
      id: uid('horse'),
      customerId: data.customerId,
      name: data.name.trim(),
      breed: data.breed?.trim() || undefined,
      color: data.color?.trim() || undefined,
      birthYear: data.birthYear,
      discipline: data.discipline?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    await dbSaveHorse(horse)
    return horse
  })

export const updateHorse = createServerFn({ method: 'POST' })
  .inputValidator((data: HorseInput & { id: string }) => data)
  .handler(async ({ data }) => {
    const existing = await dbGetHorse(data.id)
    if (!existing) throw new Error("Hittades inte")
    const updated: Horse = {
      ...existing,
      customerId: data.customerId,
      name: data.name.trim(),
      breed: data.breed?.trim() || undefined,
      color: data.color?.trim() || undefined,
      birthYear: data.birthYear,
      discipline: data.discipline?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    }
    await dbSaveHorse(updated)
    return updated
  })

export const deleteHorse = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await dbDeleteHorse(data.id)
    return { success: true }
  })

// ============= Treatments =============

export const getTreatments = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Treatment[]> => dbListTreatments(),
)

interface TreatmentInput {
  horseId: string
  type: TreatmentType
  date: string
  price: number
  notes?: string
  followUpDate?: string
}

export const createTreatment = createServerFn({ method: 'POST' })
  .inputValidator((data: TreatmentInput) => data)
  .handler(async ({ data }): Promise<Treatment> => {
    const horse = await dbGetHorse(data.horseId)
    if (!horse) throw new Error('Häst hittades inte')

    const treatment: Treatment = {
      id: uid('treat'),
      horseId: data.horseId,
      customerId: horse.customerId,
      type: data.type,
      date: data.date,
      price: data.price,
      notes: data.notes?.trim() || undefined,
      followUpDate: data.followUpDate || undefined,
      photos: [],
      createdAt: new Date().toISOString(),
    }
    await dbSaveTreatment(treatment)
    return treatment
  })

export const deleteTreatment = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await dbDeleteTreatment(data.id)
    return { success: true }
  })

export const uploadTreatmentPhoto = createServerFn({ method: 'POST' })
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data: formData }) => {
    const treatmentId = formData.get('treatmentId') as string
    const file = formData.get('photo') as File | null
    if (!treatmentId || !file) {
      throw new Error('Missing treatmentId or photo')
    }
    const treatment = await dbGetTreatment(treatmentId)
    if (!treatment) throw new Error("Hittades inte")

    const rand = Math.random().toString(36).slice(2, 10)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const key = `photos/${treatmentId}/${Date.now()}-${rand}.${ext}`
    const buffer = await file.arrayBuffer()
    await savePhoto(key, buffer, file.type || 'image/jpeg')

    const updated: Treatment = {
      ...treatment,
      photos: [...treatment.photos, { key, uploadedAt: new Date().toISOString() }],
    }
    await dbSaveTreatment(updated)
    return updated
  })

// ============= Invoices =============

export const getInvoices = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Invoice[]> => {
    const invoices = await dbListInvoices()
    const now = new Date().toISOString().slice(0, 10)
    return invoices.map((inv) => {
      if (inv.status === 'skickad' && inv.dueDate < now) {
        return { ...inv, status: 'forfallen' as InvoiceStatus }
      }
      return inv
    })
  },
)

export const getInvoiceDetail = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const invoice = await dbGetInvoice(data.id)
    if (!invoice) throw new Error("Hittades inte")
    const customer = await dbGetCustomer(invoice.customerId)
    const treatments = await Promise.all(
      invoice.lines
        .filter((l) => l.treatmentId)
        .map((l) => dbGetTreatment(l.treatmentId!)),
    )
    const horseIds = Array.from(
      new Set(treatments.filter(Boolean).map((t) => t!.horseId)),
    )
    const horses = await Promise.all(horseIds.map((id) => dbGetHorse(id)))
    return {
      invoice,
      customer,
      treatments: treatments.filter((t): t is Treatment => t !== null),
      horses: horses.filter((h): h is Horse => h !== null),
    }
  })

async function nextInvoiceNumber(): Promise<string> {
  const invoices = await dbListInvoices()
  const year = new Date().getFullYear()
  const prefix = `${year}-`
  const numbers = invoices
    .map((i) => i.number)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !isNaN(n))
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1
  return `${prefix}${String(next).padStart(3, '0')}`
}

interface CreateInvoiceInput {
  customerId: string
  treatmentIds: string[]
  dueInDays: number
  notes?: string
}

export const createInvoiceFromTreatments = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateInvoiceInput) => data)
  .handler(async ({ data }): Promise<Invoice> => {
    const treatments = await Promise.all(
      data.treatmentIds.map((id) => dbGetTreatment(id)),
    )
    const valid = treatments.filter((t): t is Treatment => t !== null)
    if (valid.length === 0) throw new Error('Inga behandlingar valda')

    const horses = await Promise.all(
      Array.from(new Set(valid.map((t) => t.horseId))).map((id) =>
        dbGetHorse(id),
      ),
    )
    const horseMap = new Map(
      horses.filter((h): h is Horse => h !== null).map((h) => [h.id, h]),
    )

    const lines: InvoiceLine[] = valid.map((t) => ({
      treatmentId: t.id,
      description: `${labelForType(t.type)} – ${horseMap.get(t.horseId)?.name ?? ''}`,
      amount: t.price,
    }))
    const subtotal = lines.reduce((sum, l) => sum + l.amount, 0)
    const vat = Math.round(subtotal * VAT_RATE)
    const total = subtotal + vat

    const today = new Date()
    const due = new Date(today)
    due.setDate(due.getDate() + data.dueInDays)

    const invoice: Invoice = {
      id: uid('inv'),
      number: await nextInvoiceNumber(),
      customerId: data.customerId,
      issuedDate: today.toISOString().slice(0, 10),
      dueDate: due.toISOString().slice(0, 10),
      status: 'skickad',
      lines,
      subtotal,
      vat,
      total,
      notes: data.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
    }

    await dbSaveInvoice(invoice)

    await Promise.all(
      valid.map((t) =>
        dbSaveTreatment({ ...t, invoiceId: invoice.id }),
      ),
    )

    return invoice
  })

export const markInvoicePaid = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const invoice = await dbGetInvoice(data.id)
    if (!invoice) throw new Error("Hittades inte")
    const updated: Invoice = {
      ...invoice,
      status: 'betald',
      paidDate: new Date().toISOString().slice(0, 10),
    }
    await dbSaveInvoice(updated)
    return updated
  })

export const markInvoiceUnpaid = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const invoice = await dbGetInvoice(data.id)
    if (!invoice) throw new Error("Hittades inte")
    const updated: Invoice = {
      ...invoice,
      status: 'skickad',
      paidDate: undefined,
    }
    await dbSaveInvoice(updated)
    return updated
  })

export const deleteInvoice = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const invoice = await dbGetInvoice(data.id)
    if (invoice) {
      for (const line of invoice.lines) {
        if (!line.treatmentId) continue
        const t = await dbGetTreatment(line.treatmentId)
        if (t?.invoiceId === invoice.id) {
          await dbSaveTreatment({ ...t, invoiceId: undefined })
        }
      }
    }
    await dbDeleteInvoice(data.id)
    return { success: true }
  })

function labelForType(type: TreatmentType): string {
  const map: Record<TreatmentType, string> = {
    skoning: 'Skoning',
    verkning: 'Verkning',
    hovvard: 'Hovvård',
    kontroll: 'Kontroll',
    annat: 'Annat',
  }
  return map[type]
}
