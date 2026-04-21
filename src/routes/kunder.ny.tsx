import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { FormEvent, useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { createCustomer } from '@/server/functions'
import { PageContainer, PageHeader } from '@/components/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Input, Textarea, Field } from '@/components/ui/Field'

export const Route = createFileRoute('/kunder/ny')({
  component: NewCustomerPage,
})

function NewCustomerPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    try {
      const customer = await createCustomer({
        data: {
          name: String(form.get('name') ?? '').trim(),
          email: String(form.get('email') ?? '').trim() || undefined,
          phone: String(form.get('phone') ?? '').trim() || undefined,
          address: String(form.get('address') ?? '').trim() || undefined,
          orgNumber: String(form.get('orgNumber') ?? '').trim() || undefined,
          notes: String(form.get('notes') ?? '').trim() || undefined,
        },
      })
      navigate({ to: '/kunder/$id', params: { id: customer.id } })
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
        Tillbaka till kunder
      </Link>
      <PageHeader
        title="Ny kund"
        description="Lägg till en ny hästägare eller anläggning."
      />

      <Card className="max-w-2xl">
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Namn *" htmlFor="name">
              <Input
                id="name"
                name="name"
                required
                placeholder="Förnamn Efternamn eller företagsnamn"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Telefon" htmlFor="phone">
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="070-123 45 67"
                />
              </Field>
              <Field label="E-post" htmlFor="email">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="namn@exempel.se"
                />
              </Field>
            </div>
            <Field label="Adress" htmlFor="address">
              <Input
                id="address"
                name="address"
                placeholder="Gatuadress, postnummer och ort"
              />
            </Field>
            <Field
              label="Personnummer / organisationsnummer"
              htmlFor="orgNumber"
              hint="Används på fakturor."
            >
              <Input id="orgNumber" name="orgNumber" placeholder="YYYYMMDD-XXXX" />
            </Field>
            <Field label="Anteckningar" htmlFor="notes">
              <Textarea
                id="notes"
                name="notes"
                placeholder="Allergier, viktig information, överenskommelser..."
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
                {submitting ? 'Sparar...' : 'Spara kund'}
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
