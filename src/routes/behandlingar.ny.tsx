import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { FormEvent, useMemo, useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import {
  createTreatment,
  getCustomers,
  getHorses,
} from '@/server/functions'
import { PageContainer, PageHeader } from '@/components/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Input, Select, Textarea, Field } from '@/components/ui/Field'
import {
  DEFAULT_PRICES,
  TREATMENT_TYPES,
  type TreatmentType,
} from '@/lib/types'
import { todayISO } from '@/lib/format'

interface Search {
  horseId?: string
  customerId?: string
}

export const Route = createFileRoute('/behandlingar/ny')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    horseId: typeof search.horseId === 'string' ? search.horseId : undefined,
    customerId:
      typeof search.customerId === 'string' ? search.customerId : undefined,
  }),
  loader: async () => {
    const [customers, horses] = await Promise.all([getCustomers(), getHorses()])
    return { customers, horses }
  },
  component: NewTreatmentPage,
})

function NewTreatmentPage() {
  const { customers, horses } = Route.useLoaderData()
  const preselected = Route.useSearch()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const preselectedHorse = preselected.horseId
    ? horses.find((h) => h.id === preselected.horseId)
    : undefined
  const initialCustomerId =
    preselected.customerId ?? preselectedHorse?.customerId ?? ''
  const [customerId, setCustomerId] = useState(initialCustomerId)
  const [horseId, setHorseId] = useState(preselected.horseId ?? '')
  const [type, setType] = useState<TreatmentType>('skoning')
  const [price, setPrice] = useState<string>(
    String(DEFAULT_PRICES.skoning),
  )

  const horsesForCustomer = useMemo(
    () => horses.filter((h) => !customerId || h.customerId === customerId),
    [horses, customerId],
  )

  function onCustomerChange(id: string) {
    setCustomerId(id)
    setHorseId('')
  }

  function onTypeChange(next: TreatmentType) {
    setType(next)
    setPrice(String(DEFAULT_PRICES[next]))
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    try {
      const treatment = await createTreatment({
        data: {
          horseId: String(form.get('horseId')),
          type,
          date: String(form.get('date') || todayISO()),
          price: Number(form.get('price')) || 0,
          notes: String(form.get('notes') ?? '').trim() || undefined,
          followUpDate:
            String(form.get('followUpDate') ?? '').trim() || undefined,
        },
      })
      navigate({ to: '/hastar/$id', params: { id: treatment.horseId } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
      setSubmitting(false)
    }
  }

  return (
    <PageContainer>
      <Link
        to="/behandlingar"
        className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Behandlingar
      </Link>
      <PageHeader
        title="Ny behandling"
        description="Registrera arbete direkt vid hästen."
      />

      <Card className="max-w-2xl">
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Kund *" htmlFor="customerId">
                <Select
                  id="customerId"
                  name="customerId"
                  required
                  value={customerId}
                  onChange={(e) => onCustomerChange(e.target.value)}
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
              <Field label="Häst *" htmlFor="horseId">
                <Select
                  id="horseId"
                  name="horseId"
                  required
                  value={horseId}
                  onChange={(e) => setHorseId(e.target.value)}
                  disabled={!customerId}
                >
                  <option value="" disabled>
                    {customerId ? 'Välj häst...' : 'Välj kund först'}
                  </option>
                  {horsesForCustomer.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Typ *" htmlFor="type">
                <Select
                  id="type"
                  name="type"
                  value={type}
                  onChange={(e) => onTypeChange(e.target.value as TreatmentType)}
                >
                  {Object.entries(TREATMENT_TYPES).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Datum *" htmlFor="date">
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={todayISO()}
                />
              </Field>
              <Field label="Pris (SEK) *" htmlFor="price">
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="10"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Field>
            </div>

            <Field
              label="Anteckningar"
              htmlFor="notes"
              hint="Dokumentera det som är värt att minnas inför nästa besök."
            >
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Ex: Ny skoning fram och bak. Hovarna i gott skick, svagt ojämn belastning på vänster fram..."
              />
            </Field>

            <Field
              label="Planerad uppföljning"
              htmlFor="followUpDate"
              hint="Valfritt – dyker upp som påminnelse senare."
            >
              <Input
                id="followUpDate"
                name="followUpDate"
                type="date"
              />
            </Field>

            {error ? (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            ) : null}

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                <Save className="h-4 w-4" />
                {submitting ? 'Sparar...' : 'Spara behandling'}
              </Button>
              <Link to="/behandlingar">
                <Button type="button" variant="ghost">
                  Avbryt
                </Button>
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </PageContainer>
  )
}
