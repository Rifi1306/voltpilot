'use client'
import { useState, useMemo } from 'react'
import { Sun, CheckCircle, ChevronRight, ChevronLeft, Zap, Battery, BarChart3, Leaf, Euro, Home, Building2, Tractor, AlertTriangle, Download, Phone } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 'result'

type PanneauType = 'monocristallin' | 'polycristallin' | 'bifacial'
type OrientationType = 'Sud' | 'Sud-Est' | 'Sud-Ouest' | 'Est' | 'Ouest'
type TypeBatiment = 'Maison individuelle' | 'Immeuble' | 'Entreprise' | 'Exploitation agricole'

type FormData = {
  // Step 1
  nom: string; email: string; telephone: string; ville: string; codePostal: string
  // Step 2
  surface: string; orientation: OrientationType; ombrage: boolean; typeBatiment: TypeBatiment
  // Step 3
  puissanceKwc: number; typePanneau: PanneauType; batterie: boolean; capaciteBatterie: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PANNEAUX = {
  monocristallin: {
    label: 'Monocristallin', icon: '☀️', rendement: '20-22%',
    puissanceW: 420, prixKwc: 1800,
    avantage: 'Meilleur rendement, idéal surface limitée',
    couleur: '#22D3EE',
  },
  polycristallin: {
    label: 'Polycristallin', icon: '🔆', rendement: '16-18%',
    puissanceW: 380, prixKwc: 1500,
    avantage: 'Rapport qualité-prix optimal',
    couleur: '#3b82f6',
  },
  bifacial: {
    label: 'Bifacial', icon: '✨', rendement: '22-24%',
    puissanceW: 500, prixKwc: 2100,
    avantage: 'Haute performance, capte lumière réfléchie',
    couleur: '#06B6D4',
  },
} as const

function getEnsoleillement(cp: string): number {
  const dept = cp.substring(0, 2)
  const map: Record<string, number> = {
    '06': 1550, '83': 1550, '84': 1500, '13': 1500,
    '30': 1450, '34': 1450, '66': 1480, '11': 1420,
    '31': 1350, '32': 1320, '65': 1300, '09': 1280,
    '33': 1300, '47': 1280, '24': 1250, '17': 1250, '64': 1300,
    '69': 1220, '63': 1200, '43': 1180, '07': 1220, '26': 1280,
    '38': 1200, '73': 1150, '74': 1100,
    '67': 1100, '68': 1080, '57': 1050, '54': 1050,
    '75': 1150, '77': 1150, '78': 1150, '91': 1150, '92': 1150,
    '93': 1150, '94': 1150, '95': 1150, '76': 1050,
    '59': 1050, '62': 1050, '80': 1050,
    '29': 1100, '35': 1100, '22': 1100, '56': 1100,
    '44': 1150, '85': 1200, '49': 1150, '72': 1150,
  }
  return map[dept] ?? 1200
}

function orientationFactor(o: OrientationType): number {
  return { 'Sud': 1, 'Sud-Est': 0.95, 'Sud-Ouest': 0.95, 'Est': 0.82, 'Ouest': 0.82 }[o]
}

function formatEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

// ─── Calculation engine ───────────────────────────────────────────────────────

function computeDevis(f: FormData) {
  const panneau = PANNEAUX[f.typePanneau]
  const nbPanneaux = Math.ceil((f.puissanceKwc * 1000) / panneau.puissanceW)
  const puissanceReelle = (nbPanneaux * panneau.puissanceW) / 1000

  const ensoleillement = getEnsoleillement(f.codePostal)
  const facteurOrientation = orientationFactor(f.orientation)
  const facteurOmbrage = f.ombrage ? 0.88 : 1
  const productionAnnuelle = Math.round(puissanceReelle * ensoleillement * 0.85 * facteurOrientation * facteurOmbrage)

  const isResidentiel = f.typeBatiment === 'Maison individuelle' || f.typeBatiment === 'Immeuble'
  const tauxTVA = isResidentiel ? 0.10 : 0.20

  const prixPanneauxHT = Math.round(puissanceReelle * panneau.prixKwc)
  const prixInstallationHT = Math.round(puissanceReelle * (isResidentiel ? 600 : 450))
  const prixDemarchesHT = 380
  const prixBatterieHT = f.batterie ? Math.round(f.capaciteBatterie * 1200) : 0

  const totalHT = prixPanneauxHT + prixInstallationHT + prixDemarchesHT + prixBatterieHT
  const montantTVA = Math.round(totalHT * tauxTVA)
  const totalTTC = totalHT + montantTVA

  // Aides 2024
  const aideMaPrime = isResidentiel
    ? puissanceReelle <= 3 ? 1500
      : puissanceReelle <= 6 ? 2400
      : puissanceReelle <= 9 ? 3000
      : 3000
    : 0
  const aideCEE = Math.round(puissanceReelle * 150)
  const totalAides = aideMaPrime + aideCEE

  const coutFinal = Math.round(totalTTC - totalAides)

  const prixElectricite = 0.2276
  const economiesAnnuelles = Math.round(productionAnnuelle * prixElectricite)
  const amortissement = (coutFinal / economiesAnnuelles).toFixed(1)
  const co2Evite = Math.round(productionAnnuelle * 0.052)
  const economies25ans = economiesAnnuelles * 25
  const coutParKwc = Math.round(coutFinal / puissanceReelle)

  const numeroDevis = `VP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

  return {
    nbPanneaux, puissanceReelle, productionAnnuelle,
    prixPanneauxHT, prixInstallationHT, prixDemarchesHT, prixBatterieHT,
    totalHT, montantTVA, totalTTC,
    aideMaPrime, aideCEE, totalAides,
    coutFinal, economiesAnnuelles, amortissement, co2Evite, economies25ans, coutParKwc,
    numeroDevis, ensoleillement,
  }
}

// ─── Field component ─────────────────────────────────────────────────────────

const FIELD = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition bg-white'
const LABEL = 'block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide'

// ─── Main component ──────────────────────────────────────────────────────────

export default function WidgetPage() {
  const [step, setStep] = useState<Step>(1)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState<FormData>({
    nom: '', email: '', telephone: '', ville: '', codePostal: '',
    surface: '', orientation: 'Sud', ombrage: false, typeBatiment: 'Maison individuelle',
    puissanceKwc: 6, typePanneau: 'monocristallin', batterie: false, capaciteBatterie: 5,
  })

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const quote = useMemo(() => computeDevis(form), [form])

  const handleNext = async () => {
    if (step === 3) {
      setSending(true)
      try {
        await fetch('/api/widget', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, typeProjet: form.typeBatiment, puissance: `${form.puissanceKwc} kWc`, message: `Panneau: ${PANNEAUX[form.typePanneau].label}, Batterie: ${form.batterie ? form.capaciteBatterie + 'kWh' : 'Non'}` }),
        })
      } catch { /* silent */ }
      setSending(false)
      setStep('result')
    } else {
      setStep(prev => (prev as number) + 1 as Step)
    }
  }

  const canNext = () => {
    if (step === 1) return form.nom && form.email && form.ville && form.codePostal && form.telephone
    if (step === 2) return !!form.typeBatiment
    if (step === 3) return form.puissanceKwc > 0
    return false
  }

  const handlePrint = () => window.print()

  // ── Result page ──────────────────────────────────────────────────────────────
  if (step === 'result') {
    const panneau = PANNEAUX[form.typePanneau]
    const dateValidite = new Date()
    dateValidite.setDate(dateValidite.getDate() + 30)

    return (
      <div className="min-h-screen p-4 sm:p-6" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #f0f9ff 100%)' }}>
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden print:shadow-none">
            <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #22D3EE, #06B6D4)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Sun size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-black text-lg">VoltPilot</p>
                    <p className="text-sky-100 text-xs">Devis solaire professionnel</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm">{quote.numeroDevis}</p>
                  <p className="text-sky-100 text-xs">Valide jusqu&apos;au {dateValidite.toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>

            {/* Success banner */}
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900 text-sm">Devis généré instantanément</p>
                <p className="text-xs text-emerald-600">Un conseiller va vous contacter pour confirmer les détails de votre installation.</p>
              </div>
            </div>

            {/* Client info */}
            <div className="px-6 py-4 border-b border-slate-50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Client</p>
              <p className="font-bold text-slate-900">{form.nom}</p>
              <p className="text-sm text-slate-500">{form.email} · {form.telephone}</p>
              <p className="text-sm text-slate-500">{form.ville} ({form.codePostal})</p>
            </div>
          </div>

          {/* Résumé technique */}
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Zap size={16} className="text-sky-500" /> Système solaire recommandé
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Puissance totale', value: `${quote.puissanceReelle.toFixed(1)} kWc` },
                { label: 'Nombre de panneaux', value: `${quote.nbPanneaux} panneaux` },
                { label: 'Type', value: panneau.label },
                { label: 'Puissance panneau', value: `${panneau.puissanceW} Wc` },
                { label: 'Orientation', value: form.orientation },
                { label: 'Type bâtiment', value: form.typeBatiment },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-slate-50">
                  <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            {form.batterie && (
              <div className="mt-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-3">
                <Battery size={18} className="text-indigo-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Batterie de stockage {form.capaciteBatterie} kWh incluse</p>
                  <p className="text-xs text-indigo-600">Stockez votre surplus pour une autonomie maximale</p>
                </div>
              </div>
            )}
          </div>

          {/* Production annuelle */}
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <BarChart3 size={16} className="text-green-500" /> Production &amp; économies estimées
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(249,115,22,0.04))', border: '1px solid rgba(34,211,238,0.2)' }}>
                <p className="text-3xl font-black text-sky-600">{quote.productionAnnuelle.toLocaleString('fr-FR')}</p>
                <p className="text-sm font-medium text-slate-600 mt-1">kWh/an produits</p>
                <p className="text-xs text-slate-400 mt-1">Ensoleillement {quote.ensoleillement}h · Pertes 15%</p>
              </div>
              <div className="p-4 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p className="text-3xl font-black text-emerald-600">{formatEur(quote.economiesAnnuelles)}</p>
                <p className="text-sm font-medium text-slate-600 mt-1">économies/an</p>
                <p className="text-xs text-slate-400 mt-1">Base 0.2276 €/kWh (tarif 2024)</p>
              </div>
            </div>
          </div>

          {/* Tableau des coûts */}
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Euro size={16} className="text-indigo-500" /> Détail des coûts
            </h2>
            <div className="space-y-2">
              {[
                { label: `Panneaux ${panneau.label} × ${quote.nbPanneaux}`, value: quote.prixPanneauxHT },
                { label: 'Onduleur + câblage + structure', value: null },
                { label: 'Installation & main d\'œuvre', value: quote.prixInstallationHT },
                { label: 'Démarches administratives (Consuel, EDF)', value: quote.prixDemarchesHT },
                ...(form.batterie ? [{ label: `Batterie de stockage ${form.capaciteBatterie} kWh`, value: quote.prixBatterieHT }] : []),
              ].filter(r => r.value !== null).map((row, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 text-sm">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="font-semibold text-slate-800">{formatEur(row.value!)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-500">Sous-total HT</span>
                <span className="text-slate-700">{formatEur(quote.totalHT)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-500">TVA ({form.typeBatiment === 'Maison individuelle' || form.typeBatiment === 'Immeuble' ? '10%' : '20%'})</span>
                <span className="text-slate-700">{formatEur(quote.montantTVA)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm text-slate-500">
                <span>Total TTC avant aides</span>
                <span>{formatEur(quote.totalTTC)}</span>
              </div>
              {quote.aideMaPrime > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-green-50 text-sm text-emerald-600">
                  <span>− MaPrimeRénov&apos; (estimation)</span>
                  <span className="font-semibold">− {formatEur(quote.aideMaPrime)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 text-sm text-emerald-600">
                <span>− CEE (Certificats d&apos;Économies d&apos;Énergie)</span>
                <span className="font-semibold">− {formatEur(quote.aideCEE)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 mt-2" style={{ borderTop: '2px solid #22D3EE' }}>
                <span className="font-black text-slate-900 text-lg">Votre coût final estimé</span>
                <span className="font-black text-2xl" style={{ color: '#22D3EE' }}>{formatEur(quote.coutFinal)}</span>
              </div>
            </div>
          </div>

          {/* Analyse financière */}
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Leaf size={16} className="text-green-500" /> Analyse sur 25 ans
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Retour sur investissement', value: `${quote.amortissement} ans`, color: '#22D3EE' },
                { label: 'Économies sur 25 ans', value: formatEur(quote.economies25ans), color: '#10b981' },
                { label: 'CO₂ évité par an', value: `${quote.co2Evite} kg`, color: '#22c55e' },
                { label: 'Coût au kWc installé', value: formatEur(quote.coutParKwc), color: '#22D3EE' },
              ].map(item => (
                <div key={item.label} className="p-4 rounded-2xl" style={{ background: item.color + '10', border: `1px solid ${item.color}30` }}>
                  <p className="text-xs text-slate-500 font-medium">{item.label}</p>
                  <p className="font-black text-xl mt-1" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Avertissement */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
            <AlertTriangle size={16} className="text-sky-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-sky-700 leading-relaxed">
              Ce devis est une <strong>estimation indicative</strong> basée sur les données saisies. Les prix définitifs seront confirmés après visite de site gratuite. Les aides sont soumises à conditions de ressources et d&apos;éligibilité.
            </p>
          </div>

          {/* CTAs */}
          <div className="bg-white rounded-3xl shadow-sm p-6 space-y-3">
            <h2 className="font-bold text-slate-900 text-sm mb-4">Prochaines étapes</h2>
            <a
              href={`tel:+33`}
              className="flex items-center gap-3 w-full py-3.5 px-5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #22D3EE, #06B6D4)' }}
            >
              <Phone size={18} /> Parler à un conseiller (gratuit)
            </a>
            <button
              onClick={handlePrint}
              className="flex items-center gap-3 w-full py-3.5 px-5 rounded-2xl font-semibold text-slate-700 text-sm border border-slate-200 hover:bg-slate-50 transition-all"
            >
              <Download size={18} /> Télécharger ce devis (PDF)
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition py-2"
            >
              ← Modifier les paramètres
            </button>
          </div>

          <p className="text-center text-xs text-slate-300 pb-4">
            Propulsé par <span className="text-sky-400 font-semibold">VoltPilot</span>
          </p>
        </div>
      </div>
    )
  }

  // ── Form steps ────────────────────────────────────────────────────────────────

  const steps = [
    { num: 1, label: 'Coordonnées' },
    { num: 2, label: 'Votre site' },
    { num: 3, label: 'Votre projet' },
  ]

  return (
    <div className="min-h-screen p-4 sm:p-6 flex items-start justify-center pt-6" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)' }}>
      <div className="bg-white rounded-3xl shadow-lg w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-8 py-5" style={{ background: 'linear-gradient(135deg, #22D3EE, #06B6D4)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Sun size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">Devis solaire instantané</h1>
              <p className="text-sky-100 text-xs">Gratuit · Sans engagement · Résultat immédiat</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-1.5 ${step === s.num ? 'opacity-100' : step > s.num ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step > s.num ? 'bg-white text-sky-600' : step === s.num ? 'bg-white text-sky-600' : 'bg-white/30 text-white'}`}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span className="text-xs text-white font-medium hidden sm:block">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="h-0.5 flex-1 rounded-full mx-1" style={{ background: (step as number) > s.num ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form content */}
        <div className="px-8 py-6 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className={LABEL}>Nom complet *</label>
                <input type="text" required value={form.nom} onChange={set('nom')} placeholder="Jean Dupont" className={FIELD} />
              </div>
              <div>
                <label className={LABEL}>Email *</label>
                <input type="email" required value={form.email} onChange={set('email')} placeholder="jean@email.fr" className={FIELD} />
              </div>
              <div>
                <label className={LABEL}>Téléphone *</label>
                <input type="tel" required value={form.telephone} onChange={set('telephone')} placeholder="06 12 34 56 78" className={FIELD} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                  <label className={LABEL}>Code postal *</label>
                  <input type="text" required maxLength={5} value={form.codePostal} onChange={set('codePostal')} placeholder="75001" className={FIELD} />
                </div>
                <div className="col-span-1">
                  <label className={LABEL}>Ville *</label>
                  <input type="text" required value={form.ville} onChange={set('ville')} placeholder="Paris" className={FIELD} />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className={LABEL}>Type de bâtiment</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'Maison individuelle', icon: Home, label: 'Maison' },
                    { value: 'Immeuble', icon: Building2, label: 'Immeuble' },
                    { value: 'Entreprise', icon: Building2, label: 'Entreprise' },
                    { value: 'Exploitation agricole', icon: Tractor, label: 'Agricole' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, typeBatiment: opt.value as TypeBatiment }))}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${form.typeBatiment === opt.value ? 'border-sky-400 bg-blue-50 text-sky-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      <opt.icon size={18} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={LABEL}>Orientation de la toiture</label>
                <select value={form.orientation} onChange={set('orientation')} className={FIELD}>
                  {(['Sud', 'Sud-Est', 'Sud-Ouest', 'Est', 'Ouest'] as OrientationType[]).map(o => (
                    <option key={o} value={o}>{o} {o === 'Sud' ? '(optimal)' : o.includes('Sud') ? '(très bon)' : '(correct)'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Surface de toiture disponible (m²)</label>
                <input type="number" min="10" max="500" value={form.surface} onChange={set('surface')} placeholder="Ex: 40" className={FIELD} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 cursor-pointer" onClick={() => setForm(p => ({ ...p, ombrage: !p.ombrage }))}>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Présence d&apos;ombrage</p>
                  <p className="text-xs text-slate-400 mt-0.5">Arbre, cheminée, immeuble voisin...</p>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${form.ombrage ? 'bg-sky-400' : 'bg-slate-200'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.ombrage ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                </div>
              </div>
              {form.ombrage && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 text-xs text-sky-700">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  L&apos;ombrage réduit la production estimée de ~12%
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className={LABEL}>Puissance souhaitée</label>
                <div className="grid grid-cols-4 gap-2 mb-1">
                  {[3, 6, 9, 12].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, puissanceKwc: p }))}
                      className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${form.puissanceKwc === p ? 'border-sky-400 bg-blue-50 text-sky-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      {p} kWc
                    </button>
                  ))}
                </div>
                <input type="range" min="1" max="20" value={form.puissanceKwc} onChange={e => setForm(p => ({ ...p, puissanceKwc: parseInt(e.target.value) }))} className="w-full accent-sky-500 mt-2" />
                <div className="flex justify-between text-xs text-slate-400 mt-0.5"><span>1 kWc</span><span className="font-bold text-sky-600">{form.puissanceKwc} kWc sélectionné</span><span>20 kWc</span></div>
              </div>

              <div>
                <label className={LABEL}>Type de panneaux</label>
                <div className="space-y-2">
                  {(Object.entries(PANNEAUX) as [PanneauType, typeof PANNEAUX['monocristallin']][]).map(([key, p]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, typePanneau: key }))}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${form.typePanneau === key ? 'border-sky-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{p.icon}</span>
                          <div>
                            <p className={`font-bold text-sm ${form.typePanneau === key ? 'text-sky-800' : 'text-slate-800'}`}>{p.label}</p>
                            <p className="text-xs text-slate-500">{p.avantage}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-500">Rendement</p>
                          <p className="font-bold text-sm" style={{ color: p.couleur }}>{p.rendement}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setForm(p => ({ ...p, batterie: !p.batterie }))}>
                  <div className="flex items-center gap-3">
                    <Battery size={18} className="text-indigo-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Batterie de stockage</p>
                      <p className="text-xs text-slate-400">Stocker le surplus pour la nuit</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors relative ${form.batterie ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.batterie ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
                {form.batterie && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <label className={LABEL}>Capacité batterie</label>
                    <select value={form.capaciteBatterie} onChange={e => setForm(p => ({ ...p, capaciteBatterie: parseInt(e.target.value) }))} className={FIELD}>
                      <option value={5}>5 kWh (~{formatEur(5 * 1200)})</option>
                      <option value={10}>10 kWh (~{formatEur(10 * 1200)})</option>
                      <option value={15}>15 kWh (~{formatEur(15 * 1200)})</option>
                      <option value={20}>20 kWh (~{formatEur(20 * 1200)})</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Live preview */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200">
                <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide mb-2">Aperçu de votre devis</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs">Production estimée</p>
                    <p className="font-bold text-slate-900">{quote.productionAnnuelle.toLocaleString('fr-FR')} kWh/an</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Économies annuelles</p>
                    <p className="font-bold text-emerald-700">{formatEur(quote.economiesAnnuelles)}/an</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Coût estimé</p>
                    <p className="font-bold text-slate-900">{formatEur(quote.coutFinal)} *</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Amortissement</p>
                    <p className="font-bold text-slate-900">{quote.amortissement} ans</p>
                  </div>
                </div>
                <p className="text-xs text-sky-600 mt-2">* après aides MaPrimeRénov&apos; + CEE estimées</p>
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="px-8 pb-6 flex items-center justify-between gap-3">
          {(step as number) > 1 ? (
            <button type="button" onClick={() => setStep(prev => (prev as number) - 1 as Step)} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition px-4 py-2.5 rounded-xl border border-slate-200">
              <ChevronLeft size={16} /> Retour
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={handleNext}
            disabled={!canNext() || sending}
            className="flex items-center gap-2 py-3 px-6 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none justify-center"
            style={{ background: 'linear-gradient(135deg, #22D3EE, #06B6D4)' }}
          >
            {sending ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Calcul...</>
              : step === 3 ? <><Sun size={16} /> Voir mon devis instantané</>
              : <>Continuer <ChevronRight size={16} /></>}
          </button>
        </div>

        <div className="px-8 pb-5 text-center">
          <p className="text-xs text-slate-300">Propulsé par <span className="text-sky-400 font-semibold">VoltPilot</span></p>
        </div>
      </div>
    </div>
  )
}
