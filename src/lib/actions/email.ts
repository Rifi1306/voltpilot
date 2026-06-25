'use server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const resend = new Resend(process.env.RESEND_API_KEY)

type LigneItem = { designation: string; quantite: number; prixUnitaire: number; remise?: number; tva?: number }

function parseLignes(raw: unknown): LigneItem[] {
  if (!Array.isArray(raw)) return []
  return raw as LigneItem[]
}

function eur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function rawTTC(lignes: LigneItem[], remise: number): number {
  const ht = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0)
  const tva = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100) * ((l.tva ?? 20) / 100), 0)
  return (ht + tva) * (1 - remise / 100)
}

function buildEmailHtml(params: {
  devisNumero: string
  clientNom: string
  companyNom: string
  companyTelephone?: string | null
  companyEmail?: string | null
  montantTTC: number
  dateValidite?: string | null
  conditionsPaiement?: string | null
  notes?: string | null
  lignes: LigneItem[]
  couleurPrimaire: string
}): string {
  const {
    devisNumero, clientNom, companyNom, companyTelephone, companyEmail,
    montantTTC, dateValidite, conditionsPaiement, notes, lignes, couleurPrimaire,
  } = params

  const topLignes = lignes.slice(0, 5)
  const lignesHtml = topLignes.map(l => {
    const ht = l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100)
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;">${l.designation}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;text-align:center;">${l.quantite}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;text-align:right;font-weight:600;">${eur(ht)}</td>
      </tr>`
  }).join('')

  const moreCount = lignes.length - topLignes.length

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:${couleurPrimaire};border-radius:16px 16px 0 0;padding:32px;text-align:center;">
      <div style="width:48px;height:48px;background:rgba(255,255,255,0.25);border-radius:12px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:24px;">☀️</span>
      </div>
      <h1 style="margin:0;color:white;font-size:22px;font-weight:700;">${companyNom}</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Votre devis est prêt</p>
    </div>

    <!-- Body -->
    <div style="background:white;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <p style="margin:0 0 24px;font-size:15px;color:#475569;">Bonjour <strong>${clientNom}</strong>,</p>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
        Veuillez trouver ci-dessous le résumé de votre devis <strong>${devisNumero}</strong>.
        Nous restons disponibles pour toute question.
      </p>

      <!-- Devis info card -->
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #e2e8f0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div>
            <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Référence</div>
            <div style="font-size:18px;font-weight:700;color:#0f172a;">${devisNumero}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Montant total TTC</div>
            <div style="font-size:24px;font-weight:800;color:${couleurPrimaire};">${eur(montantTTC)}</div>
          </div>
        </div>
        ${dateValidite ? `<div style="font-size:13px;color:#64748b;">⏱ Valable jusqu'au <strong>${new Date(dateValidite).toLocaleDateString('fr-FR')}</strong></div>` : ''}
        ${conditionsPaiement ? `<div style="font-size:13px;color:#64748b;margin-top:4px;">💳 Conditions : ${conditionsPaiement}</div>` : ''}
      </div>

      <!-- Lignes table -->
      ${lignes.length > 0 ? `
      <h3 style="margin:0 0 12px;font-size:14px;color:#475569;font-weight:600;">Détail des prestations</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:${moreCount > 0 ? '8px' : '24px'};">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-align:left;text-transform:uppercase;">Désignation</th>
            <th style="padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-align:center;text-transform:uppercase;">Qté</th>
            <th style="padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-align:right;text-transform:uppercase;">Total HT</th>
          </tr>
        </thead>
        <tbody>${lignesHtml}</tbody>
      </table>
      ${moreCount > 0 ? `<p style="font-size:12px;color:#94a3b8;margin:0 0 24px;">+ ${moreCount} autre(s) prestation(s) dans le devis complet.</p>` : ''}
      ` : ''}

      <!-- Notes -->
      ${notes ? `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-bottom:24px;">
        <div style="font-size:12px;font-weight:600;color:#92400e;margin-bottom:4px;">Note</div>
        <div style="font-size:13px;color:#78350f;">${notes}</div>
      </div>
      ` : ''}

      <!-- Contact -->
      <div style="border-top:1px solid #f1f5f9;padding-top:20px;margin-top:8px;">
        <p style="margin:0 0 8px;font-size:14px;color:#475569;">Pour accepter ce devis ou poser une question, contactez-nous :</p>
        ${companyTelephone ? `<p style="margin:0 0 4px;font-size:14px;color:#0f172a;">📞 <a href="tel:${companyTelephone}" style="color:${couleurPrimaire};text-decoration:none;font-weight:600;">${companyTelephone}</a></p>` : ''}
        ${companyEmail ? `<p style="margin:0;font-size:14px;color:#0f172a;">✉️ <a href="mailto:${companyEmail}" style="color:${couleurPrimaire};text-decoration:none;font-weight:600;">${companyEmail}</a></p>` : ''}
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;margin:20px 0 0;font-size:12px;color:#cbd5e1;">
      Ce devis a été généré par <strong>${companyNom}</strong> via VoltPilot.
    </p>
  </div>
</body>
</html>`
}

export async function sendDevisEmailAction(devisId: string, emailOverride?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Non authentifié' }

    // Fetch devis with client
    const { data: devisRaw, error: devisError } = await supabase
      .from('devis')
      .select('*, clients(*)')
      .eq('id', devisId)
      .eq('user_id', user.id)
      .single()

    if (devisError || !devisRaw) return { ok: false, error: 'Devis introuvable' }

    type DevisWithClient = {
      id: string; numero: string; statut: string; lignes: unknown
      remise: number | null; acompte: number | null; conditions_paiement: string | null
      notes: string | null; date_validite: string | null; created_at: string
      clients: { nom: string; email: string | null; telephone?: string | null } | null
    }
    const devis = devisRaw as unknown as DevisWithClient
    if (!devis.clients) return { ok: false, error: 'Aucun client associé à ce devis' }

    // Fetch profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    const client = devis.clients

    const toEmail = emailOverride?.trim() || client.email
    if (!toEmail) return { ok: false, error: 'Le client n\'a pas d\'adresse email' }

    const lignes = parseLignes(devis.lignes)
    const montantTTC = rawTTC(lignes, devis.remise ?? 0)
    const couleur = profile?.couleur_primaire ?? '#22D3EE'
    const companyNom = profile?.nom ?? 'Votre installateur solaire'

    const { error: emailError } = await resend.emails.send({
      from: `${companyNom} <onboarding@resend.dev>`,
      to: [toEmail],
      subject: `Votre devis ${devis.numero} — ${eur(montantTTC)}`,
      html: buildEmailHtml({
        devisNumero: devis.numero,
        clientNom: client.nom,
        companyNom,
        companyTelephone: profile?.telephone ?? null,
        companyEmail: user.email ?? null,
        montantTTC,
        dateValidite: devis.date_validite,
        conditionsPaiement: devis.conditions_paiement,
        notes: devis.notes,
        lignes,
        couleurPrimaire: couleur,
      }),
    })

    if (emailError) return { ok: false, error: emailError.message }

    // Marquer le devis comme envoyé si encore en brouillon
    if (devis.statut === 'brouillon') {
      await supabase.from('devis').update({ statut: 'envoye' }).eq('id', devisId).eq('user_id', user.id)
      revalidatePath('/devis')
      revalidatePath(`/devis/${devisId}`)
    }

    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}
