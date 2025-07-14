#!/usr/bin/env node

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Charger les variables d'environnement depuis .env.development
const envPath = path.join(__dirname, '..', '.env.development');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

console.log('🔧 Variables d\'environnement chargées...');
console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);

// Configuration Firebase Admin
const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.FIREBASE_PROJECT_ID || 'befret-development',
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
};

// Vérifier que les variables essentielles sont présentes
if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
  console.error('❌ Variables d\'environnement Firebase manquantes:');
  console.error('FIREBASE_PRIVATE_KEY:', serviceAccount.private_key ? '✅ Present' : '❌ Missing');
  console.error('FIREBASE_CLIENT_EMAIL:', serviceAccount.client_email ? '✅ Present' : '❌ Missing');
  console.error('FIREBASE_PROJECT_ID:', serviceAccount.project_id ? '✅ Present' : '❌ Missing');
  console.error('');
  console.error('📝 Solution: Assure-toi que .env.development contient les bonnes clés Firebase Admin');
  process.exit(1);
}

// Initialiser Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'befret-development'
  });
}

async function createAdminUser() {
  try {
    console.log('🔧 Création de l\'utilisateur admin...');
    
    const adminUser = {
      email: 'admin@befret.com',
      password: 'AdminBefret2024!',
      displayName: 'Admin Befret',
      emailVerified: true,
      disabled: false
    };

    // Créer l'utilisateur
    const userRecord = await admin.auth().createUser(adminUser);
    console.log('✅ Utilisateur créé avec succès:', userRecord.uid);

    // Ajouter des custom claims pour les permissions
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'SUPER_ADMIN',
      permissions: [
        'dashboard.read',
        'commercial.read',
        'commercial.write',
        'finance.read',
        'finance.write',
        'logistic.read',
        'logistic.write',
        'support.read',
        'support.write',
        'admin.read',
        'admin.write'
      ]
    });

    console.log('✅ Permissions admin ajoutées');
    console.log('');
    console.log('🎯 Utilisateur admin créé :');
    console.log('   Email: admin@befret.com');
    console.log('   Password: AdminBefret2024!');
    console.log('   Role: SUPER_ADMIN');
    console.log('');
    console.log('🌐 Tu peux maintenant te connecter sur :');
    console.log('   https://befret-development-e3cb5.web.app/login');

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('⚠️  L\'utilisateur admin@befret.com existe déjà');
      
      // Récupérer l'utilisateur existant
      const existingUser = await admin.auth().getUserByEmail('admin@befret.com');
      
      // Mettre à jour les permissions
      await admin.auth().setCustomUserClaims(existingUser.uid, {
        role: 'SUPER_ADMIN',
        permissions: [
          'dashboard.read',
          'commercial.read',
          'commercial.write',
          'finance.read',
          'finance.write',
          'logistic.read',
          'logistic.write',
          'support.read',
          'support.write',
          'admin.read',
          'admin.write'
        ]
      });
      
      console.log('✅ Permissions mises à jour pour l\'utilisateur existant');
    } else {
      console.error('❌ Erreur lors de la création:', error.message);
      process.exit(1);
    }
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  createAdminUser().then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
}

module.exports = { createAdminUser };