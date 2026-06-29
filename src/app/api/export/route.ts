import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const [profile, clients, devis, factures, leads] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('clients').select('*').eq('user_id', user.id),
      supabase.from('devis').select('*').eq('user_id', user.id),
      supabase.from('factures').select('*').eq('user_id', user.id),
      supabase.from('leads').select('*').eq('user_id', user.id),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      account: { email: user.email, created_at: user.created_at },
      profile: profile.data,
      clients: clients.data ?? [],
      devis: devis.data ?? [],
      factures: factures.data ?? [],
      leads: leads.data ?? [],
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="voltpilot-data-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    return NextResponse.json({ error: 'Erreur lors de l\'export.' }, { status: 500 })
  }
}
