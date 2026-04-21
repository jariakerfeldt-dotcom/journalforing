import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Plus,
  Receipt,
  FileText,
} from 'lucide-react'
import { getCustomerDetail } from '@/server/functions'
import { PageContainer, PageHeader } from '@/components/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { InvoiceStatusBadge } from '@/components/ui/InvoiceStatusBadge'
import { TREATMENT_TYPES } from '@/lib/types'
import { formatCurrency, formatShortDate } from '@/lib/format'

export const Route = createFileRoute('/kunder/$id')({
  loader: async ({ params }) => getCustomerDetail({ data: { id: params.id } }),
  component: CustomerDetail,
})

function CustomerDetail() {
  const { customer, horses, treatments, invoices } = Route.useLoaderData()
  const horseMap = new Map(horses.map((h) => [h.id, h]))

  const unpaidTotal = invoices
    .filter((i) => i.status !== 'betald' && i.status !== 'utkast')
    .reduce((s, i) => s + i.total, 0)

  const totalSpent = invoices
    .filter((i) => i.status === 'betald')
    .reduce((s, i) => s + i.total, 0)

  return (
    <PageContainer>
      <Link
        to="/kunder"
        className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Alla kunder
      </Link>

      <PageHeader
        title={customer.name}
        description={customer.orgNumber ? `Org.nr ${customer.orgNumber}` : undefined}
        actions={
          <>
            <Link
              to="/hastar/ny"
              search={{ customerId: customer.id }}
            >
              <Button variant="outline">
                <Plus className="h-4 w-4" />
                Ny häst
              </Button>
            </Link>
            <Link
              to="/behandlingar/ny"
              search={{ customerId: customer.id }}
            >
              <Button>
                <Plus className="h-4 w-4" />
                Ny behandling
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Kontakt</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2.5 text-sm">
            {customer.phone ? (
              <p className="flex items-center gap-2 text-stone-700">
                <Phone className="h-4 w-4 text-stone-400" />
                <a
                  href={`tel:${customer.phone.replace(/\s/g, '')}`}
                  className="hover:text-amber-800"
                >
                  {customer.phone}
                </a>
              </p>
            ) : null}
            {customer.email ? (
              <p className="flex items-center gap-2 text-stone-700">
                <Mail className="h-4 w-4 text-stone-400" />
                <a
                  href={`mailto:${customer.email}`}
                  className="hover:text-amber-800 truncate"
                >
                  {customer.email}
                </a>
              </p>
            ) : null}
            {customer.address ? (
              <p className="flex items-start gap-2 text-stone-700">
                <MapPin className="h-4 w-4 text-stone-400 mt-0.5" />
                <span>{customer.address}</span>
              </p>
            ) : null}
            {customer.notes ? (
              <div className="mt-3 pt-3 border-t border-stone-100">
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">
                  Anteckningar
                </p>
                <p className="text-stone-700 whitespace-pre-wrap">
                  {customer.notes}
                </p>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ekonomi</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500 font-medium">
                Utestående
              </p>
              <p className="text-2xl font-semibold text-stone-900">
                {formatCurrency(unpaidTotal)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500 font-medium">
                Totalt fakturerat (betalt)
              </p>
              <p className="text-lg font-semibold text-stone-900">
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500 font-medium">
                Behandlingar totalt
              </p>
              <p className="text-lg font-semibold text-stone-900">
                {treatments.length}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Snabbåtgärder</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            <Link to="/fakturor/ny" search={{ customerId: customer.id }}>
              <Button variant="outline" className="w-full justify-start">
                <Receipt className="h-4 w-4" />
                Skapa faktura för obetalda behandlingar
              </Button>
            </Link>
            <Link to="/fakturor" search={{ customerId: customer.id }}>
              <Button variant="ghost" className="w-full justify-start">
                <FileText className="h-4 w-4" />
                Visa alla fakturor
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Hästar</CardTitle>
            <Link to="/hastar/ny" search={{ customerId: customer.id }}>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
                Lägg till
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {horses.length === 0 ? (
              <p className="p-5 text-sm text-stone-500">
                Inga hästar registrerade för den här kunden än.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {horses.map((h) => (
                  <li key={h.id}>
                    <Link
                      to="/hastar/$id"
                      params={{ id: h.id }}
                      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-stone-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-900">{h.name}</p>
                        <p className="text-sm text-stone-500">
                          {[h.breed, h.color, h.birthYear].filter(Boolean).join(' · ') ||
                            'Ingen beskrivning'}
                        </p>
                      </div>
                      {h.discipline ? (
                        <Badge tone="emerald">{h.discipline}</Badge>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Senaste behandlingar</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {treatments.length === 0 ? (
              <p className="p-5 text-sm text-stone-500">Inga behandlingar än.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {treatments.slice(0, 8).map((t) => (
                  <li
                    key={t.id}
                    className="px-5 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge tone="amber">{TREATMENT_TYPES[t.type]}</Badge>
                        <span className="text-sm font-medium text-stone-800">
                          {horseMap.get(t.horseId)?.name ?? '–'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {formatShortDate(t.date)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-stone-900">
                      {formatCurrency(t.price)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fakturor</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {invoices.length === 0 ? (
              <p className="p-5 text-sm text-stone-500">Inga fakturor än.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {invoices.map((inv) => (
                  <li key={inv.id}>
                    <Link
                      to="/fakturor/$id"
                      params={{ id: inv.id }}
                      className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-stone-50"
                    >
                      <div>
                        <p className="font-medium text-stone-900">
                          #{inv.number}
                        </p>
                        <p className="text-xs text-stone-500">
                          {formatShortDate(inv.issuedDate)} · förfaller{' '}
                          {formatShortDate(inv.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-stone-900">
                          {formatCurrency(inv.total)}
                        </p>
                        <InvoiceStatusBadge status={inv.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  )
}
