'use client'
import { Trash2 } from 'lucide-react'

export function DeleteDossierButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all hover:bg-red-500/20"
        style={{ background: 'rgba(255,255,255,0.05)', color: '#ef4444' }}
        onClick={e => {
          if (!confirm('Supprimer ce dossier ? Les devis ne seront pas supprimés.')) e.preventDefault()
        }}
      >
        <Trash2 size={13} />
        Supprimer
      </button>
    </form>
  )
}
