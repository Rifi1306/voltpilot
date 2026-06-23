-- ============================================================
-- VoltPilot — Schéma Supabase
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

-- Type enum pour les statuts de devis
CREATE TYPE devis_statut AS ENUM ('brouillon', 'envoye', 'accepte', 'refuse', 'expire');

-- ─── Profiles ───────────────────────────────────────────────
-- Lié à auth.users via trigger
CREATE TABLE profiles (
  id                          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                       TEXT NOT NULL,
  nom                         TEXT NOT NULL DEFAULT '',
  telephone                   TEXT,
  adresse                     TEXT,
  code_postal                 TEXT,
  ville                       TEXT,
  siret                       TEXT,
  tva                         TEXT,
  mentions_legales            TEXT DEFAULT 'Devis valable 30 jours. TVA non applicable, article 293 B du CGI.',
  conditions_paiement_defaut  TEXT NOT NULL DEFAULT '30 jours net',
  validite_devis_defaut       INT  NOT NULL DEFAULT 30,
  couleur_primaire            TEXT NOT NULL DEFAULT '#f59e0b',
  plan                        TEXT NOT NULL DEFAULT 'starter',
  stripe_customer_id          TEXT,
  stripe_subscription_id      TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateur voit son propre profil"
  ON profiles FOR ALL
  USING (auth.uid() = id);

-- Trigger : crée un profil à chaque inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── Clients ────────────────────────────────────────────────
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nom         TEXT NOT NULL,
  email       TEXT,
  telephone   TEXT,
  adresse     TEXT,
  code_postal TEXT,
  ville       TEXT,
  siret       TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateur gère ses clients"
  ON clients FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_clients_user_id ON clients(user_id);

-- ─── Devis ──────────────────────────────────────────────────
CREATE TABLE devis (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id            UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  numero               TEXT NOT NULL,
  statut               devis_statut NOT NULL DEFAULT 'brouillon',
  lignes               JSONB NOT NULL DEFAULT '[]',
  remise               NUMERIC(5,2) NOT NULL DEFAULT 0,
  acompte              NUMERIC(5,2) NOT NULL DEFAULT 0,
  conditions_paiement  TEXT NOT NULL DEFAULT '30 jours net',
  notes                TEXT,
  date_validite        DATE NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE devis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateur gère ses devis"
  ON devis FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_devis_user_id   ON devis(user_id);
CREATE INDEX idx_devis_client_id ON devis(client_id);
CREATE INDEX idx_devis_statut    ON devis(statut);
