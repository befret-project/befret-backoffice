# Development Local des Firebase Functions

## Configuration des Credentials

### Pour le développement local

Si vous développez localement et voulez tester avec un projet spécifique :

```bash
# Option 1 : Utiliser l'émulateur Firebase (recommandé)
cd functions
npm run serve

# Option 2 : Tester avec un vrai projet
# Définir la variable d'environnement
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
npm run shell
```

### Service Account Keys disponibles

- `serviceAccountKey.json` - befret-development
- `befret-acceptance-firebase-key.json` - befret-acceptance

**⚠️ IMPORTANT :** Ces fichiers sont dans `.gitignore` et ne doivent JAMAIS être committés !

## Déploiement

Les functions utilisent automatiquement les credentials du projet sur lequel elles sont déployées.
Pas besoin de spécifier de service account key !

### Commandes de déploiement

```bash
# Depuis le dossier racine
npm run deploy:functions:dev    # Deploy functions sur befret-development
npm run deploy:functions:acc    # Deploy functions sur befret-acceptance
npm run deploy:functions:prod   # Deploy functions sur befret-production

# Depuis le dossier functions
npm run deploy:dev    # Deploy functions sur befret-development
npm run deploy:acc    # Deploy functions sur befret-acceptance
npm run deploy:prod   # Deploy functions sur befret-production

# Deploy TOUT (hosting + functions)
npm run deploy:all:dev    # Deploy tout sur befret-development
npm run deploy:all:acc    # Deploy tout sur befret-acceptance
npm run deploy:all:prod   # Deploy tout sur befret-production
```

## Architecture

Les Functions utilisent `admin.initializeApp()` sans paramètres :
- ✅ En production : Utilise automatiquement les credentials du projet Firebase
- ✅ En local avec émulateur : Fonctionne sans credentials
- ✅ En local avec vrai projet : Utilise GOOGLE_APPLICATION_CREDENTIALS si défini

Cette approche est plus sécurisée et évite les hardcoded service account keys.
