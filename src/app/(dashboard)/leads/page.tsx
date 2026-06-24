'use client'
import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Lead } from '@/lib/types'
import { Zap, Mail, Phone, MapPin, Clock, CheckCircle2, MessageSquare, RefreshCw, Sun, Euro, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

const STATUS_CONFIG = {
  nouveau: { label: 'Nouveau', color: 'bg-blue-100 text-sky-700' },
  contacte: { label: 'Contacté', color: 'bg-blue-100 text-blue-700' },
  converti: { label: 'Converti', color: 'bg-green-100 text-green-700' },
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `il y a ${diff}s`
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return `il y a ${Math.floor(diff / 86400)}j`
}

function eur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function LeadCard({ lead, onStatusChange }: { lead: Lead; onStatusChange: (id: string, s: Lead['status']) => void }) {
  const [expanded, setExpanded] = useState(false)
  const hasEstimation = lead.nbPanneaux != null

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' }}>
              {lead.nom.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-slate-900">{lead.nom}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[lead.status].color}`}>
                  {STATUS_CONFIG[lead.status].label}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={11} /> {timeAgo(lead.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600 transition">
                  <Mail size={12} /> {lead.email}
                </a>
                {lead.telephone && (
                  <a href={`tel:${lead.telephone}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600 transition">
                    <Phone size={12} /> {lead.telephone}
                  </a>
                )}
                {lead.ville && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={12} /> {lead.ville}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {lead.typeProjet && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{lead.typeProjet}</span>}
                {lead.typeBien && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{lead.typeBien}</span>}
                {lead.objectif && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">{lead.objectif}</span>}
              </div>
              {lead.message && (
                <p className="mt-2 text-xs text-slate-500 italic">&ldquo;{lead.message}&rdquo;</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Link
              href={`/devis/nouveau?lead_nom=${encodeURIComponent(lead.nom)}&lead_email=${encodeURIComponent(lead.email)}&lead_tel=${encodeURIComponent(lead.telephone)}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors whitespace-nowrap"
              style={{ background: '#0ea5e9' }}
            >
              Convertir en devis <ArrowRight size={12} />
            </Link>
            <select
              value={lead.status}
              onChange={e => onStatusChange(lead.id, e.target.value as Lead['status'])}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 cursor-pointer"
            >
              <option value="nouveau">Nouveau</option>
              <option value="contacte">Contacté</option>
              <option value="converti">Converti ✓</option>
            </select>
          </div>
        </div>

        {/* Estimation mini-summary */}
        {hasEstimation && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-4 w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 text-xs font-semibold text-amber-700 hover:from-amber-100 hover:to-orange-100 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sun size={13} /> Estimation calculée — {lead.nbPanneaux} panneaux · {lead.puissanceKwc} kWc
            </span>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {/* Estimation détail (expandable) */}
      {hasEstimation && expanded && (
        <div className="px-5 pb-5 border-t border-slate-50 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-slate-900">{lead.nbPanneaux}</div>
              <div className="text-xs text-slate-500">Panneaux</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-slate-900">{lead.puissanceKwc} kWc</div>
              <div className="text-xs text-slate-500">Puissance</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-slate-900">{lead.productionAnnuelle?.toLocaleString('fr-FR')}</div>
              <div className="text-xs text-slate-500">kWh / an</div>
            </div>
            {lead.fourchetteMin != null && lead.fourchetteMax != null && (
              <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                <div className="text-sm font-bold text-amber-700">
                  {eur(lead.fourchetteMin)} — {eur(lead.fourchetteMax)}
                </div>
                <div className="text-xs text-slate-500">Fourchette TTC</div>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            {lead.surface && <span className="flex items-center gap-1"><Sun size={11} /> {lead.surface} m² toiture</span>}
            {lead.factureMensuelle && <span className="flex items-center gap-1"><Euro size={11} /> {lead.factureMensuelle} €/mois</span>}
            {lead.typeToiture && <span>· {lead.typeToiture}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/widget')
      const data: Lead[] = await res.json()
      setLeads(data)
    } catch {
      setLeads([])
    }
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  const updateStatus = async (id: string, status: Lead['status']) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    await fetch('/api/widget', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, statut: status }),
    }).catch(console.error)
  }

  const nouveaux = leads.filter(l => l.status === 'nouveau').length

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Leads Widget" subtitle="Demandes reçues depuis votre site internet" />

      <div className="p-6 max-w-4xl mx-auto space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total reçus', value: leads.length, icon: Zap, color: '#0ea5e9' },
            { label: 'Nouveaux', value: nouveaux, icon: MessageSquare, color: '#ef4444' },
            { label: 'Convertis', value: leads.filter(l => l.status === 'converti').length, icon: CheckCircle2, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.color + '18' }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Refresh */}
        <div className="flex justify-end">
          <button onClick={refresh} disabled={loading} className="btn-secondary text-sm flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        {/* Liste leads */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 flex justify-center">
              <div className="w-7 h-7 border-[3px] border-sky-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : leads.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <Zap size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold mb-1">Aucun lead pour le moment</p>
              <p className="text-slate-400 text-sm">Les demandes soumises via votre widget apparaîtront ici en temps réel.</p>
              <p className="text-xs text-slate-300 mt-4">Pour intégrer le widget sur votre site, allez dans <strong className="text-slate-400">Paramètres</strong>.</p>
            </div>
          ) : leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} onStatusChange={updateStatus} />
          ))}
        </div>
      </div>
    </div>
  )
}
