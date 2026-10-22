-- ============================================================
-- Migration : Contrainte UNIQUE sur newsletter_subscribers.email
-- ============================================================
-- À exécuter dans l'éditeur SQL de Supabase APRÈS avoir nettoyé
-- les doublons via le script ou le bouton dans l'interface admin.
--
-- Étape 1 : Vérifier qu'il n'y a plus de doublons (doit retourner 0 lignes)
SELECT email, COUNT(*) as nb
FROM newsletter_subscribers
GROUP BY email
HAVING COUNT(*) > 1;

-- Étape 2 : Ajouter la contrainte UNIQUE
-- (échouera si des doublons existent encore — d'où l'étape 1)
ALTER TABLE newsletter_subscribers
  ADD CONSTRAINT newsletter_subscribers_email_unique UNIQUE (email);

-- Étape 3 : (Optionnel) Normaliser les emails existants en minuscules
-- pour être cohérent avec la validation backend
UPDATE newsletter_subscribers
SET email = LOWER(TRIM(email))
WHERE email != LOWER(TRIM(email));

-- Vérification finale : lister les index de la table
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'newsletter_subscribers';
