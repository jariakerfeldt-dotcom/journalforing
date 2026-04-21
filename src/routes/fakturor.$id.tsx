import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  getInvoiceDetail,
  markInvoicePaid,
  markInvoiceUnpaid,
  deleteInvoice,
} from '@/server/functions'
import { PageContainer } from '@/components/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { InvoiceStatusBadge } from '@/components/ui/InvoiceStatusBadge'
import { formatCurrency, formatDate, formatShortDate } from '@/lib/format'

export const Route = createFileRoute('/fakturor/$id')({
  loader: async ({ params }) => getInvoiceDetail({ data: { id: params.id } }),
  component: InvoiceDetail,
})

function InvoiceDetail() {
  const { invoice, customer, horses } = Route.useLoaderData()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  async function handleMarkPaid() {
    setBusy(true)
    await markInvoicePaid({ data: { id: invoice.id } })
    window.location.reload()
  }

  async function handleMarkUnpaid() {
    setBusy(true)
    await markInvoiceUnpaid({ data: { id: invoice.id } })
    window.location.reload()
  }

  async function handleDelete() {
    if (!confirm('Ta bort fakturan? Behandlingar kopplas loss.')) return
    setBusy(true)
    await deleteInvoice({ data: { id: invoice.id } })
    navigate({ to: '/fakturor' })
  }

  const horseNames = horses.map((h) => h.name).join(', ')

  return (
    <PageContainer>
      <div className="no-print mb-4 flex items-center justify-between">
        <Link
          to="/fakturor"
          className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Fakturor
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {invoice.status !== 'betald' ? (
            <Button onClick={handleMarkPaid} disabled={busy}>
              <CheckCircle2 className="h-4 w-4" />
              Markera som betald
            </Button>
          ) : (
            <Button variant="outline" onClick={handleMarkUnpaid} disabled={busy}>
              <RotateCcw className="h-4 w-4" />
              Ångra betalning
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => window.print()}
            disabled={busy}
          >
            <Printer className="h-4 w-4" />
            Skriv ut
          </Button>
          <Button variant="ghost" onClick={handleDelete} disabled={busy}>
            <Trash2 className="h-4 w-4" />
            Ta bort
          </Button>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardBody className="p-6 sm:p-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-stone-200">
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-800 font-semibold">
                Hovjournal
              </p>
              <h1 className="text-3xl font-semibold text-stone-900 tracking-tight mt-1">
                Faktura #{invoice.number}
              </h1>
              <div className="mt-2">
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </div>
            <div className="text-sm text-stone-600 space-y-0.5 sm:text-right">
              <p>
                <span className="text-stone-500">Utställd:</span>{' '}
                <span className="font-medium text-stone-900">
                  {formatDate(invoice.issuedDate)}
                </span>
              </p>
              <p>
                <span className="text-stone-500">Förfaller:</span>{' '}
                <span className="font-medium text-stone-900">
                  {formatDate(invoice.dueDate)}
                </span>
              </p>
              {invoice.paidDate ? (
                <p>
                  <span className="text-stone-500">Betald:</span>{' '}
                  <span className="font-medium text-emerald-700">
                    {formatShortDate(invoice.paidDate)}
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          {/* Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-stone-200">
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500 font-medium mb-2">
                Faktureras till
              </p>
              <p className="font-semibold text-stone-900">
                {customer?.name ?? '–'}
              </p>
              {customer?.orgNumber ? (
                <p className="text-sm text-stone-600">
                  Org.nr {customer.orgNumber}
                </p>
              ) : null}
              {customer?.address ? (
                <p className="text-sm text-stone-600 whitespace-pre-wrap">
                  {customer.address}
                </p>
              ) : null}
              {customer?.email ? (
                <p className="text-sm text-stone-600">{customer.email}</p>
              ) : null}
            </div>
            {horseNames ? (
              <div>
                <p className="text-xs uppercase tracking-wider text-stone-500 font-medium mb-2">
                  Avser
                </p>
                <p className="text-sm text-stone-700">{horseNames}</p>
              </div>
            ) : null}
          </div>

          {/* Lines */}
          <div className="py-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-stone-500">
                  <th className="pb-3 font-medium">Beskrivning</th>
                  <th className="pb-3 font-medium text-right">Belopp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {invoice.lines.map((line, idx) => (
                  <tr key={idx}>
                    <td className="py-3 text-stone-800">{line.description}</td>
                    <td className="py-3 text-stone-900 font-medium text-right">
                      {formatCurrency(line.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-stone-200 pt-4">
            <div className="ml-auto max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600">Delsumma</span>
                <span className="font-medium text-stone-900">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Moms (25%)</span>
                <span className="font-medium text-stone-900">
                  {formatCurrency(invoice.vat)}
                </span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-stone-200">
                <span className="font-semibold text-stone-900">
                  Att betala
                </span>
                <span className="font-semibold text-stone-900">
                  {formatCurrency(invoice.total)}
                </span>
              </div>
            </div>
          </div>

          {invoice.notes ? (
            <div className="mt-8 pt-6 border-t border-stone-200">
              <p className="text-xs uppercase tracking-wider text-stone-500 font-medium mb-2">
                Meddelande
              </p>
              <p className="text-sm text-stone-700 whitespace-pre-wrap">
                {invoice.notes}
              </p>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </PageContainer>
  )
}
