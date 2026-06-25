'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
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
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            La solution devis<br />des pros du solaire
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: '#4A6080' }}>
            Créez des devis professionnels en 2 minutes. Gérez vos clients. Suivez votre CA.
          </p>
          <div className="mt-8 space-y-3">
            {[
              '✓ Catalogue produits solaires intégré',
              '✓ Calcul automatique TVA & remises',
              '✓ Export PDF professionnel',
              '✓ Tableau de bord analytiques',
            ].map(f => (
              <p key={f} className="text-sm" style={{ color: '#7A90A8' }}>{f}</p>
            ))}
          </div>
        </div>
        <p className="text-sm" style={{ color: '#1A3560' }}>© {new Date().getFullYear()} VoltPilot · Tous droits réservés</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/logo.svg" alt="VoltPilot" width={32} height={32} />
            <span className="font-black tracking-tight">
              <span style={{ color: '#F5A623' }}>Volt</span><span className="text-white">Pilot</span>
            </span>
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
              {/* TODO: implémenter reset mot de passe — pour l'instant redirige vers le support */}
              <a href="mailto:contact@voltpilot.fr?subject=Réinitialisation mot de passe" style={{ color: '#F5A623' }} className="hover:opacity-80 transition-opacity font-medium">Mot de passe oublié ?</a>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #F5A623, #f97316)' }}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Connexion…</> : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Pas encore de compte ?{' '}
            <Link href="/register" style={{ color: '#F5A623' }} className="font-semibold transition-colors hover:opacity-80">
              Créer un compte gratuit
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
