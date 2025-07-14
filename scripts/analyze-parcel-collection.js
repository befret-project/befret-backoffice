const admin = require('firebase-admin');

// Configuration Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: "befret-development",
  private_key_id: "5fcbaea67acc49d07d5f8b3f9a52148f30591d69",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDLNp3FNxv6RcC9\nNRpDLr16Zxhurgqndk8nqeI6d8cqPv65BQLB6sW41KUxWF/lRBgMdKxwAHhFg4G2\njWwb+NxBgb/Mei3oKFJXhvCEMLxKclNL6N7SjI+UJHcYKbWlx3ekO5Y+QebxN2R5\nt7zbX5fXJyZtCwTdUT1lF+LQav1D5ah8iuoByPCUGm1bzHPI+4ts4++wMfhRUIzb\n/3GWWnAJtGj1NuK4wobgZ4kAaFJiAHDonwd8UXlaXUku6FhygGlCp1LbDjVjSdIN\nJ8RAre4ZIZW2GogduBRK6FicoKSF2glClEos3ECY9V0UKjMFaGSdjvKtQuqtunlj\njzxkyc+nAgMBAAECggEAE8JtR+JqbYT/z0YNFjBCy1af+Q8iSRNHchdiQIYqDxEO\nCqaSlJGEBUtj/q7VsEDVR8zGgaOCDlxRrhMFSpkBrbr0j+jnctYM36bm1yu3+1Mv\nh0eO9xEk2uZK0EYp/AMvvn/uxYH590WIFw/HJNugM5MCeQLjx7NhEWXnr5VfqAzN\nwK9kmaw+qfUYeIUeUP1UMPHCYtok0fKYqbgcZu0RCbhCuPwxGzMkOhurHHtTT/Us\ngr0qeOCQyfS5r5XuPi1wOtjt/pGMVawAZIdhiOpvYG16Wa1pkQAC+oDQffkmJEtO\nuswrEwab2bRScjJzstgysddVMP9kuymg0ueU9c114QKBgQD10VICHn5QRTRTg/IK\nIOiAYHAah3PrSU3ap/EDHuShgdpIAosanD/bDF9+NCPD8NgDXkhLVn5R5RXFMvZy\nTyjMd3+dBiQHFov2DbF1XU2WaWe9TYvvkQe/aB5hx2nBGT8O9XYqG3pqogrJCBk0\nSrI7F093vqZQM+cMBFTROTKWRwKBgQDToYPGrrtbbJNy3G3kmboX/ksqKPEp5EKg\nWqGUNROBfPkvOCxPb+s+U+exxPV8IcwnFMQ8raWcnuXKO8trpbw6f/IQ7FVs8Kwu\nSlAU06uIrrUYA/ls2GQVtr96tUBdT2wI+uiUj4lzctysK4aQe9h30bswwplmh8qh\nRhBX3znLoQKBgA1GL2qD4QhOpGO6JVDctBFyo7sbA2x6OeUL2pzzhx8dlv76fC6E\nr4IRqfpzsFa9Y7zS046V7h5YA5Pxi5NiqO5ZqZ9+HGXxlr9DwAh5cF4l9P8o99yI\n9WUlpzZagWB3D4usP6RIdZTaiUCP2mSTgApm2Ni7h9me4+QnO7lMoGmzAoGAUO7Y\nvVe/UPRR40BHSoA7ucdHKYVkzRd9H2PpnQs7PW70wMkjsPFlLn3aApMHKoSmVV/M\nUEPULPRbfp6labKFLH4Xrb8j4DieMEm9HGnilK/zk46ZibWreN5dlejRB55C+6Aw\n5/eIoj0QBUvT91dVbmUnyDrzfVF6/XgU8fXtXWECgYEA1Zsg+Pl9o5SI0nYcB9Vb\nJz9WVRI1nKQ3Bl14cJFllOQxsAkYkr5g6E8vuQkrIbODlXz0gjS4Dz7RljiWd10p\nRWaQ+CQkis2t4F5a4bQkfsswMQYuZq+fDjTFk5aytVXZ0bb7gREsdV7FwHHV3bal\n3siEcT2fhBEAhhVOXy5lF8Q=\n-----END PRIVATE KEY-----\n",
  client_email: "befret-backoffice-admin-dev@befret-development.iam.gserviceaccount.com",
  client_id: "102450712963352230106",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/befret-backoffice-admin-dev%40befret-development.iam.gserviceaccount.com"
};

