# JIM 2026 — Musée Virtuel de Guinée

Application de gestion de la **Journée Internationale des Musées 2026** — Musée Virtuel de Guinée.  
Événement : **16 – 18 Mai 2026 · Musée National de Guinée, Conakry**.

## Fonctionnalités

### Accueil Visiteurs
- Enregistrement des groupes à l'entrée (heure, nombre de personnes, profil)
- 4 couleurs de groupe : **Rouge (R)**, **Jaune (J)**, **Vert (V)**, **Bleu (B)**
- IDs uniques auto-générés (ex: R001, J002, B003…) synchronisés depuis Airtable
- Envoi direct dans Airtable

### Suivi par Pôle
- 4 pôles : **Photo**, **3D**, **Récit**, **Musique et patrimoine**
- Sélection du groupe parmi les groupes enregistrés à l'accueil du jour
- Saisie des participants passés, actifs, contenus produits et observations
- Validations : actifs ≤ passés ET actifs ≤ taille du groupe
- Envoi dans Airtable + mise à jour automatique des rotations

### Rotations
- Visualisation en temps réel du groupe actuel sur chaque pôle
- Exclusivité garantie : un groupe ne peut être que sur un seul pôle à la fois
- Historique des 3 dernières rotations par pôle avec ID du groupe
- Enregistrement manuel de rotation via liste des groupes accueil
- Bouton "Libérer" pour libérer un pôle
- État remis à zéro automatiquement chaque jour (localStorage)

### Statistiques
- **Total global** = Inscriptions conférences + Visiteurs pôles uniques (sans double comptage)
- Activité par pôle : passages, actifs, contenus, rotations
- **Réconciliation accueil ↔ pôles** : vérification que chaque pôle a bien reçu tous les groupes
- Satisfaction visiteurs (notes étoiles, distribution)
- Export Excel (inscriptions, accueil, suivi pôles, avis)
- Rapport post-événement imprimable (PDF)

### Autres
- Programme & ateliers de l'événement
- Inscriptions conférences/ateliers
- Avis visiteurs
- PWA installable avec mise à jour automatique détectée (bannière in-app)

---

## Installation

```bash
npm install
npm run dev       # développement
npm run build     # production
```

## Architecture

```
src/
├── main.js                        # Point d'entrée Vue
├── App.vue                        # Shell global, navigation, connexion Airtable, bannière PWA
├── router/index.js                # Routes (login, home, programme, inscriptions, stats, accueil, suivi, rotations)
├── store/
│   ├── airtable.js                # Pinia — connexion Airtable, chargement et envoi des données
│   └── rotations.js               # Pinia — état temps réel des rotations (localStorage, remise à zéro quotidienne)
├── views/
│   ├── HomeView.vue
│   ├── ProgrammeView.vue
│   ├── InscriptionsView.vue
│   ├── StatsView.vue              # Statistiques, réconciliation, export Excel, rapport
│   ├── AccueilView.vue
│   ├── SuiviView.vue              # Historique des suivis (pagination)
│   └── RotationsView.vue          # Grille rotations temps réel + formulaire
└── components/
    ├── AccueilVisiteursForm.vue   # Enregistrement groupes à l'entrée
    ├── SuiviPoleForm.vue          # Saisie suivi par pôle
    └── AppIcon.vue                # Icônes Lucide
```

## Airtable

Tables utilisées (base `appqgfu3Ten3zehfb`) :

| Clé | Table | Usage |
|-----|-------|-------|
| `a` | Accueil visiteurs | Groupes enregistrés à l'entrée |
| `s` | Suivi pôles | Données de participation par pôle |
| `v` | Avis visiteurs | Notes et commentaires |
| `e` | Inscriptions | Inscriptions conférences/ateliers |

Le token Airtable (Personal Access Token) peut être :
- Saisi manuellement dans la barre de connexion de l'app
- Injecté via la variable d'environnement `VITE_AIRTABLE_TOKEN` (Vercel)

Scopes requis : `data.records:read`, `data.records:write`

## Déploiement

L'application est déployée sur **Vercel** en continu depuis la branche `main`.  
Chaque merge sur `main` déclenche un nouveau déploiement automatique.

## Groupes & Pôles

| Groupe | Préfixe ID | Couleur CSS |
|--------|-----------|-------------|
| Rouge  | R         | `#dc3545`   |
| Jaune  | J         | `#d4a017`   |
| Vert   | V         | `#28a745`   |
| Bleu   | B         | `#2563eb`   |

| Pôle | Icône | Clé interne |
|------|-------|-------------|
| Pôle Photo | camera | `photo` |
| Pôle 3D | box | `3d` |
| Pôle Récit | message-circle | `recit` |
| Pôle Musique et patrimoine | music | `musique` |
