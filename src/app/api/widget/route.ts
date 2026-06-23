import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST — public: visitor submits from the embedded widget
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { installer_id, nom, email, telephone, code_postal, ville, type_projet, message } = body

    if (!installer_id || !nom || !email) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

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
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
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
    puissance: '',
    message: r.message ?? '',
    createdAt: r.created_at,
    status: r.statut as 'nouveau' | 'contacte' | 'converti',
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
