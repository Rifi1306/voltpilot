import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

type StripeEvent = { type: string; data: { object: Record<string, unknown> } }

function planFromKey(planKey: string): string {
  return planKey.startsWith('pro') ? 'pro' : 'starter'
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: StripeEvent
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!) as unknown as StripeEvent
  } catch (err) {
    console.error('Webhook signature invalide:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const obj = event.data.object

  switch (event.type) {

    case 'checkout.session.completed': {
      const email = obj.customer_email as string | null
      const customerId = obj.customer as string
      const subscriptionId = obj.subscription as string
      const planKey = ((obj.metadata as Record<string, string>)?.planKey ?? 'pro_monthly')

      if (email) {
        await supabase.from('profiles').update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan: planFromKey(planKey),
          subscription_status: 'active',
        }).eq('email', email)
        console.log('✓ Compte activé:', email, '→', planFromKey(planKey))
      }
      break
    }

    case 'invoice.paid': {
      const customerId = obj.customer as string
      const lines = obj.lines as { data: { period?: { end?: number } }[] }
      const periodEnd = lines?.data?.[0]?.period?.end

      await supabase.from('profiles').update({
        subscription_status: 'active',
        subscription_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      }).eq('stripe_customer_id', customerId)
      console.log('✓ Abonnement renouvelé:', customerId)
      break
    }

    case 'invoice.payment_failed': {
      const customerId = obj.customer as string

      await supabase.from('profiles').update({
        subscription_status: 'past_due',
      }).eq('stripe_customer_id', customerId)
      console.log('⚠ Paiement échoué:', customerId)
      break
    }

    case 'customer.subscription.updated': {
      const customerId = obj.customer as string
      const status = obj.status as string
      const periodEnd = (obj.current_period_end ?? obj.billing_cycle_anchor) as number | null

      await supabase.from('profiles').update({
        subscription_status: status,
        subscription_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      }).eq('stripe_customer_id', customerId)
      console.log('✓ Abonnement mis à jour:', customerId, '→', status)
      break
    }

    case 'customer.subscription.deleted': {
      const customerId = obj.customer as string

      await supabase.from('profiles').update({
        plan: 'free',
        subscription_status: 'cancelled',
        stripe_subscription_id: null,
        subscription_period_end: null,
      }).eq('stripe_customer_id', customerId)
      console.log('✓ Abonnement annulé:', customerId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
