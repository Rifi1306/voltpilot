'use client'
import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { DevisStatus } from '@/lib/types'
import { useLanguage } from '@/i18n/LanguageContext'
import { getDevis, deleteDevisAction } from '@/lib/actions/devis'
import Link from 'next/link'
import { Eye, Trash2, Search, FileText, FolderOpen } from 'lucide-react'

type SDevis = {
  id: string
  numero: string
  statut: string
  lignes: unknown
  remise: number | null
  created_at: string
  date_validite: string
  dossier_id: string | null
  clients: { nom: string; email: string; ville: string } | null
}

function rawTTC(lignes: unknown, remise: number = 0): number {
  if (!Array.isArray(lignes)) return 0
  const rows = lignes as Array<{ quantite: number; prixUnitaire: number; remise?: number; tva?: number }>
  const ht = rows.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0)
  const tva = rows.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100) * ((l.tva ?? 20) / 100), 0)
  return (ht + tva) * (1 - remise / 100)
}

function rawHT(lignes: unknown, remise: number = 0): number {
  if (!Array.isArray(lignes)) return 0
  const rows = lignes as Array<{ quantite: number; prixUnitaire: number; remise?: number }>
  const ht = rows.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0)
  return ht * (1 - remise / 100)
}

export default function DevisPage() {
  const { t, locale, formatCurrency } = useLanguage()
  const [allDevis, setAllDevis] = useState<SDevis[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<DevisStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [activeDossier, setActiveDossier] = useState<string | null>(null)

  useEffect(() => {
    getDevis()
      .then(d => setAllDevis(d as SDevis[]))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statusFilters: { label: string; value: DevisStatus | 'all' }[] = [
    { label: t.quotes.all,      value: 'all' },
    { label: t.quotes.drafts,   value: 'brouillon' },
    { label: t.quotes.sent,     value: 'envoye' },
    { label: t.quotes.accepted, value: 'accepte' },
    { label: t.quotes.refused,  value: 'refuse' },
  ]

  const dossiers = Array.from(new Set(allDevis.map(d => d.dossier_id).filter((d): d is string => !!d))).sort()

  const filtered = allDevis.filter(d => {
    const matchesFilter = activeFilter === 'all' || d.statut === activeFilter
    const matchesDossier = activeDossier === null || d.dossier_id === activeDossier
    const matchesSearch =
      search === '' ||
      d.numero.toLowerCase().includes(search.toLowerCase()) ||
      d.clients?.nom?.toLowerCase().includes(search.toLowerCase()) ||
      d.clients?.ville?.toLowerCase().includes(search.toLowerCase()) ||
      (d.dossier_id ?? '').toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesDossier && matchesSearch
  })

  const totalAccepte = filtered
    .filter(d => d.statut === 'accepte')
    .reduce((sum, d) => sum + rawTTC(d.lignes, d.remise ?? 0), 0)

  const handleDelete = async (id: string, numero: string) => {
    if (!confirm(`Supprimer le devis ${numero} ?`)) return
    await deleteDevisAction(id)
    setAllDevis(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header
        title={t.quotes.title}
        subtitle={loading ? '…' : t.quotes.showing.replace('{n}', String(allDevis.length))}
        action={{ label: t.quotes.newQuote, href: '/devis/nouveau' }}
      />

      <div className="p-6 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {statusFilters.slice(1).map((f) => {
            const count = allDevis.filter(d => d.statut === f.value).length
            const colors: Record<string, string> = {
              brouillon: 'bg-slate-50 text-slate-600 border-slate-200',
              envoye: 'bg-blue-50 text-blue-700 border-blue-200',
              accepte: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              refuse: 'bg-red-50 text-red-700 border-red-200',
            }
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                  activeFilter === f.value ? colors[f.value as string] : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <p className="text-2xl font-bold">{loading ? '—' : count}</p>
                <p className="text-sm font-medium mt-0.5 text-slate-500">{f.label}</p>
              </button>
            )
          })}
        </div>

        {/* Dossier filter chips */}
        {dossiers.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <FolderOpen size={14} className="text-slate-400 flex-shrink-0" />
            <button
              onClick={() => setActiveDossier(null)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${activeDossier === null ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}
            >
              Tous les dossiers
            </button>
            {dossiers.map(d => (
              <button
                key={d}
                onClick={() => setActiveDossier(activeDossier === d ? null : d)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${activeDossier === d ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {/* Filters & search */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-1 p-1 bg-slate-50 rounded-xl">
              {statusFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeFilter === f.value
                      ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t.quotes.searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 w-48 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.quotes.number}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.quotes.client}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.quotes.date}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.quotes.validity}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.quotes.amountTTC}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.quotes.statusCol}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.quotes.actionsCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <FileText size={32} className="text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">{allDevis.length === 0 ? 'Aucun devis pour le moment.' : t.quotes.noQuotes}</p>
                      {allDevis.length === 0 && (
                        <Link href="/devis/nouveau" className="text-sm text-sky-500 font-medium hover:underline mt-1 block">
                          Créer votre premier devis →
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((d) => {
                    const ttc = rawTTC(d.lignes, d.remise ?? 0)
                    const ht = rawHT(d.lignes, d.remise ?? 0)
                    return (
                      <tr key={d.id} className="table-row-hover">
                        <td className="px-5 py-4">
                          <span className="font-semibold text-sm text-slate-900">{d.numero}</span>
                          {d.dossier_id && (
                            <span className="mt-1 flex items-center gap-1 text-xs text-indigo-600 font-medium">
                              <FolderOpen size={11} />
                              {d.dossier_id}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                              {(d.clients?.nom ?? '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{d.clients?.nom ?? '—'}</p>
                              <p className="text-xs text-slate-400">{d.clients?.ville ?? ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">{new Date(d.created_at).toLocaleDateString(locale)}</td>
                        <td className="px-5 py-4 text-sm text-slate-500">{new Date(d.date_validite).toLocaleDateString(locale)}</td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-900">{formatCurrency(ttc)}</span>
                          <p className="text-xs text-slate-400 mt-0.5">{t.common.taxExcl}: {formatCurrency(ht)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={d.statut as DevisStatus} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/devis/${d.id}`}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            >
                              <Eye size={15} />
                            </Link>
                            <button
                              onClick={() => handleDelete(d.id, d.numero)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
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
          <div className="px-5 py-3 border-t border-slate-50 flex items-center justify-between bg-slate-50/50">
            <p className="text-sm text-slate-500">
              {t.quotes.showing.replace('{n}', String(filtered.length))}
            </p>
            {activeFilter === 'accepte' && totalAccepte > 0 && (
              <p className="text-sm font-semibold text-emerald-700">
                {t.quotes.totalAccepted}: {formatCurrency(totalAccepte)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
