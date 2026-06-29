'use client'
import { useState, useCallback, useEffect, useTransition, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { getClients } from '@/lib/actions/clients'
import { createDevisAction, type LotDevis, type LigneJson, type EtudeEco } from '@/lib/actions/devis'
import { getDossiers, type Dossier } from '@/lib/actions/dossiers'
import { getCatalogueActif, getKits } from '@/lib/actions/catalogue'
import { type ProduitCatalogue, type Kit } from '@/lib/catalogue-shared'
import { generateId } from '@/lib/utils'
import { useLanguage } from '@/i18n/LanguageContext'
import {
  Plus, Trash2, ChevronDown, Zap, Loader2, Sun, AlertTriangle,
  Calculator, Save, CheckCircle, RefreshCw, Bolt, Lightbulb,
  Satellite, Package, FileText, TrendingUp, Settings2, Users,
  MapPin, BarChart3, X, Search, Layers,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const DRAFT_KEY = 'voltpilot_devis_draft_v3'

// ── Types ─────────────────────────────────────────────────────────
type SClient = {
  id: string; nom: string; email: string | null; telephone: string | null
  adresse: string | null; code_postal: string | null; ville: string | null; siret: string | null
}

type LigneUI = {
  id: string
  designation: string
  description?: string
  quantite: number
  prixUnitaire: number
  tva: number
  remise: number
  isText?: boolean
  prixAchat?: number // pour marge interne
}

type LotUI = {
  id: string
  nom: string
  lignes: LigneUI[]
}

// ── Constantes ────────────────────────────────────────────────────
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

const LOTS_RESIDENTIEL = ['Fourniture matériel', 'Pose et installation', 'Électricité et câblage', 'Démarches administratives']
const LOTS_TERTIAIRE = ['Fourniture matériel', 'Structure et fixation', 'Câblage et protection', 'Installation électrique', 'Mise en service', 'Démarches administratives']

const TYPES_COUVERTURE = ['Tuile', 'Ardoise', 'Bac acier', 'Joint debout', 'Fibrociment', 'Toiture plate', 'N/A']
const TYPES_POSE = ['Surimposition', 'Intégration bâti (IAB)', 'Toiture plate', 'Ombrière', 'Au sol']
const TYPES_PROJET = ['Résidentiel', 'Tertiaire', 'Agricole', 'Au sol']
const TYPES_CLIENT = ['Particulier', 'Professionnel', 'Collectivité']

// ── Calculs ───────────────────────────────────────────────────────
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

const PANEL_W = 400
const PANEL_M2 = 1.7
const PR = 0.80

function calcFromSurface(surface: number, orientation: string, inclinaison: string, cp: string, ombrage: boolean) {
  const nbPanneaux = Math.max(1, Math.floor(surface / PANEL_M2))
  const puissanceKwc = (nbPanneaux * PANEL_W) / 1000
  const ensoleillement = getEnsoleillement(cp)
  const oF = ORIENTATIONS.find(o => o.label === orientation)?.factor ?? 1.0
  const iF = INCLINAISONS.find(i => i.label === inclinaison)?.factor ?? 1.0
  const prod = puissanceKwc * ensoleillement * PR * oF * iF * (ombrage ? 0.88 : 1.0)
  return { nbPanneaux, puissanceKwc, productionAnnuelle: Math.round(prod), co2: Math.round(prod * 0.052) }
}

function calcFromNbPanneaux(nb: number, orientation: string, inclinaison: string, cp: string, ombrage: boolean) {
  const puissanceKwc = (nb * PANEL_W) / 1000
  const ensoleillement = getEnsoleillement(cp)
  const oF = ORIENTATIONS.find(o => o.label === orientation)?.factor ?? 1.0
  const iF = INCLINAISONS.find(i => i.label === inclinaison)?.factor ?? 1.0
  const prod = puissanceKwc * ensoleillement * PR * oF * iF * (ombrage ? 0.88 : 1.0)
  return { nbPanneaux: nb, puissanceKwc, productionAnnuelle: Math.round(prod), co2: Math.round(prod * 0.052) }
}

function calcFromKwc(kwc: number, orientation: string, inclinaison: string, cp: string, ombrage: boolean) {
  const nbPanneaux = Math.round((kwc * 1000) / PANEL_W)
  const ensoleillement = getEnsoleillement(cp)
  const oF = ORIENTATIONS.find(o => o.label === orientation)?.factor ?? 1.0
  const iF = INCLINAISONS.find(i => i.label === inclinaison)?.factor ?? 1.0
  const prod = kwc * ensoleillement * PR * oF * iF * (ombrage ? 0.88 : 1.0)
  return { nbPanneaux, puissanceKwc: kwc, productionAnnuelle: Math.round(prod), co2: Math.round(prod * 0.052) }
}

// ── Suggestion onduleur ───────────────────────────────────────────
type OnduleurSuggestion = {
  type: string; titre: string; raison: string; designation: string
  prixUnitaire: number; tva: number; couleur: string; bg: string
}

const ONDULEURS_CATALOGUE = [
  { designation: 'Onduleur string 3kW', prixUnitaire: 800, tva: 20 },
  { designation: 'Onduleur string 6kW', prixUnitaire: 1400, tva: 20 },
  { designation: 'Onduleur string 10kW', prixUnitaire: 2200, tva: 20 },
  { designation: 'Onduleur hybride 3kW', prixUnitaire: 1200, tva: 20 },
  { designation: 'Onduleur hybride 6kW', prixUnitaire: 2100, tva: 20 },
  { designation: 'Micro-onduleur 400W', prixUnitaire: 180, tva: 20 },
  { designation: 'Onduleur string triphasé 10kW', prixUnitaire: 2600, tva: 20 },
]

function suggestOnduleur(besoinBatterie: boolean, ombrage: boolean, reseau: string, kwc: number): OnduleurSuggestion | null {
  if (kwc === 0) return null
  if (besoinBatterie) {
    const o = kwc <= 4 ? ONDULEURS_CATALOGUE[3] : ONDULEURS_CATALOGUE[4]
    return { type: 'hybride', titre: 'Onduleur hybride recommandé', raison: 'Le projet inclut un besoin de stockage batterie.', ...o, couleur: '#7c3aed', bg: 'rgba(124,58,237,0.08)' }
  }
  if (ombrage) {
    return { type: 'micro', titre: 'Micro-onduleurs recommandés', raison: 'Ombrages présents — les micro-onduleurs optimisent panneau par panneau.', ...ONDULEURS_CATALOGUE[5], couleur: '#0369a1', bg: 'rgba(3,105,161,0.08)' }
  }
  if (reseau === 'Triphasé') {
    return { type: 'string-tri', titre: 'Onduleur string triphasé recommandé', raison: 'Installation triphasée — équilibrage optimal des phases.', ...ONDULEURS_CATALOGUE[6], couleur: '#22D3EE', bg: 'rgba(34,211,238,0.08)' }
  }
  const o = kwc <= 3.5 ? ONDULEURS_CATALOGUE[0] : kwc <= 7 ? ONDULEURS_CATALOGUE[1] : ONDULEURS_CATALOGUE[2]
  return { type: 'string', titre: 'Onduleur string recommandé', raison: 'Sans ombrage, sans batterie, monophasé — solution optimale rapport qualité/prix.', ...o, couleur: '#22D3EE', bg: 'rgba(34,211,238,0.06)' }
}

// ── Calcul lignes / totaux ────────────────────────────────────────
function calcLigneHT(l: LigneUI): number {
  if (l.isText) return 0
  return l.quantite * l.prixUnitaire * (1 - l.remise / 100)
}

function calcLigneTVA(l: LigneUI): number {
  return calcLigneHT(l) * (l.tva / 100)
}

function calcLotHT(lot: LotUI): number {
  return lot.lignes.reduce((s, l) => s + calcLigneHT(l), 0)
}

function calcTotaux(lots: LotUI[], remiseGlobale: number, remiseGlobaleEuros: boolean) {
  const allLignes = lots.flatMap(l => l.lignes)
  let totalHT = allLignes.reduce((s, l) => s + calcLigneHT(l), 0)
  const remiseAmt = remiseGlobaleEuros ? remiseGlobale : totalHT * remiseGlobale / 100
  totalHT -= remiseAmt
  const tvaVentilation: Record<number, number> = {}
  for (const l of allLignes) {
    if (l.isText) continue
    const ht = calcLigneHT(l) * (remiseGlobaleEuros ? 1 : (1 - remiseGlobale / 100))
    const tvaAmt = ht * l.tva / 100
    tvaVentilation[l.tva] = (tvaVentilation[l.tva] ?? 0) + tvaAmt
  }
  const totalTVA = Object.values(tvaVentilation).reduce((s, v) => s + v, 0)
  const totalTTC = totalHT + totalTVA
  return { totalHT, totalTVA, totalTTC, tvaVentilation, remiseAmt }
}

function calcMargeInterne(lots: LotUI[]): { margeEuros: number; margePct: number } {
  let totalPV = 0, totalPA = 0
  for (const lot of lots) {
    for (const l of lot.lignes) {
      if (l.isText) continue
      const pv = calcLigneHT(l)
      const pa = l.prixAchat != null ? l.quantite * l.prixAchat : 0
      totalPV += pv
      totalPA += pa
    }
  }
  const margeEuros = totalPV - totalPA
  const margePct = totalPV > 0 ? (margeEuros / totalPV) * 100 : 0
  return { margeEuros, margePct }
}

// ── State ─────────────────────────────────────────────────────────
function newLigneUI(overrides: Partial<LigneUI> = {}): LigneUI {
  return { id: generateId(), designation: '', quantite: 1, prixUnitaire: 0, tva: 20, remise: 0, ...overrides }
}

function newLotUI(nom: string): LotUI {
  return { id: generateId(), nom, lignes: [newLigneUI()] }
}

function defaultLots(typeProjet: string): LotUI[] {
  const noms = typeProjet === 'Tertiaire' ? LOTS_TERTIAIRE : LOTS_RESIDENTIEL
  return noms.map(n => newLotUI(n))
}

type DimMode = 'surface' | 'nb_panneaux' | 'kwc'

type DraftState = {
  // A — En-tête
  clientId: string
  typeClient: string
  adresseChantier: string
  cpChantier: string
  villeChantier: string
  dateValidite: string
  validiteJours: number
  // B — Qualification
  typeProjet: string
  typeCouverture: string
  typePose: string
  reseau: string
  ombrage: boolean
  orientation: string
  inclinaison: string
  // C — Dimensionnement
  dimMode: DimMode
  surface: number
  nbPanneaux: number
  kwc: number
  productionManuelle: number // 0 = auto
  besoinBatterie: boolean
  codePostal: string
  // D — Étude économique
  primeAutoconsommation: number
  tarifRachatSurplus: number
  tauxAutoconsommation: number
  // E — Lots
  lots: LotUI[]
  // F — Conditions commerciales
  remiseGlobale: number
  remiseGlobaleEuros: boolean
  acompte: number
  conditionsPaiement: string
  delaiRealisation: string
  droitRetractation: boolean
  // G — Notes / Dossier
  notes: string
  dossierId: string
}

function defaultDraft(): DraftState {
  const d = new Date(); d.setDate(d.getDate() + 30)
  return {
    clientId: '', typeClient: 'Particulier',
    adresseChantier: '', cpChantier: '', villeChantier: '',
    dateValidite: d.toISOString().split('T')[0], validiteJours: 30,
    typeProjet: 'Résidentiel', typeCouverture: '', typePose: 'Surimposition',
    reseau: 'Monophasé', ombrage: false, orientation: 'Sud', inclinaison: 'Optimal (30–35°)',
    dimMode: 'surface', surface: 30, nbPanneaux: 0, kwc: 0, productionManuelle: 0, besoinBatterie: false, codePostal: '',
    primeAutoconsommation: 0, tarifRachatSurplus: 0.1326, tauxAutoconsommation: 70,
    lots: defaultLots('Résidentiel'),
    remiseGlobale: 0, remiseGlobaleEuros: false, acompte: 0,
    conditionsPaiement: '30 jours net', delaiRealisation: '', droitRetractation: false,
    notes: '', dossierId: '',
  }
}

// ── Sous-composants UI ────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0"
      style={{ background: checked ? '#22D3EE' : '#cbd5e1' }}>
      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function Section({
  num, icon: Icon, title, subtitle, open, onToggle, children,
}: { num: number; icon: React.ElementType; title: string; subtitle?: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #22D3EE, #06B6D4)' }}>{num}</span>
          <Icon size={15} style={{ color: '#22D3EE' }} className="flex-shrink-0" />
          <div className="text-left">
            <p className="font-bold text-slate-900 text-sm">{title}</p>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>
        <ChevronDown size={15} className={`text-slate-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-slate-50">{children}</div>}
    </section>
  )
}

function RadioGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className="px-3 py-2 rounded-xl text-sm font-semibold border transition-all"
          style={{
            background: value === o ? 'linear-gradient(135deg, #22D3EE, #06B6D4)' : '#fff',
            color: value === o ? '#fff' : '#64748b',
            border: value === o ? '1.5px solid #22D3EE' : '1.5px solid #e4e7ec',
          }}>
          {o}
        </button>
      ))}
    </div>
  )
}

// ── Composant Modal catalogue ─────────────────────────────────────
function ModalCatalogue({
  catalogue, onSelect, onClose,
}: { catalogue: ProduitCatalogue[]; onSelect: (p: ProduitCatalogue) => void; onClose: () => void }) {
  const [q, setQ] = useState('')
  const { formatCurrency } = useLanguage()
  const filtered = catalogue.filter(p => !q || p.designation.toLowerCase().includes(q.toLowerCase()) || (p.famille ?? '').toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="font-bold text-slate-900">Insérer depuis catalogue</p>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="px-4 py-3 border-b border-slate-50">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="Rechercher un produit…" className="input-field pl-9 text-sm" />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
          {filtered.length === 0 && <p className="p-6 text-center text-sm text-slate-400">Aucun produit trouvé</p>}
          {filtered.map(p => (
            <button key={p.id} onClick={() => onSelect(p)}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors">
              <p className="text-sm font-semibold text-slate-800">{p.designation}</p>
              <p className="text-xs text-slate-400 mt-0.5">{p.famille} · {formatCurrency(p.prix_vente)} HT · TVA {p.tva}%</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Composant Modal Kits ──────────────────────────────────────────
function ModalKits({ kits, onSelect, onClose }: { kits: Kit[]; onSelect: (k: Kit) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="font-bold text-slate-900">Appliquer un kit</p>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
          {kits.length === 0 && <p className="p-6 text-center text-sm text-slate-400">Aucun kit enregistré</p>}
          {kits.map(k => (
            <button key={k.id} onClick={() => onSelect(k)}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors">
              <p className="text-sm font-semibold text-slate-800">{k.nom}</p>
              {k.description && <p className="text-xs text-slate-400 mt-0.5">{k.description}</p>}
              <p className="text-xs text-slate-300 mt-0.5">{k.lignes.length} ligne(s)</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══ PAGE PRINCIPALE ═══════════════════════════════════════════════
export default function NouveauDevisPage() {
  const router = useRouter()
  const { formatCurrency } = useLanguage()
  const [clients, setClients] = useState<SClient[]>([])
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [catalogue, setCatalogue] = useState<ProduitCatalogue[]>([])
  const [kits, setKits] = useState<Kit[]>([])
  const [draft, setDraft] = useState<DraftState>(defaultDraft)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRestored = useRef(false)

  // Sections accordéon
  const [open, setOpen] = useState({
    a: true, b: false, c: false, d: false, e: true, f: false, g: false,
  })
  const toggleSection = (k: keyof typeof open) => setOpen(p => ({ ...p, [k]: !p[k] }))

  // Modals
  const [catalogueLotId, setCatalogueLotId] = useState<string | null>(null)
  const [showKits, setShowKits] = useState(false)
  const [kitsLotId, setKitsLotId] = useState<string | null>(null)

  // PVGIS
  const [pvgisResult, setPvgisResult] = useState<{ production_annuelle: number; performance_ratio: number | null; irradiation: number | null; lat: number; lon: number } | null>(null)
  const [pvgisLoading, setPvgisLoading] = useState(false)
  const [pvgisError, setPvgisError] = useState('')

  // Helper set
  const set = useCallback(<K extends keyof DraftState>(key: K, val: DraftState[K]) => {
    setDraft(prev => ({ ...prev, [key]: val }))
  }, [])

  // Chargement initial
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Partial<DraftState>
        setDraft(prev => ({ ...prev, ...saved }))
        setSaveStatus('saved')
        isRestored.current = true
      }
    } catch { /* ignore */ }
    Promise.all([
      getClients().then(c => setClients(c as SClient[])),
      getDossiers().then(d => setDossiers(d)),
      getCatalogueActif().then(c => setCatalogue(c)),
      getKits().then(k => setKits(k)),
    ]).catch(console.error)
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
    if (!isRestored.current && !draft.clientId) return
    triggerAutosave(draft)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  // ── Derived / calculs ─────────────────────────────────────────
  const selectedClient = clients.find(c => c.id === draft.clientId)

  // Résultats dimensionnement
  const dimResult = (() => {
    const cp = draft.codePostal || draft.cpChantier || '75'
    if (draft.dimMode === 'surface' && draft.surface > 0)
      return calcFromSurface(draft.surface, draft.orientation, draft.inclinaison, cp, draft.ombrage)
    if (draft.dimMode === 'nb_panneaux' && draft.nbPanneaux > 0)
      return calcFromNbPanneaux(draft.nbPanneaux, draft.orientation, draft.inclinaison, cp, draft.ombrage)
    if (draft.dimMode === 'kwc' && draft.kwc > 0)
      return calcFromKwc(draft.kwc, draft.orientation, draft.inclinaison, cp, draft.ombrage)
    return null
  })()

  const productionKwh = pvgisResult ? pvgisResult.production_annuelle : (draft.productionManuelle > 0 ? draft.productionManuelle : (dimResult?.productionAnnuelle ?? 0))

  const suggestion = suggestOnduleur(draft.besoinBatterie, draft.ombrage, draft.reseau, dimResult?.puissanceKwc ?? 0)

  // Étude éco
  const tarifAutoconso = 0.2276
  const taux = draft.tauxAutoconsommation / 100
  const surplusTaux = 1 - taux
  const economiesAnnuelles = productionKwh > 0
    ? Math.round(productionKwh * taux * tarifAutoconso + productionKwh * surplusTaux * draft.tarifRachatSurplus)
    : 0

  const { totalHT, totalTVA, totalTTC, tvaVentilation, remiseAmt } = calcTotaux(draft.lots, draft.remiseGlobale, draft.remiseGlobaleEuros)
  const acompteEuros = totalTTC * draft.acompte / 100
  const primeTotal = (dimResult?.puissanceKwc ?? 0) * draft.primeAutoconsommation
  const resteCharge = totalTTC - primeTotal
  const roiAnnees = economiesAnnuelles > 0 ? (resteCharge / economiesAnnuelles).toFixed(1) : '–'
  const gain20ans = economiesAnnuelles > 0 ? Math.round(economiesAnnuelles * 20 - resteCharge) : 0

  const { margeEuros, margePct } = calcMargeInterne(draft.lots)

  // ── Lots helpers ──────────────────────────────────────────────
  const updateLot = (lotId: string, field: 'nom', val: string) => {
    setDraft(prev => ({ ...prev, lots: prev.lots.map(l => l.id === lotId ? { ...l, [field]: val } : l) }))
  }

  const removeLot = (lotId: string) => {
    if (!confirm('Supprimer ce lot et toutes ses lignes ?')) return
    setDraft(prev => ({ ...prev, lots: prev.lots.filter(l => l.id !== lotId) }))
  }

  const addLot = () => {
    setDraft(prev => ({ ...prev, lots: [...prev.lots, newLotUI('Nouveau lot')] }))
  }

  const updateLigne = (lotId: string, ligneId: string, field: keyof LigneUI, val: string | number | boolean) => {
    setDraft(prev => ({
      ...prev,
      lots: prev.lots.map(lot => lot.id !== lotId ? lot : {
        ...lot, lignes: lot.lignes.map(l => l.id !== ligneId ? l : { ...l, [field]: val }),
      }),
    }))
  }

  const removeLigne = (lotId: string, ligneId: string) => {
    setDraft(prev => ({
      ...prev,
      lots: prev.lots.map(lot => lot.id !== lotId ? lot : {
        ...lot, lignes: lot.lignes.filter(l => l.id !== ligneId),
      }),
    }))
  }

  const addLigne = (lotId: string) => {
    setDraft(prev => ({
      ...prev,
      lots: prev.lots.map(lot => lot.id !== lotId ? lot : {
        ...lot, lignes: [...lot.lignes, newLigneUI()],
      }),
    }))
  }

  const addLigneTexte = (lotId: string) => {
    setDraft(prev => ({
      ...prev,
      lots: prev.lots.map(lot => lot.id !== lotId ? lot : {
        ...lot, lignes: [...lot.lignes, newLigneUI({ isText: true, designation: '', prixUnitaire: 0 })],
      }),
    }))
  }

  const addFromCatalogue = (lotId: string, p: ProduitCatalogue) => {
    setDraft(prev => ({
      ...prev,
      lots: prev.lots.map(lot => lot.id !== lotId ? lot : {
        ...lot, lignes: [...lot.lignes, newLigneUI({
          designation: p.designation,
          prixUnitaire: p.prix_vente,
          tva: p.tva,
          prixAchat: p.prix_achat,
        })],
      }),
    }))
    setCatalogueLotId(null)
  }

  const applyKit = (lotId: string, kit: Kit) => {
    setDraft(prev => ({
      ...prev,
      lots: prev.lots.map(lot => lot.id !== lotId ? lot : {
        ...lot, lignes: [
          ...lot.lignes,
          ...kit.lignes.map(kl => newLigneUI({
            designation: kl.designation,
            quantite: kl.quantite,
            prixUnitaire: kl.prix_unitaire,
            tva: kl.tva,
          })),
        ],
      }),
    }))
    setShowKits(false)
    setKitsLotId(null)
  }

  const addSuggestionToLot = () => {
    if (!suggestion) return
    const lotId = draft.lots[0]?.id
    if (!lotId) return
    setDraft(prev => ({
      ...prev,
      lots: prev.lots.map((lot, i) => i !== 0 ? lot : {
        ...lot, lignes: lot.lignes.some(l => l.designation === suggestion.designation)
          ? lot.lignes
          : [...lot.lignes, newLigneUI({ designation: suggestion.designation, prixUnitaire: suggestion.prixUnitaire, tva: suggestion.tva })],
      }),
    }))
  }

  // Reset lots quand type projet change
  const handleTypeProjetChange = (v: string) => {
    setDraft(prev => ({ ...prev, typeProjet: v, lots: defaultLots(v) }))
  }

  // PVGIS
  const fetchPVGIS = useCallback(async () => {
    const cp = draft.codePostal || draft.cpChantier
    if (!cp || cp.length < 5 || !dimResult) return
    setPvgisLoading(true); setPvgisError(''); setPvgisResult(null)
    try {
      const params = new URLSearchParams({
        cp, peakpower: dimResult.puissanceKwc.toFixed(2),
        orientation: draft.orientation, inclinaison: draft.inclinaison,
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
  }, [draft.codePostal, draft.cpChantier, draft.orientation, draft.inclinaison, dimResult])

  const clearDraft = () => {
    if (!confirm('Effacer le brouillon et recommencer à zéro ?')) return
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
    setDraft(defaultDraft())
    isRestored.current = false
    setSaveStatus('idle')
  }

  // ── Enregistrement ────────────────────────────────────────────
  const handleSave = () => {
    if (!draft.clientId) { setError('Sélectionnez un client pour enregistrer le devis.'); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    const hasLigne = draft.lots.some(lot => lot.lignes.some(l => l.designation.trim() || l.prixUnitaire > 0))
    if (!hasLigne) { setError("Ajoutez au moins une ligne au devis avant d'enregistrer."); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    setError('')
    const validiteJours = Math.max(1, Math.round((new Date(draft.dateValidite).getTime() - Date.now()) / 86400000))

    const etudeEco: EtudeEco = {
      prime_autoconsommation: draft.primeAutoconsommation,
      tarif_rachat_surplus: draft.tarifRachatSurplus,
      taux_autoconsommation: draft.tauxAutoconsommation,
      economies_annuelles: economiesAnnuelles,
      roi_annees: economiesAnnuelles > 0 ? resteCharge / economiesAnnuelles : undefined,
      gain_20ans: gain20ans,
    }

    const lots: LotDevis[] = draft.lots.map(lot => ({
      nom: lot.nom,
      lignes: lot.lignes.map(l => ({
        id: l.id, designation: l.designation, description: l.description,
        quantite: l.quantite, prixUnitaire: l.prixUnitaire, tva: l.tva,
        remise: l.remise, isText: l.isText,
      } as LigneJson)),
    }))

    startTransition(async () => {
      try {
        try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
        const result = await createDevisAction({
          client_id: draft.clientId,
          type_client: draft.typeClient.toLowerCase(),
          adresse_chantier: draft.adresseChantier || undefined,
          code_postal_chantier: draft.cpChantier || undefined,
          ville_chantier: draft.villeChantier || undefined,
          type_projet: draft.typeProjet.toLowerCase().replace(' ', '_'),
          type_couverture: draft.typeCouverture || undefined,
          type_pose: draft.typePose.toLowerCase().replace(/ /g, '_'),
          orientation: draft.orientation,
          inclinaison: draft.inclinaison,
          reseau: draft.reseau.toLowerCase(),
          ombrage: draft.ombrage,
          puissance_kwc: dimResult?.puissanceKwc,
          nb_panneaux: dimResult?.nbPanneaux,
          production_kwh_an: productionKwh || undefined,
          etude_eco: etudeEco,
          lots,
          remise: draft.remiseGlobale,
          acompte: draft.acompte,
          conditions_paiement: draft.conditionsPaiement,
          notes: draft.notes,
          validite_jours: validiteJours,
          marge_interne: margePct > 0 ? margePct : undefined,
          dossier_id: draft.dossierId || undefined,
        })
        if ('error' in result) { setError(`Erreur : ${result.error}`); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
        router.push(`/devis/${(result as { id: string }).id}`)
      } catch (e: unknown) {
        setError(`Erreur inattendue : ${e instanceof Error ? e.message : String(e)}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="flex-1 overflow-auto" style={{ background: '#f8f9fc' }}>
      <Header title="Nouveau devis" subtitle="Créer un devis photovoltaïque complet" />

      <div className="p-6 max-w-5xl mx-auto space-y-4 pb-16">

        {/* Barre autosave */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs" style={{ color: '#94a3b8' }}>
            {saveStatus === 'saving' && <><RefreshCw size={11} className="animate-spin" /> Sauvegarde automatique…</>}
            {saveStatus === 'saved' && <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Brouillon sauvegardé</>}
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

        {/* ══ A — En-tête du devis ══════════════════════════════════ */}
        <Section num={1} icon={Users} title="En-tête du devis" subtitle="Client, chantier, validité" open={open.a} onToggle={() => toggleSection('a')}>
          <div className="p-6 grid grid-cols-2 gap-4">

            {/* Type client */}
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Type de client</label>
              <RadioGroup options={TYPES_CLIENT} value={draft.typeClient} onChange={v => set('typeClient', v)} />
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

            {/* Adresse chantier */}
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin size={13} style={{ color: '#22D3EE' }} /> Adresse de chantier
                <span className="text-slate-400 font-normal text-xs">(si différente de l&apos;adresse client)</span>
              </label>
              <input type="text" value={draft.adresseChantier} onChange={e => set('adresseChantier', e.target.value)}
                placeholder="Adresse du chantier…" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Code postal chantier</label>
              <input type="text" maxLength={5} value={draft.cpChantier} onChange={e => set('cpChantier', e.target.value)}
                placeholder="Ex : 31000" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ville chantier</label>
              <input type="text" value={draft.villeChantier} onChange={e => set('villeChantier', e.target.value)}
                placeholder="Toulouse" className="input-field" />
            </div>

            {/* Date validité */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date de validité</label>
              <input type="date" value={draft.dateValidite} onChange={e => set('dateValidite', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Durée (jours)</label>
              <input type="number" min={1} max={365} value={draft.validiteJours}
                onChange={e => {
                  const j = parseInt(e.target.value) || 30
                  const d = new Date(); d.setDate(d.getDate() + j)
                  setDraft(prev => ({ ...prev, validiteJours: j, dateValidite: d.toISOString().split('T')[0] }))
                }}
                placeholder="30" className="input-field" />
            </div>

            {/* Dossier */}
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
        </Section>

        {/* ══ B — Qualification du chantier ════════════════════════ */}
        <Section num={2} icon={Settings2} title="Qualification du chantier" subtitle="Type de projet, couverture, pose, réseau" open={open.b} onToggle={() => toggleSection('b')}>
          <div className="p-6 grid grid-cols-2 gap-4">

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Type de projet</label>
              <RadioGroup options={TYPES_PROJET} value={draft.typeProjet} onChange={handleTypeProjetChange} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type de couverture</label>
              <select value={draft.typeCouverture} onChange={e => set('typeCouverture', e.target.value)} className="select-field">
                <option value="">Sélectionner…</option>
                {TYPES_COUVERTURE.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type de pose</label>
              <select value={draft.typePose} onChange={e => set('typePose', e.target.value)} className="select-field">
                {TYPES_POSE.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Réseau</label>
              <RadioGroup options={['Monophasé', 'Triphasé']} value={draft.reseau} onChange={v => set('reseau', v)} />
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

            <div className="col-span-2 flex items-center gap-4 p-3 rounded-xl border"
              style={{ border: draft.ombrage ? '1.5px solid #22D3EE' : '1.5px solid #e4e7ec', background: draft.ombrage ? 'rgba(34,211,238,0.04)' : '#fff' }}>
              <Toggle checked={draft.ombrage} onChange={v => set('ombrage', v)} />
              <div>
                <p className="text-sm font-semibold text-slate-800">Ombrage présent</p>
                {draft.ombrage && <p className="text-xs text-cyan-600 mt-0.5">Recommande optimiseurs ou micro-onduleurs</p>}
              </div>
            </div>
          </div>
        </Section>

        {/* ══ C — Dimensionnement ══════════════════════════════════ */}
        <Section num={3} icon={Zap} title="Dimensionnement" subtitle="Surface, puissance, production estimée" open={open.c} onToggle={() => toggleSection('c')}>
          <div className="p-6 space-y-5">
            {/* Mode de saisie */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mode de calcul</label>
              <div className="flex gap-2">
                {([['surface', 'Surface (m²)'], ['nb_panneaux', 'Nb panneaux'], ['kwc', 'kWc direct']] as [DimMode, string][]).map(([k, lbl]) => (
                  <button key={k} type="button" onClick={() => set('dimMode', k)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                    style={{
                      background: draft.dimMode === k ? 'linear-gradient(135deg, #22D3EE, #06B6D4)' : '#fff',
                      color: draft.dimMode === k ? '#fff' : '#64748b',
                      border: draft.dimMode === k ? '1.5px solid #22D3EE' : '1.5px solid #e4e7ec',
                    }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {draft.dimMode === 'surface' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Surface disponible (m²)</label>
                  <input type="number" min={1} value={draft.surface || ''} onChange={e => set('surface', Number(e.target.value))}
                    placeholder="Ex : 30" className="input-field" />
                </div>
              )}
              {draft.dimMode === 'nb_panneaux' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre de panneaux</label>
                  <input type="number" min={1} value={draft.nbPanneaux || ''} onChange={e => set('nbPanneaux', Number(e.target.value))}
                    placeholder="Ex : 12" className="input-field" />
                </div>
              )}
              {draft.dimMode === 'kwc' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Puissance crête (kWc)</label>
                  <input type="number" min={0.1} step={0.1} value={draft.kwc || ''} onChange={e => set('kwc', Number(e.target.value))}
                    placeholder="Ex : 3.0" className="input-field" />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Code postal (ensoleillement)</label>
                <input type="text" maxLength={5} value={draft.codePostal} onChange={e => set('codePostal', e.target.value)}
                  placeholder="Ex : 31000" className="input-field" />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <Toggle checked={draft.besoinBatterie} onChange={v => set('besoinBatterie', v)} />
                <span className="text-sm font-semibold text-slate-700">Batterie de stockage</span>
              </div>
            </div>

            {/* Production manuelle override */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Production annuelle (kWh/an)
                <span className="text-slate-400 font-normal text-xs ml-2">— 0 = calculée automatiquement</span>
              </label>
              <input type="number" min={0} value={draft.productionManuelle || ''} onChange={e => set('productionManuelle', Number(e.target.value))}
                placeholder="Laisser vide pour calcul auto" className="input-field w-64" />
            </div>

            {/* Résultats dimensionnement */}
            {dimResult && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(34,211,238,0.2)' }}>
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.07), rgba(34,211,238,0.04))' }}>
                  <div className="flex items-center gap-2">
                    {pvgisResult
                      ? <><Satellite size={13} style={{ color: '#22D3EE' }} /><span className="text-xs font-bold text-slate-700">Données PVGIS réelles</span><span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-1" style={{ background: '#dcfce7', color: '#15803d' }}>✓ JRC · EU</span></>
                      : <><Sun size={13} style={{ color: '#22D3EE' }} /><span className="text-xs font-bold text-slate-700">Estimation de production</span><span className="text-xs text-slate-400 ml-1">(approximatif)</span></>}
                  </div>
                  {(draft.codePostal?.length === 5 || draft.cpChantier?.length === 5) && (
                    <button type="button" onClick={fetchPVGIS} disabled={pvgisLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-60"
                      style={{ background: pvgisResult ? '#64748b' : 'linear-gradient(135deg, #22D3EE, #06B6D4)' }}>
                      {pvgisLoading ? <><Loader2 size={11} className="animate-spin" /> Calcul…</> : <><Satellite size={11} /> {pvgisResult ? 'Recalculer' : 'Données PVGIS'}</>}
                    </button>
                  )}
                </div>
                {pvgisError && (
                  <div className="px-4 py-2 text-xs font-medium flex items-center gap-2" style={{ background: '#fef2f2', color: '#dc2626' }}>
                    <AlertTriangle size={12} /> {pvgisError}
                  </div>
                )}
                <div className="grid grid-cols-4 gap-3 p-4" style={{ background: 'rgba(248,250,252,0.8)' }}>
                  {[
                    { label: 'Panneaux', value: String(dimResult.nbPanneaux), unit: 'unités' },
                    { label: 'Puissance', value: dimResult.puissanceKwc.toFixed(2), unit: 'kWc' },
                    { label: 'Production / an', value: productionKwh.toLocaleString('fr-FR'), unit: 'kWh', pvgis: !!pvgisResult },
                    { label: 'CO₂ évité', value: dimResult.co2.toLocaleString('fr-FR'), unit: 'kg/an' },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-3 relative">
                      {s.pvgis && <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1 rounded" style={{ background: '#dcfce7', color: '#15803d' }}>PVGIS</span>}
                      <p className="text-lg font-black text-slate-900">{s.value}</p>
                      <p className="text-xs text-slate-400">{s.unit} · {s.label}</p>
                    </div>
                  ))}
                </div>
                {pvgisResult && (
                  <div className="px-4 pb-3 flex items-center gap-4 text-xs text-slate-400">
                    {pvgisResult.performance_ratio && <span>PR : <strong className="text-slate-600">{pvgisResult.performance_ratio}%</strong></span>}
                    {pvgisResult.irradiation && <span>Irradiation : <strong className="text-slate-600">{pvgisResult.irradiation.toLocaleString('fr-FR')} kWh/m²/an</strong></span>}
                    <span className="ml-auto">📍 {pvgisResult.lat.toFixed(3)}°N, {pvgisResult.lon.toFixed(3)}°E</span>
                  </div>
                )}
              </div>
            )}

            {/* Suggestion onduleur */}
            {suggestion && (
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
                      <p className="text-sm text-slate-600 mt-1">{suggestion.raison}</p>
                      <p className="text-xs font-semibold mt-2 text-slate-500">
                        Produit suggéré : <span className="text-slate-800">{suggestion.designation}</span>
                        <span className="ml-2" style={{ color: suggestion.couleur }}>— {formatCurrency(suggestion.prixUnitaire)}</span>
                      </p>
                    </div>
                    <button type="button" onClick={addSuggestionToLot}
                      className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white"
                      style={{ background: suggestion.couleur }}>
                      + Ajouter au lot 1
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ══ D — Étude économique ══════════════════════════════════ */}
        <Section num={4} icon={TrendingUp} title="Étude économique" subtitle="Rentabilité, retour sur investissement" open={open.d} onToggle={() => toggleSection('d')}>
          <div className="p-6 space-y-5">

            {/* Bandeau avertissement */}
            <div className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Estimation indicative.</strong> Tous les taux et primes (autoconsommation, rachat, économies) sont à vérifier selon la réglementation en vigueur et les tarifs de votre opérateur.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Prime autoconsommation (€/kWc)
                  <span className="block text-xs text-amber-600 font-normal mt-0.5">À vérifier</span>
                </label>
                <input type="number" min={0} step={1} value={draft.primeAutoconsommation || ''} onChange={e => set('primeAutoconsommation', Number(e.target.value))}
                  placeholder="Ex : 200" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Tarif rachat surplus (€/kWh)
                  <span className="block text-xs text-amber-600 font-normal mt-0.5">À vérifier</span>
                </label>
                <input type="number" min={0} step={0.001} value={draft.tarifRachatSurplus || ''} onChange={e => set('tarifRachatSurplus', Number(e.target.value))}
                  placeholder="Ex : 0.1326" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Taux autoconsommation estimé (%)
                </label>
                <input type="number" min={0} max={100} value={draft.tauxAutoconsommation || ''} onChange={e => set('tauxAutoconsommation', Number(e.target.value))}
                  placeholder="70" className="input-field" />
              </div>
            </div>

            {/* Résultats économiques */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Production autoconsommée', value: `${Math.round(productionKwh * draft.tauxAutoconsommation / 100).toLocaleString('fr-FR')} kWh/an`, color: '#16a34a' },
                { label: 'Économies annuelles estimées', value: formatCurrency(economiesAnnuelles), color: '#16a34a' },
                { label: 'Prime autoconsommation totale', value: formatCurrency(primeTotal), color: '#22D3EE' },
                { label: 'Reste à charge estimé', value: formatCurrency(resteCharge), color: '#0f172a' },
                { label: 'Retour sur investissement', value: `${roiAnnees} ans`, color: '#7c3aed' },
                { label: 'Gain estimé sur 20 ans', value: gain20ans > 0 ? formatCurrency(gain20ans) : '–', color: gain20ans > 0 ? '#16a34a' : '#94a3b8' },
              ].map(item => (
                <div key={item.label} className="p-4 rounded-xl bg-slate-50">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-lg font-black mt-1" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400">
              Calcul basé sur {productionKwh.toLocaleString('fr-FR')} kWh/an · {draft.tauxAutoconsommation}% autoconsommé à {formatCurrency(0.2276)}/kWh (tarif EDF TRV indicatif) · surplus à {formatCurrency(draft.tarifRachatSurplus)}/kWh
            </p>
          </div>
        </Section>

        {/* ══ E — Lignes du devis (LOTS) ═══════════════════════════ */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg, #22D3EE, #06B6D4)' }}>5</span>
              <Layers size={15} style={{ color: '#22D3EE' }} />
              <div>
                <p className="font-bold text-slate-900 text-sm">Lignes du devis — Lots</p>
                <p className="text-xs text-slate-400">{draft.lots.length} lot(s) · {draft.lots.flatMap(l => l.lignes).length} ligne(s)</p>
              </div>
            </div>
            <button onClick={addLot} className="btn-secondary text-xs flex items-center gap-1.5">
              <Plus size={13} /> Ajouter un lot
            </button>
          </div>

          {/* En-têtes colonnes */}
          <div className="grid gap-2 px-4 py-2.5 bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider"
            style={{ gridTemplateColumns: '3fr 1fr 1.5fr 1fr 1fr 1fr 0.5fr' }}>
            <div>Désignation / Description</div>
            <div className="text-right">Qté</div>
            <div className="text-right">Prix HT</div>
            <div className="text-center">TVA</div>
            <div className="text-right">Rem%</div>
            <div className="text-right">Total HT</div>
            <div />
          </div>

          {/* Lots */}
          {draft.lots.map((lot, lotIdx) => (
            <div key={lot.id} className="border-t border-slate-100">
              {/* En-tête lot */}
              <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.05), rgba(34,211,238,0.02))' }}>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#22D3EE' }}>{lotIdx + 1}</span>
                <input type="text" value={lot.nom} onChange={e => updateLot(lot.id, 'nom', e.target.value)}
                  className="flex-1 text-sm font-bold text-slate-800 bg-transparent border-none outline-none focus:underline" />
                <span className="text-xs text-slate-400">{formatCurrency(calcLotHT(lot))} HT</span>
                <button onClick={() => removeLot(lot.id)} className="text-red-400 hover:text-red-600 transition-colors ml-2">
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Lignes du lot */}
              <div className="divide-y divide-slate-50">
                {lot.lignes.map(ligne => {
                  const ht = calcLigneHT(ligne)
                  if (ligne.isText) {
                    return (
                      <div key={ligne.id} className="flex items-center gap-2 px-4 py-2 group">
                        <FileText size={13} className="text-slate-300 flex-shrink-0" />
                        <input type="text" placeholder="Commentaire ou texte libre…" value={ligne.designation}
                          onChange={e => updateLigne(lot.id, ligne.id, 'designation', e.target.value)}
                          className="flex-1 text-sm text-slate-500 italic bg-transparent border-none outline-none focus:underline" />
                        <button onClick={() => removeLigne(lot.id, ligne.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )
                  }
                  return (
                    <div key={ligne.id} className="group hover:bg-slate-50/50 transition-colors">
                      <div className="grid gap-2 px-4 py-2.5 items-center"
                        style={{ gridTemplateColumns: '3fr 1fr 1.5fr 1fr 1fr 1fr 0.5fr' }}>
                        <div>
                          <input type="text" placeholder="Désignation" value={ligne.designation}
                            onChange={e => updateLigne(lot.id, ligne.id, 'designation', e.target.value)}
                            className="input-field text-sm py-1.5 w-full" />
                          <input type="text" placeholder="Description…" value={ligne.description || ''}
                            onChange={e => updateLigne(lot.id, ligne.id, 'description', e.target.value)}
                            className="input-field text-xs py-1 w-full mt-1 text-slate-400" />
                        </div>
                        <div>
                          <input type="number" min="0" step="0.5" value={ligne.quantite}
                            onChange={e => updateLigne(lot.id, ligne.id, 'quantite', parseFloat(e.target.value) || 0)}
                            className="input-field text-sm py-1.5 text-right w-full" />
                        </div>
                        <div>
                          <input type="number" min="0" step="0.01" value={ligne.prixUnitaire}
                            onChange={e => updateLigne(lot.id, ligne.id, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                            className="input-field text-sm py-1.5 text-right w-full" />
                          {ligne.prixAchat != null && ligne.prixAchat > 0 && (
                            <p className="text-xs text-slate-300 text-right mt-0.5">PA: {formatCurrency(ligne.prixAchat)}</p>
                          )}
                        </div>
                        <div>
                          <select value={ligne.tva}
                            onChange={e => updateLigne(lot.id, ligne.id, 'tva', parseFloat(e.target.value))}
                            className="select-field text-sm py-1.5 w-full text-center">
                            {TVA_OPTIONS.map(t => <option key={t} value={t}>{t}%</option>)}
                          </select>
                        </div>
                        <div>
                          <input type="number" min="0" max="100" value={ligne.remise}
                            onChange={e => updateLigne(lot.id, ligne.id, 'remise', parseFloat(e.target.value) || 0)}
                            className="input-field text-sm py-1.5 text-right w-full" />
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-slate-800">{formatCurrency(ht)}</span>
                        </div>
                        <div className="flex justify-end">
                          <button onClick={() => removeLigne(lot.id, ligne.id)}
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-red-400 hover:bg-red-50 transition-all">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Sous-total lot + boutons */}
              <div className="px-4 py-3 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <button onClick={() => addLigne(lot.id)} className="btn-secondary text-xs flex items-center gap-1">
                    <Plus size={12} /> Ligne
                  </button>
                  <button onClick={() => addLigneTexte(lot.id)} className="btn-secondary text-xs flex items-center gap-1">
                    <FileText size={12} /> Texte
                  </button>
                  <button onClick={() => setCatalogueLotId(lot.id)} className="btn-secondary text-xs flex items-center gap-1">
                    <Package size={12} /> Catalogue
                  </button>
                  <button onClick={() => { setKitsLotId(lot.id); setShowKits(true) }} className="btn-secondary text-xs flex items-center gap-1">
                    <Layers size={12} /> Kit
                  </button>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Sous-total lot</span>
                  <span className="ml-3 text-sm font-bold text-slate-800">{formatCurrency(calcLotHT(lot))}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Totaux globaux */}
          <div className="border-t border-slate-100 p-6 flex justify-end">
            <div className="w-80 space-y-2">
              {draft.lots.map(lot => (
                <div key={lot.id} className="flex justify-between text-sm text-slate-400">
                  <span>{lot.nom}</span>
                  <span className="tabular-nums">{formatCurrency(calcLotHT(lot))}</span>
                </div>
              ))}
              <div className="h-px bg-slate-100 my-2" />
              <div className="flex justify-between text-sm text-slate-600">
                <span>Total HT (avant remise)</span>
                <span className="tabular-nums">{formatCurrency(totalHT + remiseAmt)}</span>
              </div>
              {remiseAmt > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Remise</span>
                  <span className="tabular-nums">–{formatCurrency(remiseAmt)}</span>
                </div>
              )}
              {/* Ventilation TVA */}
              {Object.entries(tvaVentilation).map(([taux, amt]) => (
                <div key={taux} className="flex justify-between text-sm text-slate-500">
                  <span>TVA {taux}%</span>
                  <span className="tabular-nums">{formatCurrency(amt)}</span>
                </div>
              ))}
              <div className="h-px bg-slate-100 my-2" />
              <div className="flex justify-between font-bold text-slate-900">
                <span>Total TTC</span>
                <span className="text-xl tabular-nums">{formatCurrency(totalTTC)}</span>
              </div>
              {primeTotal > 0 && (
                <div className="flex justify-between text-sm font-semibold" style={{ color: '#22D3EE' }}>
                  <span>Prime autoconsommation</span>
                  <span className="tabular-nums">–{formatCurrency(primeTotal)}</span>
                </div>
              )}
              {primeTotal > 0 && (
                <div className="flex justify-between text-sm font-bold text-slate-700">
                  <span>Reste à charge</span>
                  <span className="tabular-nums">{formatCurrency(resteCharge)}</span>
                </div>
              )}
              {draft.acompte > 0 && (
                <div className="flex justify-between text-sm font-semibold" style={{ color: '#22D3EE' }}>
                  <span>Acompte ({draft.acompte}%)</span>
                  <span className="tabular-nums">{formatCurrency(acompteEuros)}</span>
                </div>
              )}
              {/* Marge interne — jamais dans le PDF */}
              <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
                <div className="flex justify-between text-sm font-semibold" style={{ color: '#94a3b8' }}>
                  <span className="flex items-center gap-1.5">
                    <BarChart3 size={13} /> Marge installateur <span className="text-xs font-normal">(non imprimé)</span>
                  </span>
                  <span className="tabular-nums">{formatCurrency(margeEuros)} ({margePct.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ F — Conditions commerciales ══════════════════════════ */}
        <Section num={6} icon={FileText} title="Conditions commerciales" subtitle="Remise, acompte, paiement, garanties" open={open.f} onToggle={() => toggleSection('f')}>
          <div className="p-6 grid grid-cols-2 gap-4">

            {/* Remise globale */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Remise globale</label>
              <div className="flex gap-2 items-center">
                <input type="number" min="0" value={draft.remiseGlobale || ''}
                  onChange={e => set('remiseGlobale', parseFloat(e.target.value) || 0)}
                  placeholder="0" className="input-field flex-1" />
                <div className="flex gap-1">
                  {['%', '€'].map(m => (
                    <button key={m} type="button"
                      onClick={() => set('remiseGlobaleEuros', m === '€')}
                      className="px-3 py-2 rounded-lg text-sm font-bold border transition-all"
                      style={{
                        background: (m === '€') === draft.remiseGlobaleEuros ? 'linear-gradient(135deg, #22D3EE, #06B6D4)' : '#fff',
                        color: (m === '€') === draft.remiseGlobaleEuros ? '#fff' : '#64748b',
                        border: (m === '€') === draft.remiseGlobaleEuros ? '1.5px solid #22D3EE' : '1.5px solid #e4e7ec',
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Acompte */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Acompte (%)</label>
              <input type="number" min="0" max="100" value={draft.acompte || ''}
                onChange={e => set('acompte', parseFloat(e.target.value) || 0)}
                placeholder="Ex : 30" className="input-field" />
            </div>

            {/* Conditions paiement */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Conditions de paiement</label>
              <select value={draft.conditionsPaiement} onChange={e => set('conditionsPaiement', e.target.value)} className="select-field">
                <option>30 jours net</option>
                <option>50% à la commande</option>
                <option>40% acompte, 60% à la livraison</option>
                <option>À réception de facture</option>
                <option>Comptant</option>
                <option>Personnalisé</option>
              </select>
            </div>

            {/* Délai réalisation */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Délai de réalisation</label>
              <input type="text" value={draft.delaiRealisation} onChange={e => set('delaiRealisation', e.target.value)}
                placeholder="Ex : 4 à 6 semaines" className="input-field" />
            </div>

            {/* Droit de rétractation (particuliers) */}
            {draft.typeClient === 'Particulier' && (
              <div className="col-span-2">
                <div className="flex items-start gap-3 p-4 rounded-xl border cursor-pointer"
                  style={{ border: draft.droitRetractation ? '1.5px solid #22D3EE' : '1.5px solid #e4e7ec', background: draft.droitRetractation ? 'rgba(34,211,238,0.04)' : '#fff' }}
                  onClick={() => set('droitRetractation', !draft.droitRetractation)}>
                  <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ borderColor: draft.droitRetractation ? '#22D3EE' : '#d1d5db', background: draft.droitRetractation ? '#22D3EE' : '#fff' }}>
                    {draft.droitRetractation && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Inclure le droit de rétractation</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      &quot;Le client particulier dispose d&apos;un délai de rétractation de 14 jours à compter de la signature du présent devis.&quot;
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ══ G — Notes ════════════════════════════════════════════ */}
        <Section num={7} icon={FileText} title="Notes & Informations complémentaires" subtitle="Notes internes ou pour le client" open={open.g} onToggle={() => toggleSection('g')}>
          <div className="p-6">
            <textarea value={draft.notes} onChange={e => set('notes', e.target.value)}
              rows={4} className="input-field resize-none w-full"
              placeholder="Garanties, délais, subventions MaPrimeRénov', conditions particulières…" />
          </div>
        </Section>

        {/* ══ Actions ══════════════════════════════════════════════ */}
        <div className="flex items-center justify-between pb-4">
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

      {/* ── Modals ──────────────────────────────────────────────── */}
      {catalogueLotId && (
        <ModalCatalogue
          catalogue={catalogue}
          onSelect={p => addFromCatalogue(catalogueLotId, p)}
          onClose={() => setCatalogueLotId(null)}
        />
      )}

      {showKits && kitsLotId && (
        <ModalKits
          kits={kits}
          onSelect={k => applyKit(kitsLotId, k)}
          onClose={() => { setShowKits(false); setKitsLotId(null) }}
        />
      )}
    </div>
  )
}
