import Link from 'next/link'
import { getDossiers } from '@/lib/actions/dossiers'
import { Folder, Plus, Search, ChevronRight, Users, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DossiersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const dossiers = await getDossiers()

  const filtered = q
    ? dossiers.filter(d =>
        d.nom.toLowerCase().includes(q.toLowerCase()) ||
        (d.description ?? '').toLowerCase().includes(q.toLowerCase()) ||
        ((d.clients as { nom: string } | null)?.nom ?? '').toLowerCase().includes(q.toLowerCase())
      )
    : dossiers

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: '#0a0d16' }}>
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dossiers</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {dossiers.length} dossier{dossiers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dossiers/nouveau"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' }}
        >
          <Plus size={16} />
          Nouveau dossier
        </Link>
      </div>

      {/* Search */}
      <div className="px-6 pb-4">
        <form method="GET">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Rechercher un dossier..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        </form>
      </div>

      {/* List */}
      <div className="px-6 flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(14,165,233,0.1)' }}
            >
              <Folder size={28} style={{ color: '#0ea5e9' }} />
            </div>
            <p className="text-white font-semibold text-base">
              {q ? 'Aucun résultat' : 'Aucun dossier'}
            </p>
            <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {q ? 'Essayez un autre terme de recherche.' : 'Créez un dossier pour organiser vos projets.'}
            </p>
            {!q && (
              <Link
                href="/dossiers/nouveau"
                className="mt-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' }}
              >
                Créer mon premier dossier
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 pb-8">
            {filtered.map(d => {
              const client = d.clients as { nom: string } | null
              const devisCount = Array.isArray(d.devis) ? d.devis.length : 0
              return (
                <Link
                  key={d.id}
                  href={`/dossiers/${d.id}`}
                  className="group flex flex-col gap-3 p-4 rounded-2xl transition-all hover:border-sky-500/30"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(245,158,11,0.12)' }}
                      >
                        <Folder size={18} style={{ color: '#0ea5e9' }} />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm leading-tight">{d.nom}</p>
                        {client && (
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {client.nom}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.2)' }} className="flex-shrink-0 mt-1 group-hover:text-sky-400 transition-colors" />
                  </div>

                  {d.description && (
                    <p className="text-xs line-clamp-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {d.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {client && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        <Users size={11} />
                        {client.nom}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      <FileText size={11} />
                      {devisCount} devis
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
