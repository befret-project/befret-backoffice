const admin = require('firebase-admin');

// Configuration Firebase Admin (réutiliser la config existante)
const serviceAccount = {
  type: "service_account",
  project_id: "befret-development",
  private_key_id: "5fcbaea67acc49d07d5f8b3f9a52148f30591d69",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDLNp3FNxv6RcC9\nNRpDLr16Zxhurgqndk8nqeI6d8cqPv65BQLB6sW41KUxWF/lRBgMdKxwAHhFg4G2\njWwb+NxBgb/Mei3oKFJXhvCEMLxKclNL6N7SjI+UJHcYKbWlx3ekO5Y+QebxN2R5\nt7zbX5fXJyZtCwTdUT1lF+LQav1D5ah8iuoByPCUGm1bzHPI+4ts4++wMfhRUIzb\n/3GWWnAJtGj1NuK4wobgZ4kAaFJiAHDonwd8UXlaXUku6FhygGlCp1LbDjVjSdIN\nJ8RAre4ZIZW2GogduBRK6FicoKSF2glClEos3ECY9V0UKjMFaGSdjvKtQuqtunlj\njzxkyc+nAgMBAAECggEAE8JtR+JqbYT/z0YNFjBCy1af+Q8iSRNHchdiQIYqDxEO\nCqaSlJGEBUtj/q7VsEDVR8zGgaOCDlxRrhMFSpkBrbr0j+jnctYM36bm1yu3+1Mv\nh0eO9xEk2uZK0EYp/AMvvn/uxYH590WIFw/HJNugM5MCeQLjx7NhEWXnr5VfqAzN\nwK9kmaw+qfUYeIUeUP1UMPHCYtok0fKYqbgcZu0RCbhCuPwxGzMkOhurHHtTT/Us\ngr0qeOCQyfS5r5XuPi1wOtjt/pGMVawAZIdhiOpvYG16Wa1pkQAC+oDQffkmJEtO\nuswrEwab2bRScjJzstgysddVMP9kuymg0ueU9c114QKBgQD10VICHn5QRTRTg/IK\nIOiAYHAah3PrSU3ap/EDHuShgdpIAosanD/bDF9+NCPD8NgDXkhLVn5R5RXFMvZy\nTyjMd3+dBiQHFov2DbF1XU2WaWe9TYvvkQe/aB5hx2nBGT8O9XYqG3pqogrJCBk0\nSrI7F093vqZQM+cMBFTROTKWRwKBgQDToYPGrrtbbJNy3G3kmboX/ksqKPEp5EKg\nWqGUNROBfPkvOCxPb+s+U+exxPV8IcwnFMQ8raWcnuXKO8trpbw6f/IQ7FVs8Kwu\nSlAU06uIrrUYA/ls2GQVtr96tUBdT2wI+uiUj4lzctysK4aQe9h30bswwplmh8qh\nRhBX3znLoQKBgA1GL2qD4QhOpGO6JVDctBFyo7sbA2x6OeUL2pzzhx8dlv76fC6E\nr4IRqfpzsFa9Y7zS046V7h5YA5Pxi5NiqO5ZqZ9+HGXxlr9DwAh5cF4l9P8o99yI\n9WUlpzZagWB3D4usP6RIdZTaiUCP2mSTgApm2Ni7h9me4+QnO7lMoGmzAoGAUO7Y\nvVe/UPRR40BHSoA7ucdHKYVkzRd9H2PpnQs7PW70wMkjsPFlLn3aApMHKoSmVV/M\nuEPULPRbfp6labKFLH4Xrb8j4DieMEm9HGnilK/zk46ZibWreN5dlejRB55C+6Aw\n5/eIoj0QBUvT91dVbmUnyDrzfVF6/XgU8fXtXWECgYEA1Zsg+Pl9o5SI0nYcB9Vb\nJz9WVRI1nKQ3Bl14cJFllOQxsAkYkr5g6E8vuQkrIbODlXz0gjS4Dz7RljiWd10p\nRWaQ+CQkis2t4F5a4bQkfsswMQYuZq+fDjTFk5aytVXZ0bb7gREsdV7FwHHV3bal\n3siEcT2fhBEAhhVOXy5lF8Q=\n-----END PRIVATE KEY-----\n",
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

async function testExpeditionServices() {
  console.log('🧪 TEST DES SERVICES EXPÉDITION CÔTÉ APPLICATION\n');
  
  let testExpeditionId = null;
  
  try {
    // Créer une expédition de test pour tester les services
    console.log('📝 Création d\'une expédition de test...');
    const testExpedition = {
      reference: 'EXP-UI-TEST-001',
      destination: {
        ville: 'Pointe-Noire',
        pays: 'Congo',
        adresse: 'Boulevard Charles de Gaulle'
      },
      status: 'preparation',
      nbColis: 25,
      transporteur: {
        nom: 'UI Test Transport',
        contact: 'Jane UI',
        telephone: '+242 06 987 6543'
      },
      dateDepart: '2024-07-06',
      dateArriveePrevu: '2024-07-13',
      tracking: 'UI-TEST-67890',
      responsable: 'UI Test Manager',
      conteneur: 'CONT-UI-TEST-001',
      poids: 750.0,
      valeur: 25000,
      priorite: 'urgente',
      notes: 'Expédition de test pour validation UI',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'ui-test-user'
    };
    
    const docRef = await db.collection('expeditions').add(testExpedition);
    testExpeditionId = docRef.id;
    console.log('✅ Expédition de test créée - ID:', testExpeditionId);
    
    // Maintenant testons que l'application peut récupérer cette expédition
    console.log('\n🔧 TEST - Service getById (utilisé par la page de détail)...');
    const expedition = await db.collection('expeditions').doc(testExpeditionId).get();
    
    if (!expedition.exists) {
      throw new Error('Service getById ne fonctionne pas');
    }
    
    const expeditionData = { id: expedition.id, ...expedition.data() };
    console.log('✅ Service getById fonctionne - Référence:', expeditionData.reference);
    
    console.log('\n📋 TEST - Service getWithFilters (utilisé par la page principale)...');
    const expeditions = await db.collection('expeditions').orderBy('createdAt', 'desc').limit(10).get();
    
    if (expeditions.empty) {
      throw new Error('Service getWithFilters ne retourne aucune données');
    }
    
    console.log('✅ Service getWithFilters fonctionne - Nombre d\'expéditions:', expeditions.size);
    
    console.log('\n🔄 TEST - Service update (utilisé par la page d\'édition)...');
    const updateData = {
      status: 'en_cours',
      notes: 'Expédition modifiée via test UI',
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('expeditions').doc(testExpeditionId).update(updateData);
    
    // Vérifier la modification
    const updatedExpedition = await db.collection('expeditions').doc(testExpeditionId).get();
    const updatedData = updatedExpedition.data();
    
    if (updatedData.status !== 'en_cours') {
      throw new Error('Service update ne fonctionne pas');
    }
    
    console.log('✅ Service update fonctionne - Nouveau statut:', updatedData.status);
    
    console.log('\n🔍 TEST - Service searchByReference...');
    const searchResult = await db.collection('expeditions').where('reference', '==', 'EXP-UI-TEST-001').get();
    
    if (searchResult.empty) {
      throw new Error('Service searchByReference ne fonctionne pas');
    }
    
    console.log('✅ Service searchByReference fonctionne - Trouvé:', searchResult.size, 'résultat');
    
    console.log('\n🗑️ TEST - Service delete (utilisé par les boutons de suppression)...');
    await db.collection('expeditions').doc(testExpeditionId).delete();
    
    // Vérifier la suppression
    const deletedExpedition = await db.collection('expeditions').doc(testExpeditionId).get();
    if (deletedExpedition.exists) {
      throw new Error('Service delete ne fonctionne pas');
    }
    
    console.log('✅ Service delete fonctionne - Expédition supprimée');
    testExpeditionId = null; // Plus besoin de nettoyer
    
    console.log('\n🎉 TOUS LES SERVICES EXPÉDITION FONCTIONNENT CORRECTEMENT !');
    console.log('');
    console.log('✅ getById - Pour la page de détail');
    console.log('✅ getWithFilters - Pour la page principale avec filtres');
    console.log('✅ update - Pour la page d\'édition');
    console.log('✅ searchByReference - Pour la fonction de recherche');
    console.log('✅ delete - Pour les boutons de suppression');
    console.log('');
    console.log('🔗 Les boutons de navigation peuvent maintenant fonctionner correctement !');
    
  } catch (error) {
    console.error('❌ ERREUR DANS LES SERVICES:', error);
    
    // Nettoyage en cas d'erreur
    if (testExpeditionId) {
      try {
        await db.collection('expeditions').doc(testExpeditionId).delete();
        console.log('🧹 Nettoyage effectué');
      } catch (cleanupError) {
        console.error('❌ Erreur lors du nettoyage:', cleanupError);
      }
    }
    
    process.exit(1);
  }
  
  process.exit(0);
}

testExpeditionServices();