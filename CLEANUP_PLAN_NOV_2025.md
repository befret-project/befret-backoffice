# PLAN DE NETTOYAGE BEFRET-BACKOFFICE
**Date:** 14 Novembre 2025
**Objectif:** Supprimer tous les fichiers obsolètes avant migration vers acceptance

---

## 📋 FICHIERS À SUPPRIMER

### 1. API Routes Obsolètes (Code mort) ❌

**Raison:** Migrées vers Firebase Functions, jamais exécutées en mode export statique.

**Fichiers:**
```bash
src/app/api/logistic/reception/confirm/route.ts
src/app/api/logistic/reception/search/route.ts
src/app/api/logistic/reception/weigh/route.ts
```

**Action:**
```bash
rm -rf src/app/api/logistic/reception/
```

**Impact:** Aucun (ces fichiers ne sont jamais appelés en production).

---

### 2. Documentation Dupliquée Sprint 1 ❌

**Raison:** 5 fichiers différents avec "SPRINT 1 FINAL" - énorme duplication.

**Fichiers à SUPPRIMER (garder le plus récent):**
```bash
SPRINT_1_COMPLETE_FINAL.md              (8.5K)  - 27 Oct ou avant
SPRINT_1_FINALIZATION_COMPLETE.md       (15K)   - Doublon
SPRINT_1_FINAL_REPORT.md                (14K)   - Doublon
SPRINT_1_IMPLEMENTATION_REPORT.md       (11K)   - Ancien
SPRINT_1_STATUS_FINAL.md                (14K)   - Doublon
```

**Fichiers à GARDER:**
```bash
SESSION_27_OCT_FINAL_STATUS.md          (12K)   - ✅ Le plus récent et complet
IMPLEMENTATION_STATUS.md                (15K)   - ✅ Vue d'ensemble (18 Oct)
```

**Actions:**
```bash
rm SPRINT_1_COMPLETE_FINAL.md
rm SPRINT_1_FINALIZATION_COMPLETE.md
rm SPRINT_1_FINAL_REPORT.md
rm SPRINT_1_IMPLEMENTATION_REPORT.md
rm SPRINT_1_STATUS_FINAL.md
```

---

### 3. Sessions Documentation Anciennes ⚠️

**À évaluer:**
```bash
SESSION_COMPLETION_SUMMARY.md           (12K)   - Quelle date ?
SESSION_WORK_SUMMARY.md                 (11K)   - 19 Oct
SESSION_WORK_SUMMARY_27_OCT.md          (9.5K)  - 27 Oct
README_SESSION_12_OCT.md                (6.5K)  - 12 Oct
```

**Recommandation:**
- Garder: `SESSION_27_OCT_FINAL_STATUS.md` (le plus récent)
- Supprimer: Les 3 autres sessions anciennes

**Actions:**
```bash
rm SESSION_WORK_SUMMARY.md
rm README_SESSION_12_OCT.md
# Vérifier contenu SESSION_COMPLETION_SUMMARY.md avant suppression
```

---

### 4. Fichiers Debug/Test ⚠️

**Fichiers:**
```bash
debug-page.tsx                          (1.6K)  - À la racine du projet
debug-stats.js                          (2.9K)  - À la racine du projet
```

**Action:** Vérifier s'ils sont importés quelque part, sinon supprimer.

```bash
# Recherche d'imports
grep -r "debug-page" src/
grep -r "debug-stats" src/

# Si aucun résultat:
rm debug-page.tsx
rm debug-stats.js
```

---

### 5. Autres fichiers potentiellement obsolètes 🤔

**À vérifier:**
```bash
STATUS.md                               (5.4K)  - Ancien status ?
STATUS_ANALYSIS_SPRINT_1_2.md           (2.2K)  - Analyse ancienne ?
CLEANUP_PLAN.md                         (existe ?) - Plan ancien ?
```

**Action:** Lire le contenu et décider.

---

## ✅ FICHIERS À CONSERVER

### Documentation Principale
```bash
README.md                               - Documentation projet
CLAUDE.md                               - Instructions développement
CONTRIBUTING.md                         - Guide contribution
QUICK_START.md                          - Guide démarrage rapide
```

### Documentation Technique
```bash
ARCHITECTURE_BACKOFFICE_COMPLETE.md     - Architecture complète
AUTHENTICATION_SETUP.md                 - Setup authentification
FIREBASE_CONFIG_GUIDE.md                - Guide config Firebase
```

### Documentation Sprint/Session (Les plus récents)
```bash
SESSION_27_OCT_FINAL_STATUS.md          - ✅ État final Sprint 1
IMPLEMENTATION_STATUS.md                - ✅ Vue d'ensemble implémentation
```

