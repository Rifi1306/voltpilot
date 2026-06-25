'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'

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
    <div className="min-h-screen flex" style={{ background: '#0A1628' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ background: 'linear-gradient(150deg, #0F2040 0%, #0A1628 100%)', borderRight: '1px solid #1A3560' }}>
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="VoltPilot" width={40} height={40} />
          <span className="font-black text-xl tracking-tight">
            <span style={{ color: '#F5A623' }}>Volt</span><span className="text-white">Pilot</span>
          </span>
        </div>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold" style={{ background: 'rgba(245,166,35,0.12)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.25)' }}>
            ✨ 14 jours gratuits — sans CB
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Rejoignez VoltPilot</h2>
          <p className="text-lg leading-relaxed mb-8" style={{ color: '#4A6080' }}>
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
              <div key={f} className="flex items-center gap-2.5 text-sm" style={{ color: '#7A90A8' }}>
                <CheckCircle size={14} style={{ color: '#F5A623' }} className="flex-shrink-0" /> {f}
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.12)' }}>
          <p className="text-sm italic" style={{ color: '#7A90A8' }}>&quot;VoltPilot m&apos;a fait gagner 5h par semaine sur mes devis. Je peux me concentrer sur mes chantiers.&quot;</p>
          <p className="text-xs mt-2" style={{ color: '#4A6080' }}>— Marc D., installateur solaire à Lyon</p>
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
              style={{ background: 'linear-gradient(135deg, #F5A623, #f97316)' }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Création du compte…</>
                : 'Démarrer mon essai gratuit →'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" style={{ color: '#F5A623' }} className="font-semibold hover:opacity-80">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
