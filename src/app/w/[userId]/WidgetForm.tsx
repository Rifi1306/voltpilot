'use client'
import { useState } from 'react'
import { Sun, CheckCircle2, Loader2 } from 'lucide-react'

type Props = {
  installerId: string
  companyNom: string
  couleur: string
}

export function WidgetForm({ installerId, companyNom, couleur }: Props) {
  const [step, setStep] = useState<'form' | 'sending' | 'success' | 'error'>('form')
  const [form, setForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    code_postal: '',
    ville: '',
    type_projet: 'Résidentiel',
    message: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep('sending')
    try {
      const res = await fetch('/api/widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, installer_id: installerId }),
      })
      const data = await res.json()
      setStep(data.success ? 'success' : 'error')
    } catch {
      setStep('error')
    }
  }

  const inputClass = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 outline-none transition focus:border-[var(--color)] focus:shadow-[0_0_0_3px_var(--color-light)]'

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f8fafc' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: couleur }}>
            <CheckCircle2 size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Demande envoyée !</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Merci <strong>{form.nom}</strong>, votre demande a bien été reçue par <strong>{companyNom}</strong>.<br />
            Nous vous contacterons sous 24 à 48h.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc', '--color': couleur, '--color-light': couleur + '22' } as React.CSSProperties}>
      {/* Header */}
      <div className="px-6 py-5 text-white text-center" style={{ background: couleur }}>
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-2">
          <Sun size={20} className="text-white" />
        </div>
        <h1 className="text-lg font-bold">{companyNom}</h1>
        <p className="text-sm opacity-80 mt-0.5">Demande de devis solaire gratuit</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nom complet *</label>
            <input required type="text" value={form.nom} onChange={set('nom')} placeholder="Jean Dupont" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email *</label>
            <input required type="email" value={form.email} onChange={set('email')} placeholder="jean@email.fr" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Téléphone</label>
            <input type="tel" value={form.telephone} onChange={set('telephone')} placeholder="06 XX XX XX XX" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Code postal</label>
            <input type="text" value={form.code_postal} onChange={set('code_postal')} placeholder="33000" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ville</label>
            <input type="text" value={form.ville} onChange={set('ville')} placeholder="Bordeaux" className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type de projet</label>
            <select value={form.type_projet} onChange={set('type_projet')} className={inputClass}>
              <option>Résidentiel</option>
              <option>Professionnel / PME</option>
              <option>Agricole</option>
              <option>Collectivité</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Message (optionnel)</label>
            <textarea
              value={form.message}
              onChange={set('message')}
              placeholder="Surface de toit disponible, consommation annuelle, questions…"
              rows={3}
              className={inputClass + ' resize-none'}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={step === 'sending'}
          className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ background: step === 'sending' ? '#94a3b8' : couleur }}
        >
          {step === 'sending' ? (
            <><Loader2 size={16} className="animate-spin" /> Envoi en cours…</>
          ) : (
            'Envoyer ma demande de devis'
          )}
        </button>

        {step === 'error' && (
          <p className="text-center text-sm text-red-500">Une erreur est survenue. Réessayez.</p>
        )}

        <p className="text-center text-xs text-slate-400">
          Vos données sont utilisées uniquement pour répondre à votre demande.
        </p>
      </form>
    </div>
  )
}
