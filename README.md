# Befret Backoffice

Backoffice modulaire Next.js 15.3.4 pour la gestion logistique de Befret, société de livraison spécialisée dans l'envoi de colis de l'Europe vers le Congo.

> ⚠️ **ARCHITECTURE IMPORTANTE** : Ce projet utilise 4 environnements (local, dev, staging, prod) qui pointent tous vers Firebase. Voir [CLAUDE.md](./CLAUDE.md) pour la documentation complète.

## 🏗️ Architecture

### Vue d'ensemble du projet
```
befret-ecosystem/
├── befret_new/           # Application client Angular existante
├── befret-backoffice/    # Nouveau backoffice Next.js (ce projet)
└── shared-types/         # Types TypeScript partagés (futur)
```

### Modules du backoffice
- **Dashboard** : Vue d'ensemble et KPIs
- **Logistic** : Gestion complète de la chaîne logistique
- **Support** : Gestion des plaintes et réclamations (Phase 2)
- **Finance** : Comptabilité et facturation (Phase 3)
- **Commercial** : CRM et marketing (Phase 4)
- **Settings** : Administration utilisateurs et système

## 🚀 Installation et Configuration

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Accès au projet Firebase Befret existant

### Installation
```bash
cd befret-backoffice
npm install
```

### Configuration Firebase

1. **Copiez le fichier d'environnement**
```bash
cp .env.example .env.local
```

2. **Configurez les variables d'environnement**

Récupérez les informations de configuration depuis le projet `befret_new` :

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Firebase Client (depuis befret_new/src/environments/)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin (service account)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
# ... autres variables service account
```

3. **Configuration du Service Account**

Vous pouvez utiliser soit :
- Les variables individuelles du service account
- OU la clé complète en JSON : `FIREBASE_SERVICE_ACCOUNT_KEY`

### Démarrage en développement
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 🔐 Système d'Authentification

### Rôles et Permissions

Le backoffice utilise un système de rôles basé sur l'architecture existante :

#### Rôles disponibles
- `super_admin` : Accès total (mapping depuis `topManager`)
- `logistic_manager` : Gestion logistique complète (mapping depuis `manager`)
- `logistic_operator` : Opérations logistiques (mapping depuis `warehouse`, `delivery`)
- `support_manager` : Gestion support complète
- `support_agent` : Traitement tickets (mapping depuis `transitory`)
- `finance_manager` : Gestion financière
- `commercial_manager` : Gestion commerciale

#### Mapping des rôles existants
Le système mappe automatiquement les rôles existants (`ability`) vers les nouveaux rôles du backoffice :
- `topManager` → `super_admin`
- `manager` → `logistic_manager`
- `warehouse` → `logistic_operator`
- `delivery` → `logistic_operator`
- `transitory` → `support_agent`

### Connexion
Seuls les utilisateurs avec `isEmployee: true` peuvent accéder au backoffice.

## 📊 Structure des Données

### Collections Firestore Utilisées

Le backoffice réutilise les collections existantes :

- **parcel** : Colis et expéditions
- **users** : Profils utilisateurs et employés
- **items** : Contenu des colis
- **messages** : Support client
- **promotions** : Système de promotions
- **receivers** : Destinataires
- **contacts** : Newsletter

### Statuts des Colis
- `draft` : Brouillon
- `pending` : En attente (payé)
- `received` : Reçu à l'entrepôt
- `sent` : Expédié vers destination
- `arrived` : Arrivé au Congo
- `delivered` : Livré

## 🎯 Fonctionnalités par Module

### Dashboard
- ✅ Vue d'ensemble temps réel
- ✅ KPIs et métriques
- ✅ Activité récente
- ✅ Actions rapides contextuelles

### Module Logistic
- ✅ **Réception** : Scanner et enregistrer les colis
- 🔄 **Préparation** : Tri par destination
- 🔄 **Expédition** : Optimisation des envois
- 🔄 **Collectes** : Planning tournées Bruxelles
- 🔄 **Reporting** : Performances et délais

### Module Support (Phase 2)
- 🔄 Gestion des plaintes
- 🔄 Base de connaissances
- 🔄 Métriques satisfaction

### Modules Futurs
- 📋 **Finance** : Comptabilité, facturation
- 📋 **Commercial** : CRM, analytics

## 🛠️ Développement

### Structure du Code
```
src/
├── app/                  # Pages Next.js (App Router)
│   ├── (auth)/          # Pages d'authentification
│   ├── dashboard/       # Dashboard principal
│   ├── logistic/        # Module logistique
│   └── api/             # API routes
├── components/          # Composants React
│   ├── ui/              # Composants UI de base
│   ├── layout/          # Layout et navigation
│   ├── dashboard/       # Composants dashboard
│   └── logistic/        # Composants logistique
├── lib/                 # Utilitaires et configuration
│   ├── firebase-admin.ts
│   ├── firebase-client.ts
│   └── auth.ts
└── types/               # Types TypeScript
    ├── firestore.ts
    └── auth.ts
```

### Stack Technique
- **Frontend** : Next.js 14, React, TypeScript
- **Styling** : Tailwind CSS
- **UI Components** : Radix UI, Lucide Icons
- **Base de données** : Firebase Firestore (réutilisation)
- **Authentification** : NextAuth.js + Firebase Auth
- **Charts** : Recharts

### Ajout d'un Nouveau Module

1. **Créer la structure**
```bash
mkdir -p src/app/module-name
mkdir -p src/components/module-name
```

2. **Ajouter les permissions**
```typescript
// src/types/auth.ts
enum Permission {
  MODULE_VIEW = 'module:view',
  MODULE_MANAGE = 'module:manage'
}
```

3. **Mettre à jour la navigation**
```typescript
// src/components/layout/sidebar.tsx
const navigation = [
  // ... existing items
  {
    title: 'Nouveau Module',
    icon: Icon,
    permission: 'module:view',
    children: [...]
  }
]
```

## 🔒 Sécurité

### Middleware de Protection
- Vérification de l'authentification sur toutes les routes
- Contrôle des permissions par module
- Redirection automatique vers login

### Firestore Security Rules
Le backoffice respecte les règles de sécurité existantes :
- Accès staff basé sur les custom claims
- Validation des données côté serveur
- Isolation des données utilisateur

## 📱 Responsive Design

L'interface est optimisée pour :
- Desktop (usage principal)
- Tablettes (consultation mobile)
- Smartphones (actions rapides)

## 🚦 Statut du Développement

### Phase 1 (En cours) ✅
- [x] Architecture de base Next.js
- [x] Système d'authentification et rôles
- [x] Navigation modulaire
- [x] Dashboard principal avec KPIs
- [x] Module logistic - Réception des colis
- [ ] Module logistic - Préparation et expédition
- [ ] Module logistic - Gestion des collectes
- [ ] Module logistic - Reporting

### Phase 2 (Planifiée)
- [ ] Module Support complet
- [ ] Système de notifications temps réel
- [ ] Recherche et filtres avancés

### Phases Futures
- [ ] Module Finance
- [ ] Module Commercial
- [ ] API REST pour intégrations externes

## 🤝 Contribution

### Standards de Code
- TypeScript strict
- ESLint + Prettier
- Conventions de nommage cohérentes
- Commentaires JSDoc pour les fonctions complexes

### Workflow Git
1. Créer une branche feature
2. Développer et tester
3. Pull Request avec review
4. Merge après validation

## 📞 Support

Pour toute question ou problème :
- Consulter la documentation technique
- Vérifier les logs de développement
- Contacter l'équipe de développement

---

**Befret** - Révolutionner la logistique Europe-Congo 🚚✈️