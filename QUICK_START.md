# 🚀 Guide de Démarrage Rapide - Befret Backoffice

## Installation Express

```bash
# 1. Cloner et installer
cd befret-backoffice
npm run setup

# 2. Configurer Firebase (obligatoire)
# Éditer .env.local avec vos credentials Firebase

# 3. Démarrer l'application
npm run dev
```

## Configuration Firebase Minimale

Copiez les informations depuis `befret_new/src/environments/environment.ts` :

```env
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=befret-super-secret-key-2024

# Firebase Client
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=votre-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre-project.firebaseapp.com

# Firebase Admin (Service Account)
FIREBASE_PROJECT_ID=votre-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@votre-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVotre clé privée ici\n-----END PRIVATE KEY-----"
```

## Test de Connexion

1. **Accéder à l'application** : `http://localhost:3001`
2. **Page de connexion** : Utiliser un compte employé existant de Befret
3. **Vérifier l'accès** : Seuls les utilisateurs avec `isEmployee: true` peuvent se connecter

## Premiers Tests

### Dashboard
- Vue d'ensemble des KPIs
- Graphiques d'évolution
- Actions rapides par rôle

### Module Logistic
- **Réception** : `/logistic/colis/reception`
- **Préparation** : `/logistic/colis/preparation`  
- **Vue d'ensemble** : `/logistic`

## Dépannage Rapide

### Erreur de connexion Firebase
```bash
# Vérifier les credentials
npm run type-check
```

### Port déjà utilisé
```bash
# L'app utilise automatiquement le port 3001 si 3000 est occupé
# Ou forcer un port :
npm run dev -- -p 3002
```

### Cache / Problèmes de build
```bash
npm run restart
```

## Architecture Modulaire

```
Modules disponibles:
├── 📊 Dashboard (✅ complet)
├── 📦 Logistic (🔄 en cours)
│   ├── Réception (✅ fonctionnel)
│   ├── Préparation (✅ fonctionnel)  
│   ├── Expédition (📋 à venir)
│   └── Rapports (📋 à venir)
├── 🎧 Support (📋 Phase 2)
├── 💰 Finance (📋 Phase 3)
└── 👥 Commercial (📋 Phase 4)
```

## Développement

### Ajouter un nouveau composant
```bash
# UI Component
touch src/components/ui/nouveau-composant.tsx

# Module Component  
touch src/components/logistic/nouveau-module.tsx

# Page
touch src/app/module/nouvelle-page/page.tsx
```

### Structure des permissions
```typescript
// Vérifier une permission
hasPermission(userPermissions, 'logistic:view')

// Permissions disponibles
'dashboard:view'
'logistic:view'
'logistic:manage_parcels'
'support:view'
// etc.
```

## Support

- **Documentation complète** : `README.md`
- **Erreurs courantes** : Vérifier les logs du navigateur
- **Firebase** : S'assurer que les règles de sécurité sont configurées
- **NextAuth** : Vérifier `NEXTAUTH_SECRET` en production

---
🎯 **Objectif** : Interface administrative moderne pour optimiser la logistique Befret Europe-Congo