### Documentation Fonctionnalités
```bash
SCANNER_CAMERA_FIX.md                   - Fix scanner caméra
SCANNER_IMPLEMENTATION.md               - Implémentation scanner
SCANNER_FINAL_SUMMARY.md                - Résumé final scanner
MAPPING_FINAL_FIX.md                    - Fix mapping données
SEARCH_PAGE_MAPPING_FIX.md              - Fix page recherche
DASHBOARD_FIX.md                        - Fix dashboard
FIRESTORE_COLLECTION_FIX.md             - Fix collection Firestore
```

### Guides & Plans
```bash
PLAN_DE_TEST_BEFRET.md                  - Plan de tests
QUICK_START_PHASE2.md                   - Guide phase 2
```

### Nouvelles Documentations
```bash
AUDIT_COMPLET_NOV_2025.md               - ✅ Audit complet (ce fichier)
CLEANUP_PLAN_NOV_2025.md                - ✅ Plan nettoyage (ce fichier)
```

---

## 🎯 RÉSUMÉ DES SUPPRESSIONS

### Total fichiers à supprimer: ~13 fichiers

**Par catégorie:**
- API Routes: 3 fichiers (+ dossiers vides)
- Documentation Sprint 1: 5 fichiers
- Sessions anciennes: 3 fichiers
- Debug/Test: 2 fichiers

**Espace libéré estimé:** ~100KB (documentation) + code mort supprimé

---

## 🚀 ORDRE D'EXÉCUTION RECOMMANDÉ

### Étape 1: Vérifications de sécurité (5 min)
```bash
# Vérifier que debug files ne sont pas importés
cd /home/kalem-2/projects/befret-backoffice
grep -r "debug-page" src/ || echo "✅ debug-page non utilisé"
grep -r "debug-stats" src/ || echo "✅ debug-stats non utilisé"
```

### Étape 2: Backup avant suppression (optionnel)
```bash
# Créer backup
mkdir -p ~/backups/befret-backoffice-$(date +%Y%m%d)
cp SPRINT_1_*.md ~/backups/befret-backoffice-$(date +%Y%m%d)/
cp SESSION_*.md ~/backups/befret-backoffice-$(date +%Y%m%d)/
```

### Étape 3: Suppression API Routes (2 min)
```bash
rm -rf src/app/api/logistic/reception/
# Vérifier si dossier api est vide
ls -la src/app/api/
# Si vide, supprimer aussi
# rm -rf src/app/api/
```

### Étape 4: Suppression Documentation (2 min)
```bash
# Sprint 1 doublons
rm SPRINT_1_COMPLETE_FINAL.md
rm SPRINT_1_FINALIZATION_COMPLETE.md
rm SPRINT_1_FINAL_REPORT.md
rm SPRINT_1_IMPLEMENTATION_REPORT.md
rm SPRINT_1_STATUS_FINAL.md

# Sessions anciennes
rm SESSION_WORK_SUMMARY.md
rm README_SESSION_12_OCT.md
```

### Étape 5: Suppression Debug (1 min)
```bash
rm debug-page.tsx
rm debug-stats.js
```

### Étape 6: Git Commit (2 min)
```bash
git status
git add -A
git commit -m "chore: cleanup obsolete files (API routes, duplicate docs, debug files)"
```

---

## ⚠️ ATTENTION

### Ne PAS supprimer:
- Fichiers de configuration (`.env.*`, `firebase.json`, etc.)
- Fichiers de build (`package.json`, `tsconfig.json`, etc.)
- Dossiers principaux (`src/`, `functions/`, `public/`, etc.)
- Documentation technique récente

### Vérifier avant suppression:
- `STATUS.md` - Peut-être encore utilisé ?
- `CLEANUP_PLAN.md` - Ancien plan de nettoyage ?
- `SESSION_COMPLETION_SUMMARY.md` - Date à vérifier

---

## 📝 CHECKLIST

- [ ] Vérifier debug files non importés
- [ ] Backup optionnel créé
- [ ] API routes supprimées
- [ ] Documentation Sprint 1 dupliquée supprimée
- [ ] Sessions anciennes supprimées
- [ ] Debug files supprimés
- [ ] Git commit effectué
- [ ] Vérification: `npm run build` fonctionne toujours
- [ ] Vérification: Documentation essentielle toujours présente

---

**Prêt à exécuter ?** Voir Ordre d'Exécution ci-dessus.

**Après nettoyage:** Passer à la configuration Firebase acceptance.
