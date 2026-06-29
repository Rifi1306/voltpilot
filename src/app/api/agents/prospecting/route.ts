import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any>
function table(supabase: AnyClient, name: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(name)
}

type Prospect = {
  id: string
  entreprise: string
  contact_prenom: string | null
  email: string
  region: string | null
  type_activite: string
  pays: string
  etape: string
  statut: string
  email_sujet: string | null
  email_corps: string | null
  date_premier_contact: string | null
  date_dernier_contact: string | null
  date_prochaine_action: string | null
  reponse: string | null
  notes: string | null
  created_at: string
}

// Email is SUSPENDED per admin instruction — do not actually send
const EMAIL_SUSPENDED = true

function generateEmail(prospect: Partial<Prospect>, etape: string): { sujet: string; corps: string } {
  const nom = prospect.contact_prenom ?? prospect.entreprise ?? 'Madame/Monsieur'
  const widget = true // widget is live

  if (etape === 'initial') {
    const sujet = widget
      ? `Devis solaires en quelques minutes + widget pour votre site`
      : `Devis photovoltaïques professionnels en quelques minutes`

    const corps = `Bonjour ${nom},

Je m'appelle Naoufel, chez VoltPilot. Vous installez du photovoltaïque — voici ce qu'on fait pour vous :

✓ Devis complets en quelques minutes (catalogue panneaux, onduleurs, batteries, pose intégré)
✓ Export PDF professionnel à votre logo
✓ CRM clients + suivi des devis (brouillon → envoyé → accepté)${widget ? '\n✓ Widget sur votre site : vos visiteurs demandent un devis, l\'info arrive dans votre espace VoltPilot' : ''}

Objectif : vous faire gagner du temps sur la paperasse et signer plus vite.

Essai gratuit 14 jours, sans carte bancaire :
👉 https://voltpilot.fr/register

À bientôt,
Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Répondez STOP pour ne plus être contacté.`

    return { sujet, corps }
  }

  if (etape === 'relance1') {
    return {
      sujet: `Re: VoltPilot — juste un rappel`,
      corps: `Bonjour ${nom},

Je me permets de revenir vers vous brièvement. Avez-vous eu l'occasion de jeter un œil à VoltPilot ?

Si la gestion de devis n'est pas votre priorité du moment, pas de souci — je peux revenir dans quelques semaines.

Essai gratuit 14 jours → https://voltpilot.fr/register

Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Répondez STOP pour ne plus être contacté.`,
    }
  }

  // relance2
  return {
    sujet: `Dernier message de VoltPilot`,
    corps: `Bonjour ${nom},

C'est mon dernier message. Si vous installez des panneaux solaires et souhaitez simplifier vos devis, VoltPilot peut vous faire gagner plusieurs heures par semaine.

Essai 14 jours gratuit → https://voltpilot.fr/register

Bonne continuation dans tous les cas !

Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Répondez STOP pour ne plus être contacté.`,
  }
}

function nextEtape(current: string): string {
  if (current === 'initial') return 'relance1'
  if (current === 'relance1') return 'relance2'
  return 'stop'
}

function daysUntilNext(etape: string): number {
  if (etape === 'initial') return 4
  if (etape === 'relance1') return 4
  return 0
}

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await table(supabase, 'prospects_vp')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ prospects: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await req.json()

    // ── ADD prospect ────────────────────────────────────────────
    if (body.action === 'add') {
      const { entreprise, contact_prenom, email, region, type_activite, pays, notes } = body
      const { sujet, corps } = generateEmail({ entreprise, contact_prenom }, 'initial')

      const { data, error } = await table(supabase, 'prospects_vp').insert({
        entreprise, contact_prenom, email, region, type_activite, pays, notes,
        etape: 'initial',
        statut: 'a_envoyer',
        email_sujet: sujet,
        email_corps: corps,
        date_prochaine_action: new Date().toISOString(),
      }).select().single()

      if (error) throw error
      return NextResponse.json({ prospect: data })
    }

    // ── MARK RESPONSE ───────────────────────────────────────────
    if (body.action === 'response') {
      const { id, reponse } = body
      const statut = reponse === 'oui' ? 'reponse_positive'
        : reponse === 'stop' ? 'desabonne'
        : 'reponse_negative'

      await table(supabase, 'prospects_vp').update({
        reponse, statut, etape: 'stop',
      }).eq('id', id)

      return NextResponse.json({ ok: true })
    }

    // ── SEND (or simulate if suspended) ────────────────────────
    if (body.action === 'send') {
      const { id } = body
      const { data: prospect } = await table(supabase, 'prospects_vp')
        .select('*').eq('id', id).single()

      if (!prospect) return NextResponse.json({ error: 'Prospect introuvable' }, { status: 404 })
      if (prospect.statut === 'desabonne') return NextResponse.json({ error: 'Désabonné' }, { status: 400 })

      if (EMAIL_SUSPENDED) {
        return NextResponse.json({ suspended: true, message: 'Envoi suspendu — activez-le depuis la config.' })
      }

      // Actual send via Resend (when not suspended)
      // const { Resend } = await import('resend')
      // const resend = new Resend(process.env.RESEND_API_KEY)
      // await resend.emails.send({
      //   from: 'Naoufel — VoltPilot <naoufel@voltpilot.fr>',
      //   to: prospect.email,
      //   subject: prospect.email_sujet,
      //   text: prospect.email_corps,
      // })

      const now = new Date()
      const nextE = nextEtape(prospect.etape)
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + daysUntilNext(prospect.etape))
      const { sujet, corps } = nextE !== 'stop' ? generateEmail(prospect, nextE) : { sujet: null, corps: null }

      await table(supabase, 'prospects_vp').update({
        statut: 'envoye',
        etape: nextE,
        date_dernier_contact: now.toISOString(),
        date_premier_contact: prospect.date_premier_contact ?? now.toISOString(),
        date_prochaine_action: nextE !== 'stop' ? nextDate.toISOString() : null,
        email_sujet: sujet ?? prospect.email_sujet,
        email_corps: corps ?? prospect.email_corps,
      }).eq('id', id)

      return NextResponse.json({ ok: true, next_etape: nextE })
    }

    // ── DELETE ──────────────────────────────────────────────────
    if (body.action === 'delete') {
      await table(supabase, 'prospects_vp').delete().eq('id', body.id)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
