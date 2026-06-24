-- ================================================================
-- Migration Widget V2 — Table leads + estimation
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ================================================================

-- ─── Leads (Widget) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nom                  TEXT NOT NULL,
  email                TEXT NOT NULL,
  telephone            TEXT,
  code_postal          TEXT,
  ville                TEXT,
  type_projet          TEXT,
  message              TEXT,
  statut               TEXT NOT NULL DEFAULT 'nouveau',
  -- Champs V2 (formulaire enrichi)
  surface              NUMERIC(8,2),
  facture_mensuelle    NUMERIC(8,2),
  objectif             TEXT,
  type_bien            TEXT,
  type_toiture         TEXT,
  adresse              TEXT,
  consentement         BOOLEAN NOT NULL DEFAULT false,
  -- Résultats estimation automatique
  nb_panneaux          INTEGER,
  puissance_kwc        NUMERIC(8,2),
  production_annuelle  NUMERIC(10,2),
  fourchette_min       NUMERIC(10,2),
  fourchette_max       NUMERIC(10,2),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Installateur voit ses leads"
  ON leads FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);

-- Option widget : afficher ou masquer la fourchette de prix
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS widget_show_price BOOLEAN NOT NULL DEFAULT true;
