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
  type_projet: string
  type_bien: string
  type_toiture: string
  surface: string
  facture_mensuelle: string
  objectif: string
  adresse: string
  code_postal: string
  ville: string
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

  const inputClass = `
    w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition
    border border-white/10 bg-white/5 text-white placeholder-white/30
    focus:border-[var(--w-color)] focus:shadow-[0_0_0_3px_var(--w-color-faint)]
  `

  const labelClass = 'block text-xs font-semibold text-white/50 mb-1.5 flex items-center gap-1.5'

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
        setStep(4)
      } else {
        setSubmitError(data.error ?? 'Erreur inconnue')
      }
    } catch {
      setSubmitError('Erreur réseau, veuillez réessayer.')
    }
    setSending(false)
  }

  const cssVars = {
    '--w-color': couleur,
    '--w-color-faint': couleur + '22',
    '--w-color-dim': couleur + '33',
  } as React.CSSProperties

  // ── Success screen ──────────────────────────────────────────
  if (step === 4) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{
          ...cssVars,
          background: 'linear-gradient(160deg, #06091a 0%, #0a0f25 100%)',
        }}
      >
        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${couleur}18 0%, transparent 65%)`,
        }} />

        <div className="relative px-6 py-5 text-white text-center border-b border-white/06">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: couleur + '22', border: `1px solid ${couleur}44` }}
          >
            <CheckCircle2 size={24} style={{ color: couleur }} />
          </div>
          <h1 className="text-lg font-bold text-white">Demande envoyée !</h1>
          <p className="text-sm text-white/50 mt-0.5">Votre estimation personnalisée</p>
        </div>

        <div className="relative p-5 max-w-lg mx-auto w-full space-y-4">
          <div className="rounded-2xl border border-white/08 bg-white/04 backdrop-blur-sm p-5">
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              Merci <strong className="text-white">{form.nom}</strong> !{' '}
              <strong className="text-white">{companyNom}</strong> vous contactera sous 24 à 48h.
            </p>

            {estimation && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Estimation solaire</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: String(estimation.nb_panneaux), unit: 'Panneaux' },
                    { val: `${estimation.puissance_kwc} kWc`, unit: 'Puissance' },
                    { val: `${(estimation.production_annuelle / 1000).toFixed(1)} MWh`, unit: 'Production/an' },
                  ].map(({ val, unit }) => (
                    <div key={unit} className="rounded-xl p-3 text-center border border-white/08 bg-white/03">
                      <div className="text-lg font-bold" style={{ color: couleur }}>{val}</div>
                      <div className="text-xs text-white/40 mt-0.5">{unit}</div>
                    </div>
                  ))}
                </div>

                {showPrice && (
                  <div
                    className="rounded-xl p-4 text-center border"
                    style={{ borderColor: couleur + '33', background: couleur + '0a' }}
                  >
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-1">Fourchette de prix estimée</p>
                    <p className="text-2xl font-bold" style={{ color: couleur }}>
                      {estimation.fourchette_min.toLocaleString('fr-FR')} — {estimation.fourchette_max.toLocaleString('fr-FR')} €
                    </p>
                    <p className="text-xs text-white/30 mt-1">Prix TTC indicatif · Devis précis sur rendez-vous</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        ...cssVars,
        background: 'linear-gradient(160deg, #06091a 0%, #0a0f25 100%)',
      }}
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 70% 45% at 50% -5%, ${couleur}16 0%, transparent 60%)`,
      }} />

      {/* Header */}
      <div className="relative px-6 py-5 border-b border-white/06">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: couleur + '22', border: `1px solid ${couleur}44` }}
          >
            <Sun size={18} style={{ color: couleur }} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">{companyNom}</h1>
            <p className="text-xs text-white/40">Devis solaire gratuit</p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-white/40">
            <span>Étape {step + 1} sur {STEPS.length}</span>
            <span className="font-medium" style={{ color: couleur }}>{STEPS[step]}</span>
          </div>
          <div className="h-1 bg-white/08 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: couleur }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="relative flex-1 p-5 max-w-lg mx-auto w-full">

        {/* Étape 0 */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}><Home size={13} /> Type de projet</label>
              <select value={form.type_projet} onChange={set('type_projet')} className={inputClass}>
                <option>Résidentiel</option>
                <option>Professionnel / PME</option>
                <option>Agricole</option>
                <option>Collectivité</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Type de bien</label>
              <select value={form.type_bien} onChange={set('type_bien')} className={inputClass}>
                <option>Maison individuelle</option>
                <option>Maison en copropriété</option>
                <option>Bâtiment professionnel</option>
                <option>Hangar / entrepôt</option>
                <option>Exploitation agricole</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Type de toiture</label>
              <select value={form.type_toiture} onChange={set('type_toiture')} className={inputClass}>
                <option>Tuiles</option>
                <option>Ardoises</option>
                <option>Toit plat / terrasse</option>
                <option>Bac acier</option>
                <option>Autre</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Surface de toiture (m²) <span className="text-white/25 font-normal">— optionnel</span>
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

        {/* Étape 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}><Euro size={13} /> Facture mensuelle moyenne (€)</label>
              <input
                type="number"
                min="20"
                max="5000"
                value={form.facture_mensuelle}
                onChange={set('facture_mensuelle')}
                placeholder="ex : 120"
                className={inputClass}
              />
              <p className="text-xs text-white/30 mt-1">Aide à calibrer la puissance recommandée</p>
            </div>
            <div>
              <label className={labelClass}>Objectif principal</label>
              <select value={form.objectif} onChange={set('objectif')} className={inputClass}>
                <option>Réduire ma facture</option>
                <option>Produire et revendre</option>
                <option>Autoconsommation totale</option>
                <option>Valoriser mon bien</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Message <span className="text-white/25 font-normal">— optionnel</span>
              </label>
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

        {/* Étape 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                <MapPin size={13} /> Adresse <span className="text-white/25 font-normal">— optionnel</span>
              </label>
              <input type="text" value={form.adresse} onChange={set('adresse')} placeholder="12 Rue du Soleil" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Code postal *</label>
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
                <label className={labelClass}>Ville</label>
                <input type="text" value={form.ville} onChange={set('ville')} placeholder="Bordeaux" className={inputClass} />
              </div>
            </div>
            <div
              className="rounded-xl p-3 flex gap-2.5 border"
              style={{ background: couleur + '0d', borderColor: couleur + '33' }}
            >
              <Zap size={15} className="flex-shrink-0 mt-0.5" style={{ color: couleur }} />
              <p className="text-xs text-white/55 leading-relaxed">
                Le code postal nous permet de calculer l&apos;ensoleillement réel de votre région et d&apos;affiner l&apos;estimation de production.
              </p>
            </div>
          </div>
        )}

        {/* Étape 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Nom complet *</label>
              <input required type="text" value={form.nom} onChange={set('nom')} placeholder="Jean Dupont" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Email *</label>
                <input required type="email" value={form.email} onChange={set('email')} placeholder="jean@email.fr" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Téléphone</label>
                <input type="tel" value={form.telephone} onChange={set('telephone')} placeholder="06 XX XX XX XX" className={inputClass} />
              </div>
            </div>

            {/* RGPD */}
            <label
              className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all"
              style={{
                borderColor: form.consentement ? couleur + '55' : 'rgba(255,255,255,0.1)',
                background: form.consentement ? couleur + '0d' : 'rgba(255,255,255,0.03)',
              }}
            >
              <input
                type="checkbox"
                checked={form.consentement}
                onChange={setCheck('consentement')}
                className="mt-0.5 flex-shrink-0"
                style={{ accentColor: couleur }}
              />
              <span className="text-xs text-white/50 leading-relaxed">
                J&apos;accepte que mes données soient transmises à{' '}
                <strong className="text-white/75">{companyNom}</strong> pour traiter ma demande.
                Ces données ne seront pas partagées avec des tiers.{' '}
                <span className="text-white/30">(Requis *)</span>
              </span>
            </label>

            {submitError && (
              <p className="text-center text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                {submitError}
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 transition-all hover:text-white hover:bg-white/06"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
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
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
            style={{
              background: canNext() && !sending ? couleur : 'rgba(255,255,255,0.12)',
              boxShadow: canNext() && !sending ? `0 4px 20px ${couleur}44` : 'none',
            }}
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

        <p className="text-center text-xs text-white/25 mt-4">
          Gratuit · Sans engagement · Vos données restent confidentielles
        </p>
      </div>
    </div>
  )
}
