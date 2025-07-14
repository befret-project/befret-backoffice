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

async function testCRUDCollectes() {
  console.log('🧪 DÉBUT DES TESTS CRUD COLLECTES\n');
  
  let createdCollecteId = null;
  
  try {
    // ========== TEST CREATE ==========
    console.log('📝 TEST CREATE - Création d\'une nouvelle collecte...');
    const newCollecte = {
      reference: 'COL-TEST-001',
      client: {
        nom: 'Marie Test',
        telephone: '+243 81 999 8888',
        email: 'marie.test@email.com',
        entreprise: 'Test Enterprise'
      },
      adresse: {
        rue: '123 Rue du Test',
        ville: 'Test City',
        codePostal: '12345',
        pays: 'RD Congo'
      },
      status: 'programmee',
      datePrevue: '2024-07-10',
      heureCollecte: '14:30',
      nbColis: 8,
      poidsTotal: 45.5,
      typeCollecte: 'entreprise',
      priorite: 'normale',
      operateur: 'Test Operator',
      notes: 'Collecte de test pour validation CRUD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'test-user'
    };
    
    const docRef = await db.collection('collectes').add(newCollecte);
    createdCollecteId = docRef.id;
    console.log('✅ CREATE réussi - ID:', createdCollecteId);
    
    // ========== TEST READ ==========
    console.log('\n📖 TEST READ - Lecture de la collecte créée...');
    const collecteDoc = await db.collection('collectes').doc(createdCollecteId).get();
    
    if (!collecteDoc.exists) {
      throw new Error('Collecte non trouvée après création');
    }
    
    const collecteData = collecteDoc.data();
    console.log('✅ READ réussi - Référence:', collecteData.reference);
    console.log('   Client:', collecteData.client.nom);
    console.log('   Adresse:', `${collecteData.adresse.ville}, ${collecteData.adresse.pays}`);
    console.log('   Statut:', collecteData.status);
    console.log('   Nb colis:', collecteData.nbColis);
    
    // ========== TEST UPDATE ==========
    console.log('\n🔄 TEST UPDATE - Modification de la collecte...');
    const updateData = {
      status: 'en_cours',
      chauffeur: 'Paul Testeur',
      nbColis: 10,
      notes: 'Collecte modifiée - Chauffeur assigné',
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('collectes').doc(createdCollecteId).update(updateData);
    
    // Vérifier la modification
    const updatedDoc = await db.collection('collectes').doc(createdCollecteId).get();
    const updatedData = updatedDoc.data();
    
    if (updatedData.status !== 'en_cours' || updatedData.nbColis !== 10) {
      throw new Error('Mise à jour non effective');
    }
    
    console.log('✅ UPDATE réussi - Nouveau statut:', updatedData.status);
    console.log('   Chauffeur assigné:', updatedData.chauffeur);
    console.log('   Nouveau nb colis:', updatedData.nbColis);
    
    // ========== TEST LIST/FILTER ==========
    console.log('\n📋 TEST LIST - Récupération de toutes les collectes...');
    const allCollectes = await db.collection('collectes').orderBy('createdAt', 'desc').limit(10).get();
    console.log('✅ LIST réussi - Nombre de collectes:', allCollectes.size);
    
    console.log('\n🔍 TEST FILTER - Recherche par statut...');
    const collectesEnCours = await db.collection('collectes').where('status', '==', 'en_cours').get();
    console.log('✅ FILTER réussi - Collectes en cours:', collectesEnCours.size);
    
    console.log('\n🔍 TEST FILTER - Recherche par type...');
    const collectesEntreprise = await db.collection('collectes').where('typeCollecte', '==', 'entreprise').get();
    console.log('✅ FILTER réussi - Collectes entreprise:', collectesEntreprise.size);
    
    console.log('\n🔍 TEST SEARCH - Recherche par référence...');
    const searchResult = await db.collection('collectes').where('reference', '==', 'COL-TEST-001').get();
    console.log('✅ SEARCH réussi - Références trouvées:', searchResult.size);
    
    // ========== TEST DELETE ==========
    console.log('\n🗑️ TEST DELETE - Suppression de la collecte test...');
    await db.collection('collectes').doc(createdCollecteId).delete();
    
    // Vérifier la suppression
    const deletedDoc = await db.collection('collectes').doc(createdCollecteId).get();
    if (deletedDoc.exists) {
      throw new Error('Collecte non supprimée');
    }
    
    console.log('✅ DELETE réussi - Collecte supprimée');
    
    // ========== RÉSUMÉ ==========
    console.log('\n🎉 TOUS LES TESTS CRUD COLLECTES SONT PASSÉS AVEC SUCCÈS !');
    console.log('');
    console.log('✅ CREATE - Création de collecte');
    console.log('✅ READ - Lecture de collecte');
    console.log('✅ UPDATE - Modification de collecte');
    console.log('✅ DELETE - Suppression de collecte');
    console.log('✅ LIST - Listage des collectes');
    console.log('✅ FILTER - Filtrage par statut et type');
    console.log('✅ SEARCH - Recherche par référence');
    
  } catch (error) {
    console.error('❌ ERREUR LORS DES TESTS CRUD COLLECTES:', error);
    
    // Nettoyage en cas d'erreur
    if (createdCollecteId) {
      try {
        await db.collection('collectes').doc(createdCollecteId).delete();
        console.log('🧹 Nettoyage effectué - Collecte test supprimée');
      } catch (cleanupError) {
        console.error('❌ Erreur lors du nettoyage:', cleanupError);
      }
    }
    
    process.exit(1);
  }
  
  process.exit(0);
}

testCRUDCollectes();