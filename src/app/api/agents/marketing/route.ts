import { NextRequest, NextResponse } from 'next/server'
import { runMarketingAgent } from '@/lib/agents/marketing-agent'
import { createClient } from '@/lib/supabase/server'

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  if (!cronSecret) return true
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

export async function POST(req: NextRequest) {
  // ⛔ BLOQUÉ — envoi d'emails suspendu jusqu'à ordre explicite du propriétaire
  // Ne pas retirer ce bloc sans autorisation de Naoufel Alaphilippe
  void req
  return NextResponse.json(
    { error: 'Agent marketing désactivé temporairement. Reprendre manuellement quand VoltPilot sera prêt.' },
    { status: 503 }
  )
}

// Vercel Cron — chaque lundi à 8h
export const GET = POST
