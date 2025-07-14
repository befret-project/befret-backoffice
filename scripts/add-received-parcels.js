// Script pour ajouter des colis déjà reçus dans Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

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

// Générer un trackingID unique
function generateTrackingID() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `BF-${year}-${randomNum}`;
}

// Colis déjà reçus pour l'affichage
const receivedParcels = [
  {
    trackingID: generateTrackingID(),
    sender_name: "David Nsimba",
    receiver_name: "Claudine Mbiya",
    uid: "test_user_006",
    mail2User: "david.nsimba@gmail.com",
    type: "paquet",
    description: "Produits alimentaires africains",
    totalWeight: 12.3,
    numberOfItems: 5,
    cost: 145.00,
    status: "to_warehouse",
    create_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    payment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notified: true,
    pickupMethod: "warehouse",
    logisticStatus: "received",
    receivedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // Il y a 4 heures
    logisticHistory: [
      {
        step: "received",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        agent: "admin@befret.com",
        notes: "Colis reçu à l'entrepôt Tubize et scanné dans le backoffice"
      }
    ],
    sender_phone: "+32489123456",
    receiver_phone: "+243819876543",
    city: "kinshasa"
  },
  {
    trackingID: generateTrackingID(),
    sender_name: "Fatou Diallo",
    receiver_name: "Emmanuel Lumumba",
    uid: "test_user_007",
    mail2User: "fatou.diallo@yahoo.fr",
    type: "paquet",
    description: "Textiles et accessoires de mode",
    totalWeight: 9.8,
    numberOfItems: 3,
    cost: 112.50,
    status: "to_warehouse",
    create_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    payment_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    notified: true,
    pickupMethod: "warehouse",
    logisticStatus: "received",
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Il y a 2 heures
    logisticHistory: [
      {
        step: "received",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        agent: "admin@befret.com",
        notes: "Colis reçu à l'entrepôt Tubize et scanné dans le backoffice"
      }
    ],
    sender_phone: "+32476543210",
    receiver_phone: "+243876543210",
    city: "lubumbashi"
  },
  {
    trackingID: generateTrackingID(),
    sender_name: "Richard Kabongo",
    receiver_name: "Sylvie Mateta",
    uid: "test_user_008",
    mail2User: "richard.kabongo@hotmail.com",
    type: "courrier",
    description: "Documents juridiques importants",
    totalWeight: 1.5,
    numberOfItems: 1,
    cost: 35.00,
    status: "to_warehouse",
    create_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    payment_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notified: true,
    pickupMethod: "home_delivery",
    logisticStatus: "received",
    receivedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // Il y a 45 minutes
    logisticHistory: [
      {
        step: "received",
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        agent: "admin@befret.com",
        notes: "Colis reçu à l'entrepôt Tubize et scanné dans le backoffice"
      }
    ],
    sender_phone: "+32493456789",
    receiver_phone: "+243834567890",
    city: "kinshasa"
  }
];

async function addReceivedParcels() {
  try {
    console.log('🎯 Ajout de colis déjà reçus dans Firestore...');
    
    for (let i = 0; i < receivedParcels.length; i++) {
      const parcel = receivedParcels[i];
      console.log(`📥 Ajout du colis reçu ${i + 1}/${receivedParcels.length}: ${parcel.trackingID}`);
      
      // Ajouter le document dans la collection 'parcel'
      const docRef = await addDoc(collection(db, 'parcel'), parcel);
      console.log(`✅ Colis reçu ajouté avec ID: ${docRef.id}`);
    }
    
    console.log('🎉 Tous les colis reçus ont été ajoutés avec succès!');
    console.log('');
    console.log('📋 Résumé des colis reçus:');
    receivedParcels.forEach((parcel, index) => {
      const receivedTime = new Date(parcel.receivedAt).toLocaleString('fr-FR');
      console.log(`${index + 1}. ${parcel.trackingID} - Reçu le ${receivedTime}`);
      console.log(`   ${parcel.sender_name} → ${parcel.receiver_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des colis reçus:', error);
  }
}

// Exécuter le script
addReceivedParcels();