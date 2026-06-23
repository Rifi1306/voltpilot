'use client'
import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { getDevis } from '@/lib/actions/devis'
import { useLanguage } from '@/i18n/LanguageContext'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp } from 'lucide-react'

const COLORS = ['#10b981', '#3b82f6', '#94a3b8', '#ef4444', '#8b5cf6']

type SDevis = {
  id: string
  statut: string
  lignes: unknown
  remise: number | null
  created_at: string
}

function rawTTC(lignes: unknown, remise: number = 0): number {
  if (!Array.isArray(lignes)) return 0
  const rows = lignes as Array<{ quantite: number; prixUnitaire: number; remise?: number; tva?: number }>
  const ht = rows.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0)
  const tva = rows.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100) * ((l.tva ?? 20) / 100), 0)
  return (ht + tva) * (1 - remise / 100)
}

function toMonthlyData(devis: SDevis[]) {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('fr-FR', { month: 'short' })
    const monthDevis = devis.filter(dv => dv.created_at.startsWith(key))
    const accepted = monthDevis.filter(dv => dv.statut === 'accepte')
    const montant = accepted.reduce((s, dv) => s + rawTTC(dv.lignes, dv.remise ?? 0), 0)
    months.push({ mois: label, montant, devis: monthDevis.length })
  }
  return months
}

export default function AnalyticsPage() {
  const [allDevis, setAllDevis] = useState<SDevis[]>([])
  const [loading, setLoading] = useState(true)
  const { formatCurrency } = useLanguage()

  useEffect(() => {
    getDevis()
      .then(d => setAllDevis(d as SDevis[]))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const accepted = allDevis.filter(d => d.statut === 'accepte')
  const totalCA = accepted.reduce((s, d) => s + rawTTC(d.lignes, d.remise ?? 0), 0)
  const totalEnAttente = allDevis.filter(d => d.statut === 'envoye').reduce((s, d) => s + rawTTC(d.lignes, d.remise ?? 0), 0)
  const tauxAcceptation = allDevis.length > 0 ? Math.round(accepted.length / allDevis.length * 100) : 0
  const panierMoyen = accepted.length > 0 ? totalCA / accepted.length : 0
  const monthlyData = toMonthlyData(allDevis)

  const statusData = [
    { name: 'Acceptés', value: allDevis.filter(d => d.statut === 'accepte').length },
    { name: 'Envoyés', value: allDevis.filter(d => d.statut === 'envoye').length },
    { name: 'Brouillons', value: allDevis.filter(d => d.statut === 'brouillon').length },
    { name: 'Refusés', value: allDevis.filter(d => d.statut === 'refuse').length },
  ].filter(s => s.value > 0)

  if (loading) return (
    <div className="flex-1 overflow-auto">
      <Header title="Analytiques" subtitle="Performance commerciale de votre activité solaire" />
      <div className="flex justify-center py-24">
        <div className="w-7 h-7 border-[3px] border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (allDevis.length === 0) return (
    <div className="flex-1 overflow-auto">
      <Header title="Analytiques" subtitle="Performance commerciale de votre activité solaire" />
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <TrendingUp size={40} className="text-slate-200 mx-auto mb-4" />
          <p className="font-semibold text-slate-700 mb-1">Aucune donnée à analyser</p>
          <p className="text-sm text-slate-400">Créez vos premiers devis pour voir vos statistiques ici.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Analytiques" subtitle="Performance commerciale de votre activité solaire" />

      <div className="p-6 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'CA réalisé', value: formatCurrency(totalCA), sub: 'Devis acceptés' },
            { label: 'Pipeline en cours', value: formatCurrency(totalEnAttente), sub: 'Devis envoyés' },
            { label: 'Taux acceptation', value: `${tauxAcceptation}%`, sub: 'Sur tous les devis' },
            { label: 'Panier moyen', value: panierMoyen > 0 ? formatCurrency(panierMoyen) : '—', sub: 'Par devis accepté' },
          ].map(k => (
            <div key={k.label} className="stat-card">
              <p className="text-2xl font-black text-slate-900">{k.value}</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{k.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* CA evolution */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-900 mb-1">Évolution CA mensuel</h2>
            <p className="text-sm text-slate-400 mb-5">6 derniers mois (devis acceptés)</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="ca" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k€`} />
                <Tooltip formatter={(v: unknown) => [formatCurrency(Number(v ?? 0)), 'CA']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="montant" stroke="#6366f1" strokeWidth={2.5} fill="url(#ca)" dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Devis par mois */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-900 mb-1">Devis créés par mois</h2>
            <p className="text-sm text-slate-400 mb-5">Volume mensuel</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="devis" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Statuts pie */}
          {statusData.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="font-bold text-slate-900 mb-1">Répartition des devis</h2>
              <p className="text-sm text-slate-400 mb-5">Par statut</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend formatter={(value) => <span className="text-sm text-slate-600">{value}</span>} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Résumé par statut */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-900 mb-1">Progression par statut</h2>
            <p className="text-sm text-slate-400 mb-5">Sur {allDevis.length} devis au total</p>
            <div className="space-y-4">
              {[
                { label: 'Acceptés', count: allDevis.filter(d => d.statut === 'accepte').length, color: '#10b981' },
                { label: 'Envoyés', count: allDevis.filter(d => d.statut === 'envoye').length, color: '#3b82f6' },
                { label: 'Brouillons', count: allDevis.filter(d => d.statut === 'brouillon').length, color: '#94a3b8' },
                { label: 'Refusés', count: allDevis.filter(d => d.statut === 'refuse').length, color: '#ef4444' },
              ].map(s => {
                const pct = allDevis.length > 0 ? Math.round(s.count / allDevis.length * 100) : 0
                return (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{s.label}</span>
                      <span className="text-sm font-bold text-slate-900">
                        {s.count} <span className="font-normal text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: s.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
