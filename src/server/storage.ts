import { getStore } from '@netlify/blobs';
import type {
  Customer,
  Horse,
  Journal,
  Invoice,
  Product,
  Treatment,
} from '../lib/types';

const STORE = 'hovjournal';

function store() {
  return getStore({ name: STORE, consistency: 'strong' });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getList<T>(prefix: string): Promise<T[]> {
  const s = store();
  const { blobs } = await s.list({ prefix });
  const items = await Promise.all(blobs.map((b) => s.get(b.key, { type: 'json' })));
  return items.filter(Boolean) as T[];
}

async function getOne<T>(key: string): Promise<T | null> {
  return store().get(key, { type: 'json' });
}

async function setOne<T>(key: string, value: T): Promise<void> {
  await store().setJSON(key, value);
}

async function deleteOne(key: string): Promise<void> {
  await store().delete(key);
}

// ─── Kunder ───────────────────────────────────────────────────────────────────
export const getCustomers = () => getList<Customer>('customer:');
export const getCustomer = (id: string) => getOne<Customer>(`customer:${id}`);
export const saveCustomer = (c: Customer) => setOne(`customer:${c.id}`, c);
export const deleteCustomer = (id: string) => deleteOne(`customer:${id}`);

// ─── Hästar ───────────────────────────────────────────────────────────────────
export const getHorses = () => getList<Horse>('horse:');
export const getHorse = (id: string) => getOne<Horse>(`horse:${id}`);
export const saveHorse = (h: Horse) => setOne(`horse:${h.id}`, h);
export const deleteHorse = (id: string) => deleteOne(`horse:${id}`);

// ─── Behandlingar (Treatments) ────────────────────────────────────────────────
export const getTreatments = async (): Promise<Treatment[]> => {
  const list = await getList<Treatment>('treatment:');
  return list.sort((a, b) => (a.date < b.date ? 1 : -1));
};
export const getTreatment = (id: string) => getOne<Treatment>(`treatment:${id}`);
export const saveTreatment = (t: Treatment) => setOne(`treatment:${t.id}`, t);
export const deleteTreatmentBlob = (id: string) => deleteOne(`treatment:${id}`);

// ─── Journalanteckningar (kvarstår) ───────────────────────────────────────────
export const getJournals = () => getList<Journal>('journal:');
export const getJournal = (id: string) => getOne<Journal>(`journal:${id}`);
export const saveJournal = (j: Journal) => setOne(`journal:${j.id}`, j);
export const deleteJournal = (id: string) => deleteOne(`journal:${id}`);

// ─── Produkter ────────────────────────────────────────────────────────────────
export const getProducts = () => getList<Product>('product:');
export const getProduct = (id: string) => getOne<Product>(`product:${id}`);
export const saveProduct = (p: Product) => setOne(`product:${p.id}`, p);
export const deleteProduct = (id: string) => deleteOne(`product:${id}`);

// ─── Fakturor ─────────────────────────────────────────────────────────────────
export const getInvoices = () => getList<Invoice>('invoice:');
export const getInvoice = (id: string) => getOne<Invoice>(`invoice:${id}`);
export const saveInvoice = (inv: Invoice) => setOne(`invoice:${inv.id}`, inv);
export const deleteInvoiceBlob = (id: string) => deleteOne(`invoice:${id}`);

// ─── Foton (binär blob) ───────────────────────────────────────────────────────
export async function savePhoto(photoId: string, data: ArrayBuffer, contentType: string) {
  await store().set(`photo:${photoId}`, data, { metadata: { contentType } });
}

export async function getPhoto(photoId: string) {
  const s = store();
  const blob = await s.get(`photo:${photoId}`, { type: 'arrayBuffer' });
  if (!blob) return null;
  const meta = await s.getMetadata(`photo:${photoId}`);
  return { data: blob, contentType: (meta?.metadata?.contentType as string) ?? 'image/jpeg' };
}

// ─── Seed-data ────────────────────────────────────────────────────────────────
export async function seedIfEmpty() {
  const customers = await getCustomers();
  if (customers.length > 0) return;

  const now = new Date().toISOString();

  const c1: Customer = { id: 'cust-1', name: 'Anna Lindström', email: 'anna@example.com', phone: '070-111 22 33', createdAt: now };
  const c2: Customer = { id: 'cust-2', name: 'Björn Ekman', email: 'bjorn@example.com', phone: '073-444 55 66', createdAt: now };
  const c3: Customer = { id: 'cust-3', name: 'Cecilia Wahlgren', email: 'cecilia@example.com', phone: '076-777 88 99', createdAt: now };

  await Promise.all([saveCustomer(c1), saveCustomer(c2), saveCustomer(c3)]);

  const h1: Horse = { id: 'horse-freja', customerId: 'cust-1', name: 'Freja', breed: 'KWPN', color: 'Fuxe', discipline: 'Hoppning', createdAt: now };
  const h2: Horse = { id: 'horse-odin', customerId: 'cust-1', name: 'Oden', breed: 'Svensk varmblod', color: 'Brun', discipline: 'Dressyr', createdAt: now };
  const h3: Horse = { id: 'horse-saga', customerId: 'cust-2', name: 'Saga', breed: 'Connemara', color: 'Grå', discipline: 'Allround', createdAt: now };

  await Promise.all([saveHorse(h1), saveHorse(h2), saveHorse(h3)]);

  const p1: Product = { id: 'prod-1', name: 'Stålsko standard (fram)', category: 'sko_staal', description: 'Standardskoning, storlek 1–4', price: 280, unit: 'st', active: true, createdAt: now };
  const p2: Product = { id: 'prod-2', name: 'Stålsko förstärkt (bak)', category: 'sko_staal', description: 'Med stöd, storlek 2–5', price: 320, unit: 'st', active: true, createdAt: now };
  const p3: Product = { id: 'prod-3', name: 'EasyShoe Sport sula', category: 'sula', description: 'Skumsula med stöd', price: 195, unit: 'st', active: true, createdAt: now };

  await Promise.all([saveProduct(p1), saveProduct(p2), saveProduct(p3)]);

  const t1: Treatment = {
    id: 'treatment-1',
    horseId: 'horse-freja',
    customerId: 'cust-1',
    date: '2026-04-14',
    type: 'skoning',
    price: 1800,
    notes: 'Ny skoning fram och bak. Kontrollerade balansen noggrant.',
    photos: [],
    createdAt: now,
  };
  await saveTreatment(t1);
}
