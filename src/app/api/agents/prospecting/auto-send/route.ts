import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateGuidePDF, languageFromPays } from '@/lib/generateGuidePDF'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function table(supabase: any, name: string) { return supabase.from(name) }

const MAX_SENDS_PER_RUN = 30 // respect rate limits and deliverability

type Prospect = {
  id: string
  entreprise: string
  contact_prenom: string | null
  email: string
  pays: string
  etape: string
  statut: string
  email_sujet: string | null
  email_corps: string | null
  date_premier_contact: string | null
}

function nextEtape(current: string): string {
  if (current === 'initial') return 'relance1'
  if (current === 'relance1') return 'relance2'
  return 'stop'
}

function daysUntilNext(etape: string): number {
  return etape === 'initial' || etape === 'relance1' ? 4 : 0
}

export async function GET() {
  return NextResponse.json({ message: 'POST to trigger auto-send' })
}

export async function POST() {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'VoltPilot <contact@voltpilot.fr>'

  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY non configure', sent: 0 }, { status: 200 })
  }

  const supabase = createAdminClient()

  // Fetch prospects due for sending
  const { data: prospects, error } = await table(supabase, 'prospects_vp')
    .select('*')
    .in('statut', ['a_envoyer', 'envoye'])
    .neq('etape', 'stop')
    .lte('date_prochaine_action', new Date().toISOString())
    .order('date_prochaine_action', { ascending: true })
    .limit(MAX_SENDS_PER_RUN)

  if (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }

  const dueLst = (prospects ?? []) as Prospect[]
  if (dueLst.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: 'Aucun prospect en attente' })
  }

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const p of dueLst) {
    try {
      const attachments: Array<{ filename: string; content: Buffer }> = []

      // Attach PDF guide on initial or relance1
      if (p.etape === 'initial' || p.etape === 'relance1') {
        try {
          const lang = languageFromPays(p.pays ?? 'FR')
          const pdfBuffer = generateGuidePDF(p.pays ?? 'FR')
          attachments.push({ filename: `guide-voltpilot-${lang}.pdf`, content: pdfBuffer })
        } catch { /* skip if PDF fails */ }
      }

      await resend.emails.send({
        from: fromEmail,
        to: p.email,
        subject: p.email_sujet ?? '',
        text: p.email_corps ?? '',
        attachments,
      })

      const now = new Date()
      const nextE = nextEtape(p.etape)
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + daysUntilNext(p.etape))

      await table(supabase, 'prospects_vp').update({
        statut: nextE === 'stop' ? 'envoye' : 'envoye',
        etape: nextE,
        date_dernier_contact: now.toISOString(),
        date_premier_contact: p.date_premier_contact ?? now.toISOString(),
        date_prochaine_action: nextE !== 'stop' ? nextDate.toISOString() : null,
      }).eq('id', p.id)

      sent++

      // Small delay between sends for deliverability
      await new Promise((r) => setTimeout(r, 200))
    } catch (err) {
      failed++
      errors.push(`${p.email}: ${String(err)}`)
    }
  }

  return NextResponse.json({ ok: true, sent, failed, errors: errors.slice(0, 5) })
}
