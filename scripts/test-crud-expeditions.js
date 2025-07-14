const admin = require('firebase-admin');

// Configuration Firebase Admin
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

async function testCRUDExpeditions() {
  console.log('🧪 DÉBUT DES TESTS CRUD EXPÉDITIONS\n');
  
  let createdExpeditionId = null;
  
  try {
    // ========== TEST CREATE ==========
    console.log('📝 TEST CREATE - Création d\'une nouvelle expédition...');
    const newExpedition = {
      reference: 'EXP-TEST-001',
      destination: {
        ville: 'Brazzaville',
        pays: 'Congo',
        adresse: 'Avenue de l\'Indépendance'
      },
      status: 'preparation',
      nbColis: 15,
      transporteur: {
        nom: 'TEST Express',
        contact: 'John Test',
        telephone: '+242 06 123 4567'
      },
      dateDepart: '2024-07-05',
      dateArriveePrevu: '2024-07-12',
      tracking: 'TEST-12345',
      responsable: 'Test Manager',
      conteneur: 'CONT-TEST-001',
      poids: 500.0,
      valeur: 15000,
      priorite: 'normale',
      notes: 'Expédition de test pour validation CRUD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'test-user'
    };
    
    const docRef = await db.collection('expeditions').add(newExpedition);
    createdExpeditionId = docRef.id;
    console.log('✅ CREATE réussi - ID:', createdExpeditionId);
    
    // ========== TEST READ ==========
    console.log('\n📖 TEST READ - Lecture de l\'expédition créée...');
    const expeditionDoc = await db.collection('expeditions').doc(createdExpeditionId).get();
    
    if (!expeditionDoc.exists) {
      throw new Error('Expédition non trouvée après création');
    }
    
    const expeditionData = expeditionDoc.data();
    console.log('✅ READ réussi - Référence:', expeditionData.reference);
    console.log('   Destination:', `${expeditionData.destination.ville}, ${expeditionData.destination.pays}`);
    console.log('   Statut:', expeditionData.status);
    console.log('   Nb colis:', expeditionData.nbColis);
    
    // ========== TEST UPDATE ==========
    console.log('\n🔄 TEST UPDATE - Modification de l\'expédition...');
    const updateData = {
      status: 'en_cours',
      nbColis: 18,
      notes: 'Expédition modifiée - En transit',
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('expeditions').doc(createdExpeditionId).update(updateData);
    
    // Vérifier la modification
    const updatedDoc = await db.collection('expeditions').doc(createdExpeditionId).get();
    const updatedData = updatedDoc.data();
    
    if (updatedData.status !== 'en_cours' || updatedData.nbColis !== 18) {
      throw new Error('Mise à jour non effective');
    }
    
    console.log('✅ UPDATE réussi - Nouveau statut:', updatedData.status);
    console.log('   Nouveau nb colis:', updatedData.nbColis);
    
    // ========== TEST LIST/FILTER ==========
    console.log('\n📋 TEST LIST - Récupération de toutes les expéditions...');
    const allExpeditions = await db.collection('expeditions').orderBy('createdAt', 'desc').limit(10).get();
    console.log('✅ LIST réussi - Nombre d\'expéditions:', allExpeditions.size);
    
    console.log('\n🔍 TEST FILTER - Recherche par statut...');
    const expeditionsEnCours = await db.collection('expeditions').where('status', '==', 'en_cours').get();
    console.log('✅ FILTER réussi - Expéditions en cours:', expeditionsEnCours.size);
    
    // ========== TEST DELETE ==========
    console.log('\n🗑️ TEST DELETE - Suppression de l\'expédition test...');
    await db.collection('expeditions').doc(createdExpeditionId).delete();
    
    // Vérifier la suppression
    const deletedDoc = await db.collection('expeditions').doc(createdExpeditionId).get();
    if (deletedDoc.exists) {
      throw new Error('Expédition non supprimée');
    }
    
    console.log('✅ DELETE réussi - Expédition supprimée');
    
    // ========== RÉSUMÉ ==========
    console.log('\n🎉 TOUS LES TESTS CRUD SONT PASSÉS AVEC SUCCÈS !');
    console.log('');
    console.log('✅ CREATE - Création d\'expédition');
    console.log('✅ READ - Lecture d\'expédition');
    console.log('✅ UPDATE - Modification d\'expédition');
    console.log('✅ DELETE - Suppression d\'expédition');
    console.log('✅ LIST - Listage des expéditions');
    console.log('✅ FILTER - Filtrage par critères');
    
  } catch (error) {
    console.error('❌ ERREUR LORS DES TESTS CRUD:', error);
    
    // Nettoyage en cas d'erreur
    if (createdExpeditionId) {
      try {
        await db.collection('expeditions').doc(createdExpeditionId).delete();
        console.log('🧹 Nettoyage effectué - Expédition test supprimée');
      } catch (cleanupError) {
        console.error('❌ Erreur lors du nettoyage:', cleanupError);
      }
    }
    
    process.exit(1);
  }
  
  process.exit(0);
}

testCRUDExpeditions();