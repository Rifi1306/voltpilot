'use client'
import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { useLanguage } from '@/i18n/LanguageContext'
import { getAdminStats, AdminStats } from '@/lib/actions/admin'
import { Users, FileText, Euro, CheckCircle2, Lock } from 'lucide-react'

export default function AdminPage() {
  const [data, setData] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { formatCurrency } = useLanguage()

  useEffect(() => {
    getAdminStats()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="volt-spinner" />
      </div>
    )
  }

  if (!data || !data.allowed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-12">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <Lock size={28} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Accès refusé</h1>
        <p className="text-sm text-slate-400 max-w-xs">
          Cette page est réservée à l'administrateur de VoltPilot.
        </p>
      </div>
    )
  }

  const tauxAcceptation = data.totalDevis > 0
    ? Math.round(data.devisAcceptes / data.totalDevis * 100)
    : 0

  const kpis = [
    { label: 'Utilisateurs', value: String(data.totalUsers), icon: Users, iconBg: 'rgba(79,70,229,0.1)', iconColor: '#4f46e5' },
    { label: 'Devis total', value: String(data.totalDevis), icon: FileText, iconBg: 'rgba(34,211,238,0.1)', iconColor: '#22D3EE' },
    { label: 'CA total (acceptés)', value: formatCurrency(data.totalCA), icon: Euro, iconBg: 'rgba(16,185,129,0.1)', iconColor: '#10b981' },
    { label: 'Taux d\'acceptation', value: `${tauxAcceptation}%`, icon: CheckCircle2, iconBg: 'rgba(34,211,238,0.1)', iconColor: '#06B6D4' },
  ]

  const statuses = [
    { label: 'Acceptés', count: data.devisAcceptes, color: '#10b981' },
    { label: 'Envoyés', count: data.devisEnvoyes, color: '#3b82f6' },
    { label: 'Brouillons', count: data.devisBrouillons, color: '#94a3b8' },
    { label: 'Refusés', count: data.devisRefuses, color: '#ef4444' },
  ]

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Administration" subtitle="Vue globale de la plateforme VoltPilot" />

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map(k => {
            const Icon = k.icon
            return (
              <div key={k.label} className="stat-card">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: k.iconBg }}>
                  <Icon size={18} style={{ color: k.iconColor }} />
                </div>
                <p className="text-2xl font-black text-slate-900" style={{ letterSpacing: '-0.03em' }}>{k.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{k.label}</p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Répartition des devis */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-900 mb-1">Répartition des devis</h2>
            <p className="text-sm text-slate-400 mb-5">Sur l'ensemble de la plateforme</p>
            <div className="space-y-4">
              {statuses.map(s => {
                const pct = data.totalDevis > 0 ? Math.round(s.count / data.totalDevis * 100) : 0
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

          {/* Top utilisateurs */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Top utilisateurs</h2>
              <p className="text-sm text-slate-400">Classés par CA accepté</p>
            </div>
            <div className="divide-y divide-slate-50">
              {data.topUsers.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Aucun utilisateur</p>
              ) : data.topUsers.map((u, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-3">
                  <span className="text-xs font-black w-5 text-center" style={{ color: i < 3 ? '#22D3EE' : '#d1d5db' }}>#{i + 1}</span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', fontSize: '11px' }}>
                    {(u.nom ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{u.nom ?? '—'}</p>
                    <p className="text-xs text-slate-400">{u.totalDevis} devis</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900 flex-shrink-0">{formatCurrency(u.totalCA)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inscriptions récentes */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Inscriptions récentes</h2>
            <p className="text-sm text-slate-400">10 derniers comptes créés</p>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                {['Entreprise', 'Date d\'inscription'].map(h => (
                  <th key={h} className="px-6 py-3 text-left" style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-10 text-center text-sm text-slate-400">Aucun utilisateur</td>
                </tr>
              ) : data.recentUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #22D3EE, #06B6D4)', fontSize: '11px' }}>
                        {(u.nom ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{u.nom ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-400">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
