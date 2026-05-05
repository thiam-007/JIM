# JIM 2026 — Musée Virtuel de Guinée

Migration Vue.js (Vite) du formulaire existant vers une application évolutive avec Airtable.

## Installation

1. Installer Node.js dans votre environnement.
2. Exécuter `npm install` dans le dossier `c:\Users\PC\Desktop\JIM`.
3. Lancer le projet avec `npm run dev`.

## Architecture

- `src/main.js` : point d’entrée Vue
- `src/App.vue` : structure globale, navigation et connexion Airtable
- `src/router/index.js` : Vue Router pour la navigation entre pages
- `src/store/airtable.js` : store Pinia pour la connexion Airtable et l’envoi de données
- `src/views/` : pages `Home`, `Programme`, `Stats`, `Accueil`, `Suivi`, `Avis`
- `src/components/` : formulaires réutilisables, dont `EventRegistrationForm.vue`

## Airtable

La connexion Airtable reste la même que dans votre HTML : API REST via `fetch`.
Vous pouvez saisir le Personal Access Token dans la barre de connexion, puis envoyer les formulaires.

## Notes

- `jim_formulaires_mvg.html` est conservé comme version legacy.
- L’environnement VS Code n’a pas de `npm` installé ici, donc l’installation des dépendances doit être faite localement.
