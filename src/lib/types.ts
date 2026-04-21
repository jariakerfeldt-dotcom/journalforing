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
  importantInfo?: string;
  createdAt: string;
}

// ─── Bild med notering ───────────────────────────────────────────────────────
export interface JournalPhoto {
  photoId: string;   // blob-nyckel
  note?: string;     // fritext-notering per bild
}

// ─── Journalanteckning (ersätter Treatment) ───────────────────────────────────
export type JournalStatus = 'bra_skick' | 'bor_foljas' | 'atgard_kravs';
export type VisitType = 'skoning' | 'verkning' | 'hovvard' | 'kontroll' | 'annat';

export interface Journal {
  id: string;
  horseId: string;
  customerId: string;
  date: string;                      // ISO-datum

  // Journalfält
  rubrik: string;
  visitType: VisitType;
  anamnes?: string;                  // bakgrund / ägarens berättelse
  hovstatus: JournalStatus;
  diagnos?: string;
  behandlingAtgard?: string;         // utförd åtgärd
  rekommendation?: string;           // råd till ägaren

  // Bilder
  photos: JournalPhoto[];

  // Produkter som använts
  usedProducts: UsedProduct[];

  // Uppföljning
  followUpDays?: number;

  // Ekonomi
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
  price: number;          // SEK exkl. moms
  unit: string;           // 'st', 'par', 'förpackning' osv.
  sku?: string;
  stock?: number;
  active: boolean;
  createdAt: string;
}

export interface UsedProduct {
  productId: string;
  name: string;           // snapshot vid användningstillfället
  quantity: number;
  unitPrice: number;
}

// ─── Faktura ──────────────────────────────────────────────────────────────────
export type InvoiceStatus = 'utkast' | 'skickad' | 'betald' | 'forfallen';

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;        // 0.25
}

export interface Invoice {
  id: string;
  number: string;         // t.ex. "2026-007"
  customerId: string;
  journalIds: string[];   // kopplade journalanteckningar
  lines: InvoiceLine[];
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes?: string;
  createdAt: string;
}
