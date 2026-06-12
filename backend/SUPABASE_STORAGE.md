# Supabase Storage pour les images MVG

## Buckets recommandés

Le backend tente de créer automatiquement les buckets suivants au démarrage :

- actualites : images de couverture et de détail des articles
- hero : images du slider hero du site

## Pré-requis

Dans votre environnement backend, assurez-vous d’avoir :

- SUPABASE_URL
- SUPABASE_SERVICE_KEY

Optionnellement :

- SUPABASE_NEWS_BUCKET=actualites
- SUPABASE_HERO_BUCKET=hero

## Création manuelle depuis le dashboard Supabase

1. Ouvrez votre projet Supabase.
2. Allez dans Storage.
3. Créez deux buckets publics :
   - actualites
   - hero
4. Définissez les règles de stockage selon vos besoins (public si vous souhaitez afficher les images directement dans la vitrine).

## Vérification

Après démarrage du backend, les buckets seront créés automatiquement si l’utilisateur service role dispose des droits suffisants.

Si vous voulez forcer un bucket spécifique lors d’un upload d’actualité, vous pouvez envoyer :

```json
{
  "file": "data:image/jpeg;base64,...",
  "fileName": "cover.jpg",
  "mimeType": "image/jpeg",
  "bucket": "actualites"
}
```
