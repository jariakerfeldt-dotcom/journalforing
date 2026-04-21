import { createServerFn } from '@tanstack/start';
import * as storage from './storage';
import type { Customer, Horse, Journal, Invoice, Product } from '../lib/types';

// ─── Init ──────────────────────────────────────────────────────────────────────
export const seed = createServerFn({ method: 'GET' }).handler(storage.seedIfEmpty);

// ─── Kunder ────────────────────────────────────────────────────────────────────
export const fetchCustomers = createServerFn({ method: 'GET' }).handler(storage.getCustomers);
export const fetchCustomer = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(({ data }) => storage.getCustomer(data));
export const upsertCustomer = createServerFn({ method: 'POST' })
  .validator((c: Customer) => c)
  .handler(({ data }) => storage.saveCustomer(data));
export const removeCustomer = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(({ data }) => storage.deleteCustomer(data));

// ─── Hästar ────────────────────────────────────────────────────────────────────
export const fetchHorses = createServerFn({ method: 'GET' }).handler(storage.getHorses);
export const fetchHorse = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(({ data }) => storage.getHorse(data));
export const upsertHorse = createServerFn({ method: 'POST' })
  .validator((h: Horse) => h)
  .handler(({ data }) => storage.saveHorse(data));
export const removeHorse = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(({ data }) => storage.deleteHorse(data));

// ─── Journalanteckningar ───────────────────────────────────────────────────────
export const fetchJournals = createServerFn({ method: 'GET' }).handler(storage.getJournals);
export const fetchJournal = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(({ data }) => storage.getJournal(data));
export const upsertJournal = createServerFn({ method: 'POST' })
  .validator((j: Journal) => j)
  .handler(({ data }) => storage.saveJournal(data));
export const removeJournal = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(({ data }) => storage.deleteJournal(data));

// ─── Produkter ─────────────────────────────────────────────────────────────────
export const fetchProducts = createServerFn({ method: 'GET' }).handler(storage.getProducts);
export const fetchProduct = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(({ data }) => storage.getProduct(data));
export const upsertProduct = createServerFn({ method: 'POST' })
  .validator((p: Product) => p)
  .handler(({ data }) => storage.saveProduct(data));
export const removeProduct = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(({ data }) => storage.deleteProduct(data));

// ─── Fakturor ──────────────────────────────────────────────────────────────────
export const fetchInvoices = createServerFn({ method: 'GET' }).handler(storage.getInvoices);
export const fetchInvoice = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(({ data }) => storage.getInvoice(data));
export const upsertInvoice = createServerFn({ method: 'POST' })
  .validator((inv: Invoice) => inv)
  .handler(({ data }) => storage.saveInvoice(data));
export const removeInvoice = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(({ data }) => storage.deleteInvoice(data));

// ─── Foton ────────────────────────────────────────────────────────────────────
export const uploadPhoto = createServerFn({ method: 'POST' })
  .validator((d: { photoId: string; base64: string; contentType: string }) => d)
  .handler(async ({ data }) => {
    const binary = Buffer.from(data.base64, 'base64');
    await storage.savePhoto(data.photoId, binary.buffer, data.contentType);
    return { photoId: data.photoId };
  });