// Initialiser Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://befret-development-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function analyzeParcelCollection() {
  console.log('🔍 ANALYSE DE LA COLLECTION "PARCEL"\n');
  
  try {
    // Récupérer quelques documents de la collection parcel
    console.log('📊 Récupération des documents parcel...');
    const parcelsRef = db.collection('parcel');
    const snapshot = await parcelsRef.limit(5).get();
    
    if (snapshot.empty) {
      console.log('❌ Aucun document trouvé dans la collection "parcel"');
      
      // Créer quelques documents de test pour l'analyse
      console.log('\n🧪 Création de documents de test...');
      await createTestParcels();
      return;
    }
    
    console.log(`✅ ${snapshot.size} documents trouvés\n`);
    
    // Analyser la structure des documents
    console.log('🏗️  === STRUCTURE DES DOCUMENTS ===\n');
    
    const allFields = new Set();
    const samples = [];
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      samples.push({ id: doc.id, ...data });
      
      // Collecter tous les champs
      Object.keys(data).forEach(field => allFields.add(field));
      
      if (index < 3) { // Afficher seulement 3 exemples détaillés
        console.log(`📦 DOCUMENT ${index + 1} - ID: ${doc.id}`);
        console.log('─'.repeat(50));
        
        // Analyser chaque champ
        Object.entries(data).forEach(([key, value]) => {
          const type = Array.isArray(value) ? 'array' : typeof value;
          const preview = JSON.stringify(value).length > 50 
            ? JSON.stringify(value).substring(0, 50) + '...'
            : JSON.stringify(value);
          console.log(`  ${key}: ${type} = ${preview}`);
        });
        console.log('');
      }
    });
    
    // Résumé de tous les champs trouvés
    console.log('📋 === CHAMPS DISPONIBLES DANS LA COLLECTION ===\n');
    const sortedFields = Array.from(allFields).sort();
    sortedFields.forEach((field, index) => {
      console.log(`${index + 1}. ${field}`);
    });
    
    console.log(`\n📊 Total des champs uniques: ${sortedFields.length}\n`);
    
    // Analyse des besoins logistiques
    console.log('🎯 === ANALYSE POUR BESOINS LOGISTIQUES ===\n');
    
    const logisticNeeds = {
      'Scanner QR à l\'arrivée': {
        required: ['qrCode', 'arrivalScan', 'scanTimestamp'],
        existing: sortedFields.filter(f => ['qr', 'scan', 'arrival'].some(keyword => f.toLowerCase().includes(keyword))),
        status: 'MISSING'
      },
      'Pesée avec photo sur balance': {
        required: ['actualWeight', 'weightPhoto', 'weightTimestamp', 'scale'],
        existing: sortedFields.filter(f => ['weight', 'photo', 'scale'].some(keyword => f.toLowerCase().includes(keyword))),
        status: 'PARTIAL'
      },
      'Comparaison poids déclaré vs réel': {
        required: ['declaredWeight', 'actualWeight', 'weightDifference', 'weightVariance'],
        existing: sortedFields.filter(f => ['weight'].some(keyword => f.toLowerCase().includes(keyword))),
        status: 'PARTIAL'
      },
      'Notifications automatiques clients': {
        required: ['notificationsSent', 'clientEmail', 'notificationHistory', 'clientPhone'],
        existing: sortedFields.filter(f => ['notification', 'email', 'phone', 'client'].some(keyword => f.toLowerCase().includes(keyword))),
        status: 'PARTIAL'
      }
    };
    
    Object.entries(logisticNeeds).forEach(([feature, analysis]) => {
      console.log(`🔧 ${feature}`);
      console.log(`   Champs requis: ${analysis.required.join(', ')}`);
      console.log(`   Champs existants: ${analysis.existing.length > 0 ? analysis.existing.join(', ') : 'Aucun'}`);
      console.log(`   Statut: ${analysis.status}`);
      console.log('');
    });
    
    // Points d'intégration avec befret_new
    console.log('🔗 === POINTS D\'INTÉGRATION AVEC BEFRET_NEW ===\n');
    
    const integrationPoints = {
      'Identification colis': sortedFields.filter(f => ['id', 'reference', 'tracking'].some(keyword => f.toLowerCase().includes(keyword))),
      'Informations client': sortedFields.filter(f => ['client', 'user', 'sender', 'recipient'].some(keyword => f.toLowerCase().includes(keyword))),
      'Statut et suivi': sortedFields.filter(f => ['status', 'state', 'step'].some(keyword => f.toLowerCase().includes(keyword))),
      'Données temporelles': sortedFields.filter(f => ['date', 'time', 'created', 'updated'].some(keyword => f.toLowerCase().includes(keyword))),
      'Données de livraison': sortedFields.filter(f => ['delivery', 'destination', 'address'].some(keyword => f.toLowerCase().includes(keyword)))
    };
    
    Object.entries(integrationPoints).forEach(([category, fields]) => {
      console.log(`📌 ${category}:`);
      if (fields.length > 0) {
        fields.forEach(field => console.log(`   ✅ ${field}`));
      } else {
        console.log('   ❌ Aucun champ trouvé');
      }
      console.log('');
    });
    
    // Proposition d'extension de schéma
    console.log('💡 === PROPOSITION D\'EXTENSION DE SCHÉMA ===\n');
    
    const proposedSchema = {
      // Champs existants à conserver
      existing: 'Tous les champs actuels',
      
      // Nouveaux champs pour Sprint 2
      logisticExtensions: {
        // Scanner QR
        'qrCode': 'string - Code QR unique du colis',
        'arrivalScan': 'object - Données du scan d\'arrivée',
        'arrivalScan.timestamp': 'timestamp - Moment du scan',
        'arrivalScan.operator': 'string - Opérateur qui a scanné',
        'arrivalScan.location': 'string - Lieu du scan',
        
        // Pesée et photos
        'actualWeight': 'number - Poids réel mesuré (kg)',
        'weightPhotos': 'array - Photos de la pesée',
        'weightPhotos[].url': 'string - URL de la photo',
        'weightPhotos[].timestamp': 'timestamp - Moment de la photo',
        'weightPhotos[].type': 'string - Type (balance, colis, etc.)',
        'weightVerification': 'object - Données de vérification',
        'weightVerification.difference': 'number - Différence déclaré vs réel',
        'weightVerification.percentage': 'number - Pourcentage d\'écart',
        'weightVerification.status': 'string - OK, WARNING, ERROR',
        
        // Workflow logistique
        'logisticStatus': 'string - Statut logistique détaillé',
        'processingHistory': 'array - Historique des étapes',
        'processingHistory[].step': 'string - Nom de l\'étape',
        'processingHistory[].timestamp': 'timestamp - Moment',
        'processingHistory[].operator': 'string - Opérateur',
        'processingHistory[].data': 'object - Données de l\'étape',
        
        // Notifications
        'notificationHistory': 'array - Historique des notifications',
        'notificationHistory[].type': 'string - Type de notification',
        'notificationHistory[].timestamp': 'timestamp - Envoi',
        'notificationHistory[].status': 'string - Statut d\'envoi',
        'notificationHistory[].recipient': 'string - Destinataire'
      }
    };
    
    console.log('🏗️  Champs à ajouter pour Sprint 2:');
    Object.entries(proposedSchema.logisticExtensions).forEach(([field, description]) => {
      console.log(`   ${field}: ${description}`);
    });
    
    console.log('\n🎯 === PLAN D\'IMPLÉMENTATION ===\n');
    console.log('Phase 1 - Scanner QR:');
    console.log('  ✅ Ajouter champs qrCode, arrivalScan');
    console.log('  ✅ Interface de scan avec caméra');
    console.log('  ✅ Validation et recherche par QR');
    console.log('');
    console.log('Phase 2 - Pesée avec photo:');
    console.log('  ✅ Interface de pesée');
    console.log('  ✅ Capture photo balance');
    console.log('  ✅ Calcul écarts de poids');
    console.log('');
    console.log('Phase 3 - Notifications automatiques:');
    console.log('  ✅ Système de notifications');
    console.log('  ✅ Templates d\'emails/SMS');
    console.log('  ✅ Intégration befret_new');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

