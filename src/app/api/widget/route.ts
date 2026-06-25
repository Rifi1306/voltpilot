import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeEstimationWithPVGIS } from '@/lib/estimation'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// POST — public: visitor submits from the embedded widget
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      installer_id,
      nom,
      email,
      telephone,
      code_postal,
      ville,
      type_projet,
      message,
      // V2 fields
      surface,
      facture_mensuelle,
      objectif,
      type_bien,
      type_toiture,
      adresse,
      consentement,
    } = body

    if (!installer_id || !nom || !email) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    // Calcul estimation
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://voltpilot.fr'
    const estimation = await computeEstimationWithPVGIS(
      { surface, factureMensuelle: facture_mensuelle, codePostal: code_postal, typeProjet: type_projet },
      baseUrl
    )

    const admin = createAdminClient()
    const { error } = await admin.from('leads').insert({
      user_id: installer_id,
      nom: String(nom).trim(),
      email: String(email).trim().toLowerCase(),
      telephone: telephone ? String(telephone).trim() : null,
      code_postal: code_postal ? String(code_postal).trim() : null,
      ville: ville ? String(ville).trim() : null,
      type_projet: type_projet ?? 'Résidentiel',
      message: message ? String(message).trim() : null,
      statut: 'nouveau',
      // V2 fields
      surface: surface ? Number(surface) : null,
      facture_mensuelle: facture_mensuelle ? Number(facture_mensuelle) : null,
      objectif: objectif ?? null,
      type_bien: type_bien ?? null,
      type_toiture: type_toiture ?? null,
      adresse: adresse ? String(adresse).trim() : null,
      consentement: Boolean(consentement),
      // Estimation results
      nb_panneaux: estimation.nbPanneaux,
      puissance_kwc: estimation.puissanceKwc,
      production_annuelle: estimation.productionAnnuelle,
      fourchette_min: estimation.fourchetteMin,
      fourchette_max: estimation.fourchetteMax,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notification email à l'installateur (fire-and-forget)
    try {
      const { data: profile } = await admin
        .from('profiles')
        .select('email, nom, couleur_primaire')
        .eq('id', installer_id)
        .single()

      if (profile?.email) {
        const couleur = profile.couleur_primaire ?? '#22D3EE'
        const companyNom = profile.nom ?? 'VoltPilot'
        const eur = (n: number) =>
          new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

        await resend.emails.send({
          from: `VoltPilot <onboarding@resend.dev>`,
          to: [profile.email],
          subject: `Nouveau lead widget — ${String(nom).trim()} (${ville ?? code_postal ?? ''})`,
          html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:28px 16px;">
    <div style="background:${couleur};border-radius:14px 14px 0 0;padding:24px 28px;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Nouveau lead reçu</p>
      <h1 style="margin:6px 0 0;color:white;font-size:20px;font-weight:700;">${String(nom).trim()}</h1>
    </div>
    <div style="background:white;border-radius:0 0 14px 14px;padding:24px 28px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;font-size:13px;color:#64748b;width:40%;">Email</td><td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${String(email).trim()}</td></tr>
        ${telephone ? `<tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Téléphone</td><td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${String(telephone).trim()}</td></tr>` : ''}
        ${(code_postal || ville) ? `<tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Localisation</td><td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${[ville, code_postal].filter(Boolean).join(' · ')}</td></tr>` : ''}
        <tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Projet</td><td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${type_projet ?? 'Résidentiel'}</td></tr>
        ${objectif ? `<tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Objectif</td><td style="padding:6px 0;font-size:13px;color:#0f172a;">${objectif}</td></tr>` : ''}
        ${surface ? `<tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Surface toiture</td><td style="padding:6px 0;font-size:13px;color:#0f172a;">${surface} m²</td></tr>` : ''}
        ${facture_mensuelle ? `<tr><td style="padding:6px 0;font-size:13px;color:#64748b;">Facture mensuelle</td><td style="padding:6px 0;font-size:13px;color:#0f172a;">${facture_mensuelle} €/mois</td></tr>` : ''}
        ${message ? `<tr><td style="padding:6px 0;font-size:13px;color:#64748b;vertical-align:top;">Message</td><td style="padding:6px 0;font-size:13px;color:#0f172a;font-style:italic;">"${String(message).trim()}"</td></tr>` : ''}
      </table>
      <div style="margin:20px 0 0;padding:16px;background:#f8fafc;border-radius:10px;border-left:3px solid ${couleur};">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Estimation calculée</p>
        <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">${estimation.nbPanneaux} panneaux · ${estimation.puissanceKwc} kWc · ${estimation.productionAnnuelle.toLocaleString('fr-FR')} kWh/an</p>
        <p style="margin:4px 0 0;font-size:13px;color:${couleur};font-weight:600;">Fourchette : ${eur(estimation.fourchetteMin)} — ${eur(estimation.fourchetteMax)} TTC</p>
      </div>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f1f5f9;">
        <a href="https://voltpilot.fr/leads" style="display:inline-block;padding:10px 20px;background:${couleur};color:white;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">Voir dans ${companyNom}</a>
      </div>
    </div>
    <p style="text-align:center;margin:16px 0 0;font-size:11px;color:#cbd5e1;">Notification automatique · VoltPilot</p>
  </div>
</body>
</html>`,
        })
      }
    } catch {
      // Email non bloquant — ne pas faire échouer la réponse
    }

    return NextResponse.json({
      success: true,
      estimation: {
        nb_panneaux: estimation.nbPanneaux,
        puissance_kwc: estimation.puissanceKwc,
        production_annuelle: estimation.productionAnnuelle,
        fourchette_min: estimation.fourchetteMin,
        fourchette_max: estimation.fourchetteMax,
        source: estimation.source,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET — authenticated: installer fetches their own leads
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json([], { status: 500 })

  const leads = (data ?? []).map(r => ({
    id: r.id,
    nom: r.nom,
    email: r.email,
    telephone: r.telephone ?? '',
    ville: r.ville ?? '',
    typeProjet: r.type_projet ?? 'Résidentiel',
    puissance: r.puissance_kwc ? `${r.puissance_kwc} kWc` : '',
    message: r.message ?? '',
    createdAt: r.created_at,
    status: r.statut as 'nouveau' | 'contacte' | 'converti',
    // V2 estimation
    surface: r.surface,
    factureMensuelle: r.facture_mensuelle,
    objectif: r.objectif,
    typeBien: r.type_bien,
    typeToiture: r.type_toiture,
    adresse: r.adresse,
    consentement: r.consentement,
    nbPanneaux: r.nb_panneaux,
    puissanceKwc: r.puissance_kwc,
    productionAnnuelle: r.production_annuelle,
    fourchetteMin: r.fourchette_min,
    fourchetteMax: r.fourchette_max,
  }))

  return NextResponse.json(leads)
}

// PATCH — authenticated: update lead status
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id, statut } = await request.json()
  if (!id || !statut) return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })

  const { error } = await supabase
    .from('leads')
    .update({ statut })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
