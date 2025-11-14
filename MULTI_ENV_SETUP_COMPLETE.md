# CONFIGURATION MULTI-ENVIRONNEMENTS COMPLÈTE
**Date:** 14 Novembre 2025
**Statut:** ✅ **100% COMPLET** - Local, Dev, Acceptance configurés

---

## 🎯 RÉSUMÉ

Configuration complète pour 3 environnements (Local, Development, Acceptance) avec:
- ✅ Frontend (Next.js) - Build séparé par environnement
- ✅ Backend (Firebase Functions) - Déploiement séparé par environnement
- ✅ Firebase Projects - Configuration correcte pour chaque environnement
- ✅ Scripts npm - Commandes dédiées pour chaque environnement

---

## 🚀 COMMANDES PRINCIPALES

### Deploy Hosting (Frontend)
```bash
npm run deploy:dev       # Deploy hosting → befret-development
npm run deploy:acc       # Deploy hosting → befret-acceptance
```

### Deploy Functions (Backend)
```bash
npm run deploy:functions:dev    # Deploy functions → befret-development
npm run deploy:functions:acc    # Deploy functions → befret-acceptance
```

### Deploy COMPLET (Hosting + Functions)
```bash
npm run deploy:all:dev    # Build + Deploy tout → befret-development
npm run deploy:all:acc    # Build + Deploy tout → befret-acceptance
```

---

## 🌐 URLS

| Environnement | URL | Projet Firebase |
|---------------|-----|-----------------|
| **Local** | http://localhost:3000 | befret-development |
| **Development** | https://befret-development.web.app | befret-development |
| **Acceptance** | https://befret-backoffice-acceptance.web.app | befret-acceptance |

---

**Dernière mise à jour:** 14 Novembre 2025
**Statut:** ✅ Production Ready