async function createTestParcels() {
  console.log('Création de 3 colis de test pour l\'analyse...\n');
  
  const testParcels = [
    {
      id: 'BF-2024-001',
      reference: 'BF-2024-001',
      trackingNumber: 'TRK-001-2024',
      status: 'created',
      declaredWeight: 2.5,
      dimensions: {
        length: 30,
        width: 20,
        height: 15
      },
      sender: {
        name: 'Jean Dupont',
        email: 'jean.dupont@email.com',
        phone: '+33 6 12 34 56 78',
        address: '123 Rue de la Paix, Paris, France'
      },
      recipient: {
        name: 'Marie Ngozi',
        email: 'marie.ngozi@email.com',
        phone: '+243 81 234 5678',
        address: 'Avenue Kasavubu, Kinshasa, RDC'
      },
      destination: {
        country: 'RDC',
        city: 'Kinshasa',
        zipCode: '12345'
      },
      contents: 'Vêtements et produits cosmétiques',
      value: 150.00,
      currency: 'EUR',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      createdBy: 'client-web-app'
    },
    {
      id: 'BF-2024-002',
      reference: 'BF-2024-002',
      trackingNumber: 'TRK-002-2024',
      status: 'in_transit',
      declaredWeight: 5.2,
      dimensions: {
        length: 40,
        width: 30,
        height: 25
      },
      sender: {
        name: 'Pierre Martin',
        email: 'pierre.martin@email.com',
        phone: '+33 6 98 76 54 32',
        address: '456 Boulevard des Italiens, Lyon, France'
      },
      recipient: {
        name: 'Joseph Kabila',
        email: 'joseph.kabila@email.com',
        phone: '+243 97 876 5432',
        address: 'Boulevard du 30 Juin, Lubumbashi, RDC'
      },
      destination: {
        country: 'RDC',
        city: 'Lubumbashi',
        zipCode: '54321'
      },
      contents: 'Livres et matériel électronique',
      value: 320.00,
      currency: 'EUR',
      createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 86400000)), // 1 jour plus tôt
      updatedAt: admin.firestore.Timestamp.now(),
      createdBy: 'client-mobile-app',
      // Déjà quelques données logistiques
      actualWeight: 5.1,
      weightDifference: -0.1,
      logisticNotes: 'Poids conforme'
    },
    {
      id: 'BF-2024-003',
      reference: 'BF-2024-003', 
      trackingNumber: 'TRK-003-2024',
      status: 'delivered',
      declaredWeight: 1.8,
      dimensions: {
        length: 25,
        width: 15,
        height: 10
      },
      sender: {
        name: 'Sophie Dubois',
        email: 'sophie.dubois@email.com',
        phone: '+33 6 11 22 33 44',
        address: '789 Rue Victor Hugo, Marseille, France'
      },
      recipient: {
        name: 'Grace Mukendi',
        email: 'grace.mukendi@email.com',
        phone: '+243 85 345 6789',
        address: 'Avenue Mobutu, Bukavu, RDC'
      },
      destination: {
        country: 'RDC',
        city: 'Bukavu',
        zipCode: '67890'
      },
      contents: 'Médicaments et vitamines',
      value: 85.50,
      currency: 'EUR',
      createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 172800000)), // 2 jours plus tôt
      updatedAt: admin.firestore.Timestamp.now(),
      deliveredAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1 heure plus tôt
      createdBy: 'client-web-app',
      // Données logistiques complètes pour ce colis livré
      actualWeight: 2.1,
      weightDifference: 0.3,
      weightPhotos: [
        {
          url: 'gs://befret-development.appspot.com/photos/weight-BF-2024-003-1.jpg',
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7200000)),
          type: 'balance'
        }
      ],
      logisticStatus: 'completed',
      processingSteps: [
        {
          step: 'received',
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 86400000)),
          operator: 'operator-1'
        },
        {
          step: 'weighed',
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7200000)),
          operator: 'operator-2'
        },
        {
          step: 'delivered',
          timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3600000)),
          operator: 'delivery-agent-1'
        }
      ]
    }
  ];
  
  // Ajouter les colis de test
  for (const parcel of testParcels) {
    await db.collection('parcel').doc(parcel.id).set(parcel);
    console.log(`✅ Colis ${parcel.reference} créé`);
  }
  
  console.log('\n🎯 Relancement de l\'analyse avec les données de test...\n');
  
  // Relancer l'analyse
  const snapshot = await db.collection('parcel').limit(5).get();
  analyzeParcelCollection();
}

analyzeParcelCollection();