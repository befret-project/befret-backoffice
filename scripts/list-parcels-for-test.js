/**
 * Script pour lister les colis existants et trouver des candidats pour tester le Sprint 1
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'befret-development'
});

const db = admin.firestore();

async function listParcelsForTest() {
  try {
    console.log('🔍 Recherche de colis pour test du Sprint 1...\n');

    // Chercher les colis qui sont prêts pour réception (payment_completed)
    const snapshot = await db.collection('shipments')
      .where('status.current', '==', 'payment_completed')
      .limit(10)
      .get();

    if (snapshot.empty) {
      console.log('⚠️  Aucun colis avec statut "payment_completed" trouvé.');
      console.log('📝 Suggestion: Exécutez create-test-parcel.js pour créer un colis de test.\n');
      return;
    }

    console.log(`✅ Trouvé ${snapshot.size} colis prêts pour réception:\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n${index + 1}. ${doc.id}`);
      console.log(`   📦 Tracking BeFret:  ${data.trackingNumber}`);
      if (data.dpdTrackingNumber) {
        console.log(`   📦 Tracking DPD:      ${data.dpdTrackingNumber}`);
      }
      console.log(`   👤 Expediteur:        ${data.customerInfo?.sender?.name || 'N/A'}`);
      console.log(`   📧 Email sender:      ${data.customerInfo?.sender?.email || 'N/A'}`);
      console.log(`   📞 Phone sender:      ${data.customerInfo?.sender?.phone?.full || 'N/A'}`);
      console.log(`   👥 Destinataire:      ${data.customerInfo?.receiver?.name || 'N/A'}`);
      console.log(`   📧 Email receiver:    ${data.customerInfo?.receiver?.email || 'N/A'}`);
      console.log(`   📞 Phone receiver:    ${data.customerInfo?.receiver?.phone?.full || 'N/A'}`);
      console.log(`   ⚖️  Poids déclaré:     ${data.parcelInfo?.weight || 'N/A'} kg`);
      console.log(`   📍 Status:            ${data.status?.current}`);
      console.log(`   🗓️  Créé le:           ${data.createdAt ? new Date(data.createdAt).toLocaleString('fr-FR') : 'N/A'}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 COMMENT TESTER:');
    console.log('1. Lancez le serveur: npm run dev');
    console.log('2. Allez sur: http://localhost:3000/logistic/reception-depart/recherche');
    console.log('3. Choisissez un colis ci-dessus');
    console.log('4. Utilisez son tracking DPD ou BeFret pour le chercher');
    console.log('5. Suivez le workflow complet\n');

    // Chercher aussi les colis déjà reçus (pour vérifier si le workflow a déjà été testé)
    const receivedSnapshot = await db.collection('shipments')
      .where('status.current', '==', 'received_at_warehouse')
      .limit(5)
      .get();

    if (!receivedSnapshot.empty) {
      console.log('\n📊 Colis déjà réceptionnés (workflow déjà testé):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      receivedSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ${data.trackingNumber}`);
        console.log(`   Reçu le: ${data.logisticData?.receptionDepart?.receivedAt ?
          new Date(data.logisticData.receptionDepart.receivedAt).toLocaleString('fr-FR') : 'N/A'}`);
        if (data.logisticData?.receptionDepart?.weighing) {
          const w = data.logisticData.receptionDepart.weighing;
          console.log(`   Pesé: ${w.actualWeight}kg (déclaré: ${w.declaredWeight}kg, écart: ${w.weightDifference}kg)`);
        }
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await admin.app().delete();
  }
}

// Run
listParcelsForTest()
  .then(() => {
    console.log('✅ Script terminé\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  });
