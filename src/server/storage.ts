import { getStore } from '@netlify/blobs'
import type {
  Customer,
  Horse,
  Invoice,
  Treatment,
} from '@/lib/types'

const STORE_NAME = 'hovjournal'

function store() {
  return getStore({ name: STORE_NAME, consistency: 'strong' })
}

async function listAll<T>(prefix: string): Promise<T[]> {
  const s = store()
  const { blobs } = await s.list({ prefix })
  const results = await Promise.all(
    blobs.map((b) => s.get(b.key, { type: 'json' }) as Promise<T | null>),
  )
  return results.filter((r): r is T => r !== null)
}

export async function listCustomers(): Promise<Customer[]> {
  await ensureSeed()
  const items = await listAll<Customer>('customers/')
  return items.sort((a, b) => a.name.localeCompare(b.name, 'sv'))
}

export async function getCustomer(id: string): Promise<Customer | null> {
  await ensureSeed()
  return (await store().get(`customers/${id}`, { type: 'json' })) as Customer | null
}

export async function saveCustomer(customer: Customer): Promise<void> {
  await store().setJSON(`customers/${customer.id}`, customer)
}

export async function deleteCustomer(id: string): Promise<void> {
  await store().delete(`customers/${id}`)
}

export async function listHorses(): Promise<Horse[]> {
  await ensureSeed()
  const items = await listAll<Horse>('horses/')
  return items.sort((a, b) => a.name.localeCompare(b.name, 'sv'))
}

export async function getHorse(id: string): Promise<Horse | null> {
  await ensureSeed()
  return (await store().get(`horses/${id}`, { type: 'json' })) as Horse | null
}

export async function saveHorse(horse: Horse): Promise<void> {
  await store().setJSON(`horses/${horse.id}`, horse)
}

export async function deleteHorse(id: string): Promise<void> {
  await store().delete(`horses/${id}`)
}

export async function listTreatments(): Promise<Treatment[]> {
  await ensureSeed()
  const items = await listAll<Treatment>('treatments/')
  return items.sort((a, b) => b.date.localeCompare(a.date))
}

export async function getTreatment(id: string): Promise<Treatment | null> {
  await ensureSeed()
  return (await store().get(`treatments/${id}`, { type: 'json' })) as Treatment | null
}

export async function saveTreatment(treatment: Treatment): Promise<void> {
  await store().setJSON(`treatments/${treatment.id}`, treatment)
}

export async function deleteTreatment(id: string): Promise<void> {
  await store().delete(`treatments/${id}`)
}

export async function listInvoices(): Promise<Invoice[]> {
  await ensureSeed()
  const items = await listAll<Invoice>('invoices/')
  return items.sort((a, b) => b.issuedDate.localeCompare(a.issuedDate))
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  await ensureSeed()
  return (await store().get(`invoices/${id}`, { type: 'json' })) as Invoice | null
}

export async function saveInvoice(invoice: Invoice): Promise<void> {
  await store().setJSON(`invoices/${invoice.id}`, invoice)
}

export async function deleteInvoice(id: string): Promise<void> {
  await store().delete(`invoices/${id}`)
}

export async function savePhoto(
  key: string,
  data: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const s = store()
  await s.set(key, data, { metadata: { contentType } })
}

export async function getPhoto(
  key: string,
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const s = store()
  const result = await s.getWithMetadata(key, { type: 'arrayBuffer' })
  if (!result) return null
  const contentType =
    (result.metadata?.contentType as string | undefined) ?? 'image/jpeg'
  return { data: result.data as ArrayBuffer, contentType }
}

let seedPromise: Promise<void> | null = null

async function ensureSeed(): Promise<void> {
  if (seedPromise) return seedPromise
  seedPromise = doSeed().catch((err) => {
    seedPromise = null
    throw err
  })
  return seedPromise
}

