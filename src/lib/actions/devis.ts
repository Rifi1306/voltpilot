'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { addDays, format } from 'date-fns'
import type { Json } from '@/lib/supabase/types'

type LigneJson = { quantite: number; prixUnitaire: number; remise?: number; tva?: number; designation?: string; description?: string }

function toLignes(raw: Json): LigneJson[] {
  if (!Array.isArray(raw)) return []
  return raw as LigneJson[]
}

function calcCA(lignes: LigneJson[], remise: number): number {
  const ht = lignes.reduce((s, l) => {
    return s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100)
  }, 0)
  return ht * (1 - remise / 100)
}

export async function getDevis() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('devis')
    .select('*, clients(nom, email, ville)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getDevisById(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('devis')
    .select('*, clients(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data
}

export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { totalDevis: 0, devisAcceptes: 0, tauxConversion: 0, caTotal: 0, totalClients: 0 }

  const [devisResult, clientsResult] = await Promise.all([
    supabase.from('devis').select('statut, lignes, remise, acompte, created_at').eq('user_id', user.id),
    supabase.from('clients').select('id, created_at').eq('user_id', user.id),
  ])

  const allDevis = devisResult.data ?? []
  const allClients = clientsResult.data ?? []

  const totalDevis = allDevis.length
  const devisAcceptes = allDevis.filter(d => d.statut === 'accepte').length
  const tauxConversion = totalDevis > 0 ? Math.round((devisAcceptes / totalDevis) * 100) : 0

  const caTotal = allDevis
    .filter(d => d.statut === 'accepte')
    .reduce((sum, d) => sum + calcCA(toLignes(d.lignes), d.remise ?? 0), 0)

  return {
    totalDevis,
    devisAcceptes,
    tauxConversion,
    caTotal,
    totalClients: allClients.length,
  }
}

export async function createDevisAction(payload: {
  client_id: string
  lignes: LigneJson[]
  remise: number
  acompte: number
  conditions_paiement: string
  notes: string
  validite_jours: number
  dossier?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié — reconnectez-vous')

  const numero = `DEV-${Date.now()}`
  const date_validite = format(addDays(new Date(), payload.validite_jours), 'yyyy-MM-dd')

  console.log('[createDevis] insert payload:', {
    user_id: user.id,
    client_id: payload.client_id,
    numero,
    date_validite,
    lignes_count: payload.lignes.length,
  })

  const { data, error } = await supabase.from('devis').insert({
    user_id: user.id,
    client_id: payload.client_id,
    numero,
    statut: 'brouillon',
    lignes: payload.lignes as Json,
    remise: payload.remise,
    acompte: payload.acompte,
    conditions_paiement: payload.conditions_paiement,
    notes: payload.notes || null,
    dossier: payload.dossier || null,
    date_validite,
  }).select().single()

  if (error) {
    console.error('[createDevis] supabase error:', error)
    throw new Error(`Supabase: ${error.message} (code: ${error.code})`)
  }

  revalidatePath('/devis')
  revalidatePath(`/devis/${data.id}`)
  return { id: data.id }
}

export async function updateDevisStatut(id: string, statut: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('devis')
    .update({ statut: statut as 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire' })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/devis')
  revalidatePath(`/devis/${id}`)
}

export async function deleteDevisAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('devis').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/devis')
  redirect('/devis')
}
