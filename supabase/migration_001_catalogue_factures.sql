-- ============================================================
-- VoltPilot — Migration 001 : Catalogue, Kits, Factures
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

-- ─── 1. Enrichissement de profiles ─────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rge_number              TEXT,
  ADD COLUMN IF NOT EXISTS assurance_decennale     TEXT,
  ADD COLUMN IF NOT EXISTS iban                    TEXT,
  ADD COLUMN IF NOT EXISTS garanties_defaut        TEXT DEFAULT 'Garantie décennale 10 ans. Garantie produits selon fabricant. Garantie de production selon onduleur.',
  ADD COLUMN IF NOT EXISTS format_numero_devis     TEXT NOT NULL DEFAULT 'DEV-{YYYY}-{NUM}',
  ADD COLUMN IF NOT EXISTS format_numero_facture   TEXT NOT NULL DEFAULT 'FAC-{YYYY}-{NUM}',
  ADD COLUMN IF NOT EXISTS prime_autoconsommation  NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tarif_rachat_surplus    NUMERIC(10,4) DEFAULT 0.1288,
  ADD COLUMN IF NOT EXISTS hypotheses_note         TEXT DEFAULT 'Hypothèses économiques à vérifier : prime, tarif de rachat, taux TVA, aides locales.',
  ADD COLUMN IF NOT EXISTS widget_show_price       BOOLEAN NOT NULL DEFAULT true;

-- ─── 2. Enrichissement de devis ────────────────────────────
ALTER TABLE devis
  ADD COLUMN IF NOT EXISTS type_client          TEXT DEFAULT 'particulier',
  ADD COLUMN IF NOT EXISTS adresse_chantier     TEXT,
  ADD COLUMN IF NOT EXISTS code_postal_chantier TEXT,
  ADD COLUMN IF NOT EXISTS ville_chantier       TEXT,
  ADD COLUMN IF NOT EXISTS type_projet          TEXT DEFAULT 'residentiel',
  ADD COLUMN IF NOT EXISTS type_couverture      TEXT,
  ADD COLUMN IF NOT EXISTS type_pose            TEXT DEFAULT 'surimposition',
  ADD COLUMN IF NOT EXISTS orientation          TEXT DEFAULT 'Sud',
  ADD COLUMN IF NOT EXISTS inclinaison          TEXT DEFAULT 'Optimal (30–35°)',
  ADD COLUMN IF NOT EXISTS reseau               TEXT DEFAULT 'monophase',
  ADD COLUMN IF NOT EXISTS ombrage              BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS puissance_kwc        NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS nb_panneaux          INTEGER,
  ADD COLUMN IF NOT EXISTS production_kwh_an    NUMERIC(10,0),
  ADD COLUMN IF NOT EXISTS etude_eco            JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lots                 JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS marge_interne        NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS dossier_id           UUID REFERENCES dossiers(id) ON DELETE SET NULL;

-- ─── 3. Table catalogue_produits ────────────────────────────
CREATE TABLE IF NOT EXISTS catalogue_produits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reference    TEXT,
  designation  TEXT NOT NULL,
  famille      TEXT NOT NULL,
  description  TEXT,
  marque       TEXT,
  modele       TEXT,
  unite        TEXT NOT NULL DEFAULT 'unité',
  prix_achat   NUMERIC(10,2) NOT NULL DEFAULT 0,
  prix_vente   NUMERIC(10,2) NOT NULL DEFAULT 0,
  tva          NUMERIC(5,2) NOT NULL DEFAULT 20,
  type_projet  TEXT NOT NULL DEFAULT 'les_deux',
  actif        BOOLEAN NOT NULL DEFAULT true,
  ordre        INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE catalogue_produits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateur gère son catalogue"
  ON catalogue_produits FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_catalogue_user_id ON catalogue_produits(user_id);
CREATE INDEX IF NOT EXISTS idx_catalogue_famille ON catalogue_produits(famille);

-- ─── 4. Table kits_projets ──────────────────────────────────
CREATE TABLE IF NOT EXISTS kits_projets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nom          TEXT NOT NULL,
  description  TEXT,
  type_projet  TEXT NOT NULL DEFAULT 'les_deux',
  lignes       JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE kits_projets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateur gère ses kits"
  ON kits_projets FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_kits_user_id ON kits_projets(user_id);

-- ─── 5. Table factures ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS factures (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  devis_id            UUID REFERENCES devis(id) ON DELETE SET NULL,
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  numero              TEXT NOT NULL,
  statut              TEXT NOT NULL DEFAULT 'emise',
  lignes              JSONB NOT NULL DEFAULT '[]',
  lots                JSONB DEFAULT '[]',
  remise              NUMERIC(5,2) NOT NULL DEFAULT 0,
  acompte_verse       NUMERIC(10,2) DEFAULT 0,
  conditions_paiement TEXT NOT NULL DEFAULT '30 jours net',
  date_echeance       DATE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE factures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateur gère ses factures"
  ON factures FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_factures_user_id   ON factures(user_id);
CREATE INDEX IF NOT EXISTS idx_factures_client_id ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut    ON factures(statut);

-- ─── 6. Table dossiers (si absente) ─────────────────────────
CREATE TABLE IF NOT EXISTS dossiers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nom         TEXT NOT NULL,
  description TEXT,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Utilisateur gère ses dossiers"
  ON dossiers FOR ALL
  USING (auth.uid() = user_id);
