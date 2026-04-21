import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import {
  Users,
  PawPrint,
  Wrench,
  Banknote,
  AlertCircle,
  ArrowRight,
  Plus,
} from 'lucide-react'
import {
  getDashboard,
  getTreatments,
  getCustomers,
  getInvoices,
  getHorses,
} from '@/server/functions'
import { TREATMENT_TYPES } from '@/lib/types'
import { formatCurrency, formatShortDate } from '@/lib/format'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { InvoiceStatusBadge } from '@/components/ui/InvoiceStatusBadge'
import { PageContainer, PageHeader } from '@/components/AppShell'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

export const Route = createFileRoute('/')({
  loader: async () => {
    const [stats, treatments, customers, invoices, horses] = await Promise.all([
      getDashboard(),
      getTreatments(),
      getCustomers(),
      getInvoices(),
      getHorses(),
    ])
    return { stats, treatments, customers, invoices, horses }
  },
  component: DashboardPage,
})

const MONTH_LABELS = [
  'jan', 'feb', 'mar', 'apr', 'maj', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
]

function monthLabel(key: string) {
  const month = parseInt(key.slice(5, 7), 10) - 1
  return MONTH_LABELS[month] ?? key
}

function DashboardPage() {
  const { stats, treatments, customers, invoices, horses } = Route.useLoaderData()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const customerMap = new Map(customers.map((c) => [c.id, c]))
  const horseMap = new Map(horses.map((h) => [h.id, h]))

  const recentTreatments = treatments.slice(0, 5)
  const overdue = invoices.filter((i) => i.status === 'forfallen')
  const unpaid = invoices.filter(
    (i) => i.status === 'skickad' || i.status === 'forfallen',
  )

  const chartData = {
    labels: stats.monthlyRevenue.map((m) => monthLabel(m.month)),
    datasets: [
      {
        label: 'Intäkter (SEK)',
        data: stats.monthlyRevenue.map((m) => m.amount),
        borderColor: 'rgb(180, 83, 9)',
        backgroundColor: 'rgba(180, 83, 9, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: 'rgb(180, 83, 9)',
        pointRadius: 4,
      },
    ],
  }

  return (
    <PageContainer>
      <PageHeader
        title="Stallet i översikt"
        description="Snabb koll på dagens arbete, obetalda fakturor och intäkter från senaste månaderna."
        actions={
          <>
            <Link to="/behandlingar/ny">
              <Button>
                <Plus className="h-4 w-4" />
                Ny behandling
              </Button>
            </Link>
            <Link to="/fakturor/ny">
              <Button variant="outline">Skapa faktura</Button>
            </Link>
          </>
        }
      />

      {overdue.length > 0 ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">
              {overdue.length} faktur{overdue.length === 1 ? 'a' : 'or'} har
              förfallit
            </p>
            <p className="text-sm text-red-800/80">
              Totalt{' '}
              {formatCurrency(overdue.reduce((s, i) => s + i.total, 0))} väntar
              på betalning.
            </p>
          </div>
          <Link to="/fakturor">
            <Button variant="outline" size="sm">
              Visa fakturor
            </Button>
          </Link>
        </div>
      ) : null}

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          title="Aktiva kunder"
          value={String(stats.activeCustomers)}
          icon={Users}
          accent="bg-emerald-100 text-emerald-800"
        />
        <StatCard
          title="Hästar i journal"
          value={String(stats.totalHorses)}
          icon={PawPrint}
          accent="bg-amber-100 text-amber-800"
        />
        <StatCard
          title="Behandlingar denna månad"
          value={String(stats.treatmentsThisMonth)}
          icon={Wrench}
          accent="bg-blue-100 text-blue-800"
        />
        <StatCard
          title="Obetalt"
          value={formatCurrency(stats.unpaidTotal)}
          hint={`${stats.unpaidCount} faktur${stats.unpaidCount === 1 ? 'a' : 'or'}`}
          icon={Banknote}
          accent="bg-red-100 text-red-800"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Intäkter, senaste 6 månaderna</CardTitle>
            <span className="text-sm text-stone-500">
              Utifrån betalda fakturor
            </span>
          </CardHeader>
          <CardBody>
            {mounted ? (
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => formatCurrency(ctx.parsed.y ?? 0),
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(0,0,0,0.04)' },
                    },
                    x: { grid: { display: false } },
                  },
                }}
              />
            ) : (
              <div className="h-64" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Väntande betalningar</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {unpaid.length === 0 ? (
              <div className="p-5 text-sm text-stone-500">
                Inga obetalda fakturor just nu.
              </div>
            ) : (
              <ul className="divide-y divide-stone-100">
                {unpaid.slice(0, 5).map((inv) => (
                  <li key={inv.id}>
                    <Link
                      to="/fakturor/$id"
                      params={{ id: inv.id }}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-stone-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-900 truncate">
                          {customerMap.get(inv.customerId)?.name ?? 'Okänd'}
                        </p>
                        <p className="text-xs text-stone-500">
                          #{inv.number} · förfaller{' '}
                          {formatShortDate(inv.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-stone-900">
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

      <Card className="mt-4 sm:mt-6">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Senaste behandlingar</CardTitle>
          <Link
            to="/behandlingar"
            className="text-sm font-medium text-amber-800 hover:text-amber-900 inline-flex items-center gap-1"
          >
            Alla behandlingar <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardBody className="p-0">
          {recentTreatments.length === 0 ? (
            <div className="p-5 text-sm text-stone-500">
              Inga behandlingar registrerade ännu.
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {recentTreatments.map((t) => {
                const horse = horseMap.get(t.horseId)
                const customer = customerMap.get(t.customerId)
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge tone="amber">{TREATMENT_TYPES[t.type]}</Badge>
                        <Link
                          to="/hastar/$id"
                          params={{ id: t.horseId }}
                          className="text-sm font-semibold text-stone-900 hover:underline"
                        >
                          {horse?.name ?? 'Okänd häst'}
                        </Link>
                        <span className="text-xs text-stone-500">
                          · {customer?.name ?? 'Okänd'}
                        </span>
                      </div>
                      {t.notes ? (
                        <p className="mt-1 text-sm text-stone-600 line-clamp-2">
                          {t.notes}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right text-sm shrink-0">
                      <p className="text-stone-500">
                        {formatShortDate(t.date)}
                      </p>
                      <p className="font-semibold text-stone-900">
                        {formatCurrency(t.price)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </PageContainer>
  )
}

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  title: string
  value: string
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-500 font-medium">
          {title}
        </p>
        <p className="text-xl sm:text-2xl font-semibold text-stone-900 mt-1">
          {value}
        </p>
        {hint ? (
          <p className="text-xs text-stone-500 mt-0.5">{hint}</p>
        ) : null}
      </div>
    </div>
  )
}
