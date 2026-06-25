'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sun, AlertTriangle, XCircle, Loader2, ArrowRight, CheckCircle } from 'lucide-react'
import { Suspense } from 'react'
import type { PlanKey } from '@/lib/stripe'

const PLANS = [
  {
    name: 'Starter',
    price: 49,
    priceAnnual: 39,
    monthlyKey: 'starter_monthly' as PlanKey,
    annualKey: 'starter_annual' as PlanKey,
    features: ['30 devis / mois', '20 clients', 'Export PDF', 'Support email'],
  },
  {
    name: 'Pro',
    price: 119,
    priceAnnual: 99,
    monthlyKey: 'pro_monthly' as PlanKey,
    annualKey: 'pro_annual' as PlanKey,
    popular: true,
    features: ['Devis illimités', 'Clients illimités', 'Analytics avancés', 'Support 7j/7'],
  },
]

function BillingContent() {
  const params = useSearchParams()
  const status = params.get('status') ?? 'cancelled'
  const [annual, setAnnual] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)

  const isPastDue = status === 'past_due'
  const isCancelled = status === 'cancelled' || status === 'free'

  async function handleCheckout(planKey: PlanKey) {
    setLoading(planKey)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: '#060912' }}>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22D3EE, #06B6D4)' }}>
          <Sun size={18} className="text-white" />
        </div>
        <span className="font-black text-white text-xl" style={{ letterSpacing: '-0.03em' }}>VoltPilot</span>
      </Link>

      {/* Bannière statut */}
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-2xl mb-8 max-w-lg w-full"
        style={{
          background: isPastDue ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
          border: isPastDue ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(239,68,68,0.25)',
        }}
      >
        {isPastDue
          ? <AlertTriangle size={20} style={{ color: '#22D3EE', flexShrink: 0 }} />
          : <XCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
        }
        <div>
          <p className="font-bold text-sm" style={{ color: isPastDue ? '#22D3EE' : '#f87171' }}>
            {isPastDue ? 'Paiement en échec' : 'Abonnement inactif'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
            {isPastDue
              ? 'Votre dernier paiement a échoué. Choisissez un plan pour continuer.'
              : 'Votre accès a été suspendu. Réactivez votre abonnement pour retrouver vos données.'}
          </p>
        </div>
      </div>

      <h1 className="font-black text-white text-center mb-2" style={{ fontSize: '28px', letterSpacing: '-0.03em' }}>
        Choisissez votre plan
      </h1>

      {/* Toggle */}
      <div className="inline-flex items-center gap-3 p-1.5 rounded-xl mb-8" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => setAnnual(false)}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ background: !annual ? 'rgba(255,255,255,0.1)' : 'transparent', color: !annual ? '#fff' : 'rgba(255,255,255,0.4)' }}
        >
          Mensuel
        </button>
        <button
          onClick={() => setAnnual(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ background: annual ? 'rgba(34,211,238,0.15)' : 'transparent', color: annual ? '#22D3EE' : 'rgba(255,255,255,0.4)' }}
        >
          Annuel <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(34,211,238,0.2)', color: '#22D3EE' }}>−17%</span>
        </button>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-4 max-w-2xl w-full">
        {PLANS.map(plan => {
          const price = annual ? plan.priceAnnual : plan.price
          const planKey = annual ? plan.annualKey : plan.monthlyKey
          const isLoading = loading === planKey

          return (
            <div
              key={plan.name}
              className="p-6 rounded-2xl relative"
              style={{
                background: plan.popular ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(249,115,22,0.05))' : 'rgba(255,255,255,0.03)',
                border: plan.popular ? '1px solid rgba(34,211,238,0.35)' : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'linear-gradient(135deg, #22D3EE, #06B6D4)', color: '#0A0E1A' }}>
                  Recommandé
                </div>
              )}
              <p className="text-white font-bold text-lg mb-3">{plan.name}</p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-black text-white" style={{ fontSize: '40px', letterSpacing: '-0.04em', lineHeight: 1 }}>{price}€</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>/mois</span>
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    <CheckCircle size={13} style={{ color: '#22D3EE', flexShrink: 0 }} /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout(planKey)}
                disabled={!!loading}
                className="flex items-center justify-center gap-2 w-full rounded-xl font-bold transition-all disabled:opacity-60"
                style={{
                  padding: '11px',
                  fontSize: '14px',
                  ...(plan.popular
                    ? { background: 'linear-gradient(135deg, #22D3EE, #06B6D4)', color: '#0A0E1A', boxShadow: '0 4px 16px rgba(34,211,238,0.3)' }
                    : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }),
                }}
              >
                {isLoading ? <><Loader2 size={14} className="animate-spin" /> Redirection…</> : <>Activer {plan.name} <ArrowRight size={14} /></>}
              </button>
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-center" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
        Vos données sont conservées · Annulation à tout moment
      </p>

      <button
        onClick={async () => {
          const { createClient } = await import('@/lib/supabase/client')
          await createClient().auth.signOut()
          window.location.href = '/login'
        }}
        className="mt-4 text-xs transition-colors hover:text-white"
        style={{ color: 'rgba(255,255,255,0.2)' }}
      >
        Se déconnecter
      </button>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  )
}
