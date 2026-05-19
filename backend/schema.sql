-- ============================================================
-- Musée Virtuel de Guinée — Supabase Schema
-- ============================================================

-- evenements
CREATE TABLE IF NOT EXISTS evenements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre VARCHAR NOT NULL,
  description TEXT,
  date_debut TIMESTAMPTZ NOT NULL,
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

-- ============================================================
-- Indexes for common queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_invitations_evenement_id ON invitations(evenement_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invite_id ON invitations(invite_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_statut ON invitations(statut);
CREATE INDEX IF NOT EXISTS idx_checkins_invitation_id ON checkins(invitation_id);
