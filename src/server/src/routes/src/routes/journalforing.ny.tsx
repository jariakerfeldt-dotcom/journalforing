import { useState, useRef } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { fetchHorses, fetchCustomers, fetchProducts, upsertJournal, uploadPhoto, seed } from '../server/functions';
import type { Journal, JournalPhoto, UsedProduct, JournalStatus, VisitType, Product } from '../lib/types';

export const Route = createFileRoute('/journalforing/ny')({
  loader: async () => {
    await seed();
    const [horses, customers, products] = await Promise.all([
      fetchHorses(), fetchCustomers(), fetchProducts(),
    ]);
    return { horses, customers, products: products.filter((p: Product) => p.active) };
  },
  component: NyJournal,
});

const VISIT_TYPES: { value: VisitType; label: string; icon: string }[] = [
  { value: 'skoning', label: 'Skoning', icon: '🔨' },
  { value: 'verkning', label: 'Verkning', icon: '✂️' },
  { value: 'hovvard', label: 'Hovvård', icon: '🧴' },
  { value: 'kontroll', label: 'Kontroll', icon: '🔍' },
  { value: 'annat', label: 'Annat', icon: '📋' },
];

const FOLLOWUP_OPTIONS = [
  { days: 42, label: '6 veckor' },
  { days: 56, label: '8 veckor' },
  { days: 70, label: '10 veckor' },
  { days: 84, label: '12 veckor' },
];

const CATEGORY_LABELS: Record<string, string> = {
  sko_staal: '🔵 Stålskor',
  sko_aluminium: '⚪ Aluminiumskor',
  sko_plast: '🟡 Plastskor',
  sula: '🟤 Sulor',
  spik: '⚫ Spik',
  verktyg: '🔧 Verktyg',
  hovvard: '🧴 Hovvård',
  ovrigt: '📦 Övrigt',
};

