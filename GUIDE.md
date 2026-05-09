# Guide d'utilisation — Application JIM 2026
**Journée Internationale des Musées · Musée Virtuel de Guinée · 16 – 18 Mai 2026**

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Rôles et appareils](#2-rôles-et-appareils)
3. [Connexion à l'application](#3-connexion-à-lapplication)
4. [Accueil des visiteurs](#4-accueil-des-visiteurs)
5. [Suivi par pôle](#5-suivi-par-pôle)
6. [Rotations (état des pôles)](#6-rotations-état-des-pôles)
7. [Programme](#7-programme)
8. [Inscriptions aux conférences](#8-inscriptions-aux-conférences)
9. [Statistiques et export](#9-statistiques-et-export)
10. [Avis visiteurs](#10-avis-visiteurs)
11. [Flux complet de l'événement](#11-flux-complet-de-lévénement)
12. [Questions fréquentes](#12-questions-fréquentes)

---

## 1. Vue d'ensemble

L'application JIM 2026 est un outil de gestion en temps réel de l'événement. Elle permet de :

- Enregistrer les groupes de visiteurs à l'entrée
- Suivre leur passage dans chaque pôle d'activité (Photo, 3D, Récit)
- Visualiser en temps réel quels pôles sont libres ou occupés
- Collecter les avis des visiteurs
- Gérer les inscriptions aux conférences
- Générer des statistiques et des rapports post-événement

Toutes les données sont synchronisées en temps réel via **Airtable**.

---

## 2. Rôles et appareils

L'application est conçue pour être utilisée sur **plusieurs appareils simultanément** :

| Appareil | Rôle | Modules utilisés |
|---|---|---|
| **Accueil (entrée)** | Agent d'accueil | Accueil des visiteurs |
| **Pôle Photo** | Référent·e Photo | Suivi par pôle |
| **Pôle 3D** | Référent·e 3D | Suivi par pôle |
| **Pôle Récit** | Référent·e Récit | Suivi par pôle |
| **Coordination** | Coordinateur·trice | Rotations, Statistiques |
| **Conférences** | Responsable inscriptions | Inscriptions |
| **Sortie** | Agent de sortie | Avis visiteurs |

> **Important :** Chaque appareil doit être connecté à Internet pour synchroniser les données avec Airtable.

---

## 3. Connexion à l'application

### Accès sécurisé

L'application est protégée par un mot de passe. À l'ouverture :

1. Saisir le **mot de passe** dans le champ prévu
2. Cliquer sur **"Accéder à l'application"**
3. En cas d'erreur, le champ se vide automatiquement — réessayer

> Le compte à rebours visible à gauche de la page de connexion indique le temps restant avant le début de l'événement (16 mai 2026 à 08h30).

La session reste active tant que le navigateur n'est pas fermé. En cas de fermeture, il faudra se reconnecter.

---

## 4. Accueil des visiteurs

**Qui l'utilise :** l'agent·e à l'entrée de l'événement  
**Chemin :** Menu → Accueil

### Objectif

Enregistrer chaque groupe de visiteurs à leur arrivée et leur attribuer un **identifiant unique** (ID de groupe) ainsi qu'une **couleur de groupe** (Rouge, Jaune ou Vert) pour faciliter leur suivi dans les pôles.

### Étapes

1. **Heure d'arrivée** — l'heure actuelle est pré-remplie automatiquement. La modifier si nécessaire.

2. **Nombre de personnes** — saisir le nombre de visiteurs du groupe (ex : 12).

3. **Groupe attribué** — cliquer sur la couleur à attribuer :
   - 🔴 **Groupe Rouge**
   - 🟡 **Groupe Jaune**
   - 🟢 **Groupe Vert**

   > L'**ID de groupe** est généré automatiquement au format `R001`, `J002`, `V003`… Il est unique et ne se répètera jamais, même après un rechargement de la page.

4. **Profil du public** — sélectionner le profil correspondant :
   - Étudiant(e)
   - Jeune public
   - Professionnel(le)
   - Grand public
   - Autres

5. Cliquer sur **"Enregistrer l'arrivée"**

6. Une confirmation apparaît. Cliquer sur **"Nouveau groupe"** pour enregistrer le groupe suivant.

### Notes importantes

- L'ID est calculé en lisant les données Airtable à l'ouverture de la page — il reprend toujours là où le dernier s'est arrêté, même si la page est rechargée ou si un autre appareil a créé des groupes entre-temps.
- Dès l'enregistrement, le groupe devient **visible dans le Suivi par pôle** de tous les référents (sans qu'ils aient besoin d'actualiser).

---

## 5. Suivi par pôle

**Qui l'utilise :** le·la référent·e de chaque pôle (Photo, 3D ou Récit), sur son propre appareil  
**Chemin :** Menu → Suivi

### Objectif

Renseigner les données d'activité après le passage de chaque groupe dans le pôle. Le référent n'a **pas besoin de connaître l'ID du groupe** — il le sélectionne directement depuis la liste.

### Étapes

1. **Choisir le pôle** — cliquer sur la carte correspondante :
   - 📷 Pôle Photo
   - 📦 Pôle 3D
   - 💬 Pôle Récit

2. **Sélectionner le groupe** — la liste affiche automatiquement les groupes enregistrés à l'accueil aujourd'hui **qui ne sont pas encore passés par ce pôle**. Chaque groupe affiche :
   - Son **ID** (ex : R001)
   - Le **nombre de personnes**
   - L'**heure d'arrivée** à l'accueil
   - Un **bouton Actualiser** pour forcer le rafraîchissement (la liste se met à jour automatiquement toutes les 30 secondes)

   > Dès qu'un groupe est sélectionné, le pôle apparaît comme **OCCUPÉ** dans la vue Rotations sur tous les appareils.

3. **Renseigner les données de participation** :
   - **Participants passé(e)s** : nombre total de personnes ayant participé
   - **Participants actif(ves)** : nombre de personnes engagées/actives
   - **Contenus produits** : nombre de photos prises / modèles 3D créés / récits écrits

4. **Observations** (facultatif) — cocher les observations pertinentes :
   - Fluide / Forte participation / Attente
   - Peu de participants / Problème technique / Matériel défaillant
   - Questions fréquentes / Enthousiasme élevé

5. Cliquer sur **"Enregistrer le suivi"**

6. Une confirmation apparaît. Le groupe **disparaît automatiquement** de la liste (il est marqué comme passé). Le pôle passe à **LIBRE** dans les Rotations.

7. Cliquer sur **"Nouveau suivi"** pour le groupe suivant.

### Comportement automatique de la liste

| Situation | Comportement |
|---|---|
| Nouveau groupe enregistré à l'accueil | Apparaît dans la liste en ≤ 30 secondes sur tous les appareils |
| Groupe sélectionné par le référent | Pôle affiché OCCUPÉ dans Rotations |
| Suivi soumis | Groupe retiré de la liste · Pôle affiché LIBRE dans Rotations |
| Tous les groupes ont été vus | Message vert : "Tous les groupes enregistrés sont passés par ce pôle" |

---

## 6. Rotations (état des pôles)

**Qui l'utilise :** le·la coordinateur·trice de l'événement  
**Chemin :** Menu → Rotations

### Objectif

Visualiser en temps réel quels pôles sont **libres** ou **occupés**, et par quel groupe. Cet écran se met à jour automatiquement — **aucune saisie manuelle n'est nécessaire**.

### Ce que l'écran affiche

Trois cartes, une par pôle (Photo, 3D, Récit), indiquant :

**Pôle LIBRE :**
- Badge vert ✓ "Libre"
- Le pôle est disponible pour accueillir un nouveau groupe

**Pôle OCCUPÉ :**
- Pastille colorée (rouge/jaune/vert selon le groupe)
- ID du groupe (ex : R001)
- Couleur du groupe (ex : Groupe Rouge)
- Nombre de personnes (si disponible)
- Les 3 derniers groupes passés par ce pôle

**Historique du jour** en bas de page :
- Tous les passages terminés dans la journée, avec l'heure de complétion

### Synchronisation

L'écran se rafraîchit automatiquement toutes les **30 secondes**. L'heure de la dernière synchronisation est affichée dans le sous-titre de la page.

**Flux automatique :**
```
Référent sélectionne un groupe  →  Pôle : OCCUPÉ (visible dans les ~30s)
Référent soumet le suivi        →  Pôle : LIBRE  (visible immédiatement)
```

---

## 7. Programme

**Qui l'utilise :** tout le personnel de l'événement  
**Chemin :** Menu → Programme

### Objectif

Consulter l'agenda officiel de l'événement : horaires, lieux, intervenants et public cible.

Le programme est divisé en deux sections :
- **Programme officiel** : conférences et interventions
- **Ateliers & sessions participatives** : activités interactives

Aucune interaction requise — consultation uniquement.

---

## 8. Inscriptions aux conférences

**Qui l'utilise :** le·la responsable des inscriptions  
**Chemin :** Menu → Inscriptions

### Objectif

Enregistrer les personnes inscrites aux sessions et conférences de l'événement.

### Formulaire d'inscription

Renseigner :
- Nom et prénom du participant
- Session choisie (liste déroulante)
- Nombre de participants (si groupe)
- Acceptation du contact post-événement (optionnel)

Les inscriptions sont enregistrées dans Airtable et apparaissent dans les statistiques.

---

## 9. Statistiques et export

**Qui l'utilise :** le·la coordinateur·trice, la direction  
**Chemin :** Menu → Statistiques

### Tableau de bord

**4 indicateurs clés (KPIs) :**
- Total participants (conférences + pôles)
- Inscrits aux conférences
- Passages aux pôles
- Avis collectés

**Sessions & ateliers :** graphique en barres du nombre de participants par session.

**Activités des pôles :** pour chaque pôle (Photo, 3D, Récit) :
- Participants passés
- Participants actifs
- Contenus produits
- Nombre de rotations

**Satisfaction visiteurs :** note moyenne sur 5 étoiles + distribution style "Play Store".

### Export CSV

Trois fichiers téléchargeables en un clic :
- `inscriptions-jim2026-[date].csv` — données des inscriptions
- `suivi-poles-jim2026-[date].csv` — données des suivis pôles
- `avis-visiteurs-jim2026-[date].csv` — données des avis

### Rapport post-événement

Un rapport complet imprimable/PDF est généré automatiquement avec :
- Résumé général (KPIs)
- Top sessions
- Tableau d'activité des pôles
- Commentaires visiteurs sélectionnés

Cliquer sur **"Imprimer / PDF"** pour l'exporter.

---

## 10. Avis visiteurs

**Qui l'utilise :** l'agent·e à la sortie de l'événement (ou les visiteurs eux-mêmes sur une tablette)  
**Chemin :** Menu → Avis (ou accessible via la page d'accueil)

### Objectif

Collecter le retour d'expérience des visiteurs en fin de visite.

### Formulaire

1. **Nom et Prénom** (obligatoire)
2. **Email** (facultatif)
3. **Téléphone** (facultatif)
4. **Pôle préféré** — Photo, 3D ou Récit
5. **Qu'avez-vous découvert ?** — champ libre
6. **Note de satisfaction** — de 1 à 5 étoiles (obligatoire)
7. **Commentaire** — impression générale (facultatif)

Cliquer sur **"Envoyer mon avis"** pour valider.

---

## 11. Flux complet de l'événement

Voici le déroulement type d'une journée :

```
[ENTRÉE]
Agent d'accueil
  └─ Enregistre le groupe (couleur + ID généré automatiquement)
       ex : Groupe Rouge · R001 · 15 personnes · 09h30

                    ↓ visible immédiatement dans Suivi Pôle

[PÔLE PHOTO]                [PÔLE 3D]               [PÔLE RÉCIT]
Référent sélectionne R001   Attente du prochain       Attente du prochain
→ Pôle OCCUPÉ               → Pôle LIBRE              → Pôle LIBRE

                    ↓ visible dans Rotations

[COORDINATEUR — ROTATIONS]
  Photo : OCCUPÉ · R001 · Groupe Rouge · 15 pers.
  3D    : LIBRE
  Récit : LIBRE

                    ↓ après l'activité

[PÔLE PHOTO]
Référent remplit le suivi (participants, contenus, observations)
→ Soumet → R001 disparaît de sa liste
→ Pôle LIBRE dans Rotations

                    ↓ R001 visible dans 3D et Récit

[COORDINATEUR] envoie R001 au Pôle 3D
[PÔLE 3D] sélectionne R001 → Pôle OCCUPÉ ...

                    (cycle continue)

[SORTIE]
Agent ou visiteur
  └─ Remplit le formulaire d'avis (note + commentaire)
       → Données agrégées dans Statistiques
```

---

## 12. Questions fréquentes

**Q : La liste des groupes dans Suivi Pôle ne s'actualise pas.**  
R : Cliquer sur le bouton **"Actualiser"** à côté du titre "Groupe". La liste se met aussi à jour automatiquement toutes les 30 secondes.

**Q : Un groupe n'apparaît pas dans le Suivi Pôle.**  
R : Vérifier que le groupe a bien été enregistré dans **Accueil** et que l'appareil est connecté à Internet. Attendre jusqu'à 30 secondes pour la synchronisation automatique, ou cliquer sur Actualiser.

**Q : La page Rotations ne se met pas à jour.**  
R : La synchronisation est automatique (30 secondes). Vérifier la connexion Internet. L'heure de la dernière sync est affichée dans le sous-titre de la page.

**Q : Un ID de groupe s'est répété.**  
R : Cela ne devrait pas arriver — les IDs sont calculés depuis Airtable au chargement de la page. Si cela se produit, contacter le responsable technique.

**Q : Je ne vois plus un groupe dans ma liste Suivi Pôle alors qu'il ne s'est pas encore présenté.**  
R : Le groupe a peut-être déjà été enregistré pour votre pôle par erreur. Contacter le coordinateur pour vérifier.

**Q : Comment exporter les données en fin d'événement ?**  
R : Aller dans **Statistiques → Exporter les données** et télécharger les trois fichiers CSV (inscriptions, suivi pôles, avis visiteurs).

**Q : L'application demande un mot de passe à chaque fois.**  
R : La session est liée à l'onglet du navigateur. Si l'onglet est fermé, il faut se reconnecter. Garder l'onglet ouvert pendant toute la durée de l'événement.

---

*Musée Virtuel de Guinée · JIM 2026 · « Les musées unissent un monde divisé »*
