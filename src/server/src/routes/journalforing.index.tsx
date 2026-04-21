import { createFileRoute, Link } from '@tanstack/react-router';
import { fetchJournals, fetchHorses, fetchCustomers, seed } from '../server/functions';
import { formatDate, formatCurrency } from '../lib/format';
import type { Journal, Horse, Customer } from '../lib/types';

export const Route = createFileRoute('/journalforing/')({
  loader: async () => {
    await seed();
    const [journals, horses, customers] = await Promise.all([
      fetchJournals(), fetchHorses(), fetchCustomers(),
    ]);
    return { journals: journals.sort((a, b) => b.date.localeCompare(a.date)), horses, customers };
  },
  component: JournalList,
});

const STATUS_LABEL: Record<string, string> = {
  bra_skick: '✅ Bra skick',
  bor_foljas: '⚠️ Bör följas upp',
  atgard_kravs: '🚨 Åtgärd krävs',
};

const STATUS_CLASS: Record<string, string> = {
  bra_skick: 'badge-green',
  bor_foljas: 'badge-yellow',
  atgard_kravs: 'badge-red',
};

const VISIT_LABEL: Record<string, string> = {
  skoning: '🔨 Skoning',
  verkning: '✂️ Verkning',
  hovvard: '🧴 Hovvård',
  kontroll: '🔍 Kontroll',
  annat: '📋 Annat',
};

function JournalList() {
  const { journals, horses, customers } = Route.useLoaderData();

  const horseMap = Object.fromEntries(horses.map((h: Horse) => [h.id, h]));
  const customerMap = Object.fromEntries(customers.map((c: Customer) => [c.id, c]));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Journalföring</h1>
          <p className="page-subtitle">{journals.length} anteckningar totalt</p>
        </div>
        <Link to="/journalforing/ny" className="btn-primary">
          + Ny journalanteckning
        </Link>
      </div>

      <div className="journal-list">
        {journals.map((j: Journal) => {
          const horse = horseMap[j.horseId];
          const customer = customerMap[j.customerId];
          return (
            <Link key={j.id} to={`/journalforing/${j.id}`} className="journal-card">
              <div className="journal-card-top">
                <div className="journal-card-left">
                  <span className="horse-name">🐎 {horse?.name ?? '–'}</span>
                  <span className="customer-name">{customer?.name ?? '–'}</span>
                </div>
                <div className="journal-card-right">
                  <span className={`badge ${STATUS_CLASS[j.hovstatus]}`}>
                    {STATUS_LABEL[j.hovstatus]}
                  </span>
                </div>
              </div>
              <div className="journal-card-body">
                <div className="journal-rubrik">{j.rubrik}</div>
                <div className="journal-meta">
                  <span>{VISIT_LABEL[j.visitType]}</span>
                  <span>·</span>
                  <span>{formatDate(j.date)}</span>
                  {j.photos.length > 0 && <><span>·</span><span>📸 {j.photos.length} bilder</span></>}
                </div>
              </div>
              <div className="journal-card-footer">
                <span className="journal-price">{formatCurrency(j.price)}</span>
                {j.followUpDays && (
                  <span className="followup-chip">
                    🔁 Uppföljning om {j.followUpDays} dagar
                  </span>
                )}
              </div>
            </Link>
          );
        })}

        {journals.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <h2>Inga journalanteckningar ännu</h2>
            <p>Skapa din första anteckning direkt efter ett besök.</p>
            <Link to="/journalforing/ny" className="btn-primary">Skapa journalanteckning</Link>
          </div>
        )}
      </div>
    </div>
  );
}
