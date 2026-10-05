CREATE TABLE IF NOT EXISTS invitation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES evenements(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  organization VARCHAR(150),
  job_title VARCHAR(150),
  phone VARCHAR(40),
  message TEXT,
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected')),
  processing_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE invitation_requests ADD COLUMN IF NOT EXISTS processing_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitation_requests_pending_email
  ON invitation_requests(event_id, lower(email))
  WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_invitation_requests_event_status
  ON invitation_requests(event_id, status, created_at DESC);

ALTER TABLE invitation_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE invitation_requests FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE invitation_requests TO service_role;