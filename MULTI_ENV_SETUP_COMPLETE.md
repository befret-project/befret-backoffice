# CONFIGURATION MULTI-ENVIRONNEMENTS - BEFRET BACKOFFICE
**Date:** 14 Novembre 2025
**Status:** ✅ Configuration complète

---

## 🏗️ ARCHITECTURE DES ENVIRONNEMENTS

### 4 Environnements Configurés

```
┌─────────────┬──────────────────────┬─────────────────────────────────────────┐
│ Environment │ Firebase Project     │ Hosting URL                             │
├─────────────┼──────────────────────┼─────────────────────────────────────────┤
│ local       │ befret-development   │ http://localhost:3000                   │
│ dev         │ befret-development   │ https://befret-development.web.app      │
│ acc         │ befret-acceptance    │ https://befret-backoffice-acceptance... │
│ prod        │ befret-production    │ https://befret-backoffice-production... │
└─────────────┴──────────────────────┴─────────────────────────────────────────┘
```

---

## 📁 FICHIERS DE CONFIGURATION

### 1. `.firebaserc` - Projets Firebase

```json
{
  "projects": {
    "default": "befret-development",
    "local": "befret-development",
    "dev": "befret-development",
    "acc": "befret-acceptance",
    "prod": "befret-production"
  },
  "targets": {
    "befret-development": {
      "hosting": {
        "backoffice": ["befret-development"]
      }
    },
    "befret-acceptance": {
      "hosting": {
        "backoffice": ["befret-backoffice-acceptance"]
      }
    }
  }
}
```

### 2. Variables d'Environnement

#### `.env.local` (Local Development)
```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=befret-development
NEXT_PUBLIC_ENVIRONMENT=local
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### `.env.dev` (Development Deployed)
```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=befret-development
NEXT_PUBLIC_ENVIRONMENT=dev
NEXT_PUBLIC_APP_URL=https://befret-development.web.app
```

#### `.env.acceptance` (Acceptance Testing)
```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=befret-acceptance
NEXT_PUBLIC_ENVIRONMENT=acceptance
NEXT_PUBLIC_APP_URL=https://befret-backoffice-acceptance.web.app
```

#### `.env.production` (À créer)
```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=befret-production
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_URL=https://befret-backoffice-production.web.app
```

---

## 🔑 SERVICE ACCOUNT KEYS

### Fichiers de Clés

```
functions/
├── serviceAccountKey.json               # befret-development (existant)
├── befret-acceptance-firebase-key.json  # befret-acceptance (✅ copié)
└── befret-production-firebase-key.json  # befret-production (à créer)
```

### Configuration par Environnement

| Env   | Service Account File                        | Source               |
|-------|---------------------------------------------|----------------------|
| local | `serviceAccountKey.json`                    | Development project  |
| dev   | `serviceAccountKey.json`                    | Development project  |
| acc   | `befret-acceptance-firebase-key.json`       | ✅ Copié depuis befret_new |
| prod  | `befret-production-firebase-key.json`       | À créer              |

---

## 🚀 COMMANDES DE DÉPLOIEMENT

### Développement Local
```bash
npm run dev
# Utilise .env.local → befret-development
```

### Déploiement Development
```bash
# Build avec environnement dev
npm run build

# Déployer vers befret-development
firebase deploy --only hosting --project dev

# Ou utiliser l'alias
firebase use dev
firebase deploy --only hosting
```

### Déploiement Acceptance
```bash
# Build avec environnement acceptance
NEXT_PUBLIC_ENV=acceptance npm run build

# Déployer vers befret-acceptance
firebase deploy --only hosting:backoffice --project acc

# Ou utiliser l'alias
firebase use acc
firebase deploy --only hosting:backoffice
```

### Déploiement Production (Futur)
```bash
# Build avec environnement production
NEXT_PUBLIC_ENV=production npm run build

