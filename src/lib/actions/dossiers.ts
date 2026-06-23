'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type Dossier = {
  id: string
  user_id: string
  client_id: string | null
  nom: string
  description: string | null
  created_at: string
  clients?: { nom: string } | null
  devis?: { id: string }[]
}

export type DossierDetail = {
  id: string
  user_id: string
  client_id: string | null
  nom: string
  description: string | null
  created_at: string
  clients?: { id: string; nom: string; email: string; telephone: string } | null
  devis?: { id: string; numero: string; statut: string; created_at: string; clients: { nom: string } | null }[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = async () => (await createClient()) as any

export async function getDossiers(): Promise<Dossier[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await (await db())
    .from('dossiers')
    .select('*, clients(nom), devis(id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Dossier[]
}

export async function getDossier(id: string): Promise<DossierDetail | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await (await db())
    .from('dossiers')
    .select('*, clients(id, nom, email, telephone), devis(id, numero, statut, created_at, clients(nom))')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data as DossierDetail
}

export async function createDossier(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const nom = formData.get('nom') as string
  const description = formData.get('description') as string | null
  const client_id = formData.get('client_id') as string | null

  const { error } = await (await db()).from('dossiers').insert({
    user_id: user!.id,
    nom,
    description: description || null,
    client_id: client_id || null,
  })

  if (error) throw error
  revalidatePath('/dossiers')
  redirect('/dossiers')
}

export async function updateDossier(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const nom = formData.get('nom') as string
  const description = formData.get('description') as string | null
  const client_id = formData.get('client_id') as string | null

  const { error } = await (await db())
    .from('dossiers')
    .update({ nom, description: description || null, client_id: client_id || null })
    .eq('id', id)
    .eq('user_id', user!.id)

  if (error) throw error
  revalidatePath('/dossiers')
  revalidatePath(`/dossiers/${id}`)
  redirect(`/dossiers/${id}`)
}

export async function deleteDossier(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await (await db())
    .from('dossiers')
    .delete()
    .eq('id', id)
    .eq('user_id', user!.id)

  if (error) throw error
  revalidatePath('/dossiers')
  redirect('/dossiers')
}
