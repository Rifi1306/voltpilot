import Stripe from 'stripe'

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-05-27.dahlia',
  })
}

export const PLANS = {
  starter_monthly: {
    priceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID ?? '',
    name: 'Starter Mensuel',
    amount: 4900,
  },
  starter_annual: {
    priceId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID ?? '',
    name: 'Starter Annuel',
    amount: 46800,
  },
  pro_monthly: {
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? '',
    name: 'Pro Mensuel',
    amount: 11900,
  },
  pro_annual: {
    priceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? '',
    name: 'Pro Annuel',
    amount: 118800,
  },
} as const

export type PlanKey = keyof typeof PLANS
