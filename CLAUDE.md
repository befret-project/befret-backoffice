# BEFRET BACKOFFICE - ARCHITECTURE & DÉVELOPPEMENT

## 🏗️ ARCHITECTURE DES ENVIRONNEMENTS

Le projet utilise **4 environnements distincts** qui pointent tous vers Firebase :

### Environnements configurés :
- **local** : Développement local (`localhost:3000`)
- **dev** : Développement déployé (`https://befret-development-e3cb5.web.app/`)

### Environnements à configurer :
- **staging** : Tests et validation
- **prod** : Production finale

### Services Firebase utilisés :
- ✅ **Hosting** : Déploiement des applications
- ✅ **Functions** : APIs backend (Node.js)
- ✅ **Firestore** : Base de données NoSQL
- ✅ **Authentication** : Gestion des utilisateurs
- ✅ **Storage** : Stockage des fichiers

### Configuration partagée :
- `local` et `dev` peuvent partager les mêmes clés API et configurations
- `staging` et `prod` auront leurs propres configurations (à configurer ultérieurement)

## 🚀 COMMANDES DE DÉPLOIEMENT

```bash
# Développement local
npm run dev

# Déploiement development (hosting)
npm run deploy:dev

# Déploiement functions uniquement
npm run deploy:functions

# Déploiement complet (hosting + functions)
npm run deploy:all

# Build pour export static
npm run export:dev
```

⚠️ **Note importante** : Les API routes Next.js ont été migrées vers Firebase Functions. Les commandes d'export n'ont plus besoin de déplacer le dossier `src/app/api`.

## 📊 ÉTAT ACTUEL DU PROJET

### ✅ Sprint 1 - Réception des colis (TERMINÉ)
- Interface de réception fonctionnelle
- Intégration Firestore complète
- Gestion des statuts logistiques
- Données de test créées (430+ colis)

### ✅ Dashboard (TERMINÉ)
- **StatsCards** : Statistiques en temps réel depuis Firestore
- **Dashboard Overview** : Graphiques mensuels et répartition des statuts
- **Recent Activity** : Activités récentes des colis
- **APIs Firebase Functions** déployées et fonctionnelles

### 🔗 URLs des APIs Dashboard :
- Stats: `https://api-rcai6nfrla-uc.a.run.app/api/dashboard/stats`
- Overview: `https://api-rcai6nfrla-uc.a.run.app/api/dashboard/overview`
- Recent Activity: `https://api-rcai6nfrla-uc.a.run.app/api/dashboard/recent-activity`

## 📋 PROCHAINES ÉTAPES - SPRINTS RESTANTS

### Sprint 2 - Préparation des colis
- Interface de pesée et vérification
- Gestion des écarts de poids
- Attribution des emplacements

### Sprint 3 - Expédition
- Création des bordereaux d'expédition
- Gestion des conteneurs
- Suivi des envois

### Sprint 4 - Suivi et livraison
- Interface de suivi temps réel
- Gestion des livraisons
- Notifications automatiques

### Sprint 5 - Reporting avancé
- Tableaux de bord détaillés
- Rapports d'activité
- Analytics de performance

### Sprint 6 - Intégrations
- APIs externes (transporteurs)
- Webhooks et notifications
- Optimisations finales

## 🎯 RÈGLES DE DÉVELOPPEMENT

1. **Toujours respecter l'architecture des 4 environnements**
2. **Utiliser uniquement Firebase pour tous les services (Hosting, Functions, Firestore, Auth, Storage)**
3. **Maintenir la cohérence entre local et dev (mêmes clés API)**
4. **Documenter tous les changements d'architecture dans CLAUDE.md**
5. **Tester sur l'environnement dev avant validation**
6. **Ne jamais mélanger les configurations d'environnements**

## 🔧 CONFIGURATION TECHNIQUE

### Frontend : Next.js 15.3.4
- App Router avec TypeScript
- Tailwind CSS + Radix UI
- Export statique pour Firebase Hosting

### Backend : Firebase Functions v2
- Node.js avec TypeScript
- API REST pour les endpoints
- Intégration Firestore native

### Base de données : Firestore
- Collection `parcel` : Données des colis
- Structure optimisée pour les requêtes
- Index automatiques configurés

## 📁 CONFIGURATION DES ENVIRONNEMENTS

### Fichiers de configuration existants :
- `.env.development` - Configuration local + dev (befret-development)
- `.env.local` - Configuration locale active

### Fichiers à créer plus tard :
- `.env.staging` - Configuration staging
- `.env.production` - Configuration production

### Variables d'environnement communes :
- `NEXT_PUBLIC_FIREBASE_*` : Configuration Firebase publique
- `FIREBASE_*` : Configuration Firebase Admin (serveur)
- `NEXTAUTH_*` : Configuration authentification

### Projets Firebase :
- **local/dev** : `befret-development` (configuré)
- **staging** : À configurer
- **prod** : À configurer