function NyJournal() {
  const { horses, customers, products } = Route.useLoaderData();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'journal' | 'bilder' | 'produkter'>('journal');
  const [saving, setSaving] = useState(false);

  // Formulärfält
  const [horseId, setHorseId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitType, setVisitType] = useState<VisitType>('skoning');
  const [rubrik, setRubrik] = useState('');
  const [anamnes, setAnamnes] = useState('');
  const [hovstatus, setHovstatus] = useState<JournalStatus>('bra_skick');
  const [diagnos, setDiagnos] = useState('');
  const [behandlingAtgard, setBehandlingAtgard] = useState('');
  const [rekommendation, setRekommendation] = useState('');
  const [followUpDays, setFollowUpDays] = useState<number | undefined>(56);
  const [price, setPrice] = useState(0);

  // Bilder
  const [photos, setPhotos] = useState<(JournalPhoto & { preview: string })[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Produkter
  const [usedProducts, setUsedProducts] = useState<UsedProduct[]>([]);

  const selectedHorse = horses.find((h: any) => h.id === horseId);
  const customer = customers.find((c: any) => c.id === selectedHorse?.customerId);

  function toggleProduct(product: Product) {
    const exists = usedProducts.find(p => p.productId === product.id);
    if (exists) {
      setUsedProducts(prev => prev.filter(p => p.productId !== product.id));
    } else {
      setUsedProducts(prev => [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.price,
      }]);
      // Uppdatera totalpris automatiskt
      setPrice(prev => prev + product.price);
    }
  }

  async function handlePhotoUpload(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const preview = URL.createObjectURL(file);
      const photoId = `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      // Konvertera till base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      await uploadPhoto({ photoId, base64, contentType: file.type });
      setPhotos(prev => [...prev, { photoId, note: '', preview }]);
    }
  }

  function updatePhotoNote(photoId: string, note: string) {
    setPhotos(prev => prev.map(p => p.photoId === photoId ? { ...p, note } : p));
  }

  async function handleSave() {
    if (!horseId || !rubrik) return;
    setSaving(true);
    const journal: Journal = {
      id: `journal-${Date.now()}`,
      horseId,
      customerId: selectedHorse?.customerId ?? '',
      date,
      rubrik,
      visitType,
      anamnes,
      hovstatus,
      diagnos,
      behandlingAtgard,
      rekommendation,
      photos: photos.map(({ photoId, note }) => ({ photoId, note })),
      usedProducts,
      followUpDays,
      price,
      createdAt: new Date().toISOString(),
    };
    await upsertJournal(journal);
    navigate({ to: '/journalforing' });
  }

  // Gruppera produkter per kategori
  const productsByCategory = products.reduce((acc: Record<string, Product[]>, p: Product) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <div className="page-container" style={{ paddingBottom: 0 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ny journalanteckning</h1>
          {selectedHorse && <p className="page-subtitle">🐎 {selectedHorse.name} · {customer?.name}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate({ to: '/journalforing' })} className="btn-secondary">Avbryt</button>
          <button onClick={handleSave} disabled={saving || !horseId || !rubrik} className="btn-primary">
            {saving ? 'Sparar...' : '💾 Spara journal'}
          </button>
        </div>
      </div>

      {/* TAB-NAVIGERING */}
      <div className="tab-bar">
        {[
          { key: 'journal', label: '📋 Journal' },
          { key: 'bilder', label: `📸 Bilder${photos.length > 0 ? ` (${photos.length})` : ''}` },
          { key: 'produkter', label: `🛒 Produkter${usedProducts.length > 0 ? ` (${usedProducts.length})` : ''}` },
        ].map(t => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key as any)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: JOURNAL ── */}
      {activeTab === 'journal' && (
        <div className="form-grid">

          {/* HÄST & DATUM */}
          <div className="form-card">
            <div className="card-header">
              <span className="card-icon">🐎</span>
              <h3>Häst & datum</h3>
            </div>
            <label className="field-label">Välj häst <span className="required">*</span></label>
            <div className="chip-row">
              {horses.map((h: any) => (
                <button key={h.id} className={`horse-chip ${horseId === h.id ? 'selected' : ''}`} onClick={() => setHorseId(h.id)}>
                  🐎 {h.name}
                </button>
              ))}
            </div>
            <label className="field-label">Datum</label>
            <input className="field-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            <label className="field-label">Typ av besök</label>
            <div className="chip-row">
              {VISIT_TYPES.map(v => (
                <button key={v.value} className={`visit-chip ${visitType === v.value ? 'selected' : ''}`} onClick={() => setVisitType(v.value)}>
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* HOVSTATUS */}
          <div className="form-card">
            <div className="card-header">
              <span className="card-icon">🩺</span>
              <h3>Hovstatus</h3>
            </div>
            <label className="field-label">Övergripande bedömning</label>
            <div className="status-row">
              {[
                { value: 'bra_skick' as JournalStatus, label: '✅ Bra skick', cls: 'status-green' },
                { value: 'bor_foljas' as JournalStatus, label: '⚠️ Bör följas', cls: 'status-yellow' },
                { value: 'atgard_kravs' as JournalStatus, label: '🚨 Åtgärd krävs', cls: 'status-red' },
              ].map(s => (
                <button key={s.value} className={`status-badge ${s.cls} ${hovstatus === s.value ? 'selected' : ''}`} onClick={() => setHovstatus(s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
            <label className="field-label">Diagnos</label>
            <input className="field-input" value={diagnos} onChange={e => setDiagnos(e.target.value)} placeholder="T.ex. torrsprickor, ojämn belastning..." />
            <label className="field-label">Uppföljning</label>
            <div className="chip-row">
              {FOLLOWUP_OPTIONS.map(f => (
                <button key={f.days} className={`visit-chip ${followUpDays === f.days ? 'selected' : ''}`} onClick={() => setFollowUpDays(f.days)}>
                  {f.label}
                </button>
              ))}
              <button className={`visit-chip ${followUpDays === undefined ? 'selected' : ''}`} onClick={() => setFollowUpDays(undefined)}>
                Ingen
              </button>
            </div>
          </div>

          {/* ANAMNES */}
          <div className="form-card">
            <div className="card-header">
              <span className="card-icon">📝</span>
              <h3>Anamnes</h3>
            </div>
            <label className="field-label">Rubrik <span className="required">*</span></label>
            <input className="field-input" value={rubrik} onChange={e => setRubrik(e.target.value)} placeholder="T.ex. Skoning inför tävlingssäsong..." />
            <label className="field-label">Anamnes – bakgrund</label>
            <textarea className="field-textarea" value={anamnes} onChange={e => setAnamnes(e.target.value)} placeholder="Vad berättar ägaren? Tidigare besvär, förändringar i rörelse, miljöbyte..." />
          </div>

          {/* BEHANDLING */}
          <div className="form-card">
            <div className="card-header">
              <span className="card-icon">🔨</span>
              <h3>Behandling & åtgärd</h3>
            </div>
            <label className="field-label">Utförd åtgärd</label>
            <textarea className="field-textarea" value={behandlingAtgard} onChange={e => setBehandlingAtgard(e.target.value)} placeholder="Vad gjordes? Vilka skor, sulor, justeringar..." />
            <label className="field-label">Råd till ägaren</label>
            <textarea className="field-textarea" value={rekommendation} onChange={e => setRekommendation(e.target.value)} placeholder="Vad bör ryttaren tänka på?" />
            <label className="field-label">Pris (kr)</label>
            <input className="field-input" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} placeholder="0" />
          </div>

        </div>
      )}

      {/* ── TAB: BILDER ── */}
      {activeTab === 'bilder' && (
        <div className="form-card" style={{ margin: '0 28px 28px' }}>
          <div className="card-header">
            <span className="card-icon">📸</span>
            <h3>Bilder & dokumentation</h3>
          </div>
          <p className="hint-text">Fotografera hovarna direkt – du kan lägga till en notering per bild.</p>
          <div className="photo-grid">
            {photos.map(p => (
              <div key={p.photoId} className="photo-item">
                <img src={p.preview} alt="Hovbild" className="photo-img" />
                <input
                  className="photo-note-input"
                  value={p.note}
                  onChange={e => updatePhotoNote(p.photoId, e.target.value)}
                  placeholder="Lägg till notering..."
                />
              </div>
            ))}
            <button className="photo-slot" onClick={() => fileRef.current?.click()}>
              <span style={{ fontSize: 32 }}>📷</span>
              <span>Lägg till bild</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handlePhotoUpload(e.target.files)} />
        </div>
      )}

      {/* ── TAB: PRODUKTER ── */}
      {activeTab === 'produkter' && (
        <div className="form-card" style={{ margin: '0 28px 28px' }}>
          <div className="card-header">
            <span className="card-icon">🛒</span>
            <h3>Använda produkter</h3>
          </div>
          <p className="hint-text">Välj vilka produkter som användes – priset uppdateras automatiskt.</p>
          {Object.entries(productsByCategory).map(([cat, prods]) => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div className="category-label">{CATEGORY_LABELS[cat] ?? cat}</div>
              <div className="product-list">
                {(prods as Product[]).map(p => {
                  const isSelected = usedProducts.some(u => u.productId === p.id);
                  return (
                    <button key={p.id} className={`product-item ${isSelected ? 'selected' : ''}`} onClick={() => toggleProduct(p)}>
                      <div className="product-info">
                        <div className="product-name">{p.name}</div>
                        {p.description && <div className="product-desc">{p.description}</div>}
                      </div>
                      <div className="product-price">{p.price} kr/{p.unit}</div>
                      {isSelected && <span className="checkmark">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {usedProducts.length > 0 && (
            <div className="product-summary">
              <span>Valda produkter: {usedProducts.length} st</span>
              <span className="product-total">Totalt: {usedProducts.reduce((s, p) => s + p.unitPrice * p.quantity, 0)} kr</span>
            </div>
          )}
        </div>
      )}

      {/* SPARA-KNAPP (sticky) */}
      <div className="save-bar">
        <button onClick={() => navigate({ to: '/journalforing' })} className="btn-secondary">Avbryt</button>
        <button onClick={handleSave} disabled={saving || !horseId || !rubrik} className="btn-primary">
          {saving ? 'Sparar...' : '💾 Spara & skapa faktura'}
        </button>
      </div>
    </div>
  );
}
