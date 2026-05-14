# Guide d'utilisation — JIM 2026
## Application de gestion · Musée Virtuel de Guinée
**Journée Internationale des Musées · 16 – 18 Mai 2026**

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Connexion Airtable](#2-connexion-airtable)
3. [Accueil Visiteurs](#3-accueil-visiteurs)
4. [Suivi par Pôle](#4-suivi-par-pôle)
5. [Rotations](#5-rotations)
6. [Statistiques](#6-statistiques)
7. [Programme & Inscriptions](#7-programme--inscriptions)
8. [Installation de l'application (PWA)](#8-installation-de-lapplication-pwa)
9. [Workflow recommandé le jour J](#9-workflow-recommandé-le-jour-j)
10. [Résolution des problèmes courants](#10-résolution-des-problèmes-courants)

---

## 1. Vue d'ensemble

L'application JIM 2026 permet de gérer en temps réel l'ensemble des activités de l'événement :

| Module | Rôle | Utilisateur |
|--------|------|-------------|
| **Accueil Visiteurs** | Enregistrer les groupes à l'entrée | Agent accueil |
| **Suivi par Pôle** | Saisir les données de participation après chaque rotation | Référent de pôle |
| **Rotations** | Visualiser et gérer quel groupe est dans quel pôle | Coordinateur |
| **Statistiques** | Consulter les chiffres en temps réel et exporter | Coordinateur |
| **Programme** | Afficher le programme de l'événement | Tous |
| **Inscriptions** | Enregistrer les inscriptions aux ateliers/conférences | Agent accueil |

### Les 4 groupes

| Couleur | Préfixe ID | Exemple |
|---------|-----------|---------|
| Rouge   | R         | R001    |
| Jaune   | J         | J001    |
| Vert    | V         | V001    |
| Bleu    | B         | B001    |

### Les 4 pôles d'activité

| Pôle | Description |
|------|-------------|
| Pôle Photo | Atelier photographie |
| Pôle 3D | Modélisation 3D |
| Pôle Récit | Narration et récit |
| Pôle Musique | Création musicale et patrimoine |

---

## 2. Connexion Airtable

Toutes les données sont sauvegardées dans Airtable. La connexion est nécessaire pour enregistrer et consulter les données.

### Si le token est déjà configuré (Vercel)
La connexion est automatique — aucune action requise. La bannière verte **"Connexion Airtable active"** s'affiche en haut.

### Si vous devez saisir le token manuellement
1. Récupérez votre **Personal Access Token** Airtable (commence par `pat…`)
2. Collez-le dans le champ en haut de l'application
3. Cliquez sur **Connecter**
4. La bannière verte confirme la connexion

> Le token est mémorisé dans le navigateur — vous n'aurez pas à le ressaisir à chaque visite.

---

## 3. Accueil Visiteurs

Utilisé par l'**agent d'accueil** dès l'arrivée d'un groupe.

### Étapes

1. **Heure d'arrivée** — pré-remplie automatiquement, modifiable si besoin
2. **Nombre de personnes** — saisir le nombre exact de personnes dans le groupe
3. **Groupe attribué** — sélectionner la couleur du groupe :
   - Choisir parmi Rouge, Jaune, Vert ou Bleu
   - L'**ID du groupe est généré automatiquement** (ex: R001, B002…)
4. **Profil du public** — sélectionner le profil dominant :
   - Étudiant(e), Jeune public, Professionnel(le), Grand public, Autres
5. Cliquer sur **Enregistrer l'arrivée**

### Ce qui se passe après l'enregistrement
- Le groupe est sauvegardé dans Airtable
- Il devient immédiatement disponible dans le **Suivi par Pôle** du jour

> **Important** : chaque clic sur une couleur de groupe incrémente automatiquement le compteur. Évitez de cliquer plusieurs fois sur la même couleur sans valider.

---

## 4. Suivi par Pôle

Utilisé par le **référent de chaque pôle** après chaque rotation de groupe.

### Étapes

1. **Pôle concerné** — cliquer sur la carte du pôle (Photo, 3D, Récit ou Musique)
2. **Groupe** — sélectionner le groupe dans la liste des groupes du jour
   - Si la liste est vide : cliquer sur **Actualiser**
   - La liste se rafraîchit automatiquement toutes les 30 secondes
3. **Participants passé(e)s** — nombre total de personnes ayant participé à la session
4. **Participants actif(ves)** — nombre de personnes actives pendant la session
   - Ne peut pas dépasser les **participants passés**
   - Ne peut pas dépasser la **taille du groupe** enregistré à l'accueil
5. **Contenus produits** — nombre de photos / modèles 3D / récits / morceaux créés
6. **Observations** — cocher les observations pertinentes (Fluide, Forte participation, Attente…)
7. Cliquer sur **Enregistrer le suivi**

### Règles de validation
| Règle | Message d'erreur |
|-------|-----------------|
| Actifs > Passés | "Ne peut pas dépasser les participants passé(e)s" |
| Actifs > Taille du groupe | "Ne peut pas dépasser N (taille du groupe)" |

> Un groupe ne peut être enregistré qu'**une seule fois par pôle** dans la journée. Une fois passé, il disparaît de la liste pour ce pôle.

---

## 5. Rotations

Utilisé par le **coordinateur** pour visualiser et gérer les rotations en temps réel.

### Visualisation des pôles

La grille affiche les 4 pôles avec pour chacun :
- Le **groupe actuel** (ID + couleur) ou "— Libre —" si le pôle est vide
- Les **3 dernières rotations** avec l'heure
- Un bouton **Libérer** pour retirer le groupe du pôle

### Enregistrer une rotation manuellement

1. Sélectionner le **pôle** dans le menu déroulant
2. Sélectionner le **groupe entrant** (liste des groupes accueil) ou "Libérer le pôle"
3. Cliquer sur **Enregistrer la rotation**

> **Exclusivité automatique** : si un groupe est déjà sur un autre pôle, il en est retiré automatiquement lors de l'affectation au nouveau pôle.

### Timeline

L'historique de toutes les rotations du jour s'affiche en bas de page avec l'heure, le pôle et le groupe.

> Les rotations sont stockées **localement** (localStorage) et se remettent à zéro chaque matin. Elles ne sont pas envoyées dans Airtable.

---

## 6. Statistiques

Vue synthétique pour le **coordinateur**. Les données se chargent depuis Airtable à l'ouverture de la page.

### Indicateurs clés (KPIs)

| Indicateur | Calcul |
|------------|--------|
| **Total participants (global)** | Inscrits conférences + Visiteurs pôles uniques |
| **Inscrits conférences** | Total des inscriptions aux ateliers/conférences |
| **Visiteurs pôles** | Total accueil (si renseigné) ou max des passés par pôle |
| **Avis collectés** | Nombre total d'avis visiteurs |

### Réconciliation accueil ↔ pôles

Compare le **total enregistré à l'accueil** avec le **nombre de passés à chaque pôle**.  
- ✅ **Cohérent** : tous les groupes ont bien été enregistrés aux 4 pôles
- ⚠️ **Écart détecté** : certains pôles ont plus ou moins de passages qu'attendu

> Normal en cours d'événement — la réconciliation se stabilise en fin de journée.

### Export Excel

4 exports disponibles en `.xlsx` :
- **Inscriptions** — liste complète des inscrits
- **Accueil visiteurs** — tous les groupes enregistrés
- **Suivi pôles** — toutes les sessions par pôle
- **Avis visiteurs** — notes et commentaires

### Rapport post-événement

Cliquer sur **Imprimer / PDF** pour générer un rapport complet imprimable.

---

## 7. Programme & Inscriptions

### Programme
Affiche le calendrier des activités des 3 jours de l'événement (16, 17 et 18 mai).

### Inscriptions
Permet d'enregistrer les inscriptions aux ateliers et conférences :
1. Remplir les informations du participant
2. Sélectionner la session
3. Cliquer sur **S'inscrire**

---

## 8. Installation de l'application (PWA)

L'application peut être installée sur smartphone ou tablette comme une app native.

### Sur Android (Chrome)
1. Ouvrir l'application dans Chrome
2. Menu ⋮ → **Ajouter à l'écran d'accueil**
3. Confirmer → l'icône JIM 2026 apparaît sur l'écran d'accueil

### Sur iOS (Safari)
1. Ouvrir l'application dans Safari
2. Icône de partage ↑ → **Sur l'écran d'accueil**
3. Confirmer → l'icône JIM 2026 apparaît sur l'écran d'accueil

### Mise à jour de l'app installée
Quand une nouvelle version est disponible, une **bannière verte** apparaît automatiquement en haut de l'application avec le bouton **"Mettre à jour"**. Appuyer dessus recharge l'application avec la dernière version.

> Si la bannière n'apparaît pas et que l'app semble ancienne : fermer complètement l'application et la rouvrir.

---

## 9. Workflow recommandé le jour J

### Avant l'ouverture
- [ ] Vérifier la connexion Airtable (bannière verte)
- [ ] Vérifier que l'application est à jour (bannière de mise à jour si nécessaire)
- [ ] Ouvrir l'onglet **Rotations** sur le poste coordinateur

### À l'arrivée de chaque groupe
1. Agent accueil → **Accueil Visiteurs** → enregistrer le groupe (couleur + personnes + profil)
2. Coordinateur → **Rotations** → affecter le groupe à son premier pôle

### Après chaque rotation (toutes les ~20 min)
1. Référent du pôle → **Suivi par Pôle** → saisir les données de la session
2. Coordinateur → **Rotations** → enregistrer la nouvelle affectation des groupes

### En fin de journée
1. Coordinateur → **Statistiques** → vérifier la réconciliation
2. Exporter les données en Excel si besoin
3. Imprimer le rapport post-événement

---

## 10. Résolution des problèmes courants

| Problème | Cause probable | Solution |
|----------|---------------|----------|
| "Erreur Airtable : Insufficient permissions to create new select option" | L'option n'existe pas dans le champ Select d'Airtable | Ajouter l'option manquante dans Airtable (paramètres du champ) |
| Le groupe enregistré à l'accueil n'apparaît pas dans Suivi | Délai de synchronisation | Cliquer sur **Actualiser** dans le formulaire Suivi |
| "Aucun groupe enregistré à l'accueil aujourd'hui" | Pas encore de groupes enregistrés ce jour | Enregistrer d'abord les groupes dans **Accueil Visiteurs** |
| L'app installée n'est pas à jour | Cache du service worker | Appuyer sur "Mettre à jour" dans la bannière verte, ou fermer/rouvrir l'app |
| "Token Airtable manquant" | Non connecté | Saisir le Personal Access Token dans la barre de connexion |
| L'ID du groupe est incorrect (ex: R000) | Clic multiple sur la couleur avant validation | Recharger la page — les compteurs se réinitialisent depuis Airtable |

---

*Document généré le 14 mai 2026 · Musée Virtuel de Guinée · JIM 2026*
