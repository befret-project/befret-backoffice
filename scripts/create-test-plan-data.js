// Script pour créer les données de test spécifiques au plan de test BEFRET
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc } = require('firebase/firestore');

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

// Données de test correspondant exactement aux scénarios du plan de test
const testPlanParcels = [
  // TC-R001: Réception normale d'un colis
  {
    trackingID: "BF-TEST-001",
    sender_name: "Test Sender 001",
    receiver_name: "Test Receiver 001",
    uid: "test_plan_001",
    mail2User: "test001@befret.com",
    type: "paquet",
    description: "Colis test pour réception normale",
    totalWeight: 2.5,
    numberOfItems: 1,
    cost: 75.00,
    status: "pending",
    create_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    payment_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    notified: false,
    pickupMethod: "warehouse",
    logisticStatus: "pending_reception",
    sender_phone: "+32400000001",
    receiver_phone: "+243100000001",
    city: "kinshasa"
  },
  
  // TC-R002: Réception avec écart de poids mineur
  {
    trackingID: "BF-TEST-002",
    sender_name: "Test Sender 002",
    receiver_name: "Test Receiver 002",
    uid: "test_plan_002",
    mail2User: "test002@befret.com",
    type: "paquet",
    description: "Colis test pour écart de poids mineur",
    totalWeight: 3.0,
    numberOfItems: 2,
    cost: 85.00,
    status: "pending",
    create_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    payment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notified: false,
    pickupMethod: "warehouse",
    logisticStatus: "pending_reception",
    sender_phone: "+32400000002",
    receiver_phone: "+243100000002",
    city: "kinshasa"
  },
  
  // TC-R003: Réception avec écart de poids majeur
  {
    trackingID: "BF-TEST-003",
    sender_name: "Test Sender 003",
    receiver_name: "Test Receiver 003",
    uid: "test_plan_003",
    mail2User: "test003@befret.com",
    type: "paquet",
    description: "Colis test pour écart de poids majeur",
    totalWeight: 2.0,
    numberOfItems: 1,
    cost: 60.00,
    status: "pending",
    create_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    payment_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notified: false,
    pickupMethod: "warehouse",
    logisticStatus: "pending_reception",
    sender_phone: "+32400000003",
    receiver_phone: "+243100000003",
    city: "kinshasa"
  },
  
  // TC-R006: Colis déjà réceptionné
  {
    trackingID: "BF-TEST-006",
    sender_name: "Test Sender 006",
    receiver_name: "Test Receiver 006",
    uid: "test_plan_006",
    mail2User: "test006@befret.com",
    type: "paquet",
    description: "Colis test déjà réceptionné",
    totalWeight: 1.8,
    numberOfItems: 1,
    cost: 55.00,
    status: "to_warehouse",
    create_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    payment_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    notified: true,
    pickupMethod: "warehouse",
    logisticStatus: "received",
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    logisticHistory: [
      {
        step: "received",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        agent: "test@befret.com",
        notes: "Colis déjà réceptionné pour test de double scan"
      }
    ],
    sender_phone: "+32400000006",
    receiver_phone: "+243100000006",
    city: "kinshasa"
  },
  
  // TC-R007: Colis endommagé à la réception
  {
    trackingID: "BF-TEST-007",
    sender_name: "Test Sender 007",
    receiver_name: "Test Receiver 007",
    uid: "test_plan_007",
    mail2User: "test007@befret.com",
    type: "paquet",
    description: "Colis test avec dommages visibles",
    totalWeight: 3.5,
    numberOfItems: 2,
    cost: 95.00,
    status: "pending",
    create_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    payment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notified: false,
    pickupMethod: "warehouse",
    logisticStatus: "pending_reception",
    sender_phone: "+32400000007",
    receiver_phone: "+243100000007",
    city: "kinshasa"
  },
  
  // TC-P002: Pesée avec supplément - Génération paiement
  {
    trackingID: "BF-TEST-002-P",
    sender_name: "Test Sender 002-P",
    receiver_name: "Test Receiver 002-P",
    uid: "test_plan_002p",
    mail2User: "test002p@befret.com",
    type: "paquet",
    description: "Colis test pour supplément de poids",
    totalWeight: 2.0,
    numberOfItems: 1,
    cost: 25.00,
    status: "to_warehouse",
    create_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    payment_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    notified: true,
    pickupMethod: "warehouse",
    logisticStatus: "received",
    receivedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    logisticHistory: [
      {
        step: "received",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        agent: "test@befret.com",
        notes: "Colis reçu, prêt pour pesée avec supplément"
      }
    ],
    sender_phone: "+32400000008",
    receiver_phone: "+243100000008",
    city: "kinshasa"
  },
  
  // TC-P003: Cas spécial - Colis fragile
  {
    trackingID: "BF-TEST-003-F",
    sender_name: "Test Sender 003-F",
    receiver_name: "Test Receiver 003-F",
    uid: "test_plan_003f",
    mail2User: "test003f@befret.com",
    type: "paquet",
    description: "Colis test fragile - objets en verre",
    totalWeight: 1.8,
    numberOfItems: 3,
    cost: 65.00,
    status: "to_warehouse",
    create_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    payment_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notified: true,
    pickupMethod: "warehouse",
    logisticStatus: "received",
    receivedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    logisticHistory: [
      {
        step: "received",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        agent: "test@befret.com",
        notes: "Colis reçu, marqué pour cas spécial fragile"
      }
    ],
    sender_phone: "+32400000009",
    receiver_phone: "+243100000009",
    city: "kinshasa"
  },
  
  // TC-P004: Pesée Lubumbashi - Tri automatique Zone B
  {
    trackingID: "BF-TEST-004-L",
    sender_name: "Test Sender 004-L",
    receiver_name: "Test Receiver 004-L",
    uid: "test_plan_004l",
    mail2User: "test004l@befret.com",
    type: "paquet",
    description: "Colis test pour Lubumbashi - Zone B",
    totalWeight: 3.2,
    numberOfItems: 2,
    cost: 110.00,
    status: "to_warehouse",
    create_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    payment_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    notified: true,
    pickupMethod: "warehouse",
    logisticStatus: "received",
    receivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    logisticHistory: [
      {
        step: "received",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        agent: "test@befret.com",
        notes: "Colis reçu, destination Lubumbashi pour tri Zone B"
      }
    ],
    sender_phone: "+32400000010",
    receiver_phone: "+243100000010",
    city: "lubumbashi"
  }
];