# Déployer vers befret-production
firebase deploy --only hosting:backoffice --project prod
```

---

## 🔄 WORKFLOW TYPIQUE

### 1. Développement Local
```bash
# Travailler en local
npm run dev  # Port 3000, utilise befret-development
```

### 2. Tests sur Development
```bash
# Déployer sur dev pour tester
firebase use dev
npm run build
firebase deploy --only hosting
# URL: https://befret-development.web.app
```

### 3. Validation sur Acceptance
```bash
# Déployer sur acceptance pour validation finale
firebase use acc
NEXT_PUBLIC_ENV=acceptance npm run build
firebase deploy --only hosting:backoffice
# URL: https://befret-backoffice-acceptance.web.app
```

### 4. Release Production (Après validation)
```bash
# Déployer en production
firebase use prod
NEXT_PUBLIC_ENV=production npm run build
firebase deploy --only hosting:backoffice
# URL: https://befret-backoffice-production.web.app
```

---

## 🔗 INTÉGRATION AVEC BEFRET_NEW

### Mapping des Environnements

```
befret_new              ←→  befret-backoffice
────────────────────────────────────────────────
environment.local.ts    →   .env.local (befret-development)
environment.dev.ts      →   .env.dev (befret-development)
environment.acceptance  →   .env.acceptance (befret-acceptance)
environment.prod.ts     →   .env.production (befret-production)
```

### Collection Firestore Partagée

Les deux applications utilisent la **même collection** `shipments` :

```
befret_new (Frontend Client)
    ↓ Crée shipments
Collection: shipments (unified_v2)
    ↓ Lit shipments
befret-backoffice (Backoffice Entrepôt)
```

**Important :** Local et dev pointent vers `befret-development`, donc les shipments de test de befret_new ne seront PAS visibles dans le backoffice tant qu'on n'est pas sur acceptance ou prod !

---

## ⚙️ FIREBASE FUNCTIONS

### Déploiement Functions par Environnement

```bash
# Development
cd functions
firebase use dev
npm run deploy

# Acceptance
firebase use acc
npm run deploy

# Production
firebase use prod
npm run deploy
```

### URLs Functions

| Env | Base URL                                                          |
|-----|-------------------------------------------------------------------|
| dev | `https://europe-west1-befret-development.cloudfunctions.net`      |
| acc | `https://europe-west1-befret-acceptance.cloudfunctions.net`       |
| prod| `https://europe-west1-befret-production.cloudfunctions.net`       |

---

## 📋 CHECKLIST PRÉ-DÉPLOIEMENT

### Avant Déploiement Acceptance
- [x] `.firebaserc` configuré avec alias `acc`
- [x] `.env.acceptance` créé avec bonnes configs
- [x] Service account key `befret-acceptance` copié
- [x] Hosting site `befret-backoffice-acceptance` créé dans Firebase
- [ ] Firebase Functions déployées sur acceptance
- [ ] Test connexion Firestore depuis backoffice
- [ ] Test intégration avec shipments de befret_new

### Avant Déploiement Production
- [ ] `.env.production` créé
- [ ] Service account key `befret-production` récupéré
- [ ] Hosting site `befret-backoffice-production` créé
- [ ] Firebase Functions déployées
- [ ] Tests complets effectués sur acceptance
- [ ] Validation équipe

---

## 🎯 PROCHAINES ÉTAPES

### Immédiat (Acceptance)
1. ✅ Configuration fichiers terminée
2. 🔄 Tester connexion Firebase/Firestore
3. ⏳ Déployer Firebase Functions sur acceptance
4. ⏳ Build et déployer frontend sur acceptance
5. ⏳ Tester intégration complète avec befret_new

### Futur (Production)
1. ⏳ Créer projet Firebase `befret-production`
2. ⏳ Configurer hosting production
3. ⏳ Créer `.env.production`
4. ⏳ Tests exhaustifs
5. ⏳ Déploiement production

---

## 📝 NOTES IMPORTANTES

### Gitignore
Vérifier que les fichiers sensibles sont ignorés :
```gitignore
.env.local
.env.dev
.env.acceptance
.env.production
functions/serviceAccountKey.json
functions/befret-*-firebase-key.json
```

### Sécurité
- ❌ NE JAMAIS commit les fichiers `.env*` avec des clés réelles
- ❌ NE JAMAIS commit les service account keys
- ✅ Utiliser Firebase Functions config pour secrets en production

### Variables Build-Time
Next.js injecte les variables `NEXT_PUBLIC_*` au moment du build. Il faut rebuild pour changer d'environnement !

```bash
# ❌ ERREUR: Build une fois et déployer partout
npm run build
firebase deploy --project dev   # OK
firebase deploy --project acc   # ❌ Utilise encore dev config!

# ✅ CORRECT: Rebuild pour chaque environnement
npm run build                              # Pour dev
firebase deploy --project dev

NEXT_PUBLIC_ENV=acceptance npm run build   # Pour acc
firebase deploy --project acc
```

---

**Configuration multi-environnements complète !** ✅

**Prêt pour:** Déploiement sur acceptance et intégration avec befret_new.
