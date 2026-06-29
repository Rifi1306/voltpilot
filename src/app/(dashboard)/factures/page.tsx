'use client'
import { useState, useEffect, useTransition } from 'react'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import {
  Receipt, Search, Eye, ChevronDown, CheckCircle2, Clock, AlertTriangle,
  XCircle, FileText, ArrowRight,
} from 'lucide-react'
import {
  getFactures, getFactureStats, updateFactureStatut,
} from '@/lib/actions/factures'
import type { FactureStatut } from '@/lib/actions/factures'
import { useLanguage } from '@/i18n/LanguageContext'

type SFacture = {
  id: string
  numero: string
  statut: FactureStatut
  lignes: unknown
  lots: unknown
  remise: number | null
  acompte_verse: number | null
  date_echeance: string | null
  created_at: string
  clients: { nom: string; email: string; ville: string } | null
}

type Stats = { total: number; emises: number; payees: number; en_retard: number }

function computeTTC(lignes: unknown, lots: unknown, remise = 0): number {
  let rows: Array<{ quantite: number; prixUnitaire: number; remise?: number; tva?: number; isText?: boolean }> = []
  if (Array.isArray(lots) && lots.length > 0) {
    rows = (lots as Array<{ lignes: typeof rows }>).flatMap(l => l.lignes ?? [])
  } else if (Array.isArray(lignes)) {
    rows = lignes as typeof rows
  }
  const filtered = rows.filter(l => !l.isText)
  const ht = filtered.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0)
  const tva = filtered.reduce((s, l) => {
    const base = l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100)
    return s + base * ((l.tva ?? 20) / 100)
  }, 0)
  return (ht + tva) * (1 - remise / 100)
}

const STATUT_CONFIG: Record<FactureStatut, { label: string; color: string; icon: React.ReactNode }> = {
  emise: {
    label: 'Émise',
    color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    icon: <Clock size={11} />,
  },
  payee: {
    label: 'Payée',
    color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    icon: <CheckCircle2 size={11} />,
  },
  en_retard: {
    label: 'En retard',
    color: 'bg-red-500/10 text-red-400 border border-red-500/20',
    icon: <AlertTriangle size={11} />,
  },
  annulee: {
    label: 'Annulée',
    color: 'bg-white/5 text-white/40 border border-white/10',
    icon: <XCircle size={11} />,
  },
}

