const admin = require('firebase-admin');

// Configuration Firebase (utiliser les variables d'env ou config directe)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'befret-development'
  });
}

const db = admin.firestore();

async function createFreshTestParcel() {
  try {
    console.log('🆕 [CREATE FRESH] Creating new fresh test parcel...');
    
    const timestamp = new Date().toISOString();
    const trackingID = `BF-FRESH-${Date.now()}`;
    
    const freshParcel = {
      // Identifiants
      trackingID: trackingID,
      uid: 'test-user-fresh',
      
      // Informations expéditeur/destinataire
      sender_name: 'Test Expéditeur Fresh',
      sender_phone: '+32123456789',
      receiver_name: 'Test Destinataire Fresh',
      receiver_phone: '+243987654321',
      phonePrefix1: '+243',
      phonePrefix2: 'République Démocratique du Congo',
      mail2User: 'test.fresh@example.com',
      
      // Destination
      city: 'kinshasa',
      destination: 'kinshasa',
      address: '123 Avenue Test, Kinshasa',
      
      // Contenu et caractéristiques
      type: 'Paquet',
      description: 'Colis de test fraîchement créé pour debugging',
      weight: 2.8,  // Poids déclaré
      weightDeclared: 2.8,
      items: [{
        name: 'Test Item Fresh',
        quantity: 1,
        weight: 2.8,
        value: 50
      }],
      fragile: false,
      emballage: false,
      condition: true,
      
      // Financier
      cost: 35.00,
      codePromo: '',
      
      // Workflow et statut - ÉTAT VIERGE
      status: 'pending',                    // État initial
      logisticStatus: 'pending_reception',   // En attente de réception
      logisticsStatus: 'pending_reception',  // Cohérence
      pickupMethod: 'warehouse',
      
      // Dates
      create_date: timestamp,
      notified: false,
      
      // Champs logistiques - TOUS VIDES pour test
      // weightReal: UNDEFINED - à tester
      // weightPhotos: UNDEFINED - à tester  
      // weightVerification: UNDEFINED - à tester
      // agentId: UNDEFINED - à tester
      // lastUpdated: UNDEFINED - à tester
      // lastUpdatedBy: UNDEFINED - à tester
      // weighedAt: UNDEFINED - à tester
      // receivedAt: UNDEFINED - à tester
      
      // Métadonnées
      processingHistory: [],
      
      // Géolocalisation (optionnelle)
      location: {
        _latitude: -4.4419,  // Kinshasa
        _longitude: 15.2663
      }
    };
    
    console.log('📦 [CREATE FRESH] Fresh parcel data:', freshParcel);
    
    // Créer le document
    const docRef = await db.collection('parcel').add(freshParcel);
    
    console.log(`✅ [CREATE FRESH] Fresh test parcel created with ID: ${docRef.id}`);
    console.log(`✅ [CREATE FRESH] TrackingID: ${trackingID}`);
    console.log(`📊 [CREATE FRESH] Status: ${freshParcel.status}`);
    console.log(`📊 [CREATE FRESH] LogisticsStatus: ${freshParcel.logisticsStatus}`);
    console.log(`⚖️ [CREATE FRESH] Weight declared: ${freshParcel.weight}kg`);
    console.log(`📍 [CREATE FRESH] Destination: ${freshParcel.destination}`);
    
    // Vérifier la création
    const createdDoc = await db.collection('parcel').doc(docRef.id).get();
    if (createdDoc.exists) {
      const data = createdDoc.data();
      console.log('🔍 [CREATE FRESH] Verification - Document exists in database');
      console.log('🔍 [CREATE FRESH] Key fields verification:');
      console.log(`   - trackingID: ${data.trackingID}`);
      console.log(`   - status: ${data.status}`);
      console.log(`   - logisticsStatus: ${data.logisticsStatus}`);
      console.log(`   - weight: ${data.weight}kg`);
      console.log(`   - weightReal: ${data.weightReal || 'UNDEFINED (correct for fresh test)'}`);
      console.log(`   - lastUpdated: ${data.lastUpdated || 'UNDEFINED (correct for fresh test)'}`);
      console.log(`   - lastUpdatedBy: ${data.lastUpdatedBy || 'UNDEFINED (correct for fresh test)'}`);
    }
    
    console.log('');
    console.log('🎯 [CREATE FRESH] READY FOR TESTING:');
    console.log('');
    console.log(`1. Go to: https://befret-development-e3cb5.web.app/logistic/colis/reception`);
    console.log(`2. Search for: ${trackingID}`);
    console.log(`3. Click "Ouvrir station de pesée"`);
    console.log(`4. Test weighing with: 3.0kg (should show +200g difference)`);
    console.log(`5. Check debug panel for status updates`);
    console.log('');
    
    return {
      success: true,
      documentId: docRef.id,
      trackingID: trackingID,
      declaredWeight: freshParcel.weight
    };
    
  } catch (error) {
    console.error('❌ [CREATE FRESH] Error creating fresh test parcel:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Exécution
createFreshTestParcel()
  .then(result => {
    if (result.success) {
      console.log('🎉 [CREATE FRESH] Fresh test parcel ready for debugging!');
      process.exit(0);
    } else {
      console.error('💥 [CREATE FRESH] Failed to create fresh test parcel');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 [CREATE FRESH] Unexpected error:', error);
    process.exit(1);
  });