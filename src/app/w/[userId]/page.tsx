import { createAdminClient } from '@/lib/supabase/admin'
import { WidgetForm } from './WidgetForm'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function WidgetPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params

  if (!userId || userId.length < 10) return notFound()

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('nom, couleur_primaire, widget_show_price')
    .eq('id', userId)
    .single()

  if (!profile) return notFound()

  return (
    <WidgetForm
      installerId={userId}
      companyNom={profile.nom ?? 'Votre installateur solaire'}
      couleur={profile.couleur_primaire ?? '#0ea5e9'}
      showPrice={profile.widget_show_price ?? true}
    />
  )
}
