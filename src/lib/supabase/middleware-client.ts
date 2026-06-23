import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from './types'

const PROTECTED = ['/dashboard', '/devis', '/clients', '/analytics', '/settings']
const AUTH_PAGES = ['/login', '/register']
const GRACE_DAYS = 14

function isTrialActive(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= GRACE_DAYS
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const isProtected = PROTECTED.some(r => pathname.startsWith(r))
  const isAuthPage = AUTH_PAGES.includes(pathname)

  // Non connecté → login
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Déjà connecté → dashboard
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Vérification abonnement sur les routes protégées
  if (isProtected && user && pathname !== '/billing') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, plan, created_at')
      .eq('id', user.id)
      .single()

    if (profile) {
      const status = profile.subscription_status
      const inTrial = status === 'trialing' && isTrialActive(profile.created_at)
      const isActive = status === 'active' || inTrial

      if (!isActive) {
        const url = new URL('/billing', request.url)
        url.searchParams.set('status', status)
        return NextResponse.redirect(url)
      }
    }
  }

  return response
}
