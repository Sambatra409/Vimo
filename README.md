# Vohitra — Plateforme immobilière Madagascar

Stack : **Next.js 15 + Tailwind v4 + Supabase + Server Actions**

## 🚀 Démarrer

```bash
npm install
npm run dev
```

## 📋 Setup Supabase complet

### 4 schemas SQL à exécuter dans l'ordre

Supabase Dashboard → **SQL Editor** → **New Query** → coller chaque fichier → **Run**

1. **`db/01_initial_schema.sql`** — Auth, profiles, settings
2. **`db/02_properties_schema.sql`** — Annonces, photos, favoris, tracking
3. **`db/03_step4_to_7.sql`** — Tokens, messages, alerts, storage bucket
4. **`db/04_admin_schema.sql`** — Admin (ban, packs dynamiques, audit) ← **nouveau**

### Configurer les URLs Supabase
**Authentication → URL Configuration** :
- Site URL : `http://localhost:3000`
- Redirect URLs : `http://localhost:3000/**`

### Te donner le rôle admin

Après avoir créé ton compte sur le site, exécute dans Supabase SQL Editor :

```sql
select public.promote_user_to_admin('ton.email@gmail.com');
```

Déconnecte-toi puis reconnecte-toi → un nouveau bouton **🛡️ Admin** apparaît dans le header.

## 🛡️ Console d'administration `/dashboard/admin`

5 onglets accessibles via la navigation latérale :

### 1. Vue d'ensemble
- Nombre total d'utilisateurs (avec répartition propriétaires/locataires)
- Annonces actives
- **Jetons en circulation** (somme de tous les soldes)
- Achats en attente de validation (avec mise en évidence)

### 2. Utilisateurs
- Recherche par nom ou email
- **Bannir / lever le bannissement** (avec motif)
- **Ajouter / retirer des jetons** (limité à ±1000 par opération, avec log d'audit)
- **Ajouter / retirer des rôles** (locataire, propriétaire, admin)
- Badges visuels : KYC, banni, rôles

### 3. Annonces
- Voir TOUTES les annonces (tous statuts)
- **Accorder ou retirer le badge ✓ vert** (vérification)
- **Supprimer** définitivement
- Voir directement l'annonce dans un nouvel onglet

### 4. Achats jetons (validation)
- Liste filtrable : En attente / Validés / Refusés / Tous
- **Valider** → crédite automatiquement les jetons
- **Refuser** avec motif obligatoire (visible par l'user)
- Audit complet : qui a validé, quand, avec quelle note

### 5. Paramètres
- **Tarifs en jetons** : déblocage, vérification, boost, durée du boost
- **Mode A — Tout gratuit pendant N jours** (pour tout le monde)
- **Mode B — Quota quotidien par utilisateur** (X déblocages gratuits/jour, reset 24h sans cumul)
- **Instructions de paiement** (texte affiché sur /tokens)
- **Identité du site** (nom, email/téléphone de support)
- **Packs de jetons** : modifier le prix de chaque pack

## 💳 Workflow d'achat de jetons

1. **Côté utilisateur** sur `/tokens` :
   - Choisir un pack
   - Lire les 4 étapes claires (paiement Mvola → référence → soumission → validation)
   - Suivre les instructions de paiement (modifiables par l'admin)
   - Envoyer son paiement Mvola/OM/Airtel
   - Coller la référence de transaction → soumettre
   - Statut = **"En attente"**
2. **Côté admin** sur `/dashboard/admin/purchases` :
   - Voir la demande apparaître dans l'onglet "En attente"
   - Vérifier que le paiement a bien été reçu
   - **Valider** → l'utilisateur reçoit ses jetons instantanément
   - Ou **Refuser** avec un motif

## 🎁 Modes promotionnels

| Mode | Effet | Cas d'usage |
|---|---|---|
| **A — Tout gratuit** | Tous les déblocages gratuits pendant X jours | Lancement, événement |
| **B — Quota quotidien** | Chaque user a N déblocages gratuits / 24h | Acquisition continue |
| **Aucun** | Chaque déblocage coûte 1 jeton | Monétisation classique |

Les modes sont **combinables** — si Mode A actif, il prend le pas sur Mode B.

## 🔒 Sécurité

- Toutes les actions admin appellent `requireRole("admin")` — impossible à appeler sans le bon rôle
- Les modifications de jetons sont **toutes loggées** dans `token_adjustments` (qui, quoi, pourquoi, quand)
- Un admin ne peut pas se bannir lui-même ni retirer son propre rôle admin
- Bannir un utilisateur **désactive toutes ses annonces** automatiquement
- Le check `is_banned` est dans `getCurrentUser()` → un user banni est traité comme déconnecté

## 🗺️ Progression

- [x] **Étape 1** — Fondations
- [x] **Étape 2** — Auth Supabase
- [x] **Étape 3** — Annonces + filtres + déblocage + favoris
- [x] **Étape 4** — Création/édition annonce + compression + OCR
- [x] **Étape 5** — Jetons + Messages
- [x] **Étape 6** — Comparateur + Alertes
- [x] **Étape 7** — Stats annonce
- [x] **Étape 8-9** — **Dashboard admin complet** ← **Tu es ici**
- [ ] Polish : emails transactionnels, KYC complet, demande vérification proprio
"# vimo" 
"# vimo" 
