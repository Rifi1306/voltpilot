'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      setError('Impossible d\'envoyer l\'email. Vérifiez l\'adresse saisie.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0A1628' }}>
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-80"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <ArrowLeft size={14} /> Retour à la connexion
        </Link>

        <h1 className="text-3xl font-black text-white mb-2">Mot de passe oublié</h1>
        <p className="text-slate-400 mb-8">
          Saisissez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>

        {sent ? (
          <div
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-400 font-semibold text-sm">Email envoyé !</p>
              <p className="text-emerald-300/70 text-sm mt-1">
                Vérifiez votre boîte mail (et vos spams). Le lien est valable 1 heure.
              </p>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
              >
                <AlertCircle size={15} className="flex-shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff' }}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Envoi en cours…</>
                  : 'Envoyer le lien de réinitialisation'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
