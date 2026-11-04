-- Restrict direct Data API access to application tables.
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'evenements',
    'invites',
    'invitations',
    'invitation_requests',
    'checkins',
    'audit_logs',
    'actualites',
    'article_ratings',
    'users',
    'contact_messages',
    'newsletter_subscribers',
    'newsletter_campaigns',
    'revue_presse',
    'hero_slides',
    'livre_dor'
  ]
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      EXECUTE format(
        'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated',
        table_name
      );
    END IF;
  END LOOP;
END;
$$;
