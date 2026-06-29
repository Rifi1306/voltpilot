import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateGuidePDF, languageFromPays } from '@/lib/generateGuidePDF'

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

// ── Multilingual email templates ──────────────────────────────

type EmailTemplates = {
  initial_sujet: string
  initial_corps: (nom: string) => string
  relance1_sujet: string
  relance1_corps: (nom: string) => string
  relance2_sujet: string
  relance2_corps: (nom: string) => string
  stop_keyword: string
  guide_filename: string
}

const EMAIL_LANG: Record<string, EmailTemplates> = {
  fr: {
    initial_sujet: `Devis solaires en quelques minutes + widget pour votre site`,
    initial_corps: (nom) => `Bonjour ${nom},

Je m'appelle Naoufel, chez VoltPilot. Vous installez du photovoltaique — voici ce qu'on fait pour vous :

✓ Devis complets en quelques minutes (catalogue panneaux, onduleurs, batteries, pose integre)
✓ Export PDF professionnel a votre logo et signature
✓ CRM clients + suivi des devis (Brouillon -> Envoye -> Accepte)
✓ Widget sur votre site : vos visiteurs demandent un devis, l'info arrive dans votre espace VoltPilot

Objectif : vous faire gagner du temps sur la paperasse et signer plus vite.

Essai gratuit 14 jours, sans carte bancaire :
https://voltpilot.fr/register

Vous trouverez en piece jointe notre guide complet pour decouvrir toutes les fonctionnalites VoltPilot.

A bientot,
Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Repondez STOP pour ne plus etre contacte.`,
    relance1_sujet: `Re: VoltPilot — juste un rappel`,
    relance1_corps: (nom) => `Bonjour ${nom},

Je me permets de revenir vers vous brievement. Avez-vous eu l'occasion de jeter un oeil a VoltPilot ?

Si la gestion de devis n'est pas votre priorite du moment, pas de souci — je peux revenir dans quelques semaines.

Essai gratuit 14 jours -> https://voltpilot.fr/register

Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Repondez STOP pour ne plus etre contacte.`,
    relance2_sujet: `Dernier message de VoltPilot`,
    relance2_corps: (nom) => `Bonjour ${nom},

C'est mon dernier message. Si vous installez des panneaux solaires et souhaitez simplifier vos devis, VoltPilot peut vous faire gagner plusieurs heures par semaine.

Essai 14 jours gratuit -> https://voltpilot.fr/register

Bonne continuation dans tous les cas !

Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Repondez STOP pour ne plus etre contacte.`,
    stop_keyword: 'STOP',
    guide_filename: 'guide-voltpilot-fr.pdf',
  },

  en: {
    initial_sujet: `Professional solar quotes in minutes + website widget`,
    initial_corps: (nom) => `Hello ${nom},

My name is Naoufel, from VoltPilot. You install solar panels — here is what we do for you:

✓ Complete quotes in minutes (integrated catalog: panels, inverters, batteries, installation)
✓ Professional PDF export with your company logo and signature
✓ Client CRM + quote tracking (Draft -> Sent -> Accepted)
✓ Website widget: your visitors request a quote, it arrives directly in your VoltPilot account

Goal: save you time on paperwork and close deals faster.

14-day free trial, no credit card required:
https://voltpilot.fr/register

Please find attached our complete user guide to discover all VoltPilot features.

Best regards,
Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Reply STOP to unsubscribe.`,
    relance1_sujet: `Re: VoltPilot — just a quick reminder`,
    relance1_corps: (nom) => `Hello ${nom},

Just a brief follow-up. Have you had a chance to look at VoltPilot?

If quote management is not your priority right now, no problem — I can get back to you in a few weeks.

14-day free trial -> https://voltpilot.fr/register

Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Reply STOP to unsubscribe.`,
    relance2_sujet: `Last message from VoltPilot`,
    relance2_corps: (nom) => `Hello ${nom},

This is my last message. If you install solar panels and want to simplify your quoting process, VoltPilot can save you several hours a week.

14-day free trial -> https://voltpilot.fr/register

Best of luck in any case!

Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Reply STOP to unsubscribe.`,
    stop_keyword: 'STOP',
    guide_filename: 'guide-voltpilot-en.pdf',
  },

  de: {
    initial_sujet: `Professionelle Solarangebote in Minuten + Website-Widget`,
    initial_corps: (nom) => `Hallo ${nom},

mein Name ist Naoufel von VoltPilot. Sie installieren Solaranlagen — das machen wir fur Sie:

✓ Vollstandige Angebote in Minuten (integrierter Katalog: Panels, Wechselrichter, Batterien, Montage)
✓ Professioneller PDF-Export mit Ihrem Firmenlogo und Unterschrift
✓ Kunden-CRM + Angebotsverfolgung (Entwurf -> Gesendet -> Akzeptiert)
✓ Website-Widget: Ihre Besucher fordern ein Angebot an, die Information kommt direkt in Ihr VoltPilot-Konto

Ziel: Ihnen Burowarbeit abnehmen und Abschlusse beschleunigen.

14-tagige kostenlose Testphase, keine Kreditkarte:
https://voltpilot.fr/register

Anbei finden Sie unser vollstandiges Benutzerhandbuch mit allen VoltPilot-Funktionen.

Mit freundlichen Grussen,
Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Antworten Sie STOP um sich abzumelden.`,
    relance1_sujet: `Re: VoltPilot — kurze Erinnerung`,
    relance1_corps: (nom) => `Hallo ${nom},

Ich erlaube mir, kurz nachzufragen. Hatten Sie die Gelegenheit, sich VoltPilot anzusehen?

Falls die Angebotsverwaltung gerade keine Prioritat hat — kein Problem, ich melde mich in ein paar Wochen wieder.

14 Tage kostenlos -> https://voltpilot.fr/register

Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Antworten Sie STOP um sich abzumelden.`,
    relance2_sujet: `Letzte Nachricht von VoltPilot`,
    relance2_corps: (nom) => `Hallo ${nom},

Dies ist meine letzte Nachricht. Wenn Sie Solaranlagen installieren und Ihre Angebotserstellung vereinfachen mochten, kann VoltPilot Ihnen mehrere Stunden pro Woche sparen.

14 Tage kostenlos -> https://voltpilot.fr/register

Auf jeden Fall alles Gute!

Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Antworten Sie STOP um sich abzumelden.`,
    stop_keyword: 'STOP',
    guide_filename: 'guide-voltpilot-de.pdf',
  },

  es: {
    initial_sujet: `Presupuestos solares profesionales en minutos + widget para su web`,
    initial_corps: (nom) => `Hola ${nom},

Me llamo Naoufel, de VoltPilot. Usted instala paneles solares — esto es lo que hacemos por usted:

✓ Presupuestos completos en minutos (catalogo integrado: paneles, inversores, baterias, instalacion)
✓ Exportacion PDF profesional con el logotipo y firma de su empresa
✓ CRM de clientes + seguimiento de presupuestos (Borrador -> Enviado -> Aceptado)
✓ Widget web: sus visitantes solicitan un presupuesto, la informacion llega directamente a su cuenta VoltPilot

Objetivo: ahorrarle tiempo en el papeleo y cerrar contratos mas rapido.

14 dias de prueba gratuita, sin tarjeta de credito:
https://voltpilot.fr/register

Adjuntamos nuestra guia completa para descubrir todas las funciones de VoltPilot.

Atentamente,
Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Responda STOP para darse de baja.`,
    relance1_sujet: `Re: VoltPilot — solo un recordatorio`,
    relance1_corps: (nom) => `Hola ${nom},

Me permito hacer un breve seguimiento. ?Ha tenido la oportunidad de ver VoltPilot?

Si la gestion de presupuestos no es su prioridad en este momento, sin problema — puedo volver en unas semanas.

14 dias gratuitos -> https://voltpilot.fr/register

Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Responda STOP para darse de baja.`,
    relance2_sujet: `Ultimo mensaje de VoltPilot`,
    relance2_corps: (nom) => `Hola ${nom},

Este es mi ultimo mensaje. Si instala paneles solares y desea simplificar sus presupuestos, VoltPilot puede ahorrarle varias horas a la semana.

14 dias gratuitos -> https://voltpilot.fr/register

Que le vaya muy bien en cualquier caso.

Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Responda STOP para darse de baja.`,
    stop_keyword: 'STOP',
    guide_filename: 'guide-voltpilot-es.pdf',
  },

  it: {
    initial_sujet: `Preventivi solari professionali in pochi minuti + widget per il sito`,
    initial_corps: (nom) => `Salve ${nom},

Mi chiamo Naoufel, di VoltPilot. Installate pannelli solari — ecco cosa facciamo per voi:

✓ Preventivi completi in pochi minuti (catalogo integrato: pannelli, inverter, batterie, installazione)
✓ Esportazione PDF professionale con il vostro logo e firma aziendale
✓ CRM clienti + tracciamento preventivi (Bozza -> Inviato -> Accettato)
✓ Widget sito web: i vostri visitatori richiedono un preventivo, le informazioni arrivano direttamente nel vostro account VoltPilot

Obiettivo: farvi risparmiare tempo sulla burocrazia e chiudere piu velocemente.

14 giorni di prova gratuita, senza carta di credito:
https://voltpilot.fr/register

In allegato trovate la nostra guida completa per scoprire tutte le funzionalita VoltPilot.

Cordiali saluti,
Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Risponda STOP per annullare l'iscrizione.`,
    relance1_sujet: `Re: VoltPilot — solo un promemoria`,
    relance1_corps: (nom) => `Salve ${nom},

Mi permetto di ricontattarvi brevemente. Avete avuto l'occasione di dare un'occhiata a VoltPilot?

Se la gestione dei preventivi non e la vostra priorita in questo momento, nessun problema — posso riscrivere tra qualche settimana.

14 giorni gratuiti -> https://voltpilot.fr/register

Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Risponda STOP per annullare l'iscrizione.`,
    relance2_sujet: `Ultimo messaggio da VoltPilot`,
    relance2_corps: (nom) => `Salve ${nom},

Questo e il mio ultimo messaggio. Se installate pannelli solari e volete semplificare i vostri preventivi, VoltPilot puo farvi risparmiare diverse ore alla settimana.

14 giorni gratuiti -> https://voltpilot.fr/register

In bocca al lupo in ogni caso!

Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Risponda STOP per annullare l'iscrizione.`,
    stop_keyword: 'STOP',
    guide_filename: 'guide-voltpilot-it.pdf',
  },

  nl: {
    initial_sujet: `Professionele zonne-energie offertes in minuten + website-widget`,
    initial_corps: (nom) => `Hallo ${nom},

Mijn naam is Naoufel, van VoltPilot. U installeert zonnepanelen — dit is wat wij voor u doen:

✓ Volledige offertes in minuten (geintegreerde catalogus: panelen, omvormers, batterijen, installatie)
✓ Professionele PDF-export met uw bedrijfslogo en handtekening
✓ CRM voor klanten + offertetracking (Concept -> Verzonden -> Geaccepteerd)
✓ Website-widget: uw bezoekers vragen een offerte aan, de informatie komt direct in uw VoltPilot-account

Doel: u tijd besparen met papierwerk en sneller deals sluiten.

14 dagen gratis proberen, geen creditcard vereist:
https://voltpilot.fr/register

In de bijlage vindt u onze volledige gebruikshandleiding met alle VoltPilot-functies.

Met vriendelijke groet,
Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Antwoord STOP om u af te melden.`,
    relance1_sujet: `Re: VoltPilot — een korte herinnering`,
    relance1_corps: (nom) => `Hallo ${nom},

Ik neem even contact op. Heeft u de kans gehad om VoltPilot te bekijken?

Als offertebeheer momenteel geen prioriteit is, geen probleem — ik kan over een paar weken terugkomen.

14 dagen gratis -> https://voltpilot.fr/register

Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Antwoord STOP om u af te melden.`,
    relance2_sujet: `Laatste bericht van VoltPilot`,
    relance2_corps: (nom) => `Hallo ${nom},

Dit is mijn laatste bericht. Als u zonnepanelen installeert en uw offerteproces wilt vereenvoudigen, kan VoltPilot u meerdere uren per week besparen.

14 dagen gratis -> https://voltpilot.fr/register

In ieder geval veel succes!

Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Antwoord STOP om u af te melden.`,
    stop_keyword: 'STOP',
    guide_filename: 'guide-voltpilot-nl.pdf',
  },

  pt: {
    initial_sujet: `Orcamentos solares profissionais em minutos + widget para o seu site`,
    initial_corps: (nom) => `Ola ${nom},

O meu nome e Naoufel, da VoltPilot. Voce instala paineis solares — e isto que fazemos por si:

✓ Orcamentos completos em minutos (catalogo integrado: paineis, inversores, baterias, instalacao)
✓ Exportacao PDF profissional com o seu logotipo e assinatura
✓ CRM de clientes + acompanhamento de orcamentos (Rascunho -> Enviado -> Aceite)
✓ Widget web: os seus visitantes pedem um orcamento, a informacao chega diretamente a sua conta VoltPilot

Objetivo: poupar-lhe tempo na burocracia e fechar negocios mais rapidamente.

14 dias de avaliacao gratuita, sem cartao de credito:
https://voltpilot.fr/register

Em anexo encontra o nosso guia completo para descobrir todas as funcionalidades VoltPilot.

Com os melhores cumprimentos,
Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Responda STOP para cancelar a subscricao.`,
    relance1_sujet: `Re: VoltPilot — so um lembrete`,
    relance1_corps: (nom) => `Ola ${nom},

Permito-me fazer um breve acompanhamento. Teve oportunidade de ver o VoltPilot?

Se a gestao de orcamentos nao e a sua prioridade de momento, sem problema — posso voltar em algumas semanas.

14 dias gratuitos -> https://voltpilot.fr/register

Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Responda STOP para cancelar a subscricao.`,
    relance2_sujet: `Ultima mensagem da VoltPilot`,
    relance2_corps: (nom) => `Ola ${nom},

Esta e a minha ultima mensagem. Se instala paineis solares e deseja simplificar os seus orcamentos, o VoltPilot pode poupar-lhe varias horas por semana.

14 dias gratuitos -> https://voltpilot.fr/register

Boa sorte em qualquer caso!

Naoufel — VoltPilot
voltpilotpro@gmail.com

---
Responda STOP para cancelar a subscricao.`,
    stop_keyword: 'STOP',
    guide_filename: 'guide-voltpilot-pt.pdf',
  },
}

