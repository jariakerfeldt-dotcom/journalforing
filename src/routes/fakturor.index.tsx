import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Receipt } from 'lucide-react'
import { getInvoices, getCustomers } from '@/server/functions'
import { PageContainer, PageHeader } from '@/components/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { InvoiceStatusBadge } from '@/components/ui/InvoiceStatusBadge'
import { formatCurrency, formatShortDate } from '@/lib/format'
import type { InvoiceStatus } from '@/lib/types'

interface Search {
  customerId?: string
  status?: InvoiceStatus | 'all'
}

export const Route = createFileRoute('/fakturor/')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    customerId:
      typeof search.customerId === 'string' ? search.customerId : undefined,
    status:
      search.status === 'betald' ||
      search.status === 'skickad' ||
      search.status === 'forfallen' ||
      search.status === 'utkast' ||
      search.status === 'all'
        ? search.status
        : undefined,
  }),
  loader: async () => {
    const [invoices, customers] = await Promise.all([
      getInvoices(),
      getCustomers(),
    ])
    return { invoices, customers }
  },
  component: InvoicesIndex,
})

function InvoicesIndex() {
  const { invoices, customers } = Route.useLoaderData()
  const { customerId, status } = Route.useSearch()
  const customerMap = new Map(customers.map((c) => [c.id, c]))

  const filter = status ?? 'all'
  const filtered = invoices.filter((inv) => {
    if (customerId && inv.customerId !== customerId) return false
    if (filter === 'all') return true
    return inv.status === filter
  })

  const unpaid = invoices.filter(
    (i) => i.status === 'skickad' || i.status === 'forfallen',
  )
  const unpaidTotal = unpaid.reduce((s, i) => s + i.total, 0)
  const overdueTotal = invoices
    .filter((i) => i.status === 'forfallen')
    .reduce((s, i) => s + i.total, 0)
  const paidTotal = invoices
    .filter((i) => i.status === 'betald')
    .reduce((s, i) => s + i.total, 0)

  const activeCustomer = customerId ? customerMap.get(customerId) : undefined

  return (
    <PageContainer>
      <PageHeader
        title="Fakturor"
        description={
          activeCustomer
            ? `Visar fakturor för ${activeCustomer.name}.`
            : 'Alla fakturor och deras status.'
        }
        actions={
          <Link to="/fakturor/ny">
            <Button>
              <Plus className="h-4 w-4" />
              Ny faktura
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <SummaryStat
          label="Obetalt totalt"
          value={formatCurrency(unpaidTotal)}
          tone="amber"
        />
        <SummaryStat
          label="Förfallet"
          value={formatCurrency(overdueTotal)}
          tone="red"
        />
        <SummaryStat
          label="Betalt totalt"
          value={formatCurrency(paidTotal)}
          tone="emerald"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FilterLink label="Alla" value="all" active={filter === 'all'} />
        <FilterLink
          label="Obetalda"
          value="skickad"
          active={filter === 'skickad'}
        />
        <FilterLink
          label="Förfallna"
          value="forfallen"
          active={filter === 'forfallen'}
        />
        <FilterLink
          label="Betalda"
          value="betald"
          active={filter === 'betald'}
        />
        {activeCustomer ? (
          <Link
            to="/fakturor"
            className="ml-auto text-sm text-stone-600 hover:text-stone-900"
          >
            Rensa filter
          </Link>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <Receipt className="h-10 w-10 text-stone-300 mx-auto" />
            <p className="text-stone-700 font-medium mt-3">
              Inga fakturor matchar
            </p>
            <p className="text-sm text-stone-500 mt-1">
              Prova ett annat filter eller skapa en ny faktura.
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="text-left font-medium px-5 py-3">Nr</th>
                    <th className="text-left font-medium px-5 py-3">Kund</th>
                    <th className="text-left font-medium px-5 py-3">
                      Utställd
                    </th>
                    <th className="text-left font-medium px-5 py-3">
                      Förfaller
                    </th>
                    <th className="text-left font-medium px-5 py-3">Status</th>
                    <th className="text-right font-medium px-5 py-3">Totalt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="hover:bg-stone-50">
                      <td className="px-5 py-3 font-medium text-stone-900">
                        <Link
                          to="/fakturor/$id"
                          params={{ id: inv.id }}
                          className="hover:text-amber-800"
                        >
                          #{inv.number}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-stone-700">
                        {customerMap.get(inv.customerId)?.name ?? 'Okänd'}
                      </td>
                      <td className="px-5 py-3 text-stone-600">
                        {formatShortDate(inv.issuedDate)}
                      </td>
                      <td className="px-5 py-3 text-stone-600">
                        {formatShortDate(inv.dueDate)}
                      </td>
                      <td className="px-5 py-3">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-stone-900">
                        {formatCurrency(inv.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </PageContainer>
  )
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'amber' | 'red' | 'emerald'
}) {
  const dot = {
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    emerald: 'bg-emerald-500',
  }[tone]
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <p className="text-xs uppercase tracking-wide text-stone-500 font-medium">
          {label}
        </p>
      </div>
      <p className="text-xl sm:text-2xl font-semibold text-stone-900 mt-1.5">
        {value}
      </p>
    </div>
  )
}

function FilterLink({
  label,
  value,
  active,
}: {
  label: string
  value: string
  active: boolean
}) {
  return (
    <Link
      to="/fakturor"
      search={{ status: value as InvoiceStatus | 'all' }}
      className={`px-3 h-9 inline-flex items-center rounded-full text-sm font-medium ring-1 ring-inset transition-colors ${
        active
          ? 'bg-stone-900 text-white ring-stone-900'
          : 'bg-white text-stone-700 ring-stone-300 hover:bg-stone-50'
      }`}
    >
      {label}
    </Link>
  )
}
