-- ============================================================
-- VoltPilot — Migration : Agent de prospection
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS prospects_vp (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise            TEXT NOT NULL,
  contact_prenom        TEXT,
  email                 TEXT NOT NULL UNIQUE,
  region                TEXT,
  type_activite         TEXT DEFAULT 'résidentiel', -- résidentiel, tertiaire, agricole, industriel
  pays                  TEXT DEFAULT 'FR',
  etape                 TEXT DEFAULT 'initial',     -- initial, relance1, relance2, stop
  statut                TEXT DEFAULT 'a_envoyer',   -- a_envoyer, envoye, reponse_positive, reponse_negative, desabonne
  email_sujet           TEXT,
  email_corps           TEXT,
  date_premier_contact  TIMESTAMPTZ,
  date_dernier_contact  TIMESTAMPTZ,
  date_prochaine_action TIMESTAMPTZ DEFAULT NOW(),
  reponse               TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- RLS : table interne admin uniquement, pas de RLS user
ALTER TABLE prospects_vp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_only_prospects_vp"
  ON prospects_vp
  FOR ALL
  USING (true);
