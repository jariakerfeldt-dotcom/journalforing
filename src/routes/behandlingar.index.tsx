import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Calendar } from 'lucide-react'
import {
  getTreatments,
  getHorses,
  getCustomers,
} from '@/server/functions'
import { PageContainer, PageHeader } from '@/components/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TREATMENT_TYPES } from '@/lib/types'
import { formatCurrency, formatShortDate } from '@/lib/format'

export const Route = createFileRoute('/behandlingar/')({
  loader: async () => {
    const [treatments, horses, customers] = await Promise.all([
      getTreatments(),
      getHorses(),
      getCustomers(),
    ])
    return { treatments, horses, customers }
  },
  component: TreatmentsIndex,
})

function TreatmentsIndex() {
  const { treatments, horses, customers } = Route.useLoaderData()
  const horseMap = new Map(horses.map((h) => [h.id, h]))
  const customerMap = new Map(customers.map((c) => [c.id, c]))

  // Group by month
  const groups = new Map<string, typeof treatments>()
  for (const t of treatments) {
    const key = t.date.slice(0, 7)
    const list = groups.get(key) ?? []
    list.push(t)
    groups.set(key, list)
  }
  const MONTHS = [
    'januari',
    'februari',
    'mars',
    'april',
    'maj',
    'juni',
    'juli',
    'augusti',
    'september',
    'oktober',
    'november',
    'december',
  ]
  const formatMonthKey = (key: string) => {
    const [y, m] = key.split('-')
    return `${MONTHS[parseInt(m, 10) - 1]} ${y}`
  }

  return (
    <PageContainer>
      <PageHeader
        title="Behandlingar"
        description="Journalposter i kronologisk ordning – senaste överst."
        actions={
          <Link to="/behandlingar/ny">
            <Button>
              <Plus className="h-4 w-4" />
              Registrera behandling
            </Button>
          </Link>
        }
      />

      {treatments.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <p className="text-stone-700 font-medium">Inga behandlingar än</p>
            <p className="text-sm text-stone-500 mt-1">
              Registrera din första behandling direkt vid hästen.
            </p>
            <Link to="/behandlingar/ny" className="inline-block mt-4">
              <Button>
                <Plus className="h-4 w-4" />
                Ny behandling
              </Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([month, list]) => (
            <div key={month}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-3 capitalize">
                {formatMonthKey(month)}
              </h2>
              <Card>
                <CardBody className="p-0">
                  <ul className="divide-y divide-stone-100">
                    {list.map((t) => {
                      const horse = horseMap.get(t.horseId)
                      const customer = customerMap.get(t.customerId)
                      return (
                        <li key={t.id}>
                          <Link
                            to="/hastar/$id"
                            params={{ id: t.horseId }}
                            className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-800 shrink-0">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-stone-900">
                                  {horse?.name ?? 'Okänd'}
                                </span>
                                <Badge tone="amber">
                                  {TREATMENT_TYPES[t.type]}
                                </Badge>
                                {t.invoiceId ? (
                                  <Badge tone="emerald">Fakturerad</Badge>
                                ) : null}
                              </div>
                              <p className="text-xs text-stone-500 mt-0.5">
                                {customer?.name} · {formatShortDate(t.date)}
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
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
