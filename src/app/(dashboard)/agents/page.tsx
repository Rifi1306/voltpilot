'use client'
import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Bot, Zap, CheckCircle, AlertTriangle, XCircle, RefreshCw, Copy, Loader2, BarChart3, Shield, Mail, Plus, Eye, Trash2, CheckCheck, X, PauseCircle, Send } from 'lucide-react'
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

type Prospect = {
  id: string
  entreprise: string
  contact_prenom: string | null
  email: string
  region: string | null
  type_activite: string
  pays: string
  etape: string
  statut: string
  email_sujet: string | null
  email_corps: string | null
  date_premier_contact: string | null
  date_dernier_contact: string | null
  date_prochaine_action: string | null
  notes: string | null
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

  // ── Prospection ─────────────────────────────────────────────
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [activeTab, setActiveTab] = useState<'agents' | 'prospection'>('agents')
  const [showAddForm, setShowAddForm] = useState(false)
  const [previewProspect, setPreviewProspect] = useState<Prospect | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sendSuspended, setSendSuspended] = useState(false)
  const [addForm, setAddForm] = useState({
    entreprise: '', contact_prenom: '', email: '', region: '', type_activite: 'résidentiel', pays: 'FR', notes: '',
  })
  const [addLoading, setAddLoading] = useState(false)

  const loadData = useCallback(async () => {
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase.from('marketing_content').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('site_alerts').select('*').order('created_at', { ascending: false }).limit(30),
    ])
    if (c) setContent(c as MarketingContent[])
    if (a) setAlerts(a as SiteAlert[])
  }, [supabase])

  const loadProspects = useCallback(async () => {
    const res = await fetch('/api/agents/prospecting')
    const data = await res.json()
    if (data.prospects) setProspects(data.prospects)
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { loadProspects() }, [loadProspects])

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

  async function handleAddProspect(e: React.FormEvent) {
    e.preventDefault()
    setAddLoading(true)
    const res = await fetch('/api/agents/prospecting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', ...addForm }),
    })
    const data = await res.json()
    if (data.prospect) {
      setProspects(prev => [data.prospect, ...prev])
      setShowAddForm(false)
      setAddForm({ entreprise: '', contact_prenom: '', email: '', region: '', type_activite: 'résidentiel', pays: 'FR', notes: '' })
    }
    setAddLoading(false)
  }

  async function handleSend(id: string) {
    setSendingId(id)
    const res = await fetch('/api/agents/prospecting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', id }),
    })
    const data = await res.json()
    if (data.suspended) { setSendSuspended(true); setSendingId(null); return }
    await loadProspects()
    setSendingId(null)
  }

  async function handleResponse(id: string, reponse: string) {
    await fetch('/api/agents/prospecting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'response', id, reponse }),
    })
    await loadProspects()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce prospect ?')) return
    await fetch('/api/agents/prospecting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    setProspects(prev => prev.filter(p => p.id !== id))
  }

  const alertsActives = alerts.filter(a => !a.resolu)
  const contentBrouillons = content.filter(c => c.statut === 'brouillon')

  const ETAPE_LABEL: Record<string, string> = { initial: 'Étape 1', relance1: 'Relance J+4', relance2: 'Relance J+8', stop: 'Terminé' }
  const STATUT_COLOR: Record<string, string> = {
    a_envoyer: 'rgba(245,166,35,0.15)',
    envoye: 'rgba(99,102,241,0.12)',
    reponse_positive: 'rgba(16,185,129,0.12)',
    reponse_negative: 'rgba(239,68,68,0.10)',
    desabonne: 'rgba(100,116,139,0.12)',
  }
  const STATUT_LABEL: Record<string, string> = {
    a_envoyer: 'À envoyer',
    envoye: 'Envoyé',
    reponse_positive: '✓ Positif',
    reponse_negative: 'Négatif',
    desabonne: 'Désabonné',
  }
  const prospectsActifs = prospects.filter(p => !['stop', 'desabonne'].includes(p.etape) || p.statut === 'reponse_positive')
  const prospectsPositifs = prospects.filter(p => p.statut === 'reponse_positive').length
  const prospectsAEnvoyer = prospects.filter(p => p.statut === 'a_envoyer').length

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Agents IA" subtitle="Marketing automatique, monitoring & prospection" />

      <div className="p-6 space-y-6">

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {([['agents', 'Agents IA'], ['prospection', 'Prospection']] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={activeTab === tab
                ? { background: 'var(--nebula)', color: '#fff' }
                : { color: 'var(--star)' }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── PROSPECTION TAB ─────────────────────────────────── */}
        {activeTab === 'prospection' && (
          <div className="space-y-5">

            {/* Email suspendu banner */}
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)' }}>
              <PauseCircle size={18} style={{ color: '#f5a623', flexShrink: 0 }} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: '#f5a623' }}>Envoi d&apos;emails suspendu</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(245,166,35,0.7)' }}>
                  Les emails sont générés et prêts mais non envoyés. Active l&apos;envoi quand tu es prêt.
                </p>
              </div>
            </div>

            {sendSuspended && (
              <div className="flex items-center justify-between gap-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-sm text-red-400">Envoi bloqué — emails suspendus côté serveur.</p>
                <button onClick={() => setSendSuspended(false)} className="text-slate-400 hover:text-slate-200"><X size={14} /></button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total prospects', value: prospects.length },
                { label: 'À envoyer', value: prospectsAEnvoyer },
                { label: 'Réponses positives', value: prospectsPositifs },
              ].map(s => (
                <div key={s.label} className="volt-card p-4 text-center">
                  <p className="text-3xl font-black" style={{ color: 'var(--nova)' }}>{s.value}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--star)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Add prospect button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddForm(s => !s)}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Plus size={14} /> Ajouter un prospect
              </button>
            </div>

            {/* Add form */}
            {showAddForm && (
              <form onSubmit={handleAddProspect} className="volt-card p-5 space-y-4">
                <h3 className="font-bold text-sm" style={{ color: 'var(--nova)' }}>Nouveau prospect</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--star)' }}>Entreprise *</label>
                    <input required value={addForm.entreprise} onChange={e => setAddForm(f => ({ ...f, entreprise: e.target.value }))} className="input-field text-sm" placeholder="Soleil SARL" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--star)' }}>Prénom contact</label>
                    <input value={addForm.contact_prenom} onChange={e => setAddForm(f => ({ ...f, contact_prenom: e.target.value }))} className="input-field text-sm" placeholder="Jean" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--star)' }}>Email *</label>
                    <input required type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} className="input-field text-sm" placeholder="contact@soleil.fr" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--star)' }}>Région</label>
                    <input value={addForm.region} onChange={e => setAddForm(f => ({ ...f, region: e.target.value }))} className="input-field text-sm" placeholder="Île-de-France" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--star)' }}>Type d&apos;activité</label>
                    <select value={addForm.type_activite} onChange={e => setAddForm(f => ({ ...f, type_activite: e.target.value }))} className="input-field text-sm">
                      {['résidentiel', 'tertiaire', 'agricole', 'industriel'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--star)' }}>Pays</label>
                    <select value={addForm.pays} onChange={e => setAddForm(f => ({ ...f, pays: e.target.value }))} className="input-field text-sm">
                      {['FR', 'BE', 'CH', 'LU', 'CA', 'OTHER'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--star)' }}>Notes</label>
                    <input value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} className="input-field text-sm" placeholder="Ex: fait du résidentiel en Bretagne" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary text-sm">Annuler</button>
                  <button type="submit" disabled={addLoading} className="btn-primary text-sm">
                    {addLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    Ajouter
                  </button>
                </div>
              </form>
            )}

            {/* Prospects list */}
            <div className="volt-card overflow-hidden">
              {prospects.length === 0 ? (
                <div className="py-16 text-center">
                  <Mail size={36} className="mx-auto mb-3" style={{ color: 'var(--border-dim)' }} />
                  <p className="text-sm" style={{ color: 'var(--star)' }}>Aucun prospect encore. Ajoute le premier ci-dessus.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border-dim)' }}>
                  {prospectsActifs.map(p => (
                    <div key={p.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm" style={{ color: 'var(--nova)' }}>{p.entreprise}</span>
                          {p.contact_prenom && <span className="text-xs" style={{ color: 'var(--star)' }}>({p.contact_prenom})</span>}
                          {p.region && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--star)' }}>{p.region}</span>}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--star)' }}>{p.email}</p>
                        {p.date_prochaine_action && p.statut !== 'desabonne' && (
                          <p className="text-xs mt-1" style={{ color: 'rgba(245,166,35,0.8)' }}>
                            Prochaine action : {new Date(p.date_prochaine_action).toLocaleDateString('fr')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: STATUT_COLOR[p.statut] ?? 'rgba(255,255,255,0.05)', color: 'var(--nova)' }}>
                          {STATUT_LABEL[p.statut] ?? p.statut}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--nebula-bright)' }}>
                          {ETAPE_LABEL[p.etape] ?? p.etape}
                        </span>
                        <button
                          onClick={() => setPreviewProspect(p)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ color: 'var(--star)' }}
                          title="Voir l'email"
                        >
                          <Eye size={13} />
                        </button>
                        {p.statut === 'a_envoyer' && (
                          <button
                            onClick={() => handleSend(p.id)}
                            disabled={sendingId === p.id}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--nebula-bright)', border: '1px solid rgba(124,58,237,0.25)' }}
                          >
                            {sendingId === p.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            Envoyer
                          </button>
                        )}
                        {p.statut === 'envoye' && p.etape !== 'stop' && (
                          <div className="flex gap-1">
                            <button onClick={() => handleResponse(p.id, 'oui')} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                              <CheckCheck size={11} /> Oui
                            </button>
                            <button onClick={() => handleResponse(p.id, 'stop')} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(100,116,139,0.12)', color: 'var(--star)' }}>
                              <X size={11} /> Stop
                            </button>
                          </div>
                        )}
                        <button onClick={() => handleDelete(p.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--star)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AGENTS TAB ──────────────────────────────────────── */}
        {activeTab === 'agents' && (<>

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

        </>)}

      </div>

      {/* Email preview modal */}
      {previewProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="volt-card p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm" style={{ color: 'var(--nova)' }}>
                Email → {previewProspect.entreprise}
              </p>
              <button onClick={() => setPreviewProspect(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--star)' }}>Objet : </span>
                <span className="font-semibold" style={{ color: 'var(--nova)' }}>{previewProspect.email_sujet}</span>
              </div>
              <div className="p-3 rounded-lg text-xs whitespace-pre-wrap leading-relaxed" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-dim)', color: 'var(--nova)' }}>
                {previewProspect.email_corps}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { copyToClipboard(previewProspect.email_corps ?? '', previewProspect.id); }}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                {copied === previewProspect.id ? <CheckCheck size={12} /> : <Copy size={12} />}
                {copied === previewProspect.id ? 'Copié !' : 'Copier le corps'}
              </button>
              {previewProspect.statut === 'a_envoyer' && (
                <button
                  onClick={() => { handleSend(previewProspect.id); setPreviewProspect(null) }}
                  disabled={sendingId === previewProspect.id}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <Send size={12} /> Envoyer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
