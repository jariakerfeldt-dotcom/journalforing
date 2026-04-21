// ─── Kund ────────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  orgNumber?: string;
  notes?: string;
  createdAt: string;
}

// ─── Häst ────────────────────────────────────────────────────────────────────
export interface Horse {
  id: string;
  customerId: string;
  name: string;
  breed?: string;
  color?: string;
  discipline?: string;
  birthYear?: number;
  notes?: string;
  importantInfo?: string;
  createdAt: string;
}

// ─── Bild med notering ───────────────────────────────────────────────────────
export interface JournalPhoto {
  photoId: string;
  note?: string;
}

// ─── Foto på en behandling ───────────────────────────────────────────────────
export interface TreatmentPhoto {
  key: string;
  note?: string;
}

// ─── Behandling (Treatment) ─────────────────────────────────────────────────
export type TreatmentType =
  | 'skoning'
  | 'verkning'
  | 'hovvard'
  | 'kontroll'
  | 'annat';

export const TREATMENT_TYPES: Record<TreatmentType, string> = {
  skoning: 'Skoning',
  verkning: 'Verkning',
  hovvard: 'Hovvård',
  kontroll: 'Kontroll',
  annat: 'Annat',
};

export const DEFAULT_PRICES: Record<TreatmentType, number> = {
  skoning: 1800,
  verkning: 700,
  hovvard: 500,
  kontroll: 400,
  annat: 500,
};

export interface Treatment {
  id: string;
  horseId: string;
  customerId: string;
  date: string;
  type: TreatmentType;
  price: number;
  notes?: string;
  followUpDate?: string;
  photos: TreatmentPhoto[];
  invoiceId?: string;
  createdAt: string;
}

// ─── Journalanteckning (nyare, rikare modell) ────────────────────────────────
export type JournalStatus = 'bra_skick' | 'bor_foljas' | 'atgard_kravs';
export type VisitType = 'skoning' | 'verkning' | 'hovvard' | 'kontroll' | 'annat';

export interface Journal {
  id: string;
  horseId: string;
  customerId: string;
  date: string;

  rubrik: string;
  visitType: VisitType;
  anamnes?: string;
  hovstatus: JournalStatus;
  diagnos?: string;
  behandlingAtgard?: string;
  rekommendation?: string;

  photos: JournalPhoto[];
  usedProducts: UsedProduct[];

  followUpDays?: number;

  price: number;
  invoiceId?: string;

  createdAt: string;
}

// ─── Produkt (produktkatalog) ─────────────────────────────────────────────────
export type ProductCategory =
  | 'sko_staal'
  | 'sko_aluminium'
  | 'sko_plast'
  | 'sula'
  | 'spik'
  | 'verktyg'
  | 'hovvard'
  | 'ovrigt';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description?: string;
  price: number;
  unit: string;
  sku?: string;
  stock?: number;
  active: boolean;
  createdAt: string;
}

export interface UsedProduct {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

// ─── Faktura ──────────────────────────────────────────────────────────────────
export type InvoiceStatus = 'utkast' | 'skickad' | 'betald' | 'forfallen';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  utkast: 'Utkast',
  skickad: 'Skickad',
  betald: 'Betald',
  forfallen: 'Förfallen',
};

export interface InvoiceLine {
  description: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  vatRate?: number;
}

export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  treatmentIds: string[];
  journalIds?: string[];
  lines: InvoiceLine[];
  status: InvoiceStatus;
  issuedDate: string;
  issueDate?: string;
  dueDate: string;
  paidDate?: string;
  subtotal: number;
  vat: number;
  total: number;
  notes?: string;
  createdAt: string;
}
