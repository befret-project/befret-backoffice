# Configuration de l'Authentification Google - Befret Backoffice

**Date:** 14 Novembre 2025
**Statut:** ✅ Code implémenté - Configuration Firebase requise

---

## 🎯 RÉSUMÉ

L'authentification Google a été ajoutée au Befret Backoffice pour permettre au personnel autorisé de se connecter avec leur compte Google.

---

## ✅ IMPLÉMENTATION COMPLÈTE

### Code Frontend
- ✅ `src/lib/firebase-auth.ts` - Fonction `signInWithGoogle()` ajoutée
- ✅ `src/hooks/useAuth.ts` - Hook `signInWithGoogle` exposé
- ✅ `src/app/(auth)/login/page.tsx` - Bouton "Continuer avec Google" ajouté
- ✅ Build testé et réussi

### Fonctionnalités
- ✅ Popup Google OAuth
- ✅ Récupération automatique du nom et email
- ✅ Attribution du rôle via Firebase Custom Claims
- ✅ Gestion d'erreurs (popup fermée, popup bloquée, etc.)
- ✅ Design cohérent avec le reste de l'interface

---

## 🔧 CONFIGURATION FIREBASE REQUISE

### Pour chaque environnement (Development, Acceptance, Production)

#### 1. **Activer Google Authentication dans Firebase Console**

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionner le projet :
   - **Development** : befret-development
   - **Acceptance** : befret-acceptance
   - **Production** : befret-production
3. Aller dans **Authentication** → **Sign-in method**
4. Cliquer sur **Google** dans la liste des fournisseurs
5. Activer le fournisseur Google
6. Configurer :
   - **Project support email** : Choisir votre email (ex: yannick.kalemba@gmail.com)
   - **Project public-facing name** : "Befret Backoffice"
7. Cliquer sur **Save**

#### 2. **Ajouter les domaines autorisés**

Dans **Authentication** → **Settings** → **Authorized domains**, vérifier que ces domaines sont autorisés :

**Development:**
- `befret-development.web.app`
- `befret-development.firebaseapp.com`
- `localhost` (pour développement local)

**Acceptance:**
- `befret-backoffice-acceptance.web.app`
- `befret-acceptance.firebaseapp.com`

**Production (à configurer plus tard):**
- `befret-production.web.app`
- `befret-production.firebaseapp.com`
- Votre domaine custom si vous en avez un

#### 3. **Configurer les rôles utilisateurs (IMPORTANT)**

Par défaut, les utilisateurs Google auront le rôle `LOGISTIC_OPERATOR`. Pour donner des rôles personnalisés :

**Option 1 : Via Firebase CLI (Recommandé)**

```bash
# Installer Firebase Admin SDK
npm install -g firebase-tools

# Se connecter
firebase login

# Définir un rôle pour un utilisateur
firebase functions:config:set user_roles.yannick.kalemba@gmail.com=ADMIN --project befret-development
firebase functions:config:set user_roles.toos.mansala@outlook.com=LOGISTIC_MANAGER --project befret-development
```

**Option 2 : Via Cloud Function (Pour production)**

Créer une Cloud Function qui assigne les rôles basés sur l'email :

```typescript
// functions/src/auth-triggers.ts
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

export const assignUserRole = functions.auth.user().onCreate(async (user) => {
  const email = user.email;

  // Map d'emails autorisés et leurs rôles
  const authorizedUsers: Record<string, string> = {
    'yannick.kalemba@gmail.com': 'ADMIN',
    'toos.mansala@outlook.com': 'LOGISTIC_MANAGER',
    'ynmpicture@gmail.com': 'LOGISTIC_OPERATOR'
  };

  const role = authorizedUsers[email || ''];

  if (role) {
    // Assigner le rôle via custom claims
    await admin.auth().setCustomUserClaims(user.uid, { role });
    console.log(`Role ${role} assigned to ${email}`);
  } else {
    // Utilisateur non autorisé - supprimer le compte
    await admin.auth().deleteUser(user.uid);
    console.log(`Unauthorized user deleted: ${email}`);
  }
});
```

