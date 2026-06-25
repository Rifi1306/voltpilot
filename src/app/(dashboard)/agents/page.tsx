'use client'
import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Bot, Zap, CheckCircle, AlertTriangle, XCircle, RefreshCw, Copy, Loader2, BarChart3, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type MarketingContent = {
  id: string
  type: string
  titre: string
  contenu: string
  hashtags: string[]
  statut: string
  plateforme: string
  score_engagement: number
  created_at: string
}

type SiteAlert = {
  id: string
  type: string
  severite: string
  message: string
  details: Record<string, unknown>
  resolu: boolean
  created_at: string
}

export default function AgentsPage() {
  const [content, setContent] = useState<MarketingContent[]>([])
  const [alerts, setAlerts] = useState<SiteAlert[]>([])
  const [runningMarketing, setRunningMarketing] = useState(false)
  const [runningMonitor, setRunningMonitor] = useState(false)
  const [lastMonitor, setLastMonitor] = useState<{ checks: { name: string; ok: boolean; latencyMs: number }[] } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase.from('marketing_content').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('site_alerts').select('*').order('created_at', { ascending: false }).limit(30),
    ])
    if (c) setContent(c as MarketingContent[])
    if (a) setAlerts(a as SiteAlert[])
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  async function runMarketing() {
    setRunningMarketing(true)
    await fetch('/api/agents/marketing', { method: 'POST' })
    await loadData()
    setRunningMarketing(false)
  }

  async function runMonitor() {
    setRunningMonitor(true)
    const res = await fetch('/api/agents/monitor', { method: 'POST' })
    const data = await res.json()
    setLastMonitor(data)
    await loadData()
    setRunningMonitor(false)
  }

  async function publierContent(id: string) {
    await supabase.from('marketing_content').update({ statut: 'publie', published_at: new Date().toISOString() }).eq('id', id)
    await loadData()
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const alertsActives = alerts.filter(a => !a.resolu)
  const contentBrouillons = content.filter(c => c.statut === 'brouillon')

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Agents IA" subtitle="Marketing automatique & monitoring du site" />

      <div className="p-6 space-y-6">

        {/* Status cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="volt-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(139,92,246,0.1))' }}>
              <BarChart3 size={22} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{contentBrouillons.length}</p>
              <p className="text-sm text-slate-500">Posts en attente</p>
            </div>
            <button
              onClick={runMarketing}
              disabled={runningMarketing}
              className="ml-auto btn-primary text-sm flex items-center gap-1.5"
            >
              {runningMarketing ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
              {runningMarketing ? 'Génération…' : 'Générer'}
            </button>
          </div>

          <div className="volt-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: alertsActives.length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' }}>
              <Shield size={22} style={{ color: alertsActives.length > 0 ? '#ef4444' : '#10b981' }} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{alertsActives.length === 0 ? '✓ OK' : alertsActives.length + ' alertes'}</p>
              <p className="text-sm text-slate-500">Statut du site</p>
            </div>
            <button
              onClick={runMonitor}
              disabled={runningMonitor}
              className="ml-auto btn-secondary text-sm flex items-center gap-1.5"
            >
              {runningMonitor ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {runningMonitor ? 'Vérification…' : 'Vérifier'}
            </button>
          </div>
        </div>

        {/* Monitor résultats */}
        {lastMonitor && (
          <div className="volt-card p-5">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Zap size={16} className="text-sky-500" /> Résultats du dernier scan
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {lastMonitor.checks?.map((c: { name: string; ok: boolean; latencyMs: number }) => (
                <div key={c.name} className="flex items-center gap-2 p-3 rounded-xl" style={{ background: c.ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${c.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                  {c.ok
                    ? <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                    : <XCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                  }
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{c.name.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400">{c.latencyMs}ms</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alertes actives */}
        {alertsActives.length > 0 && (
          <div className="volt-card p-5">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" /> Alertes actives
            </h3>
            <div className="space-y-2">
              {alertsActives.slice(0, 5).map(alert => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: alert.severite === 'critique' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)', border: `1px solid ${alert.severite === 'critique' ? 'rgba(239,68,68,0.2)' : 'rgba(14,165,233,0.2)'}` }}>
                  <span className="text-sm">{alert.message}</span>
                  <span className="ml-auto text-xs text-slate-400 whitespace-nowrap">{new Date(alert.created_at).toLocaleTimeString('fr')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contenu marketing */}
        <div className="volt-card p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Bot size={16} className="text-indigo-500" /> Contenu généré par l&apos;agent marketing
          </h3>

          {content.length === 0 && (
            <div className="text-center py-10">
              <Bot size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 text-sm">Aucun contenu généré. Cliquez sur &quot;Générer&quot; pour démarrer l&apos;agent.</p>
            </div>
          )}

          <div className="space-y-4">
            {content.map(item => (
              <div key={item.id} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="badge" style={{ background: 'rgba(34,211,238,0.08)', color: '#22D3EE', border: '1px solid rgba(34,211,238,0.15)', fontSize: '11px' }}>
                      {item.type.replace(/_/g, ' ')}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">Score: {item.score_engagement}/100</span>
                  </div>
                  <span className={`badge text-xs ${item.statut === 'publie' ? 'badge-success' : 'badge-warning'}`}>
                    {item.statut === 'publie' ? '✓ Publié' : 'Brouillon'}
                  </span>
                </div>

                <p className="font-semibold text-slate-800 text-sm mb-1">{item.titre}</p>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line mb-3" style={{ maxHeight: '100px', overflow: 'hidden' }}>
                  {item.contenu}
                </p>

                {item.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.hashtags.map(h => (
                      <span key={h} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.06)', color: '#22D3EE' }}>{h}</span>
                    ))}
                  </div>
                )}

                {item.statut === 'brouillon' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(`${item.contenu}\n\n${item.hashtags?.join(' ')}`, item.id)}
                      className="btn-secondary text-xs flex items-center gap-1.5"
                    >
                      {copied === item.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                      {copied === item.id ? 'Copié !' : 'Copier'}
                    </button>
                    <button onClick={() => publierContent(item.id)} className="btn-primary text-xs">
                      Marquer publié
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
