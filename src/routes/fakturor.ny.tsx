import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { FormEvent, useMemo, useState } from 'react'
import { ArrowLeft, Receipt } from 'lucide-react'
import {
  createInvoiceFromTreatments,
  getCustomers,
  getHorses,
  getTreatments,
} from '@/server/functions'
import { PageContainer, PageHeader } from '@/components/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input, Select, Textarea, Field } from '@/components/ui/Field'
import { TREATMENT_TYPES } from '@/lib/types'
import { formatCurrency, formatShortDate } from '@/lib/format'

interface Search {
  customerId?: string
}

export const Route = createFileRoute('/fakturor/ny')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    customerId:
      typeof search.customerId === 'string' ? search.customerId : undefined,
  }),
  loader: async () => {
    const [customers, horses, treatments] = await Promise.all([
      getCustomers(),
      getHorses(),
      getTreatments(),
    ])
    return { customers, horses, treatments }
  },
  component: NewInvoicePage,
})

function NewInvoicePage() {
  const { customers, horses, treatments } = Route.useLoaderData()
  const { customerId: initialCustomerId } = Route.useSearch()
  const navigate = useNavigate()
  const horseMap = new Map(horses.map((h) => [h.id, h]))

  const [customerId, setCustomerId] = useState(initialCustomerId ?? '')
  const [dueInDays, setDueInDays] = useState('30')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const customerTreatments = useMemo(
    () =>
      treatments.filter(
        (t) => t.customerId === customerId && !t.invoiceId,
      ),
    [treatments, customerId],
  )

  const totals = useMemo(() => {
    const subtotal = customerTreatments
      .filter((t) => selected.has(t.id))
      .reduce((s, t) => s + t.price, 0)
    const vat = Math.round(subtotal * 0.25)
    return { subtotal, vat, total: subtotal + vat }
  }, [customerTreatments, selected])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === customerTreatments.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(customerTreatments.map((t) => t.id)))
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!customerId) {
      setError('Välj en kund.')
      return
    }
    if (selected.size === 0) {
      setError('Välj minst en behandling att fakturera.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const invoice = await createInvoiceFromTreatments({
        data: {
          customerId,
          treatmentIds: Array.from(selected),
          dueInDays: Number(dueInDays) || 30,
          notes: notes.trim() || undefined,
        },
      })
      navigate({ to: '/fakturor/$id', params: { id: invoice.id } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
      setSubmitting(false)
    }
  }

  return (
    <PageContainer>
      <Link
        to="/fakturor"
        className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Fakturor
      </Link>
      <PageHeader
        title="Ny faktura"
        description="Fakturera utförda behandlingar med ett klick."
      />

      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kund</CardTitle>
            </CardHeader>
            <CardBody>
              <Field label="Välj kund *" htmlFor="customerId">
                <Select
                  id="customerId"
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value)
                    setSelected(new Set())
                  }}
                  required
                >
                  <option value="" disabled>
                    Välj kund...
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Välj behandlingar</CardTitle>
              {customerTreatments.length > 0 ? (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-sm font-medium text-amber-800 hover:text-amber-900"
                >
                  {selected.size === customerTreatments.length
                    ? 'Avmarkera alla'
                    : 'Markera alla'}
                </button>
              ) : null}
            </CardHeader>
            <CardBody className="p-0">
              {!customerId ? (
                <p className="p-5 text-sm text-stone-500">
                  Välj en kund för att se ofakturerade behandlingar.
                </p>
              ) : customerTreatments.length === 0 ? (
                <div className="p-8 text-center">
                  <Receipt className="h-8 w-8 text-stone-300 mx-auto" />
                  <p className="text-sm text-stone-600 mt-2">
                    Inga ofakturerade behandlingar för denna kund.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {customerTreatments.map((t) => {
                    const isChecked = selected.has(t.id)
                    return (
                      <li key={t.id}>
                        <label className="flex items-start gap-4 px-5 py-4 hover:bg-stone-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggle(t.id)}
                            className="mt-1 h-4 w-4 rounded border-stone-400 text-amber-700 focus:ring-amber-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-stone-900">
                                {horseMap.get(t.horseId)?.name ?? '–'}
                              </span>
                              <span className="text-sm text-stone-500">
                                {TREATMENT_TYPES[t.type]}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5">
                              {formatShortDate(t.date)}
                            </p>
                            {t.notes ? (
                              <p className="text-sm text-stone-600 mt-1 line-clamp-1">
                                {t.notes}
                              </p>
                            ) : null}
                          </div>
                          <p className="font-semibold text-stone-900 shrink-0">
                            {formatCurrency(t.price)}
                          </p>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detaljer</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <Field
                label="Betalningsvillkor (dagar)"
                htmlFor="dueInDays"
                hint="Antal dagar tills fakturan förfaller."
              >
                <Input
                  id="dueInDays"
                  type="number"
                  min="0"
                  max="120"
                  step="1"
                  value={dueInDays}
                  onChange={(e) => setDueInDays(e.target.value)}
                />
              </Field>
              <Field label="Meddelande till kund" htmlFor="notes">
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Valfritt: Tack för ditt förtroende, kontaktuppgifter..."
                />
              </Field>
            </CardBody>
          </Card>
        </div>

        <div>
          <div className="lg:sticky lg:top-6">
            <Card>
              <CardHeader>
                <CardTitle>Sammanfattning</CardTitle>
              </CardHeader>
              <CardBody className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">Antal rader</span>
                  <span className="font-medium text-stone-900">
                    {selected.size}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Delsumma</span>
                  <span className="font-medium text-stone-900">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Moms (25%)</span>
                  <span className="font-medium text-stone-900">
                    {formatCurrency(totals.vat)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-200">
                  <span className="font-semibold text-stone-900">
                    Att fakturera
                  </span>
                  <span className="font-semibold text-stone-900">
                    {formatCurrency(totals.total)}
                  </span>
                </div>

                {error ? (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
                    {error}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  className="w-full mt-3"
                  disabled={submitting || selected.size === 0 || !customerId}
                >
                  <Receipt className="h-4 w-4" />
                  {submitting ? 'Skapar...' : 'Skapa faktura'}
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
    </PageContainer>
  )
}
