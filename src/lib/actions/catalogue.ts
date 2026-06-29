'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

import type { ProduitCatalogue, Kit, LigneKit } from '@/lib/catalogue-shared'

export async function getCatalogue() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('catalogue_produits')
    .select('*')
    .eq('user_id', user.id)
    .order('famille')
    .order('ordre')
    .order('designation')

  if (error) return []
  return (data ?? []) as ProduitCatalogue[]
}

export async function getCatalogueActif() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('catalogue_produits')
    .select('*')
    .eq('user_id', user.id)
    .eq('actif', true)
    .order('famille')
    .order('ordre')

  if (error) return []
  return (data ?? []) as ProduitCatalogue[]
}

export async function createProduitAction(payload: {
  reference?: string
  designation: string
  famille: string
  description?: string
  marque?: string
  modele?: string
  unite?: string
  prix_achat: number
  prix_vente: number
  tva: number
  type_projet: string
}): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const { data, error } = await supabase
      .from('catalogue_produits')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single()

    if (error) return { error: error.message }
    revalidatePath('/catalogue')
    return { id: data.id }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function updateProduitAction(id: string, payload: Partial<{
  reference: string
  designation: string
  famille: string
  description: string
  marque: string
  modele: string
  unite: string
  prix_achat: number
  prix_vente: number
  tva: number
  type_projet: string
  actif: boolean
  ordre: number
}>): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const { error } = await supabase
      .from('catalogue_produits')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/catalogue')
    return { ok: true }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function deleteProduitAction(id: string): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const { error } = await supabase
      .from('catalogue_produits')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/catalogue')
    return { ok: true }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function getKits() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('kits_projets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as Kit[]
}

export async function createKitAction(payload: {
  nom: string
  description?: string
  type_projet: string
  lignes: LigneKit[]
}): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const { data, error } = await supabase
      .from('kits_projets')
      .insert({ ...payload, user_id: user.id, lignes: payload.lignes as unknown as import('@/lib/supabase/types').Json })
      .select()
      .single()

    if (error) return { error: error.message }
    revalidatePath('/catalogue')
    return { id: data.id }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function deleteKitAction(id: string): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const { error } = await supabase
      .from('kits_projets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/catalogue')
    return { ok: true }
  } catch (e) {
    return { error: String(e) }
  }
}
