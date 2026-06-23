import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email, password, nom } = await req.json() as { email: string; password: string; nom: string }

    if (!email || !password || !nom) {
      return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Vérifie si l'email est déjà utilisé
    const { data: existing } = await admin.auth.admin.listUsers()
    const emailTaken = existing?.users?.some(u => u.email === email)
    if (emailTaken) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 409 })
    }

    // Crée le compte et confirme l'email automatiquement (bypass email confirmation)
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nom },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Connecte l'utilisateur immédiatement
    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      return NextResponse.json({ error: 'Compte créé mais connexion échouée. Connectez-vous manuellement.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: data.user?.id })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur. Veuillez réessayer.' }, { status: 500 })
  }
}
