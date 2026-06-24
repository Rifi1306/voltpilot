'use client'
import { useState } from 'react'
import { Sun, CheckCircle2, Loader2, ChevronRight, ChevronLeft, Zap, Home, Euro, MapPin } from 'lucide-react'

type Props = {
  installerId: string
  companyNom: string
  couleur: string
  showPrice: boolean
}

type FormData = {
  // Étape 1 — Projet
  type_projet: string
  type_bien: string
  type_toiture: string
  surface: string
  // Étape 2 — Consommation
  facture_mensuelle: string
  objectif: string
  // Étape 3 — Localisation
  adresse: string
  code_postal: string
  ville: string
  // Étape 4 — Contact
  nom: string
  email: string
  telephone: string
  message: string
  consentement: boolean
}

type Estimation = {
  nb_panneaux: number
  puissance_kwc: number
  production_annuelle: number
  fourchette_min: number
  fourchette_max: number
}

const STEPS = ['Votre projet', 'Consommation', 'Localisation', 'Contact']

export function WidgetForm({ installerId, companyNom, couleur, showPrice }: Props) {
  const [step, setStep] = useState(0)
  const [sending, setSending] = useState(false)
  const [estimation, setEstimation] = useState<Estimation | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [form, setForm] = useState<FormData>({
    type_projet: 'Résidentiel',
    type_bien: 'Maison individuelle',
    type_toiture: 'Tuiles',
    surface: '',
    facture_mensuelle: '',
    objectif: 'Réduire ma facture',
    adresse: '',
    code_postal: '',
    ville: '',
    nom: '',
    email: '',
    telephone: '',
    message: '',
    consentement: false,
  })

  const set = (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  const setCheck = (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.checked }))

  const inputClass = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 outline-none transition focus:border-[var(--w-color)] focus:shadow-[0_0_0_3px_var(--w-color-light)]'

  const canNext = () => {
    if (step === 0) return form.type_projet !== ''
    if (step === 2) return form.code_postal.length >= 5
    if (step === 3) return form.nom.trim() !== '' && form.email.includes('@') && form.consentement
    return true
  }

  const handleSubmit = async () => {
    if (!canNext()) return
    setSending(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installer_id: installerId,
          nom: form.nom,
          email: form.email,
          telephone: form.telephone,
          code_postal: form.code_postal,
          ville: form.ville,
          type_projet: form.type_projet,
          message: form.message,
          surface: form.surface ? parseFloat(form.surface) : null,
          facture_mensuelle: form.facture_mensuelle ? parseFloat(form.facture_mensuelle) : null,
          objectif: form.objectif,
          type_bien: form.type_bien,
          type_toiture: form.type_toiture,
          adresse: form.adresse,
          consentement: form.consentement,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEstimation(data.estimation ?? null)
        setStep(4) // success
      } else {
        setSubmitError(data.error ?? 'Erreur inconnue')
      }
    } catch {
      setSubmitError('Erreur réseau, veuillez réessayer.')
    }
    setSending(false)
  }

  // ── Success screen ──────────────────────────────────────────
  if (step === 4) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
        <div className="px-6 py-5 text-white text-center" style={{ background: couleur }}>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 size={22} className="text-white" />
          </div>
          <h1 className="text-lg font-bold">Demande envoyée !</h1>
          <p className="text-sm opacity-80 mt-0.5">Votre estimation personnalisée</p>
        </div>

        <div className="p-5 max-w-lg mx-auto w-full space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Merci <strong>{form.nom}</strong> ! <strong>{companyNom}</strong> vous contactera sous 24 à 48h pour affiner votre projet.
            </p>

            {estimation && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Votre estimation solaire</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold" style={{ color: couleur }}>{estimation.nb_panneaux}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Panneaux</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold" style={{ color: couleur }}>{estimation.puissance_kwc} kWc</div>
                    <div className="text-xs text-slate-500 mt-0.5">Puissance</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold" style={{ color: couleur }}>{(estimation.production_annuelle / 1000).toFixed(1)} MWh</div>
                    <div className="text-xs text-slate-500 mt-0.5">Production/an</div>
                  </div>
                </div>

                {showPrice && (
                  <div className="rounded-xl p-4 text-center border-2" style={{ borderColor: couleur + '44', background: couleur + '08' }}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Fourchette de prix estimée</p>
                    <p className="text-2xl font-bold" style={{ color: couleur }}>
                      {estimation.fourchette_min.toLocaleString('fr-FR')} — {estimation.fourchette_max.toLocaleString('fr-FR')} €
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Prix TTC indicatif · Devis précis sur rendez-vous</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Progress bar ────────────────────────────────────────────
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc', '--w-color': couleur, '--w-color-light': couleur + '22' } as React.CSSProperties}>
      {/* Header */}
      <div className="px-6 py-5 text-white" style={{ background: couleur }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Sun size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">{companyNom}</h1>
            <p className="text-xs opacity-75">Devis solaire gratuit</p>
          </div>
        </div>
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs opacity-75">
            <span>Étape {step + 1} sur {STEPS.length}</span>
            <span>{STEPS[step]}</span>
          </div>
          <div className="h-1.5 bg-white/25 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 p-5 max-w-lg mx-auto w-full">
        {/* Étape 0 — Votre projet */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5"><Home size={13} /> Type de projet</label>
              <select value={form.type_projet} onChange={set('type_projet')} className={inputClass}>
                <option>Résidentiel</option>
                <option>Professionnel / PME</option>
                <option>Agricole</option>
                <option>Collectivité</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type de bien</label>
              <select value={form.type_bien} onChange={set('type_bien')} className={inputClass}>
                <option>Maison individuelle</option>
                <option>Maison en copropriété</option>
                <option>Bâtiment professionnel</option>
                <option>Hangar / entrepôt</option>
                <option>Exploitation agricole</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type de toiture</label>
              <select value={form.type_toiture} onChange={set('type_toiture')} className={inputClass}>
                <option>Tuiles</option>
                <option>Ardoises</option>
                <option>Toit plat / terrasse</option>
                <option>Bac acier</option>
                <option>Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Surface de toiture disponible (m²) <span className="text-slate-400 font-normal">— optionnel</span>
              </label>
              <input
                type="number"
                min="5"
                max="5000"
                value={form.surface}
                onChange={set('surface')}
                placeholder="ex : 30"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Étape 1 — Consommation */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5"><Euro size={13} /> Facture d&apos;électricité mensuelle moyenne (€)</label>
              <input
                type="number"
                min="20"
                max="5000"
                value={form.facture_mensuelle}
                onChange={set('facture_mensuelle')}
                placeholder="ex : 120"
                className={inputClass}
              />
              <p className="text-xs text-slate-400 mt-1">Aide à calibrer la puissance recommandée</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Objectif principal</label>
              <select value={form.objectif} onChange={set('objectif')} className={inputClass}>
                <option>Réduire ma facture</option>
                <option>Produire et revendre</option>
                <option>Autoconsommation totale</option>
                <option>Valoriser mon bien</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Message ou informations complémentaires <span className="text-slate-400 font-normal">— optionnel</span></label>
              <textarea
                value={form.message}
                onChange={set('message')}
                placeholder="Questions, contraintes particulières…"
                rows={3}
                className={inputClass + ' resize-none'}
              />
            </div>
          </div>
        )}

        {/* Étape 2 — Localisation */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5"><MapPin size={13} /> Adresse <span className="text-slate-400 font-normal">— optionnel</span></label>
              <input type="text" value={form.adresse} onChange={set('adresse')} placeholder="12 Rue du Soleil" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Code postal *</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={form.code_postal}
                  onChange={set('code_postal')}
                  placeholder="33000"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ville</label>
                <input type="text" value={form.ville} onChange={set('ville')} placeholder="Bordeaux" className={inputClass} />
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5">
              <Zap size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">Le code postal nous permet de calculer l&apos;ensoleillement réel de votre région et d&apos;affiner l&apos;estimation de production.</p>
            </div>
          </div>
        )}

        {/* Étape 3 — Contact */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nom complet *</label>
              <input required type="text" value={form.nom} onChange={set('nom')} placeholder="Jean Dupont" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email *</label>
                <input required type="email" value={form.email} onChange={set('email')} placeholder="jean@email.fr" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Téléphone</label>
                <input type="tel" value={form.telephone} onChange={set('telephone')} placeholder="06 XX XX XX XX" className={inputClass} />
              </div>
            </div>

            {/* RGPD */}
            <label className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors" style={{ borderColor: form.consentement ? couleur + '66' : '#e2e8f0', background: form.consentement ? couleur + '08' : '#fafafa' }}>
              <input
                type="checkbox"
                checked={form.consentement}
                onChange={setCheck('consentement')}
                className="mt-0.5 flex-shrink-0 accent-[var(--w-color)]"
                style={{ accentColor: couleur }}
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                J&apos;accepte que mes données soient transmises à <strong>{companyNom}</strong> pour traiter ma demande de devis. Ces données ne seront pas utilisées à d&apos;autres fins ni partagées avec des tiers. <span className="text-slate-400">(Requis *)</span>
              </span>
            </label>

            {submitError && (
              <p className="text-center text-sm text-red-500 bg-red-50 rounded-xl p-3">{submitError}</p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={15} /> Retour
            </button>
          )}
          <button
            type="button"
            disabled={!canNext() || sending}
            onClick={() => {
              if (step < 3) setStep(s => s + 1)
              else handleSubmit()
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: canNext() && !sending ? couleur : '#94a3b8' }}
          >
            {sending ? (
              <><Loader2 size={16} className="animate-spin" /> Calcul en cours…</>
            ) : step === 3 ? (
              <>Obtenir mon estimation <Zap size={15} /></>
            ) : (
              <>Suivant <ChevronRight size={15} /></>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Gratuit · Sans engagement · Vos données restent confidentielles
        </p>
      </div>
    </div>
  )
}
