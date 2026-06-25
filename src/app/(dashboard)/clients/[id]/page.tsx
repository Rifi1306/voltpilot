'use client'
import { use, useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { getClient } from '@/lib/actions/clients'
import { useLanguage } from '@/i18n/LanguageContext'
import { StatusBadge } from '@/components/ui/Badge'
import type { DevisStatus } from '@/lib/types'
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, FileText,
  CheckCircle2, Clock, Plus, TrendingUp, Euro
} from 'lucide-react'
import Link from 'next/link'

type DevisRow = {
  id: string
  numero: string
  statut: string
  lignes: unknown
  remise: number | null
  acompte: number | null
  created_at: string
  date_validite: string | null
}

type ClientRow = {
  id: string
  nom: string
  email: string | null
  telephone: string | null
  adresse: string | null
  code_postal: string | null
  ville: string | null
  siret: string | null
  tva: string | null
  notes: string | null
  created_at: string
  devis: DevisRow[]
}

function rawTTC(lignes: unknown, remise: number = 0): number {
  if (!Array.isArray(lignes)) return 0
  const rows = lignes as Array<{ quantite: number; prixUnitaire: number; remise?: number; tva?: number }>
  const ht = rows.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0)
  const tva = rows.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100) * ((l.tva ?? 20) / 100), 0)
  return (ht + tva) * (1 - remise / 100)
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [client, setClient] = useState<ClientRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const { formatCurrency } = useLanguage()

  useEffect(() => {
    getClient(id)
      .then(data => {
        if (!data) { setNotFound(true); return }
        setClient(data as ClientRow)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex-1 overflow-auto">
      <Header title="Chargement…" subtitle="" />
      <div className="flex justify-center py-24">
        <div className="volt-spinner" />
      </div>
    </div>
  )

  if (notFound || !client) return (
    <div className="flex-1 overflow-auto">
      <Header title="Client introuvable" subtitle="" />
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-500 mb-4">Ce client n&apos;existe pas ou a été supprimé.</p>
          <Link href="/clients" className="btn-primary text-sm">Retour aux clients</Link>
        </div>
      </div>
    </div>
  )

  const clientDevis = client.devis ?? []
  const devisAcceptes = clientDevis.filter(d => d.statut === 'accepte')
  const totalCA = devisAcceptes.reduce((sum, d) => sum + rawTTC(d.lignes, d.remise ?? 0), 0)
  const devisEnAttente = clientDevis.filter(d => d.statut === 'envoye').length
  const tauxAcceptation = clientDevis.length > 0 ? Math.round(devisAcceptes.length / clientDevis.length * 100) : 0

  return (
    <div className="flex-1 overflow-auto">
      <Header title={client.nom} subtitle="Fiche client" />

      <div className="p-6 space-y-5">
        {/* Top bar */}
        <div className="flex items-center gap-3">
          <Link href="/clients" className="btn-secondary text-sm">
            <ArrowLeft size={15} /> Retour
          </Link>
          <div className="flex-1" />
          <Link href={`/devis/nouveau?client=${id}`} className="btn-primary text-sm">
            <Plus size={14} /> Créer un devis
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Fiche client */}
          <div className="col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl mb-3">
                  {client.nom.charAt(0).toUpperCase()}
                </div>
                <h2 className="font-bold text-slate-900 text-lg">{client.nom}</h2>
                <p className="text-sm text-slate-400">
                  Client depuis {new Date(client.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div className="space-y-3">
                {client.email && (
                  <div className="flex items-start gap-2.5">
                    <Mail size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Email</p>
                      <a href={`mailto:${client.email}`} className="text-sm text-cyan-600 hover:underline">{client.email}</a>
                    </div>
                  </div>
                )}
                {client.telephone && (
                  <div className="flex items-start gap-2.5">
                    <Phone size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Téléphone</p>
                      <a href={`tel:${client.telephone}`} className="text-sm text-slate-700">{client.telephone}</a>
                    </div>
                  </div>
                )}
                {(client.adresse || client.ville) && (
                  <div className="flex items-start gap-2.5">
                    <MapPin size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Adresse</p>
                      {client.adresse && <p className="text-sm text-slate-700">{client.adresse}</p>}
                      {(client.code_postal || client.ville) && (
                        <p className="text-sm text-slate-700">{client.code_postal} {client.ville}</p>
                      )}
                    </div>
                  </div>
                )}
                {client.siret && (
                  <div className="flex items-start gap-2.5">
                    <Building2 size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 font-medium">SIRET</p>
                      <p className="text-sm text-slate-700 font-mono">{client.siret}</p>
                      {client.tva && <p className="text-xs text-slate-400 mt-0.5">TVA: {client.tva}</p>}
                    </div>
                  </div>
                )}
              </div>

              {client.notes && (
                <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-xs font-semibold text-sky-700 mb-1">Notes</p>
                  <p className="text-sm text-sky-800">{client.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Stats + devis */}
          <div className="col-span-2 space-y-4">
            {/* Stats cards */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'CA réalisé', value: totalCA > 0 ? formatCurrency(totalCA) : '—', icon: Euro, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                { label: 'Devis total', value: String(clientDevis.length), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Acceptés', value: String(devisAcceptes.length), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'En attente', value: String(devisEnAttente), icon: Clock, color: 'text-sky-600', bg: 'bg-sky-50' },
              ].map(s => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4">
                    <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
                      <Icon size={16} className={s.color} />
                    </div>
                    <p className="text-xl font-bold text-slate-900">{s.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                )
              })}
            </div>

            {/* Taux acceptation */}
            {clientDevis.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" />
                    <span className="font-semibold text-slate-900 text-sm">Taux d&apos;acceptation</span>
                  </div>
                  <span className="font-bold text-emerald-700 text-lg">{tauxAcceptation}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${tauxAcceptation}%`, background: 'linear-gradient(90deg, #22D3EE, #10b981)' }}
                  />
                </div>
              </div>
            )}

            {/* Historique devis */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                <h3 className="font-bold text-slate-900">Historique des devis</h3>
                <Link href={`/devis/nouveau?client=${id}`} className="btn-primary text-xs py-1.5">
                  <Plus size={13} /> Nouveau devis
                </Link>
              </div>
              {clientDevis.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Aucun devis pour ce client
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Numéro</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Montant TTC</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {clientDevis.map(devis => (
                      <tr key={devis.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <Link href={`/devis/${devis.id}`} className="font-semibold text-sm text-cyan-600 hover:text-cyan-600">
                            {devis.numero}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-500">
                          {new Date(devis.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900">
                          {formatCurrency(rawTTC(devis.lignes, devis.remise ?? 0))}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={devis.statut as DevisStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
