'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sun, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nom }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Une erreur est survenue.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0614' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' }}>
            <Sun size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl">VoltPilot</span>
        </div>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
            ✨ 14 jours gratuits — sans CB
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Rejoignez VoltPilot</h2>
          <p className="text-indigo-300 text-lg leading-relaxed mb-8">
            Des centaines d&apos;installateurs solaires font confiance à VoltPilot pour gérer leur activité.
          </p>
          <div className="space-y-3">
            {[
              'Accès immédiat — aucune confirmation email',
              'Catalogue 17 produits solaires inclus',
              'CRM clients avec historique complet',
              'Dashboard analytics avancé',
              'Export PDF avec votre logo',
              'Support client dédié',
            ].map(f => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-indigo-200">
                <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" /> {f}
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <p className="text-indigo-200 text-sm italic">&quot;VoltPilot m&apos;a fait gagner 5h par semaine sur mes devis. Je peux me concentrer sur mes chantiers.&quot;</p>
          <p className="text-indigo-400 text-xs mt-2">— Marc D., installateur solaire à Lyon</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-black text-white mb-2">Créez votre compte</h1>
          <p className="text-slate-400 mb-8">14 jours gratuits · Accès immédiat</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
              <AlertCircle size={15} className="flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Nom de l&apos;entreprise</label>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="SolarPro SARL"
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-slate-500 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email professionnel</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="contact@solarpro.fr"
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-slate-500 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••  (min. 6 caractères)"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-slate-500 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Création du compte…</>
                : 'Démarrer mon essai gratuit →'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
