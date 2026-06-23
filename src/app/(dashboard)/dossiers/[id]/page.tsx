import { getDossier, deleteDossier } from '@/lib/actions/dossiers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Folder, FileText, Users, Pencil, Trash2, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  brouillon: { label: 'Brouillon', color: '#6b7280' },
  envoye:    { label: 'Envoyé',    color: '#3b82f6' },
  accepte:   { label: 'Accepté',   color: '#10b981' },
  refuse:    { label: 'Refusé',    color: '#ef4444' },
  expire:    { label: 'Expiré',    color: '#0ea5e9' },
}

export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dossier = await getDossier(id)
  if (!dossier) notFound()

  const client = dossier.clients as { id: string; nom: string; email: string; telephone: string } | null
  const devisList = (dossier.devis ?? []) as Array<{
    id: string
    numero: string
    statut: string
    created_at: string
    clients: { nom: string } | null
  }>

  const deleteWithId = deleteDossier.bind(null, id)

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: '#0a0d16' }}>
      <div className="px-6 pt-8 pb-6">
        <Link
          href="/dossiers"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors hover:text-white"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <ArrowLeft size={14} />
          Retour aux dossiers
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.12)' }}
            >
              <Folder size={20} style={{ color: '#0ea5e9' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{dossier.nom}</h1>
              {dossier.description && (
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {dossier.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dossiers/${id}/modifier`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}
            >
              <Pencil size={13} />
              Modifier
            </Link>
            <form action={deleteWithId}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all hover:bg-red-500/20"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#ef4444' }}
                onClick={e => {
                  if (!confirm('Supprimer ce dossier ? Les devis ne seront pas supprimés.')) e.preventDefault()
                }}
              >
                <Trash2 size={13} />
                Supprimer
              </button>
            </form>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Client card */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} style={{ color: '#0ea5e9' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Client
              </span>
            </div>
            {client ? (
              <div>
                <p className="text-white font-semibold text-sm">{client.nom}</p>
                {client.email && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{client.email}</p>}
                {client.telephone && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{client.telephone}</p>}
                <Link
                  href={`/clients/${client.id}`}
                  className="inline-block mt-2 text-xs transition-colors hover:text-sky-300"
                  style={{ color: '#0ea5e9' }}
                >
                  Voir la fiche →
                </Link>
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Aucun client associé</p>
            )}
          </div>

          {/* Stats */}
          <div
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(14,165,233,0.1)' }}
            >
              <FileText size={18} style={{ color: '#0ea5e9' }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{devisList.length}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                devis dans ce dossier
              </p>
            </div>
          </div>
        </div>

        {/* Devis list */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Devis du dossier</h2>
            <Link
              href={`/devis/nouveau?dossier_id=${id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' }}
            >
              <Plus size={13} />
              Ajouter un devis
            </Link>
          </div>

          {devisList.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 rounded-2xl gap-2"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
            >
              <FileText size={24} style={{ color: 'rgba(255,255,255,0.2)' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Aucun devis dans ce dossier</p>
              <Link
                href={`/devis/nouveau?dossier_id=${id}`}
                className="mt-1 text-xs transition-colors hover:text-sky-300"
                style={{ color: '#0ea5e9' }}
              >
                Créer le premier devis →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {devisList.map(d => {
                const s = STATUT_LABELS[d.statut] ?? { label: d.statut, color: '#6b7280' }
                return (
                  <Link
                    key={d.id}
                    href={`/devis/${d.id}`}
                    className="flex items-center justify-between p-3 rounded-xl transition-all hover:border-white/20"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={15} style={{ color: 'rgba(255,255,255,0.4)' }} />
                      <div>
                        <p className="text-white text-sm font-medium">{d.numero}</p>
                        {d.clients && (
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{d.clients.nom}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: `${s.color}20`, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
