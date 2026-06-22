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
  image_url TEXT,
  image_detail_url TEXT,
  date_evenement TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
  ciblage VARCHAR DEFAULT 'tous' CHECK (ciblage IN ('tous', 'specifique')),
  destinataires UUID[], -- Array of subscriber IDs if ciblage is 'specifique'
  statut VARCHAR DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'en_cours', 'envoye')),
  date_envoi TIMESTAMPTZ,
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
