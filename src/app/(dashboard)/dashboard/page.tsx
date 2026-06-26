'use client'
import { useEffect, useRef, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { SolarSceneLoader } from '@/components/SolarSceneLoader'
import { useLanguage } from '@/i18n/LanguageContext'
import { getDashboardStats, getDevis } from '@/lib/actions/devis'
import { getClients } from '@/lib/actions/clients'
import { DevisStatus } from '@/lib/types'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { FileText, Users, CheckCircle2, Euro, ArrowUpRight, Plus, Rocket } from 'lucide-react'
import Link from 'next/link'

type Stats = { totalDevis: number; devisAcceptes: number; tauxConversion: number; caTotal: number; totalClients: number }
type SDevis = { id: string; numero: string; statut: string; lignes: unknown; remise: number | null; created_at: string; date_validite: string; clients: { nom: string; email: string; ville: string } | null }
type SClient = { id: string; nom: string; ville: string | null; email: string | null }

function rawTTC(lignes: unknown, remise: number = 0): number {
  if (!Array.isArray(lignes)) return 0
  const rows = lignes as Array<{ quantite: number; prixUnitaire: number; remise?: number; tva?: number }>
  const ht  = rows.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0)
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

function AnimatedValue({ target, format }: { target: number; format: (n: number) => string }) {
  const [display, setDisplay] = useState(format(0))
  const rafRef = useRef<number>(0)
  useEffect(() => {
    if (target === 0) { setDisplay(format(0)); return }
    const start = performance.now()
    const tick = (now: number) => {
      const p     = Math.min((now - start) / 1100, 1)
      const eased = 1 - Math.pow(1 - p, 4)
      setDisplay(format(Math.round(target * eased)))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
      else setDisplay(format(target))
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, format])
  return <>{display}</>
}

const CUSTOM_TOOLTIP_STYLE = {
  background: 'rgba(10, 15, 40, 0.95)',
  border: '1px solid rgba(124,58,237,0.3)',
  borderRadius: '10px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  fontSize: '13px',
  color: 'rgba(255,255,255,0.9)',
}

export default function DashboardPage() {
  const { t, locale, formatCurrency } = useLanguage()
  const [stats, setStats]   = useState<Stats | null>(null)
  const [allDevis, setAllDevis] = useState<SDevis[]>([])
  const [clients, setClients]   = useState<SClient[]>([])
  const [loading, setLoading]   = useState(true)

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
        <div className="volt-spinner" />
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex-1 overflow-auto">
        <Header title={t.nav.dashboard} subtitle={todayLabel} />

        {/* Hero solar panel */}
        <div className="relative w-full" style={{ height: '45vh', minHeight: '280px' }}>
          <SolarSceneLoader />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent 60%, var(--void) 100%)' }}
          />
        </div>

        <div className="flex flex-col items-center justify-center px-6 pb-16 text-center -mt-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{
              background: 'linear-gradient(135deg, var(--nebula), var(--indigo))',
              boxShadow: '0 8px 28px var(--nebula-glow)',
            }}
          >
            <Rocket size={28} style={{ color: '#fff' }} />
          </div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--nova)', letterSpacing: '-0.03em', fontFamily: "'Sora', sans-serif" }}
          >
            Bienvenue sur VoltPilot
          </h1>
          <p className="mb-8 text-sm leading-relaxed max-w-sm" style={{ color: 'var(--star)' }}>
            Votre espace est prêt. Ajoutez votre premier client et générez votre premier devis solaire professionnel.
          </p>
          <div className="flex gap-3">
            <Link href="/clients/nouveau" className="btn-secondary text-sm flex items-center gap-2">
              <Users size={14} /> Ajouter un client
            </Link>
            <Link href="/devis/nouveau" className="btn-primary text-sm flex items-center gap-2">
              <Plus size={14} /> Créer un devis
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-5 max-w-md">
            {[
              { step: '1', title: 'Client', desc: 'Créez la fiche de votre premier client' },
              { step: '2', title: 'Devis',  desc: 'Générez un devis solaire en 3 minutes' },
              { step: '3', title: 'Suivi',  desc: 'CA et taux de conversion en temps réel' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-sm"
                  style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--nebula-bright)', border: '1px solid var(--border-nebula)' }}
                >
                  {s.step}
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--nova)' }}>{s.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--star)' }}>{s.desc}</p>
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
      rawValue: stats?.caTotal ?? 0,
      format: (n: number) => formatCurrency(n),
      trend: `${stats?.devisAcceptes ?? 0} devis acceptés`,
      icon: Euro,
      iconGrad: 'linear-gradient(135deg, var(--nebula), var(--indigo))',
    },
    {
      label: t.dashboard.totalQuotes,
      rawValue: stats?.totalDevis ?? 0,
      format: (n: number) => String(n),
      trend: `${stats?.tauxConversion ?? 0}% acceptés`,
      icon: FileText,
      iconGrad: 'linear-gradient(135deg, var(--plasma), #0891b2)',
    },
    {
      label: t.dashboard.acceptedQuotes,
      rawValue: stats?.devisAcceptes ?? 0,
      format: (n: number) => String(n),
      trend: t.dashboard.acceptanceRate.replace('{n}', String(stats?.tauxConversion ?? 0)),
      icon: CheckCircle2,
      iconGrad: 'linear-gradient(135deg, #10b981, #059669)',
    },
    {
      label: t.dashboard.activeClients,
      rawValue: stats?.totalClients ?? 0,
      format: (n: number) => String(n),
      trend: `${stats?.totalClients ?? 0} enregistrés`,
      icon: Users,
      iconGrad: 'linear-gradient(135deg, var(--solar), #d97706)',
    },
  ]

  return (
    <div className="flex-1 overflow-auto scrollbar-thin">
      <Header
        title={t.nav.dashboard}
        subtitle={todayLabel}
        action={{ label: t.dashboard.newQuote, href: '/devis/nouveau' }}
      />

      {/* Hero solar panel banner */}
      <div
        className="relative w-full"
        style={{ height: '220px', borderBottom: '1px solid var(--border-dim)' }}
      >
        <SolarSceneLoader />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(3,5,13,0.7) 0%, transparent 40%, transparent 60%, rgba(3,5,13,0.7) 100%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--void))' }}
        />
        {/* Live tag */}
        <div className="absolute top-4 left-6 flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }}
          />
          <span className="text-xs font-semibold" style={{ color: 'var(--star)' }}>Temps réel</span>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4 md:space-y-5">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {dashStats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className={`stat-card animate-fade-up animate-fade-up-${i + 1}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: stat.iconGrad, boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}
                  >
                    <Icon size={16} style={{ color: '#fff' }} />
                  </div>
                </div>
                <p
                  className="text-2xl font-black mb-0.5"
                  style={{ color: 'var(--nova)', letterSpacing: '-0.035em', fontFamily: "'Sora', sans-serif" }}
                >
                  <AnimatedValue target={stat.rawValue} format={stat.format} />
                </p>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--star)' }}>
                  {stat.label}
                </p>
                <div
                  className="flex items-center gap-1 text-xs font-semibold"
                  style={{ color: '#10b981' }}
                >
                  <ArrowUpRight size={11} />
                  {stat.trend}
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-2 volt-card p-5 animate-fade-up animate-fade-up-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2
                  className="font-semibold text-sm"
                  style={{ color: 'var(--nova)', fontFamily: "'Sora', sans-serif" }}
                >
                  {t.dashboard.revenueChart}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--star)' }}>6 derniers mois — CA accepté</p>
              </div>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid var(--border-nebula)' }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--nebula)' }} />
                <span style={{ fontSize: '11px', color: 'var(--star)', fontWeight: '500' }}>CA TTC</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#7c3aed" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="mois"
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => v > 999 ? `${Math.round(v / 1000)}k€` : `${v}€`}
                />
                <Tooltip
                  formatter={(v: unknown) => [formatCurrency(Number(v ?? 0)), t.dashboard.revenue]}
                  contentStyle={CUSTOM_TOOLTIP_STYLE}
                  labelStyle={{ fontWeight: '700', color: 'var(--nova)', marginBottom: '4px' }}
                  cursor={{ stroke: 'rgba(124,58,237,0.3)', strokeWidth: 1 }}
                />
                <Area
                  type="monotone" dataKey="montant"
                  stroke="#7c3aed" strokeWidth={2}
                  fill="url(#gradCA)"
                  dot={{ fill: '#7c3aed', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#9b5cf6', stroke: 'rgba(124,58,237,0.4)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="volt-card p-5 animate-fade-up animate-fade-up-3">
            <div className="mb-5">
              <h2
                className="font-semibold text-sm"
                style={{ color: 'var(--nova)', fontFamily: "'Sora', sans-serif" }}
              >
                {t.dashboard.quotesVolume}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--star)' }}>{t.dashboard.perMonth}</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={14}>
                <XAxis
                  dataKey="mois"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  formatter={(v: unknown) => [Number(v ?? 0), t.nav.quotes]}
                  contentStyle={CUSTOM_TOOLTIP_STYLE}
                  cursor={{ fill: 'rgba(124,58,237,0.06)' }}
                />
                <Bar dataKey="devis" fill="#22d3ee" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent devis + top clients */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-2 volt-card overflow-hidden animate-fade-up animate-fade-up-3">
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border-dim)' }}
            >
              <h2
                className="font-semibold text-sm"
                style={{ color: 'var(--nova)', fontFamily: "'Sora', sans-serif" }}
              >
                {t.dashboard.recentQuotes}
              </h2>
              <Link
                href="/devis"
                className="flex items-center gap-1 text-xs font-semibold transition-colors"
                style={{ color: 'var(--nebula-bright)' }}
              >
                {t.common.viewAll} <ArrowUpRight size={11} />
              </Link>
            </div>

            {/* Mobile: cards */}
            <div className="md:hidden divide-y" style={{ borderColor: 'var(--border-dim)' }}>
              {recentDevis.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--star)' }}>
                  Aucun devis —{' '}
                  <Link href="/devis/nouveau" className="font-medium" style={{ color: 'var(--nebula-bright)' }}>
                    créer le premier
                  </Link>
                </div>
              ) : recentDevis.map(d => {
                const ttc = rawTTC(d.lignes, d.remise ?? 0)
                return (
                  <Link key={d.id} href={`/devis/${d.id}`} className="block px-5 py-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--nova)' }}>{d.numero}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--star)' }}>{d.clients?.nom ?? '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: 'var(--nova)' }}>{formatCurrency(ttc)}</p>
                        <StatusBadge status={d.statut as DevisStatus} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Desktop: table */}
            <table className="w-full hidden md:table">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-dim)' }}>
                  {[t.dashboard.number, t.dashboard.client, t.dashboard.date, t.dashboard.amount, t.dashboard.statusCol].map(h => (
                    <th
                      key={h}
                      className="px-5 py-2.5 text-left"
                      style={{ fontSize: '10px', fontWeight: '600', color: 'var(--dust)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentDevis.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--star)' }}>
                      Aucun devis —{' '}
                      <Link href="/devis/nouveau" className="font-medium" style={{ color: 'var(--nebula-bright)' }}>
                        créer le premier
                      </Link>
                    </td>
                  </tr>
                ) : recentDevis.map(d => {
                  const ttc = rawTTC(d.lignes, d.remise ?? 0)
                  return (
                    <tr key={d.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-dim)' }}>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/devis/${d.id}`}
                          className="font-semibold hover:underline"
                          style={{ fontSize: '13px', color: 'var(--nova)' }}
                        >
                          {d.numero}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center font-bold"
                            style={{ background: 'linear-gradient(135deg, var(--nebula), var(--indigo))', color: '#fff', fontSize: '10px' }}
                          >
                            {(d.clients?.nom ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '13px', color: 'var(--star)', fontWeight: '500' }}>
                            {d.clients?.nom ?? '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5" style={{ fontSize: '12px', color: 'var(--dust)' }}>
                        {new Date(d.created_at).toLocaleDateString(locale)}
                      </td>
                      <td className="px-5 py-3.5" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--nova)', letterSpacing: '-0.01em' }}>
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

          <div className="volt-card overflow-hidden animate-fade-up animate-fade-up-4">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-dim)' }}>
              <h2
                className="font-semibold text-sm"
                style={{ color: 'var(--nova)', fontFamily: "'Sora', sans-serif" }}
              >
                {t.dashboard.topClients}
              </h2>
            </div>
            <div className="p-3 space-y-1">
              {clients.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm" style={{ color: 'var(--star)' }}>Aucun client</p>
                  <Link
                    href="/clients/nouveau"
                    className="text-xs mt-1 block font-medium"
                    style={{ color: 'var(--nebula-bright)' }}
                  >
                    Ajouter un client →
                  </Link>
                </div>
              ) : clients.slice(0, 6).map((c, i) => (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span
                    className="text-xs font-black w-5 flex-shrink-0 text-center"
                    style={{ color: i < 3 ? 'var(--nebula-bright)' : 'var(--dust)' }}
                  >
                    #{i + 1}
                  </span>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold flex-shrink-0 text-white"
                    style={{ background: 'linear-gradient(135deg, var(--nebula), var(--indigo))', fontSize: '11px' }}
                  >
                    {c.nom.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--nova)' }}>{c.nom}</p>
                    <p className="text-xs" style={{ color: 'var(--dust)' }}>{c.ville ?? '—'}</p>
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
