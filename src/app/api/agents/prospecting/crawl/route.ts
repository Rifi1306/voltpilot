import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function table(supabase: any, name: string) { return supabase.from(name) }

// Countries to crawl in rotation (1 per night to respect rate limits)
const CRAWL_ROTATION = [
  { country: 'FR', offset_key: 'fr_offset', query_key: 'fr_query' },
  { country: 'BE' },
  { country: 'CH' },
  { country: 'LU' },
  { country: 'DE' },
  { country: 'ES' },
  { country: 'GB' },
  { country: 'US' },
  { country: 'UAE' },
  { country: 'AU' },
  { country: 'CA' },
  { country: 'IT' },
  { country: 'NL' },
  { country: 'PT' },
  { country: 'MA' },
  { country: 'ZA' },
  { country: 'IN' },
  { country: 'BR' },
  { country: 'SG' },
  { country: 'JP' },
]

export async function GET() {
  return NextResponse.json({ message: 'POST to trigger crawl' })
}

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Determine which country to crawl tonight based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const target = CRAWL_ROTATION[dayOfYear % CRAWL_ROTATION.length]

    // Get current offset for France (track progress through 11k records)
    let frOffset = 0
    let frQueryIndex = 0
    if (target.country === 'FR') {
      const { data: state } = await table(supabase, 'prospects_vp')
        .select('id', { count: 'exact', head: true })
        .eq('pays', 'FR')
      frOffset = ((state as { count: number } | null)?.count ?? 0)
      frOffset = Math.min(frOffset, 10900)
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://voltpilot.fr'
    const body = target.country === 'FR'
      ? { offset: frOffset, query_index: frQueryIndex }
      : { country: target.country }

    const res = await fetch(`${baseUrl}/api/agents/prospecting/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const result = await res.json()

    // Log to site_alerts for visibility
    await table(supabase, 'site_alerts').insert({
      type: 'prospection_crawl',
      severite: 'info',
      message: `Crawl nuit — ${target.country}: +${result.added ?? 0} prospects ajoutés`,
      details: result,
      resolu: true,
    })

    return NextResponse.json({ ok: true, country: target.country, result })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
