import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { FormEvent, useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { createHorse, getCustomers } from '@/server/functions'
import { PageContainer, PageHeader } from '@/components/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Input, Select, Textarea, Field } from '@/components/ui/Field'

interface Search {
  customerId?: string
}

export const Route = createFileRoute('/hastar/ny')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    customerId:
      typeof search.customerId === 'string' ? search.customerId : undefined,
  }),
  loader: async () => ({ customers: await getCustomers() }),
  component: NewHorsePage,
})

function NewHorsePage() {
  const { customers } = Route.useLoaderData()
  const { customerId: preselected } = Route.useSearch()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    try {
      const horse = await createHorse({
        data: {
          customerId: String(form.get('customerId')),
          name: String(form.get('name') ?? '').trim(),
          breed: String(form.get('breed') ?? '').trim() || undefined,
          color: String(form.get('color') ?? '').trim() || undefined,
          birthYear: form.get('birthYear')
            ? Number(form.get('birthYear'))
            : undefined,
          discipline:
            String(form.get('discipline') ?? '').trim() || undefined,
          notes: String(form.get('notes') ?? '').trim() || undefined,
        },
      })
      navigate({ to: '/hastar/$id', params: { id: horse.id } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
      setSubmitting(false)
    }
  }

  return (
    <PageContainer>
      <Link
        to="/kunder"
        className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Tillbaka
      </Link>
      <PageHeader title="Ny häst" description="Registrera en ny häst i journalen." />

      <Card className="max-w-2xl">
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Ägare *" htmlFor="customerId">
              <Select
                id="customerId"
                name="customerId"
                required
                defaultValue={preselected ?? ''}
              >
                <option value="" disabled>
                  Välj ägare...
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Namn *" htmlFor="name">
              <Input id="name" name="name" required />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Ras" htmlFor="breed">
                <Input id="breed" name="breed" placeholder="T.ex. Svenskt varmblod" />
              </Field>
              <Field label="Färg" htmlFor="color">
                <Input id="color" name="color" placeholder="T.ex. Brun" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Födelseår" htmlFor="birthYear">
                <Input
                  id="birthYear"
                  name="birthYear"
                  type="number"
                  min="1980"
                  max="2100"
                  placeholder="2018"
                />
              </Field>
              <Field label="Disciplin" htmlFor="discipline">
                <Input
                  id="discipline"
                  name="discipline"
                  placeholder="Hoppning, dressyr..."
                />
              </Field>
            </div>
            <Field label="Anteckningar" htmlFor="notes">
              <Textarea
                id="notes"
                name="notes"
                placeholder="Särskild hänsyn, tidigare problem, önskemål..."
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
                {submitting ? 'Sparar...' : 'Spara häst'}
              </Button>
              <Link to="/kunder">
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
