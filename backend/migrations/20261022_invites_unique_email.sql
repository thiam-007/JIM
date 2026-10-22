BEGIN;

CREATE TEMP TABLE invite_email_cleanup ON COMMIT DROP AS
WITH normalized AS (
  SELECT
    id,
    lower(btrim(email)) AS normalized_email,
    regexp_replace(
      lower(translate(concat_ws('', prenom, nom), 'àáâäãåçèéêëìíîïñòóôöõùúûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy')),
      '[^a-z0-9]',
      '',
      'g'
    ) AS name_key,
    regexp_replace(
      lower(translate(split_part(btrim(email), '@', 1), 'àáâäãåçèéêëìíîïñòóôöõùúûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy')),
      '[^a-z0-9]',
      '',
      'g'
    ) AS email_key,
    created_at
  FROM invites
  WHERE email IS NOT NULL AND btrim(email) <> ''
), duplicates AS (
  SELECT normalized_email
  FROM normalized
  GROUP BY normalized_email
  HAVING count(*) > 1
), ranked AS (
  SELECT
    normalized.*,
    row_number() OVER (
      PARTITION BY normalized.normalized_email
      ORDER BY (normalized.name_key = normalized.email_key AND normalized.name_key <> '') DESC,
        normalized.created_at ASC NULLS LAST,
        normalized.id
    ) AS position
  FROM normalized
  JOIN duplicates USING (normalized_email)
)
SELECT
  id,
  normalized_email,
  first_value(id) OVER (PARTITION BY normalized_email ORDER BY position) AS keep_id,
  position,
  name_key = email_key AND name_key <> '' AS name_matches_email
FROM ranked;

DO $$
DECLARE
  unresolved_emails TEXT;
  conflicting_emails TEXT;
BEGIN
  SELECT string_agg(normalized_email, ', ' ORDER BY normalized_email)
  INTO unresolved_emails
  FROM (
    SELECT normalized_email
    FROM invite_email_cleanup
    GROUP BY normalized_email
    HAVING NOT bool_or(name_matches_email)
  ) unresolved;

  IF unresolved_emails IS NOT NULL THEN
    RAISE EXCEPTION 'Nettoyage interrompu : aucun nom ne correspond à la partie avant @ pour ces emails : %', unresolved_emails;
  END IF;

  SELECT string_agg(DISTINCT cleanup.normalized_email, ', ' ORDER BY cleanup.normalized_email)
  INTO conflicting_emails
  FROM invite_email_cleanup cleanup
  JOIN invitations source_invitation ON source_invitation.invite_id = cleanup.id
  JOIN invitations kept_invitation
    ON kept_invitation.invite_id = cleanup.keep_id
    AND kept_invitation.evenement_id = source_invitation.evenement_id
  WHERE cleanup.id <> cleanup.keep_id;

  IF conflicting_emails IS NOT NULL THEN
    RAISE EXCEPTION 'Nettoyage interrompu : des invitations existent déjà pour le même événement et ces emails : %', conflicting_emails;
  END IF;
END $$;

UPDATE invitations invitation
SET invite_id = cleanup.keep_id
FROM invite_email_cleanup cleanup
WHERE invitation.invite_id = cleanup.id
  AND cleanup.id <> cleanup.keep_id;

DELETE FROM invites invite
USING invite_email_cleanup cleanup
WHERE invite.id = cleanup.id
  AND cleanup.id <> cleanup.keep_id;

UPDATE invites
SET email = lower(btrim(email))
WHERE email IS NOT NULL AND email <> lower(btrim(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_invites_email_normalized_unique
  ON invites (lower(btrim(email)))
  WHERE email IS NOT NULL AND btrim(email) <> '';

COMMIT;