import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { fetchProducts, upsertProduct, removeProduct, seed } from '../server/functions';
import type { Product, ProductCategory } from '../lib/types';

export const Route = createFileRoute('/produkter/')({
  loader: async () => { await seed(); return fetchProducts(); },
  component: Produkter,
});

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  sko_staal: '🔵 Stålskor',
  sko_aluminium: '⚪ Aluminiumskor',
  sko_plast: '🟡 Plastskor',
  sula: '🟤 Sulor',
  spik: '⚫ Spik',
  verktyg: '🔧 Verktyg',
  hovvard: '🧴 Hovvård',
  ovrigt: '📦 Övrigt',
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ProductCategory[];

function Produkter() {
  const products = Route.useLoaderData() as Product[];
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Formulär
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('sko_staal');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [unit, setUnit] = useState('st');

  function openNew() {
    setEditProduct(null);
    setName(''); setCategory('sko_staal'); setDescription(''); setPrice(0); setUnit('st');
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setName(p.name); setCategory(p.category); setDescription(p.description ?? '');
    setPrice(p.price); setUnit(p.unit);
    setShowForm(true);
  }

  async function handleSave() {
    const product: Product = {
      id: editProduct?.id ?? `prod-${Date.now()}`,
      name, category, description, price, unit,
      active: true,
      createdAt: editProduct?.createdAt ?? new Date().toISOString(),
    };
    await upsertProduct(product);
    setShowForm(false);
    window.location.reload();
  }

  async function handleDelete(id: string) {
    if (confirm('Ta bort produkten?')) {
      await removeProduct(id);
      window.location.reload();
    }
  }

  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = products.filter(p => p.category === cat && p.active);
    return acc;
  }, {} as Record<ProductCategory, Product[]>);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Produktkatalog</h1>
          <p className="page-subtitle">{products.length} produkter</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Ny produkt</button>
      </div>

      {/* PRODUKTER PER KATEGORI */}
      {CATEGORIES.filter(cat => byCategory[cat].length > 0).map(cat => (
        <div key={cat} style={{ marginBottom: 28 }}>
          <h2 className="category-heading">{CATEGORY_LABELS[cat]}</h2>
          <div className="product-catalog-grid">
            {byCategory[cat].map(p => (
              <div key={p.id} className="product-catalog-card">
                <div className="product-catalog-name">{p.name}</div>
                {p.description && <div className="product-catalog-desc">{p.description}</div>}
                <div className="product-catalog-footer">
                  <span className="product-catalog-price">{p.price} kr/{p.unit}</span>
                  <div className="product-catalog-actions">
                    <button className="btn-icon" onClick={() => openEdit(p)}>✏️</button>
                    <button className="btn-icon" onClick={() => handleDelete(p.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {products.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🛒</span>
          <h2>Inga produkter ännu</h2>
          <p>Lägg till dina skor, sulor och material här.</p>
          <button className="btn-primary" onClick={openNew}>Lägg till första produkten</button>
        </div>
      )}

      {/* MODAL */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">{editProduct ? 'Redigera produkt' : 'Ny produkt'}</h2>
            <label className="field-label">Produktnamn <span className="required">*</span></label>
            <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="T.ex. Stålsko standard..." />
            <label className="field-label">Kategori</label>
            <select className="field-input" value={category} onChange={e => setCategory(e.target.value as ProductCategory)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
            <label className="field-label">Beskrivning</label>
            <input className="field-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Frivillig beskrivning..." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="field-label">Pris (kr exkl. moms)</label>
                <input className="field-input" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} />
              </div>
              <div>
                <label className="field-label">Enhet</label>
                <select className="field-input" value={unit} onChange={e => setUnit(e.target.value)}>
                  <option value="st">st</option>
                  <option value="par">par</option>
                  <option value="förpackning">förpackning</option>
                  <option value="liter">liter</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Avbryt</button>
              <button className="btn-primary" onClick={handleSave} disabled={!name}>Spara produkt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