function getEmailTemplates(pays: string): EmailTemplates {
  const lang = languageFromPays(pays)
  return EMAIL_LANG[lang] ?? EMAIL_LANG['en']
}

function generateEmail(
  prospect: Partial<Prospect>,
  etape: string,
): { sujet: string; corps: string } {
  const nom = prospect.contact_prenom ?? prospect.entreprise ?? 'Madame/Monsieur'
  const tpl = getEmailTemplates(prospect.pays ?? 'FR')

  if (etape === 'initial') return { sujet: tpl.initial_sujet, corps: tpl.initial_corps(nom) }
  if (etape === 'relance1') return { sujet: tpl.relance1_sujet, corps: tpl.relance1_corps(nom) }
  return { sujet: tpl.relance2_sujet, corps: tpl.relance2_corps(nom) }
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
      const { sujet, corps } = generateEmail({ entreprise, contact_prenom, pays }, 'initial')

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

    // ── SEND via Resend ─────────────────────────────────────────
    if (body.action === 'send') {
      const { id } = body
      const { data: prospect } = await table(supabase, 'prospects_vp')
        .select('*').eq('id', id).single()

      if (!prospect) return NextResponse.json({ error: 'Prospect introuvable' }, { status: 404 })
      if (prospect.statut === 'desabonne') return NextResponse.json({ error: 'Desabonne' }, { status: 400 })

      const apiKey = process.env.RESEND_API_KEY
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'VoltPilot <contact@voltpilot.fr>'

      if (!apiKey) {
        console.warn('[VoltPilot] RESEND_API_KEY non configure — mode simulation')
      } else {
        try {
          const { Resend } = await import('resend')
          const resend = new Resend(apiKey)

          const attachments: Array<{ filename: string; content: Buffer }> = []

          // Attach PDF guide on initial contact only (avoid large emails on follow-ups)
          if (prospect.etape === 'initial' || prospect.etape === 'relance1') {
            try {
              const tpl = getEmailTemplates(prospect.pays ?? 'FR')
              const pdfBuffer = generateGuidePDF(prospect.pays ?? 'FR')
              attachments.push({ filename: tpl.guide_filename, content: pdfBuffer })
            } catch (pdfErr) {
              console.error('[VoltPilot] PDF guide generation failed:', pdfErr)
            }
          }

          await resend.emails.send({
            from: fromEmail,
            to: prospect.email,
            subject: prospect.email_sujet ?? '',
            text: prospect.email_corps ?? '',
            attachments,
          })
        } catch (sendErr) {
          console.error('[VoltPilot] Resend error:', sendErr)
          return NextResponse.json({ error: `Erreur envoi: ${String(sendErr)}` }, { status: 500 })
        }
      }

      const now = new Date()
      const nextE = nextEtape(prospect.etape)
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + daysUntilNext(prospect.etape))
      const { sujet, corps } = nextE !== 'stop'
        ? generateEmail({ ...prospect, etape: nextE }, nextE)
        : { sujet: null, corps: null }

      await table(supabase, 'prospects_vp').update({
        statut: 'envoye',
        etape: nextE,
        date_dernier_contact: now.toISOString(),
        date_premier_contact: prospect.date_premier_contact ?? now.toISOString(),
        date_prochaine_action: nextE !== 'stop' ? nextDate.toISOString() : null,
        email_sujet: sujet ?? prospect.email_sujet,
        email_corps: corps ?? prospect.email_corps,
      }).eq('id', id)

      return NextResponse.json({ ok: true, next_etape: nextE, simulated: !apiKey })
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
