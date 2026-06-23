'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return data
}

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('profiles').update({
    nom: formData.get('nom') as string,
    telephone: formData.get('telephone') as string || null,
    adresse: formData.get('adresse') as string || null,
    code_postal: formData.get('code_postal') as string || null,
    ville: formData.get('ville') as string || null,
    siret: formData.get('siret') as string || null,
    tva: formData.get('tva') as string || null,
    mentions_legales: formData.get('mentions_legales') as string || null,
    conditions_paiement_defaut: formData.get('conditions_paiement_defaut') as string,
    validite_devis_defaut: parseInt(formData.get('validite_devis_defaut') as string) || 30,
    couleur_primaire: formData.get('couleur_primaire') as string,
  }).eq('id', user.id)

  if (error) throw error
  revalidatePath('/settings')
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
