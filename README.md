# JIM 2026 — Musée Virtuel de Guinée

Application de gestion et vitrine web pour la **Journée Internationale des Musées 2026** du **Musée Virtuel de Guinée (MVG)**.  
Événement : **16 – 18 Mai 2026 · Musée National de Guinée, Conakry**.

Ce projet a évolué d'une simple application de rotation avec Airtable vers une architecture complète et sécurisée **Full-stack (Monorepo)** intégrant un site vitrine, un système d'invitations/RSVP/Check-in avec code QR, une gestion de newsletter, et un tableau de bord d'administration complet.

---

## 📂 Structure du Projet

Le dépôt est structuré en **Monorepo** avec deux composants principaux :

```
JIM/
├── frontend/             # Application cliente Vue.js 3 (Vite)
└── backend/              # API REST Express (Node.js) avec base de données Supabase
```

---

## ✨ Fonctionnalités Clés

### 🌐 Vitrine & Site Public (Frontend)
- **Accueil & Hero Slider** : Présentation animée et dynamique de l'événement et du Musée.
- **Événements & Ateliers** : Liste et détails des ateliers et conférences prévus avec possibilité d'inscription.
- **Actualités** : Publication d'articles et actualités liés au Musée et à l'événement.
- **Revue de Presse** : Articles et mentions média externes du MVG.
- **Inscription & RSVP** : Formulaires d'inscription publique ou via invitation dédiée pour les VIP.
- **Contact & Newsletter** : Envoi de messages de contact et abonnement à la newsletter.
- **PWA (Progressive Web App)** : Installable sur mobile et tablette avec détection automatique et notification in-app de mise à jour.

### 🛡️ Back-office Admin & Tableau de Bord
- **Gestion des Événements** : Création, modification et suivi de la capacité/inscriptions des ateliers.
- **Gestion des Invités & Invitations** : Import/ajout d'invités, envoi d'invitations personnalisées avec code QR unique.
- **Check-in par QR Code** : Scanner de codes QR à l'accueil pour valider les arrivées d'invités en temps réel (via mobile/webcam).
- **Statistiques & KPIs** : Inscriptions, taux de réponse RSVP, présences, et activités de la newsletter.
- **Campagnes Newsletter** : Rédaction et envoi de newsletters de masse (manuelles ou basées sur des articles de presse/actualités) via Brevo. Un **flux RSS public** (`/api/rss`) est également fourni pour connecter et automatiser des campagnes de newsletter.
- **Modération du Contenu** : CRUD complet pour les actualités, slides hero, revues de presse et gestion des administrateurs (rôles `admin` et `super_admin`).

---

## 🛠️ Stack Technique

### Frontend
- **Framework** : Vue.js 3 (Composition API)
- **Build tool** : Vite
- **Routage** : Vue Router
- **State Management** : Pinia
- **Animations** : Anime.js & directives d'apparition au scroll personnalisées
- **PWA** : `vite-plugin-pwa`
- **Librairies additionnelles** : Lucide-vue-next (icônes), XLSX (export Excel des données), Marked (parseur Markdown)

