import { createServerFn } from '@tanstack/react-start';
import * as storage from './storage';
import type {
  Customer,
  Horse,
  Invoice,
  Treatment,
  TreatmentType,
  InvoiceLine,
  InvoiceStatus,
} from '../lib/types';
import { TREATMENT_TYPES } from '../lib/types';

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days: number, base = new Date()) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function ensureSeed() {
  await storage.seedIfEmpty();
}

// ─── Reads ────────────────────────────────────────────────────────────────────
export const seed = createServerFn({ method: 'GET' }).handler(async () => {
  await ensureSeed();
  return { ok: true };
});

export const getCustomers = createServerFn({ method: 'GET' }).handler(async () => {
  await ensureSeed();
  const list = await storage.getCustomers();
  return list.sort((a, b) => a.name.localeCompare(b.name, 'sv'));
});

export const getHorses = createServerFn({ method: 'GET' }).handler(async () => {
  await ensureSeed();
  return storage.getHorses();
});

export const getTreatments = createServerFn({ method: 'GET' }).handler(async () => {
  await ensureSeed();
  return storage.getTreatments();
});

export const getInvoices = createServerFn({ method: 'GET' }).handler(async () => {
  await ensureSeed();
  const list = await storage.getInvoices();
  return list.sort((a, b) => (a.issuedDate < b.issuedDate ? 1 : -1));
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboard = createServerFn({ method: 'GET' }).handler(async () => {
  await ensureSeed();
  const [customers, horses, treatments, invoices] = await Promise.all([
    storage.getCustomers(),
    storage.getHorses(),
    storage.getTreatments(),
    storage.getInvoices(),
  ]);

  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);

  const treatmentsThisMonth = treatments.filter((t) =>
    t.date.startsWith(currentMonth),
  ).length;

  const unpaid = invoices.filter(
    (i) => i.status === 'skickad' || i.status === 'forfallen',
  );
  const unpaidTotal = unpaid.reduce((s, i) => s + i.total, 0);
  const unpaidCount = unpaid.length;

  const revenueByMonth = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    revenueByMonth.set(key, 0);
  }
  for (const inv of invoices) {
    if (inv.status !== 'betald') continue;
    const key = (inv.paidDate ?? inv.issuedDate).slice(0, 7);
    if (revenueByMonth.has(key)) {
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + inv.total);
    }
  }
  const monthlyRevenue = Array.from(revenueByMonth.entries()).map(
    ([month, amount]) => ({ month, amount }),
  );

  const activeIds = new Set(treatments.map((t) => t.customerId));
  const activeCustomers = customers.filter((c) => activeIds.has(c.id)).length;

  return {
    activeCustomers,
    totalHorses: horses.length,
    treatmentsThisMonth,
    unpaidTotal,
    unpaidCount,
    monthlyRevenue,
  };
});

// ─── Customers ────────────────────────────────────────────────────────────────
interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  orgNumber?: string;
  notes?: string;
}

export const createCustomer = createServerFn({ method: 'POST' })
  .validator((input: CreateCustomerInput) => input)
  .handler(async ({ data }): Promise<Customer> => {
    if (!data.name.trim()) {
      throw new Error('Namn krävs.');
    }
    const customer: Customer = {
      id: randomId('cust'),
      name: data.name.trim(),
      email: data.email,
      phone: data.phone,
      address: data.address,
      orgNumber: data.orgNumber,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    await storage.saveCustomer(customer);
    return customer;
  });

export const getCustomerDetail = createServerFn({ method: 'GET' })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    await ensureSeed();
    const [customer, horses, treatments, invoices] = await Promise.all([
      storage.getCustomer(data.id),
      storage.getHorses(),
      storage.getTreatments(),
      storage.getInvoices(),
    ]);
    if (!customer) {
      throw new Error('Kunden kunde inte hittas.');
    }
    return {
      customer,
      horses: horses.filter((h) => h.customerId === customer.id),
      treatments: treatments
        .filter((t) => t.customerId === customer.id)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
      invoices: invoices
        .filter((i) => i.customerId === customer.id)
        .sort((a, b) => (a.issuedDate < b.issuedDate ? 1 : -1)),
    };
  });

