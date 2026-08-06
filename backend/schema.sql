-- ============================================================
-- Musée Virtuel de Guinée — Supabase Schema
-- ============================================================

-- evenements
CREATE TABLE IF NOT EXISTS evenements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre VARCHAR NOT NULL,
  description TEXT,
  date_debut TIMESTAMPTZ,
  date_fin TIMESTAMPTZ,
  lieu VARCHAR,
  capacite INTEGER,
  image_url TEXT,
  statut VARCHAR DEFAULT 'brouillon',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- invites
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom VARCHAR NOT NULL,
  nom VARCHAR NOT NULL,
  email VARCHAR,
  telephone VARCHAR,
  organisation VARCHAR,
  titre_poste VARCHAR,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evenement_id UUID REFERENCES evenements(id) ON DELETE CASCADE,
  invite_id UUID REFERENCES invites(id) ON DELETE CASCADE,
  token VARCHAR UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  statut VARCHAR DEFAULT 'pas_de_reaction',
  date_envoi TIMESTAMPTZ,
  date_reponse TIMESTAMPTZ,
  heure_arrivee TIMESTAMPTZ,
  agent_checkin VARCHAR,
  notes_rsvp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(evenement_id, invite_id)
);

-- checkins (log)
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID REFERENCES invitations(id),
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  agent VARCHAR,
  device_info TEXT,
  success BOOLEAN DEFAULT TRUE,
  message TEXT
);

-- actualites
CREATE TABLE IF NOT EXISTS actualites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre VARCHAR NOT NULL,
  description TEXT,
  contenu TEXT,
  auteur VARCHAR,
  image_url TEXT,
  image_detail_url TEXT,
  date_evenement TIMESTAMPTZ DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- article_ratings (une note par IP par article)
CREATE TABLE IF NOT EXISTS article_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES actualites(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, ip_hash)
);

-- users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  prenom VARCHAR,
  nom VARCHAR,
  role VARCHAR NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom VARCHAR NOT NULL,
  nom VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  sujet VARCHAR NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Trigger: update updated_at automatically
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_evenements_updated
  BEFORE UPDATE ON evenements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_invites_updated
  BEFORE UPDATE ON invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_invitations_updated
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_actualites_updated
  BEFORE UPDATE ON actualites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_contact_messages_updated
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Indexes for common queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_invitations_evenement_id ON invitations(evenement_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invite_id ON invitations(invite_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_statut ON invitations(statut);
CREATE INDEX IF NOT EXISTS idx_checkins_invitation_id ON checkins(invitation_id);

-- ============================================================
-- Newsletter
-- ============================================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  prenom VARCHAR,
  nom VARCHAR,
  institution VARCHAR,
  fonction VARCHAR,
  statut VARCHAR DEFAULT 'actif' CHECK (statut IN ('actif', 'desabonne')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- newsletter_campaigns
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre_interne VARCHAR NOT NULL,
  sujet_email VARCHAR NOT NULL,
  type_source VARCHAR DEFAULT 'manuel' CHECK (type_source IN ('manuel', 'actualite', 'evenement', 'bulletin')),
  source_id UUID, -- References actualites(id) or evenements(id) if applicable
  contenu_personnalise TEXT,
  ciblage TEXT DEFAULT 'tous' CHECK (ciblage IN ('tous', 'specifique')),
  destinataires UUID[] DEFAULT '{}',
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'en_cours', 'envoye', 'erreur')),
  date_envoi TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  failed_emails JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_newsletter_campaigns_updated
  BEFORE UPDATE ON newsletter_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_newsletter_subscribers_updated
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Revue de Presse
-- ============================================================

CREATE TABLE IF NOT EXISTS revue_presse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre VARCHAR NOT NULL,
  media_nom VARCHAR NOT NULL,
  description TEXT,
  url_lien TEXT,
  date_publication TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_revue_presse_updated
  BEFORE UPDATE ON revue_presse
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Hero Slides
-- ============================================================

CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre_principal VARCHAR,
  titre_secondaire VARCHAR,
  sous_titre TEXT,
  media_url TEXT NOT NULL,
  media_type VARCHAR DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  ordre INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_hero_slides_updated
  BEFORE UPDATE ON hero_slides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Livre d'Or
-- ============================================================

CREATE TABLE IF NOT EXISTS livre_dor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author VARCHAR NOT NULL,
  location VARCHAR,
  genre VARCHAR DEFAULT 'homme',
  text TEXT NOT NULL,
  date VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_livre_dor_updated
  BEFORE UPDATE ON livre_dor
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

