import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/supabase/types'

interface CheckResult { name: string; ok: boolean; latencyMs: number; details?: string }

async function checkSite(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const res = await fetch('https://voltpilot-flax.vercel.app', { signal: AbortSignal.timeout(10000) })
    return { name: 'site_principal', ok: res.ok, latencyMs: Date.now() - start, details: `HTTP ${res.status}` }
  } catch (e) {
    return { name: 'site_principal', ok: false, latencyMs: Date.now() - start, details: String(e) }
  }
}

async function checkSupabase(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY! },
      signal: AbortSignal.timeout(8000),
    })
    return { name: 'supabase_api', ok: res.ok, latencyMs: Date.now() - start, details: `HTTP ${res.status}` }
  } catch (e) {
    return { name: 'supabase_api', ok: false, latencyMs: Date.now() - start, details: String(e) }
  }
}

async function checkStripe(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const res = await fetch('https://api.stripe.com/v1/products?limit=1', {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
      signal: AbortSignal.timeout(8000),
    })
    return { name: 'stripe_api', ok: res.ok, latencyMs: Date.now() - start, details: `HTTP ${res.status}` }
  } catch (e) {
    return { name: 'stripe_api', ok: false, latencyMs: Date.now() - start, details: String(e) }
  }
}

async function checkLogin(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const res = await fetch('https://voltpilot-flax.vercel.app/login', { signal: AbortSignal.timeout(10000) })
    return { name: 'page_login', ok: res.ok, latencyMs: Date.now() - start, details: `HTTP ${res.status}` }
  } catch (e) {
    return { name: 'page_login', ok: false, latencyMs: Date.now() - start, details: String(e) }
  }
}

export async function runMonitorAgent(): Promise<{ checks: CheckResult[]; alertsSaved: number; diagnosis?: string }> {
  const supabase = createAdminClient()

  const checks = await Promise.all([checkSite(), checkSupabase(), checkStripe(), checkLogin()])

  const failed = checks.filter(c => !c.ok)
  const slow = checks.filter(c => c.ok && c.latencyMs > 3000)

  let alertsSaved = 0
  let diagnosis: string | undefined

  const checksJson = JSON.parse(JSON.stringify(checks)) as Json

  // Sauvegarde les alertes pour les checks échoués
  for (const check of failed) {
    await supabase.from('site_alerts').insert({
      type: check.name,
      severite: 'critique',
      message: `❌ ${check.name} ne répond pas`,
      details: { latencyMs: check.latencyMs, details: check.details ?? null, checks: checksJson } as Json,
    })
    alertsSaved++
  }

  for (const check of slow) {
    await supabase.from('site_alerts').insert({
      type: check.name,
      severite: 'warning',
      message: `⚠️ ${check.name} lent (${check.latencyMs}ms)`,
      details: { latencyMs: check.latencyMs, checks: checksJson } as Json,
    })
    alertsSaved++
  }

  // Si des problèmes détectés → demander un diagnostic à Claude
  if (failed.length > 0) {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Tu es un expert DevOps. Voici les résultats de monitoring du site VoltPilot (SaaS de devis solaires sur Vercel + Supabase + Stripe) :

Checks échoués : ${JSON.stringify(failed, null, 2)}
Checks réussis : ${JSON.stringify(checks.filter(c => c.ok), null, 2)}

Donne un diagnostic concis (2-3 phrases) et les actions correctives prioritaires.`,
      }],
    })
    diagnosis = message.content[0].type === 'text' ? message.content[0].text : undefined

    // Sauvegarder le diagnostic
    if (diagnosis) {
      await supabase.from('site_alerts').insert({
        type: 'diagnostic_ia',
        severite: 'info',
        message: '🤖 Diagnostic IA',
        details: { diagnosis, failed_checks: JSON.parse(JSON.stringify(failed)) } as Json,
      })
    }
  }

  // Marque les alertes résolues si tout est OK maintenant
  if (failed.length === 0) {
    await supabase.from('site_alerts')
      .update({ resolu: true, resolu_at: new Date().toISOString() })
      .eq('resolu', false)
      .in('type', ['site_principal', 'supabase_api', 'stripe_api', 'page_login'])
  }

  return { checks, alertsSaved, diagnosis }
}
