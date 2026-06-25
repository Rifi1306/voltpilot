'use client'
import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'

import { useLanguage } from '@/i18n/LanguageContext'
import { getClients } from '@/lib/actions/clients'
import { getDevis } from '@/lib/actions/devis'
import { Search, MapPin, Mail, Phone, FileText, Plus, Users } from 'lucide-react'
import Link from 'next/link'

type SClient = {
  id: string
  nom: string
  email: string | null
  telephone: string | null
  adresse: string | null
  code_postal: string | null
  ville: string | null
  created_at: string
}

type SDevis = {
  id: string
  client_id: string | null
  statut: string
  lignes: unknown
  remise: number | null
}

function rawTTC(lignes: unknown, remise: number = 0): number {
  if (!Array.isArray(lignes)) return 0
  const rows = lignes as Array<{ quantite: number; prixUnitaire: number; remise?: number; tva?: number }>
  const ht = rows.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0)
  const tva = rows.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100) * ((l.tva ?? 20) / 100), 0)
  return (ht + tva) * (1 - remise / 100)
}

export default function ClientsPage() {
  const { t, locale, formatCurrency } = useLanguage()
  const [clients, setClients] = useState<SClient[]>([])
  const [allDevis, setAllDevis] = useState<SDevis[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([getClients(), getDevis()])
      .then(([c, d]) => {
        setClients(c as SClient[])
        setAllDevis(d as unknown as SDevis[])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = clients.filter(c =>
    search === '' ||
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.ville ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-auto">
      <Header
        title={t.clients.title}
        subtitle={loading ? '…' : t.clients.registered.replace('{n}', String(clients.length))}
        action={{ label: t.clients.newClient, href: '/clients/nouveau' }}
      />

      <div className="p-6 space-y-5">
        {/* Search */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t.clients.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 w-full transition-all"
            />
          </div>
          {!loading && <span className="text-sm text-slate-400">{filtered.length} {t.clients.results}</span>}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="volt-spinner" />
          </div>
        )}

        {/* Empty state */}
        {!loading && clients.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Users size={40} className="text-slate-200 mx-auto mb-4" />
            <p className="font-semibold text-slate-700 mb-1">Aucun client pour le moment</p>
            <p className="text-sm text-slate-400 mb-5">Ajoutez votre premier client pour commencer à créer des devis</p>
            <Link href="/clients/nouveau" className="btn-primary text-sm inline-flex">
              <Plus size={15} /> Ajouter un client
            </Link>
          </div>
        )}

        {/* Grid clients */}
        {!loading && clients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((client) => {
              const clientDevis = allDevis.filter(d => d.client_id === client.id)
              const totalCA = clientDevis
                .filter(d => d.statut === 'accepte')
                .reduce((sum, d) => sum + rawTTC(d.lignes, d.remise ?? 0), 0)
              const nbDevis = clientDevis.length

              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="stat-card group cursor-pointer border hover:border-cyan-300 hover:shadow-lg transition-all duration-200 block"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {client.nom.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors truncate">{client.nom}</h3>
                      {client.ville && (
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin size={11} /> {client.ville}{client.code_postal ? ` (${client.code_postal})` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {client.email && (
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        <Mail size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </p>
                    )}
                    {client.telephone && (
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        <Phone size={13} className="text-slate-400 flex-shrink-0" />
                        {client.telephone}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <FileText size={13} className="text-slate-400" />
                      <span>{nbDevis} {t.clients.quotes}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{totalCA > 0 ? formatCurrency(totalCA) : '—'}</p>
                      <p className="text-xs text-slate-400">{t.clients.revenue}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-2">
                    {t.clients.since} {new Date(client.created_at).toLocaleDateString(locale)}
                  </p>
                </Link>
              )
            })}

            {/* Add card */}
            <Link
              href="/clients/nouveau"
              className="rounded-2xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center gap-3 hover:border-cyan-300 hover:bg-cyan-50/30 transition-all duration-200 cursor-pointer min-h-[160px]"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Plus size={22} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-500">{t.clients.addClient}</p>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