### Backend
- **Framework API** : Express.js (Node.js)
- **Base de données** : Supabase PostgreSQL & SDK `@supabase/supabase-js`
- **Messagerie & SMTP** : Nodemailer & Brevo HTTP API (pour l'envoi de newsletters et RSVP)
- **Sécurité** : Helmet (en-têtes HTTP), CORS, Express Rate Limit (protection anti-DDoS), HPP (protection contre la pollution de paramètres)
- **Authentification** : JSON Web Tokens (JWT) avec rôles de sécurité (`admin` / `super_admin`)
- **Générateur QR** : QRCode (génération de buffers PNG pour les invitations)
- **Flux RSS** : Générateur XML dynamique pour le flux RSS 2.0 des actualités (compatible avec Brevo)

---

## ⚙️ Configuration & Base de données

### Base de données Supabase
Le schéma SQL complet est situé dans [backend/schema.sql](file:///c:/Users/PC/Desktop/JIM/backend/schema.sql). Il comprend les tables :
- `evenements` : Ateliers, conférences et planning
- `invites` : Fiches des personnes invitées
- `invitations` : Tokens de liaison unique invite <-> événement pour RSVP & Check-in
- `checkins` : Logs de scan et validation des arrivées le jour J
- `actualites` : Articles de blog et actualités
- `users` : Comptes administrateurs chiffrés
- `contact_messages` : Messages du formulaire de contact
- `newsletter_subscribers` & `newsletter_campaigns` : Gestion des listes de diffusion et historiques d'envois
- `revue_presse` : Articles média indexés
- `hero_slides` : Images et textes du slider de la page d'accueil

### Stockage Supabase (Storage)
Deux buckets de stockage **publics** sont requis pour l'upload d'images :
- `actualites` : Photos de couverture et détails d'articles
- `hero` : Images de fond pour le slider principal

Ils sont créés automatiquement au démarrage du backend si la clé d'API fournie possède les droits suffisants. Voir [backend/SUPABASE_STORAGE.md](file:///c:/Users/PC/Desktop/JIM/backend/SUPABASE_STORAGE.md) pour plus de détails.

---

## 🔑 Variables d'Environnement

Configurez les fichiers `.env` dans chaque sous-dossier en prenant modèle sur les fichiers `.env.example`.

### Backend (`backend/.env`)
```ini
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_SERVICE_KEY=your-service-key # Utilisé pour le stockage
SUPABASE_NEWS_BUCKET=actualites
SUPABASE_HERO_BUCKET=hero

# Auth & Sécurité
JWT_SECRET=un-secret-tres-robuste-pour-la-production

# Email SMTP / Brevo (Contournement des restrictions SMTP pour campagnes newsletters)
EMAIL_USER=votre.email@gmail.com
EMAIL_PASS=mot-de-passe-application-gmail
BREVO_API_KEY=xkeysib-votre-cle-api-brevo
BREVO_SENDER_EMAIL=expediteur.valide@votre-domaine.com
CONTACT_EMAIL=contact@mvg-events.com
```

### Frontend (`frontend/.env.local` ou `.env`)
```ini
VITE_API_URL=http://localhost:3000
VITE_ADMIN_QUERY_PARAM=admin
```

---

## 🚀 Démarrage en Développement

### 1. Cloner le projet et installer les dépendances

**Pour le Backend :**
```bash
cd backend
npm install
```

**Pour le Frontend :**
```bash
cd frontend
npm install
```

### 2. Initialiser la Base de Données
Copiez et exécutez le contenu du script [backend/schema.sql](file:///c:/Users/PC/Desktop/JIM/backend/schema.sql) directement dans l'éditeur SQL de votre Dashboard Supabase pour créer l'ensemble des tables, déclencheurs et index requis.


### 3. Lancer les serveurs de dev

**Lancer le Backend (port 3000 par défaut) :**
```bash
cd backend
npm run dev
```

**Lancer le Frontend (Vite, port 5173 par défaut) :**
```bash
cd frontend
npm run dev
```

---

## 📦 Déploiement en Production

### Frontend (sur Vercel)
Déploiement en continu connecté à votre dépôt Git. 
- La configuration de réécriture et d'en-têtes de sécurité est gérée par le fichier [frontend/vercel.json](file:///c:/Users/PC/Desktop/JIM/frontend/vercel.json).
- Définir `VITE_API_URL` comme variable d'environnement sur le dashboard Vercel.

### Backend (sur Render ou équivalent)
- Le service est configuré pour être déployé en tant que *Web Service* Node.js.
- Voir la configuration dans le fichier [render.yaml](file:///c:/Users/PC/Desktop/JIM/render.yaml).
- Veiller à ajouter toutes les variables d'environnement de production listées dans la section Configuration.

---

*Musée Virtuel de Guinée · JIM 2026*
