'use client'
import { useState, useCallback, useEffect, useTransition, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { getClients } from '@/lib/actions/clients'
import { createDevisAction } from '@/lib/actions/devis'
import { getDossiers, type Dossier } from '@/lib/actions/dossiers'
import { LigneDevis } from '@/lib/types'
import { calculateLigne, calculateTotaux, generateId } from '@/lib/utils'
import { useLanguage } from '@/i18n/LanguageContext'
import {
  Plus, Trash2, ChevronDown, Zap, Loader2, Sun, AlertTriangle,
  Calculator, Save, CheckCircle, RefreshCw, Home, Bolt, Target, Lightbulb,
  Satellite,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const DRAFT_KEY = 'voltpilot_devis_draft_v2'

type SClient = {
  id: string; nom: string; email: string | null; telephone: string | null
  adresse: string | null; code_postal: string | null; ville: string | null; siret: string | null
}

const PRODUITS_SOLAIRES = [
  { designation: 'Panneau solaire monocristallin 400Wc', prixUnitaire: 280, tva: 10 },
  { designation: 'Panneau solaire bifacial 450Wc', prixUnitaire: 350, tva: 10 },
  { designation: 'Onduleur string 3kW', prixUnitaire: 800, tva: 20 },
  { designation: 'Onduleur string 6kW', prixUnitaire: 1400, tva: 20 },
  { designation: 'Onduleur string 10kW', prixUnitaire: 2200, tva: 20 },
  { designation: 'Onduleur hybride 3kW (avec batterie)', prixUnitaire: 1200, tva: 20 },
  { designation: 'Onduleur hybride 6kW (avec batterie)', prixUnitaire: 2100, tva: 20 },
  { designation: 'Micro-onduleur 400W (unitaire)', prixUnitaire: 180, tva: 20 },
  { designation: 'Onduleur string triphasé 10kW', prixUnitaire: 2600, tva: 20 },
  { designation: 'Batterie de stockage 5kWh', prixUnitaire: 2500, tva: 20 },
  { designation: 'Batterie de stockage 10kWh', prixUnitaire: 4800, tva: 20 },
  { designation: 'Structure de fixation toiture', prixUnitaire: 150, tva: 20 },
  { designation: 'Structure de fixation sol', prixUnitaire: 280, tva: 20 },
  { designation: 'Câblage DC + AC (forfait)', prixUnitaire: 350, tva: 20 },
  { designation: 'Boîte de jonction et protection DC', prixUnitaire: 180, tva: 20 },
  { designation: 'Pose et installation (journée technicien)', prixUnitaire: 500, tva: 20 },
  { designation: 'Mise en service et tests', prixUnitaire: 300, tva: 20 },
  { designation: 'Démarches administratives (Consuel, EDF)', prixUnitaire: 250, tva: 20 },
  { designation: 'Monitoring & supervision (annuel)', prixUnitaire: 120, tva: 20 },
  { designation: 'Maintenance préventive annuelle', prixUnitaire: 200, tva: 20 },
  { designation: 'Bilan énergétique & étude technique', prixUnitaire: 400, tva: 20 },
]

const TVA_OPTIONS = [0, 5.5, 10, 20]

const ORIENTATIONS = [
  { label: 'Sud', factor: 1.0 },
  { label: 'Sud-Est', factor: 0.95 },
  { label: 'Sud-Ouest', factor: 0.95 },
  { label: 'Est', factor: 0.82 },
  { label: 'Ouest', factor: 0.82 },
  { label: 'Nord', factor: 0.55 },
]

const INCLINAISONS = [
  { label: 'Toit plat (0–5°)', factor: 0.87 },
  { label: 'Faible (10–20°)', factor: 0.96 },
  { label: 'Optimal (30–35°)', factor: 1.0 },
  { label: 'Fort (40–45°)', factor: 0.97 },
]

function getEnsoleillement(cp: string): number {
  const d = parseInt(cp.slice(0, 2))
  if (d >= 30 && d <= 34) return 1500
  if (d === 6 || d === 13 || d === 83 || d === 84) return 1550
  if (d === 31 || d === 32 || d === 65) return 1450
  if (d >= 20 && d <= 29) return 1450
  if (d >= 68 && d <= 69) return 1250
  if (d >= 70 && d <= 79) return 1250
  if (d >= 10 && d <= 19) return 1200
  if (d >= 45 && d <= 54) return 1200
  if (d === 75) return 1200
  return 1250
}

function calcEstimation(surface: number, orientation: string, inclinaison: string, cp: string, ombrage: boolean) {
  const PANEL_W = 400; const PANEL_M2 = 1.7; const PR = 0.80; const TARIF = 0.2276
  const nbPanneaux = Math.max(1, Math.floor(surface / PANEL_M2))
  const puissanceKwc = (nbPanneaux * PANEL_W) / 1000
  const ensoleillement = getEnsoleillement(cp)
  const oF = ORIENTATIONS.find(o => o.label === orientation)?.factor ?? 1.0
  const iF = INCLINAISONS.find(i => i.label === inclinaison)?.factor ?? 1.0
  const prod = puissanceKwc * ensoleillement * PR * oF * iF * (ombrage ? 0.88 : 1.0)
  return { nbPanneaux, puissanceKwc, productionAnnuelle: prod, economiesAnnuelles: prod * TARIF, co2: prod * 0.052 }
}

// ── Onduleur suggestion engine (Part B) ──────────────────────────
type OnduleurSuggestion = {
  type: 'hybride' | 'micro' | 'string-triphase' | 'string'
  titre: string
  raison: string
  produitIdx: number
  couleur: string
  bg: string
}

function suggestOnduleur(params: {
  besoinBatterie: boolean
  ombrage: boolean
  alimentation: string
  puissanceKwc: number
}): OnduleurSuggestion | null {
  const { besoinBatterie, ombrage, alimentation, puissanceKwc } = params
  if (puissanceKwc === 0) return null

  if (besoinBatterie) {
    const idx = puissanceKwc <= 4 ? 5 : 6
    return {
      type: 'hybride',
      titre: 'Onduleur hybride recommandé',
      raison: 'Le projet inclut un besoin de stockage batterie. Un onduleur hybride est indispensable pour piloter charge/décharge.',
      produitIdx: idx,
      couleur: '#7c3aed',
      bg: 'rgba(124,58,237,0.08)',
    }
  }

  if (ombrage) {
    return {
      type: 'micro',
      titre: 'Micro-onduleurs recommandés',
      raison: 'Des ombrages sont présents sur le site. Les micro-onduleurs maximisent la production panneau par panneau et éliminent l\'effet de chaîne.',
      produitIdx: 7,
      couleur: '#0369a1',
      bg: 'rgba(3,105,161,0.08)',
    }
  }

  if (alimentation === 'Triphasé') {
    return {
      type: 'string-triphase',
      titre: 'Onduleur string triphasé recommandé',
      raison: 'L\'installation est raccordée en triphasé. Un onduleur string triphasé assure un équilibrage optimal des phases.',
      produitIdx: 8,
      couleur: '#0ea5e9',
      bg: 'rgba(14,165,233,0.08)',
    }
  }

  const idx = puissanceKwc <= 3.5 ? 2 : puissanceKwc <= 7 ? 3 : 4
  return {
    type: 'string',
    titre: 'Onduleur string recommandé',
    raison: 'Installation sans ombrage ni batterie en monophasé : l\'onduleur string centralisé est la solution optimale en rapport qualité/prix.',
    produitIdx: idx,
    couleur: '#0ea5e9',
    bg: 'rgba(14,165,233,0.06)',
  }
}

// ────────────────────────────────────────────────────────────────
function newLigne(): LigneDevis {
  return { id: generateId(), designation: '', quantite: 1, prixUnitaire: 0, tva: 20, remise: 0 }
}

type DraftState = {
  clientId: string; dateValidite: string; conditionsPaiement: string; notes: string
  remiseGlobale: number; acompte: number; lignes: LigneDevis[]; dossierId: string
  segment: string
  // Bloc 2
  typeToiture: string; surface: number; orientation: string; inclinaison: string
  ombrage: boolean; typePose: string; hauteurBatiment: string; codePostal: string
  // Bloc 3
  consoAnnuelle: number; profilConso: string; alimentation: string
  typeTableau: string; distanceCoffret: number
  // Bloc 4
  objectifPrincipal: string; besoinBatterie: boolean; besoinsFuturs: string[]
}

function defaultDraft(): DraftState {
  const d = new Date(); d.setDate(d.getDate() + 30)
  return {
    clientId: '', dateValidite: d.toISOString().split('T')[0],
    conditionsPaiement: '30 jours net', notes: '', remiseGlobale: 0, acompte: 0,
    lignes: [newLigne()], dossierId: '', segment: 'Résidentiel',
    typeToiture: '', surface: 30, orientation: 'Sud', inclinaison: 'Optimal (30–35°)',
    ombrage: false, typePose: 'Surimposé', hauteurBatiment: '', codePostal: '',
    consoAnnuelle: 0, profilConso: 'Standard', alimentation: 'Monophasé',
    typeTableau: 'Récent', distanceCoffret: 0,
    objectifPrincipal: 'Autoconsommation', besoinBatterie: false, besoinsFuturs: [],
  }
}

// ────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0"
      style={{ background: checked ? '#0ea5e9' : '#e2e8f0' }}>
      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function SectionHeader({
  num, icon: Icon, title, subtitle, open, onToggle,
}: { num: number; icon: React.ElementType; title: string; subtitle?: string; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors">
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' }}>{num}</span>
        <Icon size={15} style={{ color: '#0ea5e9' }} className="flex-shrink-0" />
        <div className="text-left">
          <p className="font-bold text-slate-900 text-sm">{title}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <ChevronDown size={15} className={`text-slate-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
    </button>
  )
}

// ────────────────────────────────────────────────────────────────
export default function NouveauDevisPage() {
  const router = useRouter()
  const { formatCurrency } = useLanguage()
  const [clients, setClients] = useState<SClient[]>([])
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [draft, setDraft] = useState<DraftState>(defaultDraft)
  const [showCatalogue, setShowCatalogue] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [openBlocs, setOpenBlocs] = useState({ toiture: false, elec: false, objectifs: false })
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRestored = useRef(false)
  // PVGIS state
  const [pvgisResult, setPvgisResult] = useState<{ production_annuelle: number; performance_ratio: number | null; irradiation: number | null; lat: number; lon: number } | null>(null)
  const [pvgisLoading, setPvgisLoading] = useState(false)
  const [pvgisError, setPvgisError] = useState('')

  // Helpers to update draft fields
  const set = useCallback(<K extends keyof DraftState>(key: K, val: DraftState[K]) => {
    setDraft(prev => ({ ...prev, [key]: val }))
  }, [])

  const toggleBesoin = useCallback((item: string) => {
    setDraft(prev => ({
      ...prev,
      besoinsFuturs: prev.besoinsFuturs.includes(item)
        ? prev.besoinsFuturs.filter(b => b !== item)
        : [...prev.besoinsFuturs, item],
    }))
  }, [])

  // Restore draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Partial<DraftState>
        setDraft(prev => ({ ...prev, ...saved, lignes: saved.lignes?.length ? saved.lignes : prev.lignes }))
        setSaveStatus('saved')
        isRestored.current = true
      }
    } catch { /* ignore */ }
    getClients().then(c => setClients(c as SClient[])).catch(console.error)
    getDossiers().then(d => setDossiers(d)).catch(console.error)
  }, [])

  // Autosave
  const triggerAutosave = useCallback((state: DraftState) => {
    setSaveStatus('saving')
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); setSaveStatus('saved') }
      catch { setSaveStatus('idle') }
    }, 800)
  }, [])

  useEffect(() => {
    if (!isRestored.current && !draft.clientId && draft.lignes.length === 1 && !draft.lignes[0].designation) return
    triggerAutosave(draft)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  // Derived
  const totaux = calculateTotaux(draft.lignes, draft.remiseGlobale)
  const selectedClient = clients.find(c => c.id === draft.clientId)

  const estimation = draft.surface > 0
    ? calcEstimation(draft.surface, draft.orientation, draft.inclinaison, draft.codePostal || '75', draft.ombrage)
    : null

  const suggestion = suggestOnduleur({
    besoinBatterie: draft.besoinBatterie,
    ombrage: draft.ombrage,
    alimentation: draft.alimentation,
    puissanceKwc: estimation?.puissanceKwc ?? 0,
  })

  // Lignes helpers
  const updateLigne = useCallback((id: string, field: keyof LigneDevis, value: string | number) => {
    setDraft(prev => ({ ...prev, lignes: prev.lignes.map(l => l.id === id ? { ...l, [field]: value } : l) }))
  }, [])
  const removeLigne = useCallback((id: string) => {
    setDraft(prev => ({ ...prev, lignes: prev.lignes.filter(l => l.id !== id) }))
  }, [])
  const addLigne = useCallback(() => {
    setDraft(prev => ({ ...prev, lignes: [...prev.lignes, newLigne()] }))
  }, [])
  const addFromCatalogue = useCallback((p: typeof PRODUITS_SOLAIRES[0]) => {
    setDraft(prev => ({
      ...prev,
      lignes: [...prev.lignes, { id: generateId(), designation: p.designation, quantite: 1, prixUnitaire: p.prixUnitaire, tva: p.tva, remise: 0 }],
    }))
    setShowCatalogue(false)
  }, [])

  const appliquerEstimation = () => {
    if (!estimation) return
    const nbP = estimation.nbPanneaux
    const kwc = estimation.puissanceKwc
    const tva = draft.segment === 'Résidentiel' ? 10 : 20
    const onduleurIdx = kwc <= 3.5 ? 2 : kwc <= 7 ? 3 : 4
    setDraft(prev => ({
      ...prev,
      lignes: [
        { id: generateId(), designation: 'Panneau solaire monocristallin 400Wc', quantite: nbP, prixUnitaire: 280, tva, remise: 0 },
        { id: generateId(), designation: PRODUITS_SOLAIRES[onduleurIdx].designation, quantite: 1, prixUnitaire: PRODUITS_SOLAIRES[onduleurIdx].prixUnitaire, tva: 20, remise: 0 },
        { id: generateId(), designation: 'Structure de fixation toiture', quantite: 1, prixUnitaire: 150 * Math.ceil(nbP / 6), tva: 20, remise: 0 },
        { id: generateId(), designation: 'Câblage DC + AC (forfait)', quantite: 1, prixUnitaire: 350, tva: 20, remise: 0 },
        { id: generateId(), designation: 'Pose et installation (journée technicien)', quantite: Math.ceil(nbP / 12), prixUnitaire: 500, tva: 20, remise: 0 },
        { id: generateId(), designation: 'Mise en service et tests', quantite: 1, prixUnitaire: 300, tva: 20, remise: 0 },
        { id: generateId(), designation: 'Démarches administratives (Consuel, EDF)', quantite: 1, prixUnitaire: 250, tva: 20, remise: 0 },
      ],
    }))
  }

  const fetchPVGIS = useCallback(async () => {
    if (!draft.codePostal || draft.codePostal.length < 5 || !estimation) return
    setPvgisLoading(true)
    setPvgisError('')
    setPvgisResult(null)
    try {
      const params = new URLSearchParams({
        cp: draft.codePostal,
        peakpower: estimation.puissanceKwc.toFixed(2),
        orientation: draft.orientation,
        inclinaison: draft.inclinaison,
      })
      const res = await fetch(`/api/pvgis?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur PVGIS')
      setPvgisResult(data)
    } catch (e) {
      setPvgisError(e instanceof Error ? e.message : 'Erreur PVGIS')
    } finally {
      setPvgisLoading(false)
    }
  }, [draft.codePostal, draft.orientation, draft.inclinaison, estimation])

  const addSuggestionToDevis = () => {
    if (!suggestion) return
    const p = PRODUITS_SOLAIRES[suggestion.produitIdx]
    setDraft(prev => ({
      ...prev,
      lignes: prev.lignes.some(l => l.designation === p.designation)
        ? prev.lignes
        : [...prev.lignes, { id: generateId(), designation: p.designation, quantite: 1, prixUnitaire: p.prixUnitaire, tva: p.tva, remise: 0 }],
    }))
  }

  const clearDraft = () => {
    if (!confirm('Effacer le brouillon et recommencer à zéro ?')) return
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
    setDraft(defaultDraft())
    isRestored.current = false
    setSaveStatus('idle')
  }

  const handleSave = () => {
    const hasLigne = draft.lignes.some(l => l.designation.trim() || l.prixUnitaire > 0)
    if (!hasLigne) { setError("Ajoutez au moins une ligne au devis avant d'enregistrer."); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    if (!draft.clientId) { setError('Sélectionnez un client pour enregistrer le devis.'); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    setError('')
    const validiteJours = Math.max(1, Math.round((new Date(draft.dateValidite).getTime() - Date.now()) / 86400000))
    startTransition(async () => {
      try {
        try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
        const result = await createDevisAction({
          client_id: draft.clientId,
          lignes: draft.lignes.map(l => ({ designation: l.designation, quantite: l.quantite, prixUnitaire: l.prixUnitaire, remise: l.remise, tva: l.tva })),
          remise: draft.remiseGlobale,
          acompte: draft.acompte,
          conditions_paiement: draft.conditionsPaiement,
          notes: draft.notes,
          validite_jours: validiteJours,
          dossier_id: draft.dossierId || undefined,
        })
        if ('error' in result) {
          setError(`Erreur : ${result.error}`)
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
        router.push(`/devis/${(result as { id: string }).id}`)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        setError(`Erreur inattendue : ${msg}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-auto" style={{ background: '#f8f9fc' }}>
      <Header title="Nouveau devis" subtitle="Créer un devis pour un client" />

      <div className="p-6 max-w-5xl mx-auto space-y-4">

        {/* Autosave status bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs" style={{ color: '#94a3b8' }}>
            {saveStatus === 'saving' && <><RefreshCw size={11} className="animate-spin" /> Sauvegarde automatique…</>}
            {saveStatus === 'saved' && <><span className="autosave-dot" /> Brouillon sauvegardé</>}
            {saveStatus === 'idle' && <><span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" /> Non sauvegardé</>}
          </div>
          {saveStatus === 'saved' && (
            <button onClick={clearDraft} className="text-xs text-slate-400 hover:text-red-500 transition-colors underline">
              Effacer le brouillon
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl text-sm font-medium flex items-center gap-2"
            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
            <AlertTriangle size={14} className="flex-shrink-0" /> {error}
          </div>
        )}

        {/* ══ Bloc 1 : Client & Projet ═══════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-50">
            <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' }}>1</span>
            <h2 className="font-bold text-slate-900">Client & Projet</h2>
          </div>

          <div className="p-6 grid grid-cols-2 gap-4">
            {/* Segment */}
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Type de projet</label>
              <div className="flex gap-2">
                {['Résidentiel', 'Tertiaire', 'Industriel'].map(s => (
                  <button key={s} type="button" onClick={() => set('segment', s)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                    style={{
                      background: draft.segment === s ? 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' : '#fff',
                      color: draft.segment === s ? '#fff' : '#64748b',
                      border: draft.segment === s ? '1.5px solid #0ea5e9' : '1.5px solid #e4e7ec',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Client selector */}
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Client <span className="text-slate-400 font-normal text-xs">(requis pour enregistrer)</span>
              </label>
              {clients.length === 0 ? (
                <div className="p-4 rounded-xl text-sm flex items-center justify-between"
                  style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
                  <span>Aucun client — créez-en un d&apos;abord.</span>
                  <a href="/clients/nouveau" className="font-semibold underline">Créer →</a>
                </div>
              ) : (
                <select value={draft.clientId} onChange={e => set('clientId', e.target.value)} className="select-field">
                  <option value="">Sélectionner un client…</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}{c.ville ? ` — ${c.ville}` : ''}</option>
                  ))}
                </select>
              )}
            </div>

            {selectedClient && (
              <div className="col-span-2 p-4 rounded-xl text-sm" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <p className="font-bold text-slate-900">{selectedClient.nom}</p>
                {selectedClient.adresse && <p className="text-slate-500 mt-0.5">{selectedClient.adresse}{selectedClient.code_postal ? `, ${selectedClient.code_postal}` : ''} {selectedClient.ville ?? ''}</p>}
                <div className="flex gap-4 mt-1">
                  {selectedClient.email && <span className="text-slate-400">{selectedClient.email}</span>}
                  {selectedClient.telephone && <span className="text-slate-400">{selectedClient.telephone}</span>}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date de validité</label>
              <input type="date" value={draft.dateValidite} onChange={e => set('dateValidite', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Conditions de paiement</label>
              <select value={draft.conditionsPaiement} onChange={e => set('conditionsPaiement', e.target.value)} className="select-field">
                <option>30 jours net</option>
                <option>50% à la commande</option>
                <option>40% acompte, 60% à la livraison</option>
                <option>À réception de facture</option>
                <option>Comptant</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Dossier / Projet <span className="text-slate-400 font-normal text-xs">optionnel</span>
              </label>
              <select value={draft.dossierId} onChange={e => set('dossierId', e.target.value)} className="select-field">
                <option value="">Aucun dossier</option>
                {dossiers.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* ══ Bloc 2 : Site & Toiture ════════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <SectionHeader num={2} icon={Home} title="Site & Toiture"
            subtitle="Caractéristiques de l'installation — optionnel"
            open={openBlocs.toiture} onToggle={() => setOpenBlocs(p => ({ ...p, toiture: !p.toiture }))} />

          {openBlocs.toiture && (
            <div className="px-6 pb-6 border-t border-slate-50">
              <div className="grid grid-cols-3 gap-4 mt-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type de toiture</label>
                  <select value={draft.typeToiture} onChange={e => set('typeToiture', e.target.value)} className="select-field">
                    <option value="">Sélectionner…</option>
                    <option>Tuiles romaines</option>
                    <option>Tuiles plates</option>
                    <option>Ardoises</option>
                    <option>Bac acier / Bac alu</option>
                    <option>Toit plat (étanchéité)</option>
                    <option>Sol / Ombrière</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type de pose</label>
                  <select value={draft.typePose} onChange={e => set('typePose', e.target.value)} className="select-field">
                    <option>Surimposé</option>
                    <option>Intégré bâti (IAB)</option>
                    <option>Sol / Tracker</option>
                    <option>Ombrière</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hauteur du bâtiment (m)</label>
                  <input type="number" min={0} max={50} value={draft.hauteurBatiment}
                    onChange={e => set('hauteurBatiment', e.target.value)}
                    placeholder="Ex : 8" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Surface disponible (m²)</label>
                  <input type="number" min={1} max={2000} value={draft.surface || ''}
                    onChange={e => set('surface', Number(e.target.value))}
                    placeholder="Ex : 30" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Orientation principale</label>
                  <select value={draft.orientation} onChange={e => set('orientation', e.target.value)} className="select-field">
                    {ORIENTATIONS.map(o => <option key={o.label}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Inclinaison</label>
                  <select value={draft.inclinaison} onChange={e => set('inclinaison', e.target.value)} className="select-field">
                    {INCLINAISONS.map(i => <option key={i.label}>{i.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Code postal du site</label>
                  <input type="text" maxLength={5} value={draft.codePostal}
                    onChange={e => set('codePostal', e.target.value)}
                    placeholder="Ex : 31000" className="input-field" />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <Toggle checked={draft.ombrage} onChange={v => set('ombrage', v)} />
                  <span className="text-sm font-semibold text-slate-700">Présence d&apos;ombrage</span>
                </div>
              </div>

              {/* Estimation / PVGIS inline */}
              {estimation && draft.surface > 0 && (
                <div className="mt-5 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(14,165,233,0.2)' }}>
                  {/* Header row */}
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.07), rgba(139,92,246,0.05))' }}>
                    <div className="flex items-center gap-2">
                      {pvgisResult
                        ? <><Satellite size={13} style={{ color: '#0ea5e9' }} /><span className="text-xs font-bold text-slate-700">Données PVGIS réelles</span><span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#dcfce7', color: '#15803d' }}>✓ JRC · EU</span></>
                        : <><Sun size={13} style={{ color: '#0ea5e9' }} /><span className="text-xs font-bold text-slate-700">Estimation de production</span><span className="text-xs text-slate-400">(approximatif)</span></>
                      }
                    </div>
                    <div className="flex items-center gap-2">
                      {draft.codePostal?.length === 5 && (
                        <button type="button" onClick={fetchPVGIS} disabled={pvgisLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-60"
                          style={{ background: pvgisResult ? '#64748b' : 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' }}>
                          {pvgisLoading
                            ? <><Loader2 size={11} className="animate-spin" /> Calcul…</>
                            : <><Satellite size={11} /> {pvgisResult ? 'Recalculer PVGIS' : 'Données PVGIS réelles'}</>}
                        </button>
                      )}
                      <button type="button" onClick={appliquerEstimation} className="btn-primary text-xs py-1.5">
                        <Zap size={12} /> Appliquer au devis
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {pvgisError && (
                    <div className="px-4 py-2 text-xs font-medium flex items-center gap-2"
                      style={{ background: '#fef2f2', color: '#dc2626' }}>
                      <AlertTriangle size={12} /> {pvgisError}
                    </div>
                  )}

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-3 p-4" style={{ background: 'rgba(248,250,252,0.8)' }}>
                    {[
                      { label: 'Panneaux', value: String(estimation.nbPanneaux), unit: 'unités', pvgis: null },
                      { label: 'Puissance', value: estimation.puissanceKwc.toFixed(1), unit: 'kWc', pvgis: null },
                      {
                        label: 'Production / an',
                        value: pvgisResult
                          ? pvgisResult.production_annuelle.toLocaleString('fr-FR')
                          : Math.round(estimation.productionAnnuelle).toLocaleString('fr-FR'),
                        unit: 'kWh',
                        pvgis: pvgisResult ? true : null,
                      },
                      {
                        label: 'Économies / an',
                        value: pvgisResult
                          ? Math.round(pvgisResult.production_annuelle * 0.2276).toLocaleString('fr-FR')
                          : Math.round(estimation.economiesAnnuelles).toLocaleString('fr-FR'),
                        unit: '€',
                        pvgis: pvgisResult ? true : null,
                      },
                    ].map(s => (
                      <div key={s.label} className="bg-white rounded-xl p-3 relative">
                        {s.pvgis && (
                          <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1 rounded"
                            style={{ background: '#dcfce7', color: '#15803d' }}>PVGIS</span>
                        )}
                        <p className="text-lg font-black text-slate-900">{s.value}</p>
                        <p className="text-xs text-slate-400">{s.unit} · {s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Footer metadata */}
                  <div className="px-4 pb-3 flex items-center gap-4 text-xs text-slate-400">
                    <span>CO₂ évité : <strong className="text-slate-600">{Math.round(estimation.co2)} kg/an</strong></span>
                    {pvgisResult?.performance_ratio && (
                      <span>PR : <strong className="text-slate-600">{pvgisResult.performance_ratio}%</strong></span>
                    )}
                    {pvgisResult?.irradiation && (
                      <span>Irradiation : <strong className="text-slate-600">{pvgisResult.irradiation.toLocaleString('fr-FR')} kWh/m²/an</strong></span>
                    )}
                    {pvgisResult && (
                      <span className="ml-auto" style={{ color: '#94a3b8' }}>
                        📍 {pvgisResult.lat.toFixed(3)}°N, {pvgisResult.lon.toFixed(3)}°E
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ══ Bloc 3 : Installation Électrique ══════════════════════ */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <SectionHeader num={3} icon={Bolt} title="Installation électrique"
            subtitle="Alimentation, consommation, configuration — optionnel"
            open={openBlocs.elec} onToggle={() => setOpenBlocs(p => ({ ...p, elec: !p.elec }))} />

          {openBlocs.elec && (
            <div className="px-6 pb-6 border-t border-slate-50">
              <div className="grid grid-cols-3 gap-4 mt-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Consommation annuelle (kWh/an)</label>
                  <input type="number" min={0} value={draft.consoAnnuelle || ''}
                    onChange={e => set('consoAnnuelle', Number(e.target.value))}
                    placeholder="Ex : 6000" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Profil de consommation</label>
                  <select value={draft.profilConso} onChange={e => set('profilConso', e.target.value)} className="select-field">
                    <option>Standard</option>
                    <option>Présence en journée</option>
                    <option>Horaires de bureau</option>
                    <option>Activité nocturne</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alimentation</label>
                  <div className="flex gap-2">
                    {['Monophasé', 'Triphasé'].map(a => (
                      <button key={a} type="button" onClick={() => set('alimentation', a)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                        style={{
                          background: draft.alimentation === a ? 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' : '#fff',
                          color: draft.alimentation === a ? '#fff' : '#64748b',
                          border: draft.alimentation === a ? '1.5px solid #0ea5e9' : '1.5px solid #e4e7ec',
                        }}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type de tableau électrique</label>
                  <select value={draft.typeTableau} onChange={e => set('typeTableau', e.target.value)} className="select-field">
                    <option>Récent (&lt; 10 ans)</option>
                    <option>Ancien (&gt; 10 ans)</option>
                    <option>À rénover</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Distance coffret / toiture (m)</label>
                  <input type="number" min={0} max={200} value={draft.distanceCoffret || ''}
                    onChange={e => set('distanceCoffret', Number(e.target.value))}
                    placeholder="Ex : 15" className="input-field" />
                </div>
              </div>

              {/* Taux d'autoconsommation estimé si données dispo */}
              {draft.consoAnnuelle > 0 && estimation && (
                <div className="mt-4 p-3 rounded-xl flex items-center gap-4"
                  style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <Calculator size={14} style={{ color: '#16a34a' }} className="flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-semibold text-green-800">Taux d&apos;autoconsommation estimé : </span>
                    <span className="font-black text-green-700">
                      {Math.min(100, Math.round((estimation.productionAnnuelle / draft.consoAnnuelle) * 70))}%
                    </span>
                    <span className="text-green-600 text-xs ml-2">(70% du solaire autoconsommé en moyenne)</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ══ Bloc 4 : Objectifs du Projet ══════════════════════════ */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <SectionHeader num={4} icon={Target} title="Objectifs du projet"
            subtitle="Finalité de l'installation — optionnel"
            open={openBlocs.objectifs} onToggle={() => setOpenBlocs(p => ({ ...p, objectifs: !p.objectifs }))} />

          {openBlocs.objectifs && (
            <div className="px-6 pb-6 border-t border-slate-50">
              <div className="grid grid-cols-2 gap-6 mt-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Objectif principal</label>
                  <div className="space-y-2">
                    {[
                      { val: 'Autoconsommation', desc: 'Consommer sa propre production' },
                      { val: 'Revente totale', desc: 'Revente de toute la production à EDF OA' },
                      { val: 'Site isolé', desc: 'Installation hors réseau (off-grid)' },
                    ].map(o => (
                      <button key={o.val} type="button" onClick={() => set('objectifPrincipal', o.val)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                        style={{
                          background: draft.objectifPrincipal === o.val ? 'rgba(14,165,233,0.06)' : '#fff',
                          border: draft.objectifPrincipal === o.val ? '1.5px solid #0ea5e9' : '1.5px solid #e4e7ec',
                        }}>
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={{ borderColor: draft.objectifPrincipal === o.val ? '#0ea5e9' : '#d1d5db' }}>
                          {draft.objectifPrincipal === o.val && (
                            <div className="w-2 h-2 rounded-full" style={{ background: '#0ea5e9' }} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{o.val}</p>
                          <p className="text-xs text-slate-400">{o.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Batterie de stockage</label>
                    <div className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{ border: draft.besoinBatterie ? '1.5px solid #0ea5e9' : '1.5px solid #e4e7ec', background: draft.besoinBatterie ? 'rgba(14,165,233,0.06)' : '#fff' }}>
                      <Toggle checked={draft.besoinBatterie} onChange={v => set('besoinBatterie', v)} />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Inclure une batterie</p>
                        <p className="text-xs text-slate-400">Stockage pour autoconsommation nocturne</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Besoins futurs</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Voiture électrique', 'Pompe à chaleur', 'Piscine', 'Rien de prévu'].map(b => (
                        <button key={b} type="button" onClick={() => toggleBesoin(b)}
                          className="flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all"
                          style={{
                            background: draft.besoinsFuturs.includes(b) ? 'rgba(14,165,233,0.06)' : '#fff',
                            border: draft.besoinsFuturs.includes(b) ? '1.5px solid #0ea5e9' : '1.5px solid #e4e7ec',
                            color: draft.besoinsFuturs.includes(b) ? '#0ea5e9' : '#64748b',
                          }}>
                          {draft.besoinsFuturs.includes(b) && <CheckCircle size={12} style={{ color: '#0ea5e9' }} className="flex-shrink-0" />}
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ══ Suggestion Onduleur (Part B) ══════════════════════════ */}
        {suggestion && (openBlocs.toiture || openBlocs.objectifs) && (
          <div className="rounded-2xl p-5 flex items-start gap-4"
            style={{ background: suggestion.bg, border: `1.5px solid ${suggestion.couleur}30` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: suggestion.couleur }}>
              <Lightbulb size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-sm" style={{ color: suggestion.couleur }}>{suggestion.titre}</p>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{suggestion.raison}</p>
                  <p className="text-xs font-semibold mt-2 text-slate-500">
                    Produit suggéré : <span className="text-slate-800">{PRODUITS_SOLAIRES[suggestion.produitIdx].designation}</span>
                    <span className="ml-2" style={{ color: suggestion.couleur }}>— {formatCurrency(PRODUITS_SOLAIRES[suggestion.produitIdx].prixUnitaire)}</span>
                  </p>
                </div>
                <button type="button" onClick={addSuggestionToDevis}
                  className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: suggestion.couleur }}>
                  + Ajouter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ Bloc 5 : Lignes du Devis ══════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' }}>5</span>
              <h2 className="font-bold text-slate-900">Lignes du devis</h2>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <button onClick={() => setShowCatalogue(!showCatalogue)}
                  className="btn-secondary text-xs flex items-center gap-1.5">
                  <Zap size={13} style={{ color: '#0ea5e9' }} /> Catalogue <ChevronDown size={12} />
                </button>
                {showCatalogue && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 max-h-80 overflow-y-auto scrollbar-thin">
                    {PRODUITS_SOLAIRES.map((p, i) => (
                      <button key={i} onClick={() => addFromCatalogue(p)}
                        className="w-full px-4 py-3 text-left border-b border-slate-50 last:border-0"
                        onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <p className="text-sm font-medium text-slate-800">{p.designation}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(p.prixUnitaire)} · TVA {p.tva}%</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={addLigne} className="btn-primary text-xs">
                <Plus size={13} /> Ajouter
              </button>
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-4">Désignation</div>
            <div className="col-span-2">Détail</div>
            <div className="col-span-1 text-right">Qté</div>
            <div className="col-span-2 text-right">Prix HT</div>
            <div className="col-span-1 text-right">TVA%</div>
            <div className="col-span-1 text-right">Rem%</div>
            <div className="col-span-1 text-right">Total HT</div>
          </div>

          <div className="divide-y divide-slate-50">
            {draft.lignes.map((ligne) => {
              const { montantHT } = calculateLigne(ligne)
              return (
                <div key={ligne.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center group hover:bg-slate-50/50">
                  <div className="col-span-4">
                    <input type="text" placeholder="Désignation" value={ligne.designation}
                      onChange={e => updateLigne(ligne.id, 'designation', e.target.value)}
                      className="input-field text-sm py-2" />
                  </div>
                  <div className="col-span-2">
                    <input type="text" placeholder="Détail" value={ligne.description || ''}
                      onChange={e => updateLigne(ligne.id, 'description', e.target.value)}
                      className="input-field text-sm py-2" />
                  </div>
                  <div className="col-span-1">
                    <input type="number" min="0" step="0.5" value={ligne.quantite}
                      onChange={e => updateLigne(ligne.id, 'quantite', parseFloat(e.target.value) || 0)}
                      className="input-field text-sm py-2 text-right" />
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="0" step="0.01" value={ligne.prixUnitaire}
                      onChange={e => updateLigne(ligne.id, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                      className="input-field text-sm py-2 text-right" />
                  </div>
                  <div className="col-span-1">
                    <select value={ligne.tva}
                      onChange={e => updateLigne(ligne.id, 'tva', parseFloat(e.target.value))}
                      className="select-field text-sm py-2">
                      {TVA_OPTIONS.map(t => <option key={t} value={t}>{t}%</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <input type="number" min="0" max="100" value={ligne.remise}
                      onChange={e => updateLigne(ligne.id, 'remise', parseFloat(e.target.value) || 0)}
                      className="input-field text-sm py-2 text-right" />
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <span className="text-sm font-semibold text-slate-800">{formatCurrency(montantHT)}</span>
                    {draft.lignes.length > 1 && (
                      <button onClick={() => removeLigne(ligne.id)}
                        className="opacity-0 group-hover:opacity-100 ml-1 w-6 h-6 rounded-md flex items-center justify-center text-red-400 hover:bg-red-50 transition-all">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Totaux */}
          <div className="border-t border-slate-100 p-6 flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Sous-total HT</span>
                <span className="tabular-nums">{formatCurrency(totaux.montantHT)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-500">
                <span>Remise globale</span>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" max="100" value={draft.remiseGlobale}
                    onChange={e => set('remiseGlobale', parseFloat(e.target.value) || 0)}
                    className="w-16 input-field text-sm py-1 text-right" />
                  <span className="text-slate-400">%</span>
                </div>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Total TVA</span>
                <span className="tabular-nums">{formatCurrency(totaux.montantTVA)}</span>
              </div>
              <div className="h-px bg-slate-100 my-2" />
              <div className="flex justify-between font-bold text-slate-900">
                <span>Total TTC</span>
                <span className="text-xl tabular-nums">{formatCurrency(totaux.montantTTC)}</span>
              </div>
              {draft.acompte > 0 && (
                <div className="flex justify-between text-sm font-semibold" style={{ color: '#0ea5e9' }}>
                  <span>Acompte ({draft.acompte}%)</span>
                  <span className="tabular-nums">{formatCurrency(totaux.montantTTC * draft.acompte / 100)}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ══ Bloc 6 : Conditions & Notes ═══════════════════════════ */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' }}>6</span>
            <h2 className="font-bold text-slate-900">Conditions & Notes</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Acompte (%) <span className="text-slate-400 font-normal text-xs">optionnel</span>
              </label>
              <input type="number" min="0" max="100" value={draft.acompte || ''}
                onChange={e => set('acompte', parseFloat(e.target.value) || 0)}
                placeholder="Ex : 30" className="input-field" />
            </div>
            <div />
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Notes <span className="text-slate-400 font-normal text-xs">optionnel</span>
              </label>
              <textarea value={draft.notes} onChange={e => set('notes', e.target.value)}
                rows={3} className="input-field resize-none"
                placeholder="Garanties, délais, subventions MaPrimeRénov'…" />
            </div>
          </div>
        </section>

        {/* ══ Actions ════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between pb-8">
          <button onClick={() => router.back()} className="btn-secondary" disabled={isPending}>
            Annuler
          </button>
          <div className="flex items-center gap-3">
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle size={13} /> Brouillon sauvegardé
              </span>
            )}
            <button onClick={handleSave} className="btn-primary" disabled={isPending}>
              {isPending
                ? <><Loader2 size={15} className="animate-spin" /> Enregistrement…</>
                : <><Save size={15} /> Enregistrer le devis</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
