import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Mail, Phone, ArrowRight } from 'lucide-react'
import { getCustomers, getHorses } from '@/server/functions'
import { PageContainer, PageHeader } from '@/components/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export const Route = createFileRoute('/kunder/')({
  loader: async () => {
    const [customers, horses] = await Promise.all([getCustomers(), getHorses()])
    return { customers, horses }
  },
  component: CustomersIndex,
})

function CustomersIndex() {
  const { customers, horses } = Route.useLoaderData()
  const horsesByCustomer = new Map<string, number>()
  for (const h of horses) {
    horsesByCustomer.set(h.customerId, (horsesByCustomer.get(h.customerId) ?? 0) + 1)
  }

  return (
    <PageContainer>
      <PageHeader
        title="Kunder"
        description="Alla hästägare och anläggningar du arbetar för."
        actions={
          <Link to="/kunder/ny">
            <Button>
              <Plus className="h-4 w-4" />
              Ny kund
            </Button>
          </Link>
        }
      />

      {customers.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <p className="text-stone-700 font-medium">Inga kunder än</p>
            <p className="text-sm text-stone-500 mt-1">
              Lägg till din första kund för att komma igång.
            </p>
            <Link to="/kunder/ny" className="inline-block mt-4">
              <Button>
                <Plus className="h-4 w-4" />
                Skapa kund
              </Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.map((c) => (
            <Link
              key={c.id}
              to="/kunder/$id"
              params={{ id: c.id }}
              className="group block rounded-xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-stone-900 truncate">
                    {c.name}
                  </h3>
                  {c.orgNumber ? (
                    <p className="text-xs text-stone-500 mt-0.5">
                      Org.nr {c.orgNumber}
                    </p>
                  ) : null}
                </div>
                <Badge tone="amber">
                  {horsesByCustomer.get(c.id) ?? 0}{' '}
                  häst{(horsesByCustomer.get(c.id) ?? 0) === 1 ? '' : 'ar'}
                </Badge>
              </div>
              <div className="space-y-1.5 text-sm text-stone-600">
                {c.phone ? (
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-stone-400" />
                    {c.phone}
                  </p>
                ) : null}
                {c.email ? (
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 text-stone-400" />
                    {c.email}
                  </p>
                ) : null}
                {c.address ? (
                  <p className="text-stone-500 truncate">{c.address}</p>
                ) : null}
              </div>
              <div className="mt-4 flex items-center text-amber-800 text-sm font-medium">
                Öppna kundkort
                <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