// ─── Horses ───────────────────────────────────────────────────────────────────
interface CreateHorseInput {
  customerId: string;
  name: string;
  breed?: string;
  color?: string;
  discipline?: string;
  birthYear?: number;
  notes?: string;
}

export const createHorse = createServerFn({ method: 'POST' })
  .validator((input: CreateHorseInput) => input)
  .handler(async ({ data }): Promise<Horse> => {
    if (!data.name.trim()) throw new Error('Namn krävs.');
    if (!data.customerId) throw new Error('Ägare krävs.');
    const horse: Horse = {
      id: randomId('horse'),
      customerId: data.customerId,
      name: data.name.trim(),
      breed: data.breed,
      color: data.color,
      discipline: data.discipline,
      birthYear: data.birthYear,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    await storage.saveHorse(horse);
    return horse;
  });

export const getHorseDetail = createServerFn({ method: 'GET' })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    await ensureSeed();
    const horse = await storage.getHorse(data.id);
    if (!horse) {
      throw new Error('Hästen kunde inte hittas.');
    }
    const [customer, allTreatments] = await Promise.all([
      storage.getCustomer(horse.customerId),
      storage.getTreatments(),
    ]);
    const treatments = allTreatments
      .filter((t) => t.horseId === horse.id)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return { horse, customer, treatments };
  });

// ─── Treatments ───────────────────────────────────────────────────────────────
interface CreateTreatmentInput {
  horseId: string;
  type: TreatmentType;
  date: string;
  price: number;
  notes?: string;
  followUpDate?: string;
}

export const createTreatment = createServerFn({ method: 'POST' })
  .validator((input: CreateTreatmentInput) => input)
  .handler(async ({ data }): Promise<Treatment> => {
    const horse = await storage.getHorse(data.horseId);
    if (!horse) throw new Error('Hästen kunde inte hittas.');
    const treatment: Treatment = {
      id: randomId('treat'),
      horseId: horse.id,
      customerId: horse.customerId,
      date: data.date || todayISO(),
      type: data.type,
      price: Number(data.price) || 0,
      notes: data.notes,
      followUpDate: data.followUpDate,
      photos: [],
      createdAt: new Date().toISOString(),
    };
    await storage.saveTreatment(treatment);
    return treatment;
  });

export const deleteTreatment = createServerFn({ method: 'POST' })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const t = await storage.getTreatment(data.id);
    if (!t) return { ok: true };
    if (t.invoiceId) throw new Error('Behandlingen är redan fakturerad.');
    await storage.deleteTreatmentBlob(data.id);
    return { ok: true };
  });

export const uploadTreatmentPhoto = createServerFn({ method: 'POST' })
  .validator((data: FormData) => data)
  .handler(async ({ data }) => {
    const treatmentId = String(data.get('treatmentId') ?? '');
    const file = data.get('photo');
    if (!treatmentId || !(file instanceof File)) {
      throw new Error('Ogiltig uppladdning.');
    }
    const treatment = await storage.getTreatment(treatmentId);
    if (!treatment) throw new Error('Behandlingen kunde inte hittas.');
    const photoId = randomId('photo');
    const key = `photos/${photoId}`;
    const buffer = await file.arrayBuffer();
    await storage.savePhoto(key, buffer, file.type || 'image/jpeg');
    treatment.photos = [...treatment.photos, { key }];
    await storage.saveTreatment(treatment);
    return { ok: true };
  });

// ─── Invoices ─────────────────────────────────────────────────────────────────
interface CreateInvoiceInput {
  customerId: string;
  treatmentIds: string[];
  dueInDays: number;
  notes?: string;
}

function invoiceNumber(count: number) {
  const year = new Date().getFullYear();
  return `${year}-${String(count + 1).padStart(3, '0')}`;
}

