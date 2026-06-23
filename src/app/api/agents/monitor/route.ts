import { NextRequest, NextResponse } from 'next/server'
import { runMonitorAgent } from '@/lib/agents/monitor-agent'
import { createClient } from '@/lib/supabase/server'

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  // Allow Vercel Cron with secret
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  // Allow if no secret configured (dev)
  if (!cronSecret) return true
  // Allow authenticated dashboard users
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  try {
    const result = await runMonitorAgent()
    return NextResponse.json({ success: true, ...result })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export const GET = POST
