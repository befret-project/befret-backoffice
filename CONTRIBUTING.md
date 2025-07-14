# 🤝 Guide de Contribution - Befret Backoffice

Bienvenue dans le projet Befret Backoffice ! Ce guide vous aidera à contribuer efficacement au projet.

## 📋 Table des matières

- [🏗️ Architecture du projet](#-architecture-du-projet)
- [🌳 Structure des branches](#-structure-des-branches)
- [🔄 Workflow de développement](#-workflow-de-développement)
- [📝 Standards de code](#-standards-de-code)
- [🧪 Tests](#-tests)
- [🚀 Déploiement](#-déploiement)

## 🏗️ Architecture du projet

### Environnements

| Environnement | Branche | URL | Firebase Project |
|---------------|---------|-----|------------------|
| **Local** | `feature/*` | `localhost:3000` | `befret-development` |
| **Development** | `develop` | `https://befret-development.web.app` | `befret-development` |
| **Staging** | `staging` | `https://befret-staging.web.app` | `befret-staging` |
| **Production** | `main` | `https://befret.be` | `befret-production` |

### Stack technique

- **Frontend :** Next.js 15 + TypeScript + Tailwind CSS
- **Backend :** Firebase Functions + Firestore
- **Déploiement :** Firebase Hosting
- **CI/CD :** GitHub Actions

## 🌳 Structure des branches

### Branches principales

```
main (production)
├── staging (pre-production)
└── develop (développement)
    ├── feature/nom-de-la-fonctionnalite
    ├── bugfix/description-du-bug
    ├── hotfix/correction-urgente
    └── release/v1.2.0
```

### Convention de nommage

```bash
# Nouvelles fonctionnalités
feature/dashboard-stats-enhancement
feature/parcel-reception-workflow

# Corrections de bugs
bugfix/login-authentication-error
bugfix/dashboard-loading-issue

# Corrections urgentes (depuis main)
hotfix/critical-security-patch
hotfix/production-crash-fix

# Préparation de release
release/v1.2.0
release/v2.0.0-beta
```

## 🔄 Workflow de développement

### 1. Setup initial

```bash
# Cloner le repository
git clone https://github.com/befret-project/befret-backoffice.git
cd befret-backoffice

# Installer les dépendances
npm install

# Configurer l'environnement local
cp .env.development .env.local
```

### 2. Créer une nouvelle fonctionnalité

```bash
# Basculer sur develop et mettre à jour
git checkout develop
git pull origin develop

# Créer une nouvelle branche
git checkout -b feature/ma-nouvelle-fonctionnalite

# Développer la fonctionnalité
# ... vos modifications ...

# Commit avec message conventionnel
git add .
git commit -m "feat: ajouter dashboard des statistiques temps réel

- Ajouter composant StatsCards avec données Firestore
- Implémenter cache avec refresh automatique
- Ajouter indicateurs de performance
- Tests unitaires pour les composants

Closes #123"

# Pousser la branche
git push -u origin feature/ma-nouvelle-fonctionnalite
```

### 3. Créer une Pull Request

1. Aller sur GitHub
2. Créer une PR depuis votre branche vers `develop`
3. Remplir le template de PR
4. Assigner des reviewers
5. Attendre l'approbation et le merge

### 4. Workflow de merge

```
feature/xxx → develop → staging → main
```

## 📝 Standards de code

### Commits conventionnels

Utilisez le format [Conventional Commits](https://www.conventionalcommits.org/) :

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types :**
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage (pas de changement de code)
- `refactor:` Refactoring
- `test:` Ajout/modification de tests
- `chore:` Maintenance

**Exemples :**

```bash
feat(dashboard): ajouter graphique des livraisons mensuelles
fix(auth): corriger la redirection après login
docs: mettre à jour le guide de déploiement
refactor(components): restructurer les composants UI
```

### Code Style

#### TypeScript

```typescript
// ✅ Bon
interface ParcelData {
  id: string;
  status: ParcelStatus;
  createdAt: Date;
  updatedAt: Date;
}

const fetchParcels = async (filters: ParcelFilters): Promise<ParcelData[]> => {
  // Implementation
};

// ❌ Mauvais
const fetchParcels = (filters: any) => {
  // Implementation
};
```

#### React Components

```tsx
// ✅ Bon
interface StatsCardProps {
  title: string;
  value: number;
  trend?: 'up' | 'down' | 'stable';
  loading?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  trend = 'stable',
  loading = false
}) => {
  if (loading) {
    return <StatsCardSkeleton />;
  }

  return (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold">{value}</span>
        <TrendIcon trend={trend} />
      </div>
    </Card>
  );
};
```

### Structure des dossiers

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── (auth)/            # Groupe de routes authentifiées
│   ├── dashboard/         # Module dashboard
│   ├── logistic/          # Module logistique
│   └── layout.tsx         # Layout principal
├── components/            # Composants réutilisables
│   ├── ui/               # Composants UI de base
│   ├── dashboard/        # Composants spécifiques au dashboard
│   ├── logistic/         # Composants logistiques
│   └── layout/           # Composants de layout
├── lib/                  # Utilitaires et configurations
├── services/             # Services API et logique métier
├── types/                # Définitions TypeScript
└── utils/                # Fonctions utilitaires
```

## 🧪 Tests

### Tests requis

```bash
# Linting et formatage
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Tests unitaires (à implémenter)
npm run test
npm run test:watch

# Tests E2E (à implémenter)
npm run test:e2e
```

### Couverture de tests

- **Composants UI :** Tests de rendu et interactions
- **Services :** Tests unitaires pour la logique métier
- **Pages :** Tests d'intégration
- **APIs :** Tests d'endpoints Firebase Functions

## 🚀 Déploiement

### Déploiements automatiques

| Branche | Trigger | Environnement | URL |
|---------|---------|---------------|-----|
| `develop` | Push/PR merge | Development | https://befret-development.web.app |
| `staging` | Push/PR merge | Staging | https://befret-staging.web.app |
| `main` | Push/Tag | Production | https://befret.be |

### Déploiement manuel

```bash
# Development
npm run deploy:dev

# Staging
npm run deploy:staging

# Production (nécessite review)
npm run deploy:production
```

### Releases

1. Créer une branche `release/vX.Y.Z` depuis `develop`
2. Mettre à jour le CHANGELOG.md
3. Bump la version dans package.json
4. Merger dans `staging` pour tests
5. Merger dans `main` et créer un tag
6. Le déploiement production se lance automatiquement

## 🔒 Sécurité

### Règles importantes

- ❌ **Jamais** committer de secrets ou clés API
- ✅ Utiliser des variables d'environnement
- ✅ Valider toutes les entrées utilisateur
- ✅ Respecter les règles Firestore Security Rules
- ✅ Audit de sécurité avant chaque release

### Variables d'environnement

```bash
# Local
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=befret-development

# Ne jamais committer
FIREBASE_ADMIN_KEY=xxx
SENDGRID_API_KEY=xxx
```

## 🆘 Aide et support

### Documentation

- [CLAUDE.md](./CLAUDE.md) - Architecture détaillée
- [README.md](./README.md) - Guide de démarrage
- [Firebase Documentation](https://firebase.google.com/docs)

### Contact

- **Issues :** [GitHub Issues](https://github.com/befret-project/befret-backoffice/issues)
- **Discussions :** [GitHub Discussions](https://github.com/befret-project/befret-backoffice/discussions)

---

**💡 Conseil :** Lisez toujours CLAUDE.md avant de commencer le développement pour comprendre l'architecture globale du projet.