export const createInvoiceFromTreatments = createServerFn({ method: 'POST' })
  .validator((input: CreateInvoiceInput) => input)
  .handler(async ({ data }): Promise<Invoice> => {
    if (!data.customerId) throw new Error('Kund krävs.');
    if (!data.treatmentIds.length) {
      throw new Error('Välj minst en behandling.');
    }
    const [allTreatments, allInvoices] = await Promise.all([
      storage.getTreatments(),
      storage.getInvoices(),
    ]);
    const treatments = allTreatments.filter(
      (t) => data.treatmentIds.includes(t.id) && !t.invoiceId,
    );
    if (treatments.length === 0) {
      throw new Error('Inga tillgängliga behandlingar att fakturera.');
    }
    const lines: InvoiceLine[] = treatments.map((t) => ({
      description: `${TREATMENT_TYPES[t.type]} · ${t.date}${t.notes ? ` – ${t.notes}` : ''}`,
      amount: t.price,
      quantity: 1,
      unitPrice: t.price,
      vatRate: 0.25,
    }));
    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    const vat = Math.round(subtotal * 0.25);
    const total = subtotal + vat;
    const nowIso = new Date().toISOString();
    const issuedDate = todayISO();
    const invoice: Invoice = {
      id: randomId('inv'),
      number: invoiceNumber(allInvoices.length),
      customerId: data.customerId,
      treatmentIds: treatments.map((t) => t.id),
      lines,
      status: 'skickad',
      issuedDate,
      issueDate: issuedDate,
      dueDate: addDaysISO(Number(data.dueInDays) || 30),
      subtotal,
      vat,
      total,
      notes: data.notes,
      createdAt: nowIso,
    };
    await storage.saveInvoice(invoice);
    await Promise.all(
      treatments.map((t) =>
        storage.saveTreatment({ ...t, invoiceId: invoice.id }),
      ),
    );
    return invoice;
  });

export const getInvoiceDetail = createServerFn({ method: 'GET' })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    await ensureSeed();
    const invoice = await storage.getInvoice(data.id);
    if (!invoice) throw new Error('Fakturan kunde inte hittas.');

    const now = todayISO();
    if (invoice.status === 'skickad' && invoice.dueDate < now) {
      invoice.status = 'forfallen';
      await storage.saveInvoice(invoice);
    }

    const [customer, allTreatments, allHorses] = await Promise.all([
      storage.getCustomer(invoice.customerId),
      storage.getTreatments(),
      storage.getHorses(),
    ]);
    const treatmentIds = new Set(invoice.treatmentIds ?? []);
    const relatedTreatments = allTreatments.filter((t) => treatmentIds.has(t.id));
    const horseIds = new Set(relatedTreatments.map((t) => t.horseId));
    const horses = allHorses.filter((h) => horseIds.has(h.id));
    return { invoice, customer, horses, treatments: relatedTreatments };
  });

export const markInvoicePaid = createServerFn({ method: 'POST' })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const invoice = await storage.getInvoice(data.id);
    if (!invoice) throw new Error('Fakturan kunde inte hittas.');
    const updated: Invoice = {
      ...invoice,
      status: 'betald' as InvoiceStatus,
      paidDate: todayISO(),
    };
    await storage.saveInvoice(updated);
    return { ok: true };
  });

export const markInvoiceUnpaid = createServerFn({ method: 'POST' })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const invoice = await storage.getInvoice(data.id);
    if (!invoice) throw new Error('Fakturan kunde inte hittas.');
    const nowDate = todayISO();
    const nextStatus: InvoiceStatus = invoice.dueDate < nowDate ? 'forfallen' : 'skickad';
    const updated: Invoice = {
      ...invoice,
      status: nextStatus,
      paidDate: undefined,
    };
    await storage.saveInvoice(updated);
    return { ok: true };
  });

export const deleteInvoice = createServerFn({ method: 'POST' })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const invoice = await storage.getInvoice(data.id);
    if (!invoice) return { ok: true };
    const allTreatments = await storage.getTreatments();
    const linked = allTreatments.filter((t) => t.invoiceId === invoice.id);
    await Promise.all(
      linked.map((t) =>
        storage.saveTreatment({ ...t, invoiceId: undefined }),
      ),
    );
    await storage.deleteInvoiceBlob(invoice.id);
    return { ok: true };
  });
