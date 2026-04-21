import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowLeft,
  Plus,
  Calendar,
  Image as ImageIcon,
  Receipt,
  Trash2,
} from 'lucide-react'
import {
  getHorseDetail,
  uploadTreatmentPhoto,
  deleteTreatment,
} from '@/server/functions'
import { PageContainer, PageHeader } from '@/components/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TREATMENT_TYPES } from '@/lib/types'
import { formatCurrency, formatDate, formatShortDate } from '@/lib/format'

export const Route = createFileRoute('/hastar/$id')({
  loader: async ({ params }) => getHorseDetail({ data: { id: params.id } }),
  component: HorseDetail,
})

function HorseDetail() {
  const { horse, customer, treatments } = Route.useLoaderData()
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)

  const unbilled = treatments.filter((t) => !t.invoiceId)
  const totalUnbilled = unbilled.reduce((s, t) => s + t.price, 0)

  async function handlePhotoUpload(treatmentId: string, file: File) {
    setUploadingFor(treatmentId)
    try {
      const fd = new FormData()
      fd.append('treatmentId', treatmentId)
      fd.append('photo', file)
      await uploadTreatmentPhoto({ data: fd })
      window.location.reload()
    } finally {
      setUploadingFor(null)
    }
  }

  async function handleDeleteTreatment(id: string) {
    if (!confirm('Ta bort behandlingen? Detta går inte att ångra.')) return
    await deleteTreatment({ data: { id } })
    window.location.reload()
  }

  return (
    <PageContainer>
      {customer ? (
        <Link
          to="/kunder/$id"
          params={{ id: customer.id }}
          className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {customer.name}
        </Link>
      ) : (
        <Link
          to="/kunder"
          className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Kunder
        </Link>
      )}

      <PageHeader
        title={horse.name}
        description={[horse.breed, horse.color, horse.birthYear].filter(Boolean).join(' · ')}
        actions={
          <Link to="/behandlingar/ny" search={{ horseId: horse.id }}>
            <Button>
              <Plus className="h-4 w-4" />
              Registrera behandling
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
          </CardHeader>
          <CardBody className="text-sm space-y-1.5 text-stone-700">
            <Row label="Ägare" value={customer?.name ?? '–'} />
            <Row label="Ras" value={horse.breed ?? '–'} />
            <Row label="Färg" value={horse.color ?? '–'} />
            <Row
              label="Födelseår"
              value={horse.birthYear ? String(horse.birthYear) : '–'}
            />
            <Row label="Disciplin" value={horse.discipline ?? '–'} />
            {horse.notes ? (
              <div className="pt-3 mt-3 border-t border-stone-100">
                <p className="text-xs uppercase tracking-wide text-stone-500 font-medium mb-1">
                  Viktig information
                </p>
                <p className="whitespace-pre-wrap">{horse.notes}</p>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Behandlingshistorik</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <Row
              label="Totalt antal"
              value={String(treatments.length)}
            />
            <Row
              label="Senaste besök"
              value={
                treatments[0] ? formatShortDate(treatments[0].date) : '–'
              }
            />
            <Row
              label="Icke fakturerat"
              value={formatCurrency(totalUnbilled)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Åtgärder</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            {customer ? (
              <Link to="/fakturor/ny" search={{ customerId: customer.id }}>
                <Button variant="outline" className="w-full justify-start">
                  <Receipt className="h-4 w-4" />
                  Fakturera icke fakturerade besök
                </Button>
              </Link>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Journal</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {treatments.length === 0 ? (
            <p className="p-5 text-sm text-stone-500">
              Inga behandlingar registrerade ännu.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {treatments.map((t) => (
                <li key={t.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge tone="amber">{TREATMENT_TYPES[t.type]}</Badge>
                        <span className="inline-flex items-center gap-1 text-sm text-stone-500">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(t.date)}
                        </span>
                        {t.invoiceId ? (
                          <Badge tone="emerald">Fakturerad</Badge>
                        ) : (
                          <Badge tone="neutral">Ej fakturerad</Badge>
                        )}
                      </div>
                      {t.notes ? (
                        <p className="text-sm text-stone-700 whitespace-pre-wrap">
                          {t.notes}
                        </p>
                      ) : null}
                      {t.followUpDate ? (
                        <p className="text-xs text-stone-500 mt-2">
                          Uppföljning planerad:{' '}
                          {formatShortDate(t.followUpDate)}
                        </p>
                      ) : null}

                      {t.photos.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {t.photos.map((p) => (
                            <a
                              key={p.key}
                              href={`/${p.key.replace(/^photos\//, 'api/photos/')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="block h-20 w-20 rounded-lg overflow-hidden border border-stone-200 hover:ring-2 hover:ring-amber-400"
                            >
                              <img
                                src={`/${p.key.replace(/^photos\//, 'api/photos/')}`}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 text-sm text-amber-800 hover:text-amber-900 cursor-pointer">
                          <ImageIcon className="h-4 w-4" />
                          {uploadingFor === t.id
                            ? 'Laddar upp...'
                            : 'Lägg till bild'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingFor === t.id}
                            onChange={(e) => {
                              const f = e.currentTarget.files?.[0]
                              if (f) handlePhotoUpload(t.id, f)
                            }}
                          />
                        </label>
                        {!t.invoiceId ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteTreatment(t.id)}
                            className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            Ta bort
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-semibold text-stone-900">
                        {formatCurrency(t.price)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </PageContainer>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-900">{value}</span>
    </div>
  )
}
