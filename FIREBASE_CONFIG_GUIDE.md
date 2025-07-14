# 🔥 Guide de Configuration Firebase - Befret Backoffice

## Variables d'Environnement Requises

### 1. Création du fichier .env.local
```bash
cp .env.example .env.local
```

### 2. Configuration NextAuth
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre-secret-nextauth-super-securise-befret-2024
```

### 3. Firebase Client (Frontend)
**Source** : Firebase Console > Project Settings > General > Your apps > Web app

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=befret-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=befret-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=befret-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4. Firebase Admin (Backend)
**Source** : Firebase Console > Project Settings > Service accounts > Generate new private key

**Option A - Variables séparées :**
```env
FIREBASE_PROJECT_ID=befret-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@befret-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BA...\n-----END PRIVATE KEY-----\n"
FIREBASE_PRIVATE_KEY_ID=xxxxxxxxxxxxxx
FIREBASE_CLIENT_ID=123456789
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40befret-project.iam.gserviceaccount.com
```

**Option B - JSON complet (plus simple) :**
```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"befret-project","private_key_id":"xxxxx","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...","client_email":"firebase-adminsdk-xxxxx@befret-project.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40befret-project.iam.gserviceaccount.com"}
```

## 📋 Étapes de Configuration

### 1. Récupérer les Credentials Client
1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionner votre projet Befret
3. **Project Settings** (⚙️) > **General**
4. Descendre à "Your apps" > Section Web
5. Copier toutes les valeurs de `firebaseConfig`

### 2. Créer un Service Account
1. **Project Settings** > **Service accounts**
2. Cliquer "**Generate new private key**"
3. Télécharger le fichier JSON
4. Copier tout le contenu dans `FIREBASE_SERVICE_ACCOUNT_KEY`

### 3. Vérifier les Permissions
Le Service Account doit avoir ces rôles :
- **Firebase Admin SDK Administrator Service Agent**
- **Cloud Datastore User** (pour Firestore)

### 4. Sécurité Firestore
Vérifier que les règles permettent l'accès staff :
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow staff access
    match /{document=**} {
      allow read, write: if hasStaffRole();
    }
    
    function hasStaffRole() {
      return request.auth != null && 
             request.auth.token.staff == true;
    }
  }
}
```

## 🧪 Test de Configuration

### 1. Comptes de Test (Sans Firebase)
En attendant la config Firebase :
- **Admin** : admin@befret.com / admin123
- **Operator** : operator@befret.com / operator123

### 2. Test des Variables
```bash
# Vérifier les variables
npm run dev
# Aller sur http://localhost:3001
# Essayer de se connecter
```

### 3. Test API
```bash
# Tester l'API parcels
curl http://localhost:3001/api/parcels

# Tester l'API stats
curl http://localhost:3001/api/dashboard/stats
```

## 🔍 Debugging Firebase

### Erreurs Communes

**"Firebase App not initialized"**
```bash
# Vérifier les variables client
echo $NEXT_PUBLIC_FIREBASE_PROJECT_ID
```

**"Service account not found"**
```bash
# Vérifier le JSON service account
node -e "console.log(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))"
```

**"Permission denied"**
- Vérifier les règles Firestore
- S'assurer que l'utilisateur a `isEmployee: true`

### Logs Utiles
```bash
# Logs du serveur
npm run dev

# Logs du build
npm run build

# Logs des variables
npm run type-check
```

## 📁 Structure des Collections Existantes

### Collections à Vérifier
- `parcel` : Colis et expéditions
- `users` : Profils utilisateurs (chercher `isEmployee: true`)
- `items` : Contenu des colis
- `messages` : Support client
- `promotions` : Système de remises

### Test de Connexion
```javascript
// Test manuel dans la console Firebase
db.collection('users').where('isEmployee', '==', true).get()
```

## ✅ Checklist de Configuration

- [ ] Fichier `.env.local` créé
- [ ] Variables `NEXT_PUBLIC_FIREBASE_*` configurées
- [ ] Service Account JSON récupéré
- [ ] Variable `FIREBASE_SERVICE_ACCOUNT_KEY` configurée
- [ ] Secret `NEXTAUTH_SECRET` généré
- [ ] Test de build : `npm run build`
- [ ] Test de démarrage : `npm run dev`
- [ ] Test de connexion avec admin@befret.com
- [ ] Vérification des API routes

---

Une fois toutes les clés configurées, le backoffice utilisera automatiquement Firebase au lieu des données de démonstration !