async function doSeed() {
  const s = store()
  const marker = await s.get('meta/seeded', { type: 'text' })
  if (marker === 'v1') return

  const now = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const mk = (days: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() - days)
    return d
  }

  const customers: Customer[] = [
    {
      id: 'cust-anna',
      name: 'Anna Lindström',
      email: 'anna@lindstromsgard.se',
      phone: '070-123 45 67',
      address: 'Gårdsvägen 12, 745 92 Enköping',
      orgNumber: '197812-0123',
      createdAt: iso(mk(90)),
    },
    {
      id: 'cust-bjorn',
      name: 'Björn Ekman',
      email: 'bjorn.ekman@ekshage.se',
      phone: '073-456 78 90',
      address: 'Ekshage 4, 186 95 Vallentuna',
      createdAt: iso(mk(60)),
    },
    {
      id: 'cust-cecilia',
      name: 'Cecilia Wahlgren',
      email: 'cecilia@rydebackstall.se',
      phone: '076-234 56 78',
      address: 'Rydebäcks Stall, 253 68 Helsingborg',
      orgNumber: '556789-1234',
      createdAt: iso(mk(120)),
    },
  ]

  const horses: Horse[] = [
    {
      id: 'horse-freja',
      customerId: 'cust-anna',
      name: 'Freja',
      breed: 'Svenskt varmblod',
      color: 'Fux',
      birthYear: 2017,
      discipline: 'Dressyr',
      notes: 'Känslig i vänster framhov, behöver mjuk övergång.',
      createdAt: iso(mk(90)),
    },
    {
      id: 'horse-odin',
      customerId: 'cust-anna',
      name: 'Oden',
      breed: 'Islandshäst',
      color: 'Svart',
      birthYear: 2014,
      discipline: 'Distans',
      createdAt: iso(mk(85)),
    },
    {
      id: 'horse-saga',
      customerId: 'cust-bjorn',
      name: 'Saga',
      breed: 'Ardenner',
      color: 'Brun',
      birthYear: 2012,
      discipline: 'Körning',
      notes: 'Stora hovar, beställ breda skor i förväg.',
      createdAt: iso(mk(60)),
    },
    {
      id: 'horse-milo',
      customerId: 'cust-cecilia',
      name: 'Milo',
      breed: 'Connemara',
      color: 'Skimmel',
      birthYear: 2019,
      discipline: 'Hoppning',
      createdAt: iso(mk(40)),
    },
    {
      id: 'horse-nova',
      customerId: 'cust-cecilia',
      name: 'Nova',
      breed: 'Svenskt halvblod',
      color: 'Brun',
      birthYear: 2016,
      discipline: 'Fälttävlan',
      createdAt: iso(mk(38)),
    },
  ]

  const treatments: Treatment[] = [
    {
      id: 'treat-1',
      horseId: 'horse-freja',
      customerId: 'cust-anna',
      type: 'skoning',
      date: iso(mk(6)),
      price: 1800,
      notes: 'Ny skoning fram och bak. Hovarna i gott skick, svagt ojämn belastning på vänster fram.',
      photos: [],
      followUpDate: iso(new Date(now.getFullYear(), now.getMonth() + 2, now.getDate())),
      createdAt: iso(mk(6)),
    },
    {
      id: 'treat-2',
      horseId: 'horse-odin',
      customerId: 'cust-anna',
      type: 'verkning',
      date: iso(mk(6)),
      price: 800,
      notes: 'Barfotaverkning. Fin hovkvalitet, stabil balans.',
      photos: [],
      createdAt: iso(mk(6)),
    },
    {
      id: 'treat-3',
      horseId: 'horse-saga',
      customerId: 'cust-bjorn',
      type: 'skoning',
      date: iso(mk(13)),
      price: 2100,
      notes: 'Bredare skor monterade, passade perfekt. Rengjort strålspalter.',
      photos: [],
      createdAt: iso(mk(13)),
    },
    {
      id: 'treat-4',
      horseId: 'horse-milo',
      customerId: 'cust-cecilia',
      type: 'verkning',
      date: iso(mk(20)),
      price: 800,
      notes: 'Första verkningen sedan flytt. Prima skick.',
      photos: [],
      createdAt: iso(mk(20)),
    },
    {
      id: 'treat-5',
      horseId: 'horse-nova',
      customerId: 'cust-cecilia',
      type: 'skoning',
      date: iso(mk(22)),
      price: 1800,
      notes: 'Ny skoning inför tävlingssäsong.',
      photos: [],
      createdAt: iso(mk(22)),
    },
    {
      id: 'treat-6',
      horseId: 'horse-freja',
      customerId: 'cust-anna',
      type: 'kontroll',
      date: iso(mk(48)),
      price: 450,
      notes: 'Uppföljning mellan skoningar. Ingen lossad sko.',
      photos: [],
      createdAt: iso(mk(48)),
    },
    {
      id: 'treat-7',
      horseId: 'horse-saga',
      customerId: 'cust-bjorn',
      type: 'skoning',
      date: iso(mk(55)),
      price: 2100,
      notes: 'Ordinarie skoning.',
      photos: [],
      createdAt: iso(mk(55)),
    },
  ]

  const invoices: Invoice[] = [
    {
      id: 'inv-1',
      number: '2026-001',
      customerId: 'cust-anna',
      issuedDate: iso(mk(6)),
      dueDate: iso(mk(-24)),
      status: 'skickad',
      lines: [
        { treatmentId: 'treat-1', description: 'Skoning – Freja', amount: 1800 },
        { treatmentId: 'treat-2', description: 'Verkning – Oden', amount: 800 },
      ],
      subtotal: 2600,
      vat: 650,
      total: 3250,
      createdAt: iso(mk(6)),
    },
    {
      id: 'inv-2',
      number: '2026-002',
      customerId: 'cust-bjorn',
      issuedDate: iso(mk(13)),
      dueDate: iso(mk(-17)),
      status: 'skickad',
      lines: [
        { treatmentId: 'treat-3', description: 'Skoning – Saga', amount: 2100 },
      ],
      subtotal: 2100,
      vat: 525,
      total: 2625,
      createdAt: iso(mk(13)),
    },
    {
      id: 'inv-3',
      number: '2026-003',
      customerId: 'cust-cecilia',
      issuedDate: iso(mk(20)),
      dueDate: iso(mk(-10)),
      paidDate: iso(mk(15)),
      status: 'betald',
      lines: [
        { treatmentId: 'treat-4', description: 'Verkning – Milo', amount: 800 },
        { treatmentId: 'treat-5', description: 'Skoning – Nova', amount: 1800 },
      ],
      subtotal: 2600,
      vat: 650,
      total: 3250,
      createdAt: iso(mk(20)),
    },
    {
      id: 'inv-4',
      number: '2025-042',
      customerId: 'cust-bjorn',
      issuedDate: iso(mk(55)),
      dueDate: iso(mk(25)),
      status: 'forfallen',
      lines: [
        { treatmentId: 'treat-7', description: 'Skoning – Saga', amount: 2100 },
      ],
      subtotal: 2100,
      vat: 525,
      total: 2625,
      createdAt: iso(mk(55)),
    },
  ]

  await Promise.all([
    ...customers.map((c) => s.setJSON(`customers/${c.id}`, c)),
    ...horses.map((h) => s.setJSON(`horses/${h.id}`, h)),
    ...treatments.map((t) => s.setJSON(`treatments/${t.id}`, t)),
    ...invoices.map((i) => s.setJSON(`invoices/${i.id}`, i)),
  ])

  await s.set('meta/seeded', 'v1')
}