function StatutBadge({ statut }: { statut: FactureStatut }) {
  const cfg = STATUT_CONFIG[statut] ?? STATUT_CONFIG.emise
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

type TabFilter = FactureStatut | 'all'

const TABS: { label: string; value: TabFilter }[] = [
  { label: 'Toutes', value: 'all' },
  { label: 'Émises', value: 'emise' },
  { label: 'Payées', value: 'payee' },
  { label: 'En retard', value: 'en_retard' },
]

export default function FacturesPage() {
  const { formatCurrency } = useLanguage()
  const [factures, setFactures] = useState<SFacture[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, emises: 0, payees: 0, en_retard: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabFilter>('all')
  const [search, setSearch] = useState('')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    Promise.all([getFactures(), getFactureStats()])
      .then(([f, s]) => {
        setFactures(f as SFacture[])
        setStats(s)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = factures.filter(f => {
    const matchTab = tab === 'all' || f.statut === tab
    const q = search.toLowerCase()
    const matchSearch =
      q === '' ||
      f.numero.toLowerCase().includes(q) ||
      (f.clients?.nom ?? '').toLowerCase().includes(q)
    return matchTab && matchSearch
  })

  const handleStatut = (id: string, statut: FactureStatut) => {
    setOpenDropdown(null)
    startTransition(async () => {
      await updateFactureStatut(id, statut)
      setFactures(prev =>
        prev.map(f => f.id === id ? { ...f, statut } : f)
      )
      setStats(prev => {
        // recompute simple counts
        const updated = factures.map(f => f.id === id ? { ...f, statut } : f)
        const today = new Date().toISOString().slice(0, 10)
        return {
          total: updated.length,
          emises: updated.filter(f => f.statut === 'emise').length,
          payees: updated.filter(f => f.statut === 'payee').length,
          en_retard: updated.filter(f => f.statut === 'emise' && f.date_echeance && f.date_echeance < today).length,
        }
      })
    })
  }

  const STAT_CARDS = [
    { label: 'Total', value: stats.total, icon: <Receipt size={14} />, color: 'var(--nebula-bright)', bg: 'rgba(124,58,237,0.12)' },
    { label: 'Émises', value: stats.emises, icon: <Clock size={14} />, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    { label: 'Payées', value: stats.payees, icon: <CheckCircle2 size={14} />, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    { label: 'En retard', value: stats.en_retard, icon: <AlertTriangle size={14} />, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  ]

  return (
    <div className="flex-1 overflow-auto">
      <Header
        title="Factures"
        subtitle={loading ? '…' : `${stats.total} facture${stats.total !== 1 ? 's' : ''}`}
      />

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STAT_CARDS.map(card => (
            <div
              key={card.label}
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-dim)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: card.bg, color: card.color }}
                >
                  {card.icon}
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--star)' }}>{card.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--nova)' }}>
                {loading ? '—' : card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-dim)' }}
        >
          {/* Toolbar */}
          <div
            className="px-5 py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
            style={{ borderBottom: '1px solid var(--border-dim)' }}
          >
            {/* Tabs */}
            <div
              className="flex gap-0.5 p-1 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              {TABS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: tab === t.value ? 'rgba(124,58,237,0.25)' : 'transparent',
                    color: tab === t.value ? 'var(--nebula-bright)' : 'var(--star)',
                    border: tab === t.value ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--dust)' }} />
              <input
                type="text"
                placeholder="Rechercher…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-4 py-2 text-sm rounded-xl outline-none transition-all w-48"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-bright)',
                  color: 'var(--nova)',
                  fontSize: '13px',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--nebula)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-bright)' }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                  {['Numéro', 'Client', 'Montant TTC', 'Statut', 'Échéance', 'Date', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--dust)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <div className="volt-spinner mx-auto" style={{ width: 22, height: 22, borderWidth: 2 }} />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <Receipt size={32} className="mx-auto mb-3" style={{ color: 'var(--dust)' }} />
                      <p className="text-sm mb-1" style={{ color: 'var(--star)' }}>
                        {factures.length === 0
                          ? 'Aucune facture pour le moment.'
                          : 'Aucune facture ne correspond à votre recherche.'}
                      </p>
                      {factures.length === 0 && (
                        <p className="text-xs mb-4" style={{ color: 'var(--dust)' }}>
                          Convertissez un devis accepté en facture depuis la page Devis.
                        </p>
                      )}
                      {factures.length === 0 && (
                        <Link
                          href="/devis"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold"
                          style={{ color: 'var(--nebula-bright)' }}
                        >
                          Voir les devis <ArrowRight size={13} />
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map(f => {
                    const ttc = computeTTC(f.lignes, f.lots, f.remise ?? 0)
                    const isOverdue = f.statut === 'emise' && f.date_echeance &&
                      f.date_echeance < new Date().toISOString().slice(0, 10)
                    return (
                      <tr
                        key={f.id}
                        style={{ borderBottom: '1px solid var(--border-dim)' }}
                        className="transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-4">
                          <span className="font-semibold text-sm" style={{ color: 'var(--nova)' }}>{f.numero}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, var(--nebula), var(--indigo))' }}
                            >
                              {(f.clients?.nom ?? '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: 'var(--nova)' }}>
                                {f.clients?.nom ?? '—'}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--dust)' }}>{f.clients?.ville ?? ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-sm" style={{ color: 'var(--nova)' }}>
                            {formatCurrency(ttc)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <StatutBadge statut={f.statut} />
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: isOverdue ? '#f87171' : 'var(--star)' }}>
                          {f.date_echeance
                            ? new Date(f.date_echeance).toLocaleDateString('fr-FR')
                            : '—'}
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: 'var(--star)' }}>
                          {new Date(f.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            {/* Voir */}
                            <Link
                              href={`/factures/${f.id}`}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                              style={{ color: 'var(--star)' }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(124,58,237,0.15)'
                                e.currentTarget.style.color = 'var(--nebula-bright)'
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = 'var(--star)'
                              }}
                            >
                              <Eye size={14} />
                            </Link>

                            {/* Changer statut dropdown */}
                            <div className="relative">
                              <button
                                onClick={() => setOpenDropdown(openDropdown === f.id ? null : f.id)}
                                disabled={isPending}
                                className="h-8 px-2 rounded-lg flex items-center gap-1 text-xs font-semibold transition-all disabled:opacity-50"
                                style={{ color: 'var(--star)', border: '1px solid var(--border-dim)' }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.borderColor = 'var(--border-bright)'
                                  e.currentTarget.style.color = 'var(--nova)'
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.borderColor = 'var(--border-dim)'
                                  e.currentTarget.style.color = 'var(--star)'
                                }}
                              >
                                Statut <ChevronDown size={11} />
                              </button>
                              {openDropdown === f.id && (
                                <div
                                  className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-2xl min-w-[150px]"
                                  style={{ background: '#07091f', border: '1px solid var(--border-nebula)' }}
                                >
                                  {(['emise', 'payee', 'en_retard', 'annulee'] as FactureStatut[])
                                    .filter(s => s !== f.statut)
                                    .map(s => (
                                      <button
                                        key={s}
                                        onClick={() => handleStatut(f.id, s)}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all hover:bg-white/5 text-xs"
                                        style={{ color: 'var(--star)' }}
                                      >
                                        {STATUT_CONFIG[s].icon}
                                        {STATUT_CONFIG[s].label}
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ borderTop: '1px solid var(--border-dim)' }}
            >
              <p className="text-xs" style={{ color: 'var(--dust)' }}>
                {filtered.length} facture{filtered.length !== 1 ? 's' : ''}
              </p>
              <Link
                href="/devis"
                className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all"
                style={{ color: 'var(--nebula-bright)' }}
              >
                + Nouvelle facture <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>

        {/* Info banner */}
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)' }}
        >
          <FileText size={16} style={{ color: 'var(--nebula-bright)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--nebula-bright)' }}>
              Créer une facture
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--star)' }}>
              Pour créer une facture, convertissez un devis accepté depuis la page{' '}
              <Link href="/devis" className="underline" style={{ color: 'var(--nebula-bright)' }}>
                Devis
              </Link>
              {' '}en cliquant sur le bouton "Convertir en facture".
            </p>
          </div>
        </div>
      </div>

      {/* Close dropdown on outside click */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  )
}
