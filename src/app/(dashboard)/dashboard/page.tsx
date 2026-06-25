'use client'
import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { useLanguage } from '@/i18n/LanguageContext'
import { getDashboardStats, getDevis } from '@/lib/actions/devis'
import { getClients } from '@/lib/actions/clients'
import { DevisStatus } from '@/lib/types'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { FileText, Users, CheckCircle2, Euro, ArrowUpRight, Plus, Rocket } from 'lucide-react'
import Link from 'next/link'

type Stats = { totalDevis: number; devisAcceptes: number; tauxConversion: number; caTotal: number; totalClients: number }
type SDevis = { id: string; numero: string; statut: string; lignes: unknown; remise: number | null; created_at: string; date_validite: string; clients: { nom: string; email: string; ville: string } | null }
type SClient = { id: string; nom: string; ville: string | null; email: string | null }

function rawTTC(lignes: unknown, remise: number = 0): number {
  if (!Array.isArray(lignes)) return 0
  const rows = lignes as Array<{ quantite: number; prixUnitaire: number; remise?: number; tva?: number }>
  const ht = rows.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0)
  const tva = rows.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100) * ((l.tva ?? 20) / 100), 0)
  return (ht + tva) * (1 - remise / 100)
}

function toMonthlyChart(allDevis: SDevis[]) {
  const now = new Date()
  const months: Record<string, { montant: number; devis: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleDateString('fr-FR', { month: 'short' })
    months[key] = { montant: 0, devis: 0 }
  }
  allDevis.forEach(d => {
    const key = new Date(d.created_at).toLocaleDateString('fr-FR', { month: 'short' })
    if (months[key] !== undefined) {
      if (d.statut === 'accepte') months[key].montant += rawTTC(d.lignes, d.remise ?? 0)
      months[key].devis++
    }
  })
  return Object.entries(months).map(([mois, v]) => ({ mois, montant: Math.round(v.montant), devis: v.devis }))
}

