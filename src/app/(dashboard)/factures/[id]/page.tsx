'use client'
import { use, useState, useEffect, useTransition } from 'react'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import {
  ArrowLeft, Printer, Trash2, ChevronDown, CheckCircle2, Clock,
  AlertTriangle, XCircle, MapPin, Mail, Phone, CreditCard, Calendar,
  FileText, Sun,
} from 'lucide-react'
import {
  getFactureById, updateFactureStatut, deleteFactureAction,
} from '@/lib/actions/factures'
import { getProfile } from '@/lib/actions/profile'
import type { FactureStatut } from '@/lib/actions/factures'
import { useLanguage } from '@/i18n/LanguageContext'

// ─── Types ────────────────────────────────────────────────────────────────────

type ClientRow = {
  id: string
  nom: string
  email: string | null
  telephone: string | null
  adresse: string | null
  code_postal: string | null
  ville: string | null
  siret: string | null
}

type LigneItem = {
  designation: string
  description?: string
  quantite: number
  prixUnitaire: number
  remise?: number
  tva?: number
  isText?: boolean
  lot?: string
}

type LotItem = {
  nom: string
  lignes: LigneItem[]
}

type FactureRow = {
  id: string
  numero: string
  statut: FactureStatut
  lignes: unknown
  lots: unknown
  remise: number | null
  acompte_verse: number | null
  conditions_paiement: string | null
  notes: string | null
  date_echeance: string | null
  created_at: string
  devis_id: string | null
  clients: ClientRow | null
}

type ProfileRow = {
  nom: string | null
  adresse: string | null
  code_postal: string | null
  ville: string | null
  siret: string | null
  couleur_primaire: string | null
  mentions_legales: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseLots(raw: unknown): LotItem[] {
  if (Array.isArray(raw) && raw.length > 0) return raw as LotItem[]
  return []
}

function parseLignes(raw: unknown): LigneItem[] {
  if (Array.isArray(raw)) return raw as LigneItem[]
  return []
}

function computeTotals(lignes: LigneItem[], remiseGlobale: number) {
  const rows = lignes.filter(l => !l.isText)
  const ht = rows.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0)
  const tvaByRate: Record<number, number> = {}
  rows.forEach(l => {
    const base = l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100)
    const rate = l.tva ?? 20
    tvaByRate[rate] = (tvaByRate[rate] ?? 0) + base * (rate / 100)
  })
  const tva = Object.values(tvaByRate).reduce((s, v) => s + v, 0)
  const factor = 1 - remiseGlobale / 100
  return {
    htBase: ht,
    ht: ht * factor,
    tva: tva * factor,
    ttc: (ht + tva) * factor,
    tvaByRate,
    factor,
  }
}

// ─── Statut config ────────────────────────────────────────────────────────────

