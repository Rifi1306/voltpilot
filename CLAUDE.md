@AGENTS.md

## Redesign en cours

Le fichier `REDESIGN.md` à la racine du projet contient les instructions complètes pour la refonte intégrale de VoltPilot (direction cosmique, Three.js photorealistic, mobile-first, multi-skill).

Pour lancer le redesign, ouvre `REDESIGN.md` et suis les étapes dans l'ordre.

### Stack actuelle
- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (auth + base de données)
- Stripe (paiement)
- Three.js déjà présent (`src/components/SolarScene.tsx`)
- Dashboard routes : clients, devis, dossiers, leads, analytics, agents, admin, settings
