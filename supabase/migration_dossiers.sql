-- Migration : table dossiers
CREATE TABLE IF NOT EXISTS dossiers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  nom         TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateur gère ses dossiers"
  ON dossiers FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_dossiers_user_id ON dossiers(user_id);
CREATE INDEX idx_dossiers_client_id ON dossiers(client_id);

-- Ajouter dossier_id sur la table devis
ALTER TABLE devis ADD COLUMN IF NOT EXISTS dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_devis_dossier_id ON devis(dossier_id);