// Lot de colis pour les tests groupés (TC-R005 et TC-P005)
const lotParcels = [];
for (let i = 1; i <= 10; i++) {
  const city = i <= 5 ? "kinshasa" : "lubumbashi";
  const zone = i <= 5 ? "A" : "B";
  
  lotParcels.push({
    trackingID: `BF-LOT-${i.toString().padStart(3, '0')}`,
    sender_name: `Lot Sender ${i}`,
    receiver_name: `Lot Receiver ${i}`,
    uid: `test_lot_${i.toString().padStart(3, '0')}`,
    mail2User: `lot${i}@befret.com`,
    type: "paquet",
    description: `Colis lot ${i} pour tests groupés`,
    totalWeight: 2.0 + (i * 0.2),
    numberOfItems: Math.ceil(i / 2),
    cost: 50.00 + (i * 5),
    status: "pending",
    create_date: new Date(Date.now() - (i * 2 * 60 * 60 * 1000)).toISOString(),
    payment_date: new Date(Date.now() - (i * 2 * 60 * 60 * 1000)).toISOString(),
    notified: false,
    pickupMethod: "warehouse",
    logisticStatus: "pending_reception",
    sender_phone: `+3240000${i.toString().padStart(4, '0')}`,
    receiver_phone: `+24310000${i.toString().padStart(4, '0')}`,
    city: city,
    testZone: zone
  });
}

async function createTestPlanData() {
  try {
    console.log('🧪 Création des données de test pour le plan de test BEFRET...');
    console.log('');
    
    // Créer les colis principaux du plan de test
    console.log('📦 Création des colis principaux...');
    for (let i = 0; i < testPlanParcels.length; i++) {
      const parcel = testPlanParcels[i];
      console.log(`  ${i + 1}/${testPlanParcels.length}: ${parcel.trackingID} - ${parcel.description}`);
      
      // Utiliser setDoc avec l'ID trackingID pour pouvoir les retrouver facilement
      await setDoc(doc(db, 'parcel', parcel.trackingID), parcel);
    }
    
    console.log('');
    console.log('📦 Création du lot de colis pour tests groupés...');
    for (let i = 0; i < lotParcels.length; i++) {
      const parcel = lotParcels[i];
      console.log(`  ${i + 1}/${lotParcels.length}: ${parcel.trackingID} - ${parcel.city} (Zone ${parcel.testZone})`);
      
      await setDoc(doc(db, 'parcel', parcel.trackingID), parcel);
    }
    
    console.log('');
    console.log('🎉 Toutes les données de test ont été créées avec succès!');
    console.log('');
    console.log('📋 RÉSUMÉ DES DONNÉES CRÉÉES:');
    console.log('');
    console.log('🧪 SPRINT 1 - RÉCEPTION:');
    console.log('  • BF-TEST-001: Réception normale (2.5kg, Kinshasa)');
    console.log('  • BF-TEST-002: Écart poids mineur (3.0kg, tolérance ±200g)');
    console.log('  • BF-TEST-003: Écart poids majeur (2.0kg, test +800g)');
    console.log('  • BF-TEST-006: Colis déjà réceptionné (statut: received)');
    console.log('  • BF-TEST-007: Colis endommagé (test workflow dommages)');
    console.log('  • BF-LOT-001 à 005: Lot Kinshasa (tests groupés)');
    console.log('  • BF-LOT-006 à 010: Lot Lubumbashi (tests groupés)');
    console.log('');
    console.log('🧪 SPRINT 2 - PRÉPARATION:');
    console.log('  • BF-TEST-002-P: Supplément poids (2.0kg → 2.8kg, +€2.00)');
    console.log('  • BF-TEST-003-F: Cas spécial fragile (Zone C)');
    console.log('  • BF-TEST-004-L: Tri Lubumbashi (Zone B)');
    console.log('');
    console.log('🔗 FAUX DONNÉES POUR TESTS D\'ERREUR:');
    console.log('  • BF-FAKE-999: TrackingID inexistant (TC-R004)');
    console.log('');
    console.log('✅ Le plan de test est maintenant prêt à être exécuté!');
    console.log('   URL: https://befret-development-e3cb5.web.app');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des données de test:', error);
  }
}

// Exécuter le script
createTestPlanData();