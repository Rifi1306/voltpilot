import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PLANS, PlanKey } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { planKey, email } = await req.json() as { planKey: PlanKey; email?: string }

    const plan = PLANS[planKey]
    if (!plan) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,
      locale: 'fr',
      subscription_data: {
        metadata: { planKey },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Erreur lors de la création du paiement' }, { status: 500 })
  }
}
