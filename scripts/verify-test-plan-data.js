// Script pour vérifier les données de test du plan de test BEFRET
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDgU_qyND7LXCY-hESIzUvu8jIqFflc_BE",
  authDomain: "befret-development.firebaseapp.com",
  databaseURL: "https://befret-development-default-rtdb.firebaseio.com",
  projectId: "befret-development",
  storageBucket: "befret-development.appspot.com",
  messagingSenderId: "384879116689",
  appId: "1:384879116689:web:d0e89a006a3111eec2da30",
  measurementId: "G-KYB5JZJNMG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Liste des colis de test attendus
const expectedTestParcels = [
  { id: "BF-TEST-001", description: "Réception normale", weight: 2.5, city: "kinshasa", status: "pending" },
  { id: "BF-TEST-002", description: "Écart poids mineur", weight: 3.0, city: "kinshasa", status: "pending" },
  { id: "BF-TEST-003", description: "Écart poids majeur", weight: 2.0, city: "kinshasa", status: "pending" },
  { id: "BF-TEST-006", description: "Colis déjà réceptionné", weight: 1.8, city: "kinshasa", status: "to_warehouse" },
  { id: "BF-TEST-007", description: "Colis endommagé", weight: 3.5, city: "kinshasa", status: "pending" },
  { id: "BF-TEST-002-P", description: "Supplément poids", weight: 2.0, city: "kinshasa", status: "to_warehouse" },
  { id: "BF-TEST-003-F", description: "Cas spécial fragile", weight: 1.8, city: "kinshasa", status: "to_warehouse" },
  { id: "BF-TEST-004-L", description: "Tri Lubumbashi", weight: 3.2, city: "lubumbashi", status: "to_warehouse" }
];

const expectedLotParcels = [];
for (let i = 1; i <= 10; i++) {
  expectedLotParcels.push({
    id: `BF-LOT-${i.toString().padStart(3, '0')}`,
    description: `Lot ${i}`,
    city: i <= 5 ? "kinshasa" : "lubumbashi",
    zone: i <= 5 ? "A" : "B",
    status: "pending"
  });
}

async function verifyTestPlanData() {
  try {
    console.log('🔍 VÉRIFICATION DES DONNÉES DE TEST - PLAN DE TEST BEFRET');
    console.log('================================================================');
    console.log('');
    
    let totalFound = 0;
    let totalExpected = expectedTestParcels.length + expectedLotParcels.length;
    
    // Vérifier les colis principaux
    console.log('🧪 SPRINT 1 & 2 - COLIS PRINCIPAUX:');
    console.log('');
    
    for (const expected of expectedTestParcels) {
      const docRef = doc(db, 'parcel', expected.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const statusCheck = data.status === expected.status ? "✅" : "⚠️";
        const weightCheck = data.totalWeight === expected.weight ? "✅" : "⚠️";
        const cityCheck = data.city === expected.city ? "✅" : "⚠️";
        
        console.log(`✅ ${expected.id} - ${expected.description}`);
        console.log(`   Status: ${data.status} ${statusCheck} | Poids: ${data.totalWeight}kg ${weightCheck} | Ville: ${data.city} ${cityCheck}`);
        console.log(`   Logistic Status: ${data.logisticStatus}`);
        
        totalFound++;
      } else {
        console.log(`❌ ${expected.id} - MANQUANT`);
      }
      console.log('');
    }
    
    // Vérifier les lots
    console.log('📦 LOTS POUR TESTS GROUPÉS:');
    console.log('');
    
    let kinshasa = 0;
    let lubumbashi = 0;
    
    for (const expected of expectedLotParcels) {
      const docRef = doc(db, 'parcel', expected.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const statusCheck = data.status === expected.status ? "✅" : "⚠️";
        const cityCheck = data.city === expected.city ? "✅" : "⚠️";
        
        console.log(`✅ ${expected.id} - ${expected.description} (Zone ${expected.zone})`);
        console.log(`   Status: ${data.status} ${statusCheck} | Ville: ${data.city} ${cityCheck}`);
        
        if (data.city === "kinshasa") kinshasa++;
        if (data.city === "lubumbashi") lubumbashi++;
        
        totalFound++;
      } else {
        console.log(`❌ ${expected.id} - MANQUANT`);
      }
    }
    
    console.log('');
    console.log('📊 RÉSUMÉ DE LA VÉRIFICATION:');
    console.log('================================================================');
    console.log(`📦 Total des colis de test: ${totalFound}/${totalExpected}`);
    console.log(`🎯 Colis principaux: ${totalFound - kinshasa - lubumbashi}/${expectedTestParcels.length}`);
    console.log(`🏙️ Lot Kinshasa (Zone A): ${kinshasa}/5`);
    console.log(`🏭 Lot Lubumbashi (Zone B): ${lubumbashi}/5`);
    console.log('');
    
    if (totalFound === totalExpected) {
      console.log('🎉 SUCCÈS: Toutes les données de test sont présentes!');
      console.log('');
      console.log('🚀 PRÊT POUR L\'EXÉCUTION DU PLAN DE TEST');
      console.log('   URL: https://befret-development-e3cb5.web.app');
      console.log('');
      console.log('📋 SCÉNARIOS DE TEST DISPONIBLES:');
      console.log('   • TC-R001: Réception normale (BF-TEST-001)');
      console.log('   • TC-R002: Écart poids mineur (BF-TEST-002)');
      console.log('   • TC-R003: Écart poids majeur (BF-TEST-003)');
      console.log('   • TC-R004: Colis non trouvé (BF-FAKE-999)');
      console.log('   • TC-R005: Réception multiple (BF-LOT-001 à 010)');
      console.log('   • TC-R006: Colis déjà réceptionné (BF-TEST-006)');
      console.log('   • TC-R007: Colis endommagé (BF-TEST-007)');
      console.log('   • TC-P001: Pesée conforme (BF-TEST-001)');
      console.log('   • TC-P002: Pesée avec supplément (BF-TEST-002-P)');
      console.log('   • TC-P003: Cas spécial fragile (BF-TEST-003-F)');
      console.log('   • TC-P004: Tri Lubumbashi (BF-TEST-004-L)');
      console.log('   • TC-P005: Lot de pesée (BF-LOT-001 à 010)');
    } else {
      console.log('⚠️ ATTENTION: Certaines données de test sont manquantes');
      console.log('   Exécutez: node scripts/create-test-plan-data.js');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécuter la vérification
verifyTestPlanData();