---

## 🔒 SÉCURITÉ

### Contrôle d'accès

**Liste blanche d'emails** (recommandé pour le backoffice) :

Ajouter une vérification dans `src/lib/firebase-auth.ts` :

```typescript
// Liste d'emails autorisés
const AUTHORIZED_EMAILS = [
  'yannick.kalemba@gmail.com',
  'toos.mansala@outlook.com',
  'ynmpicture@gmail.com'
];

// Dans signInWithGoogle(), après userCredential :
if (!AUTHORIZED_EMAILS.includes(firebaseUser.email || '')) {
  await firebaseSignOut(auth);
  throw new Error('Accès non autorisé. Contactez l\'administrateur.');
}
```

### Règles Firestore

Assurer que seuls les utilisateurs authentifiés peuvent accéder aux données :

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permettre l'accès uniquement aux utilisateurs authentifiés
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🧪 TESTER L'AUTHENTIFICATION GOOGLE

### Environnement Local

1. Démarrer le serveur local :
```bash
cd /home/kalem-2/projects/befret-backoffice
npm run dev
```

2. Aller sur http://localhost:3000/login
3. Cliquer sur "Continuer avec Google"
4. Sélectionner votre compte Google
5. Vérifier que vous êtes redirigé vers `/modules`

### Environnement Development

1. Aller sur https://befret-development.web.app/login
2. Cliquer sur "Continuer avec Google"
3. Sélectionner votre compte Google
4. Vérifier la redirection

### Vérifier le rôle assigné

Après connexion, ouvrir la console du navigateur et taper :
```javascript
const user = JSON.parse(localStorage.getItem('befret_user'));
console.log('Role:', user.role);
console.log('Permissions:', user.permissions);
```

---

## 📊 RÔLES DISPONIBLES

Définis dans `src/types/auth.ts` :

| Rôle | Permissions |
|------|-------------|
| `ADMIN` | Accès complet à toutes les fonctionnalités |
| `FINANCE_MANAGER` | Gestion financière, paiements, factures |
| `LOGISTIC_MANAGER` | Gestion logistique complète |
| `COMMERCIAL_MANAGER` | Gestion commerciale, CRM, pipeline |
| `SUPPORT_MANAGER` | Gestion support client, tickets |
| `LOGISTIC_OPERATOR` | Opérations logistiques basiques (rôle par défaut) |
| `COMMERCIAL_AGENT` | Opérations commerciales basiques |
| `SUPPORT_AGENT` | Support client basique |

---

## 🚀 DÉPLOIEMENT

Après avoir configuré Firebase Console :

```bash
# Déployer sur Development
npm run deploy:all:dev

# Déployer sur Acceptance
npm run deploy:all:acc

# Déployer sur Production (quand prêt)
npm run deploy:all:prod
```

---

## ⚠️ TROUBLESHOOTING

### Popup bloquée par le navigateur
- Vérifier que les popups sont autorisées pour le domaine Firebase
- Sur Chrome : Cliquer sur l'icône de popup bloquée dans la barre d'adresse

### Erreur "auth/unauthorized-domain"
- Vérifier que le domaine est ajouté dans **Authorized domains** dans Firebase Console

### L'utilisateur n'a pas le bon rôle
- Vérifier que les custom claims sont bien configurés
- Forcer le rafraîchissement du token : déconnexion/reconnexion

### Popup fermée sans connexion
- C'est normal si l'utilisateur ferme la popup
- Le message d'erreur "Connexion annulée" s'affichera

---

## 📝 PROCHAINES ÉTAPES

1. ✅ Activer Google Auth dans Firebase Console (Development)
2. ✅ Activer Google Auth dans Firebase Console (Acceptance)
3. ⏳ Configurer la liste d'emails autorisés
4. ⏳ Créer la Cloud Function d'assignation de rôles
5. ⏳ Tester avec plusieurs comptes
6. ⏳ Déployer en production

---

**Dernière mise à jour:** 14 Novembre 2025
**Responsable:** Claude Code Assistant
