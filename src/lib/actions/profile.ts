'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!data) return null
  return { ...data, email: user.email ?? '' }
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
    rge_number: formData.get('rge_number') as string || null,
    assurance_decennale: formData.get('assurance_decennale') as string || null,
    iban: formData.get('iban') as string || null,
    garanties_defaut: formData.get('garanties_defaut') as string || null,
    mentions_legales: formData.get('mentions_legales') as string || null,
    conditions_paiement_defaut: formData.get('conditions_paiement_defaut') as string,
    validite_devis_defaut: parseInt(formData.get('validite_devis_defaut') as string) || 30,
    format_numero_devis: formData.get('format_numero_devis') as string || 'DEV-{YYYY}-{NUM}',
    format_numero_facture: formData.get('format_numero_facture') as string || 'FAC-{YYYY}-{NUM}',
    prime_autoconsommation: parseFloat(formData.get('prime_autoconsommation') as string) || 0,
    tarif_rachat_surplus: parseFloat(formData.get('tarif_rachat_surplus') as string) || 0.1288,
    hypotheses_note: formData.get('hypotheses_note') as string || null,
    couleur_primaire: formData.get('couleur_primaire') as string,
    widget_show_price: formData.get('widget_show_price') === 'true',
  }).eq('id', user.id)

  if (error) throw error
  revalidatePath('/settings')
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