const STATUT_CONFIG: Record<FactureStatut, { label: string; color: string; icon: React.ReactNode }> = {
  emise:     { label: 'Émise',      color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',       icon: <Clock size={11} /> },
  payee:     { label: 'Payée',      color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', icon: <CheckCircle2 size={11} /> },
  en_retard: { label: 'En retard',  color: 'bg-red-500/10 text-red-400 border border-red-500/20',           icon: <AlertTriangle size={11} /> },
  annulee:   { label: 'Annulée',    color: 'bg-white/5 text-white/40 border border-white/10',               icon: <XCircle size={11} /> },
}

function StatutBadge({ statut }: { statut: FactureStatut }) {
  const cfg = STATUT_CONFIG[statut] ?? STATUT_CONFIG.emise
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FactureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { formatCurrency } = useLanguage()

  const [facture, setFacture] = useState<FactureRow | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    Promise.all([getFactureById(id), getProfile()])
      .then(([f, p]) => {
        if (!f) { setNotFound(true); return }
        setFacture(f as FactureRow)
        setProfile(p as ProfileRow | null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleStatut = (statut: FactureStatut) => {
    setDropdownOpen(false)
    startTransition(async () => {
      await updateFactureStatut(id, statut)
      setFacture(prev => prev ? { ...prev, statut } : prev)
    })
  }

  const handleDelete = () => {
    if (!confirm('Supprimer cette facture définitivement ?')) return
    startTransition(async () => {
      await deleteFactureAction(id)
    })
  }

  // ─── Loading / not found ────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex-1 overflow-auto">
      <Header title="Chargement…" subtitle="" />
      <div className="flex justify-center py-24">
        <div className="volt-spinner" />
      </div>
    </div>
  )

  if (notFound || !facture) return (
    <div className="flex-1 overflow-auto">
      <Header title="Facture introuvable" subtitle="" />
      <div className="p-6">
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-dim)' }}
        >
          <p className="text-sm mb-4" style={{ color: 'var(--star)' }}>Cette facture n&apos;existe pas ou a été supprimée.</p>
          <Link href="/factures" className="btn-primary text-sm">Retour aux factures</Link>
        </div>
      </div>
    </div>
  )

  // ─── Data ──────────────────────────────────────────────────────────────────

  const client = facture.clients
  const lots = parseLots(facture.lots)
  const allLignes = lots.length > 0
    ? lots.flatMap(l => l.lignes ?? [])
    : parseLignes(facture.lignes)

  const remise = facture.remise ?? 0
  const { ht, tva, ttc, tvaByRate, factor } = computeTotals(allLignes, remise)
  const acompte = facture.acompte_verse ?? 0
  const soldeDu = ttc - acompte

  const isOverdue = facture.statut === 'emise' && facture.date_echeance &&
    facture.date_echeance < new Date().toISOString().slice(0, 10)

  return (
    <div className="flex-1 overflow-auto">
      <Header
        title={facture.numero}
        subtitle={client ? `Facture pour ${client.nom}` : 'Facture'}
      />

      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Actions bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/factures" className="btn-secondary text-sm">
            <ArrowLeft size={15} /> Retour
          </Link>
          <div className="flex-1" />

          {/* Changer statut */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              disabled={isPending}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              <StatutBadge statut={facture.statut} />
              <ChevronDown size={13} />
            </button>
            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-2xl min-w-[160px]"
                style={{ background: '#07091f', border: '1px solid var(--border-nebula)' }}
              >
                {(['emise', 'payee', 'en_retard', 'annulee'] as FactureStatut[])
                  .filter(s => s !== facture.statut)
                  .map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatut(s)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all hover:bg-white/5 text-xs"
                      style={{ color: 'var(--star)' }}
                    >
                      {STATUT_CONFIG[s].icon} {STATUT_CONFIG[s].label}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <button onClick={() => window.print()} className="btn-secondary text-sm" disabled={isPending}>
            <Printer size={14} /> Imprimer / PDF
          </button>

          {facture.devis_id && (
            <Link href={`/devis/${facture.devis_id}`} className="btn-secondary text-sm">
              <FileText size={14} /> Voir le devis source
            </Link>
          )}

          <button
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </div>

        {/* Status banner */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3 flex-wrap"
          style={{
            background: isOverdue
              ? 'rgba(248,113,113,0.07)'
              : facture.statut === 'payee'
              ? 'rgba(52,211,153,0.07)'
              : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isOverdue ? 'rgba(248,113,113,0.2)' : facture.statut === 'payee' ? 'rgba(52,211,153,0.2)' : 'var(--border-dim)'}`,
          }}
        >
          <StatutBadge statut={facture.statut} />
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--star)' }}>
            <Calendar size={12} />
            <span>Émise le {new Date(facture.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
          {facture.date_echeance && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: isOverdue ? '#f87171' : 'var(--star)' }}>
              <Calendar size={12} />
              <span>Échéance: {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}</span>
              {isOverdue && <span className="font-bold">(En retard)</span>}
            </div>
          )}
        </div>

        {/* Document */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {/* En-tête */}
          <div className="p-8 border-b border-slate-100">
            <div className="flex justify-between items-start">
              {/* Entreprise */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${profile?.couleur_primaire ?? '#22D3EE'}, #06B6D4)` }}
                  >
                    <Sun size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{profile?.nom ?? 'Mon entreprise'}</h3>
                    <p className="text-slate-500 text-xs">Solutions photovoltaïques</p>
                  </div>
                </div>
                {profile?.adresse && <p className="text-sm text-slate-500">{profile.adresse}</p>}
                {(profile?.code_postal || profile?.ville) && (
                  <p className="text-sm text-slate-500">{profile?.code_postal} {profile?.ville}</p>
                )}
                {profile?.siret && <p className="text-xs text-slate-400 mt-1">SIRET: {profile.siret}</p>}
              </div>

              {/* Numéro & dates */}
              <div className="text-right">
                <div
                  className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white' }}
                >
                  FACTURE
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">{facture.numero}</h2>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 justify-end text-sm text-slate-500">
                    <Calendar size={13} />
                    <span>Émise le {new Date(facture.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {facture.date_echeance && (
                    <div className="flex items-center gap-2 justify-end text-sm text-slate-500">
                      <Calendar size={13} />
                      <span>Échéance: {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Client */}
            {client && (
              <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Destinataire</p>
                <p className="font-bold text-slate-900">{client.nom}</p>
                <div className="flex gap-6 mt-1 flex-wrap">
                  {(client.adresse || client.ville) && (
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <MapPin size={12} />
                      {client.adresse}{client.code_postal ? `, ${client.code_postal}` : ''}{client.ville ? ` ${client.ville}` : ''}
                    </p>
                  )}
                  {client.email && (
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <Mail size={12} /> {client.email}
                    </p>
                  )}
                  {client.telephone && (
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <Phone size={12} /> {client.telephone}
                    </p>
                  )}
                </div>
                {client.siret && <p className="text-xs text-slate-400 mt-1">SIRET: {client.siret}</p>}
              </div>
            )}
          </div>

          {/* Lignes — par lot si lots, sinon flat */}
          {lots.length > 0 ? (
            lots.map((lot, li) => {
              const lotLignes = (lot.lignes ?? []).filter(l => !l.isText)
              const lotHT = lotLignes.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0)
              return (
                <div key={li} className="overflow-x-auto">
                  <div className="px-6 py-3 bg-slate-50 border-y border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{lot.nom}</p>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Désignation</th>
                        <th className="px-6 py-2 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">Qté</th>
                        <th className="px-6 py-2 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-28">PU HT</th>
                        <th className="px-6 py-2 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">TVA</th>
                        <th className="px-6 py-2 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">Remise</th>
                        <th className="px-6 py-2 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-28">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {lotLignes.map((ligne, i) => {
                        const ligneHT = ligne.quantite * ligne.prixUnitaire * (1 - (ligne.remise ?? 0) / 100)
                        return (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="px-6 py-3">
                              <p className="font-medium text-slate-900 text-sm">{ligne.designation}</p>
                              {ligne.description && <p className="text-xs text-slate-400 mt-0.5">{ligne.description}</p>}
                            </td>
                            <td className="px-6 py-3 text-right text-sm text-slate-600">{ligne.quantite}</td>
                            <td className="px-6 py-3 text-right text-sm text-slate-600">{formatCurrency(ligne.prixUnitaire)}</td>
                            <td className="px-6 py-3 text-right text-sm text-slate-500">{ligne.tva ?? 20}%</td>
                            <td className="px-6 py-3 text-right text-sm text-slate-500">
                              {(ligne.remise ?? 0) > 0 ? `-${ligne.remise}%` : '—'}
                            </td>
                            <td className="px-6 py-3 text-right font-semibold text-slate-900 text-sm">{formatCurrency(ligneHT)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/50">
                        <td colSpan={5} className="px-6 py-2 text-sm font-semibold text-slate-500 text-right">Sous-total {lot.nom}</td>
                        <td className="px-6 py-2 text-right font-bold text-slate-900 text-sm">{formatCurrency(lotHT)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )
            })
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Désignation</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">Qté</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-28">PU HT</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">TVA</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">Remise</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-28">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allLignes.filter(l => !l.isText).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">Aucune ligne dans cette facture</td>
                    </tr>
                  ) : (
                    allLignes.filter(l => !l.isText).map((ligne, i) => {
                      const ligneHT = ligne.quantite * ligne.prixUnitaire * (1 - (ligne.remise ?? 0) / 100)
                      return (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-900">{ligne.designation}</p>
                            {ligne.description && <p className="text-xs text-slate-400 mt-0.5">{ligne.description}</p>}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-slate-600">{ligne.quantite}</td>
                          <td className="px-6 py-4 text-right text-sm text-slate-600">{formatCurrency(ligne.prixUnitaire)}</td>
                          <td className="px-6 py-4 text-right text-sm text-slate-500">{ligne.tva ?? 20}%</td>
                          <td className="px-6 py-4 text-right text-sm text-slate-500">
                            {(ligne.remise ?? 0) > 0 ? `-${ligne.remise}%` : '—'}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-slate-900">{formatCurrency(ligneHT)}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Totaux */}
          <div className="p-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Paiement info */}
            <div className="space-y-2">
              {facture.conditions_paiement && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <CreditCard size={14} />
                  <span className="font-semibold text-slate-700">Conditions:</span>
                  <span>{facture.conditions_paiement}</span>
                </div>
              )}
              {facture.notes && (
                <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-xs font-semibold text-sky-700 mb-1">Notes</p>
                  <p className="text-sm text-sky-800">{facture.notes}</p>
                </div>
              )}
            </div>

            {/* Chiffres */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Sous-total HT</span>
                <span>{formatCurrency(ht)}</span>
              </div>

              {/* TVA ventilée par taux */}
              {Object.entries(tvaByRate).map(([rate, amount]) => (
                <div key={rate} className="flex justify-between text-sm text-slate-500">
                  <span>TVA {rate}%</span>
                  <span>{formatCurrency(amount * factor)}</span>
                </div>
              ))}

              {remise > 0 && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Remise globale ({remise}%)</span>
                  <span className="text-red-500">incluse</span>
                </div>
              )}

              <div className="h-px bg-slate-100" />

              <div className="flex justify-between font-bold text-slate-900 text-lg">
                <span>Total TTC</span>
                <span className="text-indigo-700">{formatCurrency(ttc)}</span>
              </div>

              {acompte > 0 && (
                <>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Acompte versé</span>
                    <span className="text-emerald-600">− {formatCurrency(acompte)}</span>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Solde dû</span>
                    <span className={soldeDu <= 0 ? 'text-emerald-600' : 'text-slate-900'}>
                      {formatCurrency(Math.max(0, soldeDu))}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mentions légales */}
          {profile?.mentions_legales && (
            <div className="px-6 pb-6">
              <p className="text-xs text-slate-400 border-t border-slate-50 pt-4">{profile.mentions_legales}</p>
            </div>
          )}
        </div>
      </div>

      {/* Close dropdown overlay */}
      {dropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
      )}
    </div>
  )
}
