import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeEstimationWithPVGIS } from '@/lib/estimation'

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
