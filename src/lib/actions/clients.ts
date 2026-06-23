'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getClients() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getClient(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('clients')
    .select('*, devis(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data
}

export async function createClientAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('clients').insert({
    user_id: user.id,
    nom: formData.get('nom') as string,
    email: formData.get('email') as string || null,
    telephone: formData.get('telephone') as string || null,
    adresse: formData.get('adresse') as string || null,
    code_postal: formData.get('code_postal') as string || null,
    ville: formData.get('ville') as string || null,
    siret: formData.get('siret') as string || null,
    notes: formData.get('notes') as string || null,
  })

  if (error) throw error
  revalidatePath('/clients')
  redirect('/clients')
}

export async function updateClientAction(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('clients').update({
    nom: formData.get('nom') as string,
    email: formData.get('email') as string || null,
    telephone: formData.get('telephone') as string || null,
    adresse: formData.get('adresse') as string || null,
    code_postal: formData.get('code_postal') as string || null,
    ville: formData.get('ville') as string || null,
    siret: formData.get('siret') as string || null,
    notes: formData.get('notes') as string || null,
  }).eq('id', id).eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  redirect(`/clients/${id}`)
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('clients').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/clients')
  redirect('/clients')
}
