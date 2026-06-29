'use client'
import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { getProfile } from '@/lib/actions/profile'
import { Check, Zap, Star, Loader2 } from 'lucide-react'

type PlanKey = 'starter_monthly' | 'starter_annual' | 'pro_monthly' | 'pro_annual'

const STARTER_FEATURES = [
  '30 devis par mois',
  '20 clients maximum',
  'PDF personnalisé',
  'Widget intégrable',
  'Factures & catalogues',
  'Support par email',
]

const PRO_FEATURES = [
  'Devis illimités',
  'Clients illimités',
  'PDF personnalisé',
  'Widget intégrable',
  'Factures & catalogues',
  'Analytics avancés',
  'Support 7j/7 prioritaire',
  'Accès API',
]

export default function BillingPage() {
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState<PlanKey | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string>('starter')
  const [email, setEmail] = useState<string>('')

  useEffect(() => {
    getProfile().then(p => {
      if (p) {
        setCurrentPlan((p as Record<string, unknown>).plan as string ?? 'starter')
        setEmail((p as Record<string, unknown>).email as string ?? '')
      }
    }).catch(console.error)
  }, [])

  const handleCheckout = async (planKey: PlanKey) => {
    setLoading(planKey)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey, email }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error ?? 'Erreur lors du paiement')
    } finally {
      setLoading(null)
    }
  }

  const starterKey: PlanKey = annual ? 'starter_annual' : 'starter_monthly'
  const proKey: PlanKey = annual ? 'pro_annual' : 'pro_monthly'

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Choisir un plan" subtitle="Commencez gratuitement, passez en Pro quand vous êtes prêt" />

      <div className="p-6 max-w-4xl mx-auto space-y-8">

        {/* Toggle mensuel / annuel */}
        <div className="flex items-center justify-center gap-4">
          <span className="text-sm font-medium" style={{ color: annual ? 'var(--star)' : 'var(--nova)' }}>Mensuel</span>
          <button
            onClick={() => setAnnual(a => !a)}
            className="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
            style={{ background: annual ? 'var(--nebula)' : 'rgba(255,255,255,0.1)' }}
          >
            <span
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200"
              style={{ transform: annual ? 'translateX(26px)' : 'translateX(4px)' }}
            />
          </button>
          <span className="text-sm font-medium" style={{ color: annual ? 'var(--nova)' : 'var(--star)' }}>
            Annuel
            <span
              className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--nebula-bright)' }}
            >
              −20%
            </span>
          </span>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Starter */}
          <div
            className="volt-card p-6 flex flex-col"
            style={currentPlan === 'starter' ? { border: '1px solid rgba(124,58,237,0.4)' } : {}}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-dim)' }}>
                  <Star size={18} style={{ color: 'var(--star)' }} />
                </div>
                <span className="font-bold text-lg" style={{ color: 'var(--nova)' }}>Starter</span>
              </div>
              {currentPlan === 'starter' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--nebula-bright)' }}>
                  Plan actuel
                </span>
              )}
            </div>

            <div className="mb-5 mt-3">
              <span className="text-4xl font-bold" style={{ color: 'var(--nova)' }}>
                {annual ? '39' : '49'}€
              </span>
              <span className="text-sm ml-1" style={{ color: 'var(--star)' }}>/mois</span>
              {annual && <p className="text-xs mt-1" style={{ color: 'var(--star)' }}>Facturé 468€/an</p>}
            </div>

            <ul className="space-y-2.5 mb-6 flex-1">
              {STARTER_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--star)' }}>
                  <Check size={14} style={{ color: 'var(--nebula-bright)', flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout(starterKey)}
              disabled={loading !== null || currentPlan === 'pro'}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
              style={{
                background: currentPlan === 'starter' ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.2)',
                color: 'var(--nova)',
                border: '1px solid var(--border-dim)',
              }}
            >
              {loading === starterKey ? (
                <Loader2 size={15} className="animate-spin mx-auto" />
              ) : currentPlan === 'starter' ? 'Plan actuel' : 'Choisir Starter'}
            </button>
          </div>

          {/* Pro */}
          <div
            className="volt-card p-6 flex flex-col relative overflow-hidden"
            style={{ border: '1px solid rgba(124,58,237,0.5)', background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(99,102,241,0.06) 100%)' }}
          >
            {/* Badge recommandé */}
            <div
              className="absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl"
              style={{ background: 'linear-gradient(135deg, var(--nebula), var(--indigo))', color: '#fff' }}
            >
              Recommandé
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--nebula), var(--indigo))' }}>
                  <Zap size={18} className="text-white" />
                </div>
                <span className="font-bold text-lg" style={{ color: 'var(--nova)' }}>Pro</span>
              </div>
              {currentPlan === 'pro' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--nebula-bright)' }}>
                  Plan actuel
                </span>
              )}
            </div>

            <div className="mb-5 mt-3">
              <span className="text-4xl font-bold" style={{ color: 'var(--nova)' }}>
                {annual ? '99' : '119'}€
              </span>
              <span className="text-sm ml-1" style={{ color: 'var(--star)' }}>/mois</span>
              {annual && <p className="text-xs mt-1" style={{ color: 'var(--star)' }}>Facturé 1 188€/an</p>}
            </div>

            <ul className="space-y-2.5 mb-6 flex-1">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--star)' }}>
                  <Check size={14} style={{ color: 'var(--nebula-bright)', flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout(proKey)}
              disabled={loading !== null || currentPlan === 'pro'}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 text-white"
              style={{ background: currentPlan === 'pro' ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, var(--nebula), var(--indigo))' }}
            >
              {loading === proKey ? (
                <Loader2 size={15} className="animate-spin mx-auto" />
              ) : currentPlan === 'pro' ? 'Plan actuel' : 'Passer en Pro'}
            </button>
          </div>
        </div>

        {/* Garantie */}
        <p className="text-center text-xs" style={{ color: 'var(--star)' }}>
          Paiement sécurisé par Stripe · Annulable à tout moment · Sans engagement
        </p>
      </div>
    </div>
  )
}