export default function DashboardPage() {
  const { t, locale, formatCurrency } = useLanguage()
  const [stats, setStats] = useState<Stats | null>(null)
  const [allDevis, setAllDevis] = useState<SDevis[]>([])
  const [clients, setClients] = useState<SClient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStats(), getDevis(), getClients()])
      .then(([s, d, c]) => {
        setStats(s)
        setAllDevis(d as SDevis[])
        setClients(c as SClient[])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const todayLabel = new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const isEmpty = !loading && stats !== null && stats.totalDevis === 0 && stats.totalClients === 0
  const recentDevis = allDevis.slice(0, 5)
  const chartData = toMonthlyChart(allDevis)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex-1 overflow-auto">
        <Header title={t.nav.dashboard} subtitle={todayLabel} />
        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[65vh]">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center mb-6 shadow-lg shadow-sky-200">
            <Rocket size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Bienvenue sur VoltPilot !</h1>
          <p className="text-slate-500 max-w-md mb-8 text-sm leading-relaxed">
            Votre espace est prêt. Commencez par ajouter votre premier client, puis créez votre premier devis solaire professionnel en quelques minutes.
          </p>
          <div className="flex gap-3">
            <Link href="/clients/nouveau" className="btn-secondary flex items-center gap-2 text-sm">
              <Users size={15} /> Ajouter un client
            </Link>
            <Link href="/devis/nouveau" className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={15} /> Créer un devis
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
            {[
              { step: '1', title: 'Ajoutez un client', desc: 'Créez la fiche de votre premier client installateur ou particulier' },
              { step: '2', title: 'Créez un devis', desc: 'Générez un devis professionnel solaire en moins de 3 minutes' },
              { step: '3', title: 'Suivez vos affaires', desc: 'Votre CA et taux de conversion s\'affichent en temps réel ici' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center mx-auto mb-2">{s.step}</div>
                <p className="font-semibold text-slate-800 text-sm">{s.title}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const dashStats = [
    {
      label: t.dashboard.revenue,
      value: formatCurrency(stats?.caTotal ?? 0),
      trend: `${stats?.devisAcceptes ?? 0} devis acceptés`,
      icon: Euro, iconBg: 'rgba(34,211,238,0.1)', iconColor: '#22D3EE', trendColor: '#10b981',
    },
    {
      label: t.dashboard.totalQuotes,
      value: String(stats?.totalDevis ?? 0),
      trend: `${stats?.tauxConversion ?? 0}% taux d'acceptation`,
      icon: FileText, iconBg: 'rgba(79,70,229,0.1)', iconColor: '#4f46e5', trendColor: '#10b981',
    },
    {
      label: t.dashboard.acceptedQuotes,
      value: String(stats?.devisAcceptes ?? 0),
      trend: t.dashboard.acceptanceRate.replace('{n}', String(stats?.tauxConversion ?? 0)),
      icon: CheckCircle2, iconBg: 'rgba(16,185,129,0.1)', iconColor: '#10b981', trendColor: '#10b981',
    },
    {
      label: t.dashboard.activeClients,
      value: String(stats?.totalClients ?? 0),
      trend: `${stats?.totalClients ?? 0} enregistrés`,
      icon: Users, iconBg: 'rgba(34,211,238,0.1)', iconColor: '#06B6D4', trendColor: '#10b981',
    },
  ]

  return (
    <div className="flex-1 overflow-auto">
      <Header
        title={t.nav.dashboard}
        subtitle={todayLabel}
        action={{ label: t.dashboard.newQuote, href: '/devis/nouveau' }}
      />

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {dashStats.map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="stat-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: stat.iconBg }}>
                    <Icon size={18} style={{ color: stat.iconColor }} />
                  </div>
                </div>
                <p className="text-2xl font-black mb-0.5" style={{ color: '#0d1117', letterSpacing: '-0.03em' }}>{stat.value}</p>
                <p className="text-sm font-medium mb-2" style={{ color: '#6b7280' }}>{stat.label}</p>
                <div className="flex items-center gap-1" style={{ color: stat.trendColor, fontSize: '12px', fontWeight: '600' }}>
                  <ArrowUpRight size={12} />
                  {stat.trend}
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-2 volt-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-sm" style={{ color: '#0d1117' }}>{t.dashboard.revenueChart}</h2>
                <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>6 derniers mois — CA accepté</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: '#f9fafb', border: '1px solid #e9eaec' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: '#22D3EE' }} />
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>CA TTC</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => v > 999 ? `${Math.round(v / 1000)}k€` : `${v}€`} />
                <Tooltip
                  formatter={(v: unknown) => [formatCurrency(Number(v ?? 0)), t.dashboard.revenue]}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e9eaec', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '13px' }}
                  labelStyle={{ fontWeight: '700', color: '#0d1117', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="montant" stroke="#22D3EE" strokeWidth={2.5} fill="url(#gradCA)" dot={{ fill: '#22D3EE', r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#22D3EE', stroke: 'white', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="volt-card p-5">
            <div className="mb-5">
              <h2 className="font-bold text-sm" style={{ color: '#0d1117' }}>{t.dashboard.quotesVolume}</h2>
              <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{t.dashboard.perMonth}</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: unknown) => [Number(v ?? 0), t.nav.quotes]}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e9eaec', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '13px' }}
                />
                <Bar dataKey="devis" fill="#4f46e5" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent devis + top clients */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-2 volt-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <h2 className="font-bold text-sm" style={{ color: '#0d1117' }}>{t.dashboard.recentQuotes}</h2>
              <Link href="/devis" className="flex items-center gap-1 text-xs font-semibold transition-colors" style={{ color: '#22D3EE' }}>
                {t.common.viewAll} <ArrowUpRight size={12} />
              </Link>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                  {[t.dashboard.number, t.dashboard.client, t.dashboard.date, t.dashboard.amount, t.dashboard.statusCol].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left" style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentDevis.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                      Aucun devis pour le moment — <Link href="/devis/nouveau" className="text-sky-500 hover:underline font-medium">créer le premier</Link>
                    </td>
                  </tr>
                ) : recentDevis.map((d) => {
                  const ttc = rawTTC(d.lignes, d.remise ?? 0)
                  return (
                    <tr key={d.id} className="table-row-hover" style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td className="px-5 py-3.5">
                        <Link href={`/devis/${d.id}`} className="font-semibold hover:underline" style={{ fontSize: '13px', color: '#0d1117' }}>{d.numero}</Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg, #22D3EE, #06B6D4)', fontSize: '10px' }}>
                            {(d.clients?.nom ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>{d.clients?.nom ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5" style={{ fontSize: '13px', color: '#9ca3af' }}>
                        {new Date(d.created_at).toLocaleDateString(locale)}
                      </td>
                      <td className="px-5 py-3.5" style={{ fontSize: '13px', fontWeight: '700', color: '#0d1117', letterSpacing: '-0.01em' }}>
                        {formatCurrency(ttc)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={d.statut as DevisStatus} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="volt-card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <h2 className="font-bold text-sm" style={{ color: '#0d1117' }}>{t.dashboard.topClients}</h2>
            </div>
            <div className="p-3 space-y-1.5">
              {clients.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-400">Aucun client</p>
                  <Link href="/clients/nouveau" className="text-xs text-indigo-500 hover:underline mt-1 block">Ajouter un client →</Link>
                </div>
              ) : clients.slice(0, 6).map((c, i) => (
                <Link key={c.id} href={`/clients/${c.id}`} className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-blue-50 group">
                  <span className="text-xs font-black w-5 flex-shrink-0 text-center" style={{ color: i < 3 ? '#22D3EE' : '#d1d5db' }}>#{i + 1}</span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', fontSize: '11px' }}>
                    {c.nom.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate group-hover:text-sky-700 transition-colors" style={{ color: '#0d1117' }}>{c.nom}</p>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>{c.ville ?? '—'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
