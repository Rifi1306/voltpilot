'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sun, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect.')
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
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            La solution devis<br />des pros du solaire
          </h2>
          <p className="text-indigo-300 text-lg leading-relaxed">
            Créez des devis professionnels en 2 minutes. Gérez vos clients. Suivez votre CA.
          </p>
          <div className="mt-8 space-y-3">
            {[
              '✓ Catalogue produits solaires intégré',
              '✓ Calcul automatique TVA & remises',
              '✓ Export PDF professionnel',
              '✓ Tableau de bord analytiques',
            ].map(f => (
              <p key={f} className="text-indigo-200 text-sm">{f}</p>
            ))}
          </div>
        </div>
        <p className="text-indigo-400 text-sm">© {new Date().getFullYear()} VoltPilot · Tous droits réservés</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' }}>
              <Sun size={16} className="text-white" />
            </div>
            <span className="text-white font-bold">VoltPilot</span>
          </div>

          <h1 className="text-3xl font-black text-white mb-2">Bon retour 👋</h1>
          <p className="text-slate-400 mb-8">Connectez-vous à votre espace VoltPilot</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="contact@monentreprise.fr"
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
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-slate-500 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
              />
            </div>
            <div className="flex items-center justify-end text-sm">
              <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">Mot de passe oublié ?</a>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Connexion…</> : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Créer un compte gratuit
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
