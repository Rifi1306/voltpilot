'use client'
import { useState } from 'react'
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import type { PlanKey } from '@/lib/stripe'

const PLANS = [
  {
    name: 'Starter',
    monthly: 49,
    annual: 39,
    annualTotal: 468,
    desc: 'Pour les artisans solo',
    features: ['30 devis / mois', '20 clients', 'Export PDF', 'Catalogue solaire 17 produits', 'Support email'],
    popular: false,
    cta: 'Choisir Starter',
    monthlyKey: 'starter_monthly' as PlanKey,
    annualKey: 'starter_annual' as PlanKey,
  },
  {
    name: 'Pro',
    monthly: 119,
    annual: 99,
    annualTotal: 1188,
    desc: 'Pour les entreprises',
    features: ['Devis illimités', 'Clients illimités', 'PDF avec votre logo & couleurs', 'Analytics avancés + objectifs', 'Support prioritaire 7j/7', 'Nouvelles fonctionnalités en avant-première'],
    popular: true,
    cta: 'Démarrer avec Pro',
    monthlyKey: 'pro_monthly' as PlanKey,
    annualKey: 'pro_annual' as PlanKey,
  },
]

export function PricingSection() {
  const [annual, setAnnual] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckout(planKey: PlanKey) {
    setLoading(planKey)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Erreur lors de la redirection vers le paiement.')
      }
    } catch {
      alert('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <section className="max-w-5xl mx-auto px-8 py-20">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="font-black text-white mb-3" style={{ fontSize: '38px', letterSpacing: '-0.03em' }}>
          Tarifs transparents
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginBottom: '28px' }}>
          Aucun frais caché. Annulez à tout moment.
        </p>

        {/* Toggle mensuel / annuel */}
        <div className="inline-flex items-center gap-3 p-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setAnnual(false)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: !annual ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: !annual ? '#ffffff' : 'rgba(255,255,255,0.4)',
            }}
          >
            Mensuel
          </button>
          <button
            onClick={() => setAnnual(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: annual ? 'rgba(34,211,238,0.15)' : 'transparent',
              color: annual ? '#22D3EE' : 'rgba(255,255,255,0.4)',
            }}
          >
            Annuel
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: annual ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.08)',
                color: annual ? '#22D3EE' : 'rgba(255,255,255,0.3)',
              }}
            >
              −17%
            </span>
          </button>
        </div>

        {annual && (
          <p className="mt-3 text-sm font-medium" style={{ color: '#10b981' }}>
            ✓ 2 mois offerts avec l&apos;abonnement annuel
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
        {PLANS.map(plan => {
          const price = annual ? plan.annual : plan.monthly
          const planKey = annual ? plan.annualKey : plan.monthlyKey
          const isLoading = loading === planKey

          return (
            <div
              key={plan.name}
              className="p-7 rounded-2xl relative"
              style={{
                background: plan.popular
                  ? 'linear-gradient(135deg, rgba(34,211,238,0.07), rgba(45,212,191,0.03))'
                  : 'rgba(255,255,255,0.03)',
                border: plan.popular
                  ? '1px solid rgba(34,211,238,0.35)'
                  : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #22D3EE, #06B6D4)', color: '#0A0E1A' }}
                >
                  Recommandé
                </div>
              )}

              <p className="text-white font-bold text-lg mb-0.5">{plan.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginBottom: '20px' }}>
                {plan.desc}
              </p>

              {/* Prix */}
              <div className="mb-1">
                <div className="flex items-baseline gap-1">
                  <span
                    className="font-black text-white transition-all"
                    style={{ fontSize: '46px', letterSpacing: '-0.04em', lineHeight: 1 }}
                  >
                    {price}€
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>/mois</span>
                </div>
                {annual && (
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12.5px', marginTop: '4px' }}>
                    Soit{' '}
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                      {plan.annualTotal}€ facturé annuellement
                    </span>
                    {' '}
                    <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.2)' }}>
                      {plan.monthly * 12}€
                    </span>
                  </p>
                )}
              </div>

              {annual && (
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg mt-3 mb-5 text-xs font-bold"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                >
                  ✓ Économie de {(plan.monthly - plan.annual) * 12}€ / an
                </div>
              )}

              {!annual && <div className="mb-5" />}

              <ul className="space-y-2.5 mb-7">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2" style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.6)' }}>
                    <CheckCircle size={14} style={{ color: '#22D3EE', flexShrink: 0, marginTop: '2px' }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(planKey)}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 w-full rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  padding: '12px',
                  fontSize: '14px',
                  ...(plan.popular
                    ? {
                        background: 'linear-gradient(135deg, #22D3EE, #06B6D4)',
                        color: '#0A0E1A',
                        boxShadow: '0 4px 18px rgba(34,211,238,0.35)',
                      }
                    : {
                        background: 'rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.7)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }),
                }}
              >
                {isLoading ? (
                  <><Loader2 size={15} className="animate-spin" /> Redirection…</>
                ) : (
                  <>{plan.cta} <ArrowRight size={15} /></>
                )}
              </button>

              <p
                className="text-center mt-3"
                style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.2)' }}
              >
                14 jours gratuits · Sans carte bancaire
              </p>
            </div>
          )
        })}
      </div>

      {/* Comparatif valeur */}
      <div className="mt-10 text-center">
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>
          Un seul devis accepté grâce à VoltPilot = 15 000€+ pour votre entreprise.
          <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: '600' }}> L&apos;abonnement se rentabilise en quelques heures.</span>
        </p>
      </div>
    </section>
  )
}
