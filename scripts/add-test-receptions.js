// Script pour ajouter des réceptions de test dans Firestore
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

// Générer un trackingID unique
function generateTrackingID() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `BF-${year}-${randomNum}`;
}

// Données de test réalistes
const testParcels = [
  {
    trackingID: generateTrackingID(),
    sender_name: "Jean-Paul Kabangu",
    receiver_name: "Marie Tshiamala",
    uid: "test_user_001",
    mail2User: "jeanpaul.kabangu@gmail.com",
    type: "paquet",
    description: "Vêtements et chaussures pour famille",
    totalWeight: 15.5,
    numberOfItems: 3,
    cost: 178.50,
    status: "pending",
    create_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 2 jours
    payment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notified: false,
    pickupMethod: "warehouse",
    logisticStatus: "pending_reception",
    sender_phone: "+32484123456",
    receiver_phone: "+243812345678",
    city: "kinshasa"
  },
  {
    trackingID: generateTrackingID(),
    sender_name: "Sophie Mukendi",
    receiver_name: "Patrick Mbuyi",
    uid: "test_user_002", 
    mail2User: "sophie.mukendi@outlook.com",
    type: "paquet",
    description: "Matériel médical et médicaments",
    totalWeight: 8.2,
    numberOfItems: 2,
    cost: 95.00,
    status: "pending",
    create_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 1 jour
    payment_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    notified: false,
    pickupMethod: "warehouse",
    logisticStatus: "pending_reception",
    sender_phone: "+32476987654",
    receiver_phone: "+243987654321",
    city: "lubumbashi"
  },
  {
    trackingID: generateTrackingID(),
    sender_name: "André Kalonji",
    receiver_name: "Esperance Kasongo",
    uid: "test_user_003",
    mail2User: "andre.kalonji@yahoo.fr",
    type: "courrier",
    description: "Documents officiels et photos",
    totalWeight: 2.1,
    numberOfItems: 1,
    cost: 45.00,
    status: "pending",
    create_date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // Il y a 3 heures
    payment_date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    notified: false,
    pickupMethod: "home_delivery",
    logisticStatus: "pending_reception",
    sender_phone: "+32495111222",
    receiver_phone: "+243823456789",
    city: "kinshasa"
  },
  {
    trackingID: generateTrackingID(),
    sender_name: "Céline Mutombo",
    receiver_name: "Joseph Kabila Tshisekedi",
    uid: "test_user_004",
    mail2User: "celine.mutombo@gmail.com", 
    type: "paquet",
    description: "Équipement électronique (téléphone, tablette)",
    totalWeight: 4.8,
    numberOfItems: 2,
    cost: 125.50,
    status: "pending",
    create_date: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Il y a 30 minutes
    payment_date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    notified: false,
    pickupMethod: "warehouse",
    logisticStatus: "pending_reception",
    sender_phone: "+32487654321",
    receiver_phone: "+243856789012",
    city: "kinshasa"
  },
  {
    trackingID: generateTrackingID(),
    sender_name: "Michel Nzuzi",
    receiver_name: "Grace Makolo",
    uid: "test_user_005",
    mail2User: "michel.nzuzi@hotmail.com",
    type: "paquet",
    description: "Produits de beauté et cosmétiques",
    totalWeight: 6.7,
    numberOfItems: 4,
    cost: 89.00,
    status: "pending",
    create_date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // Il y a 1 heure
    payment_date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    notified: false,
    pickupMethod: "warehouse",
    logisticStatus: "pending_reception",
    sender_phone: "+32478123456",
    receiver_phone: "+243898765432",
    city: "lubumbashi"
  }
];

async function addTestReceptions() {
  try {
    console.log('🚀 Ajout de réceptions de test dans Firestore...');
    
    for (let i = 0; i < testParcels.length; i++) {
      const parcel = testParcels[i];
      console.log(`📦 Ajout du colis ${i + 1}/${testParcels.length}: ${parcel.trackingID}`);
      
      // Ajouter le document dans la collection 'parcel'
      const docRef = await addDoc(collection(db, 'parcel'), parcel);
      console.log(`✅ Colis ajouté avec ID: ${docRef.id}`);
    }
    
    console.log('🎉 Tous les colis de test ont été ajoutés avec succès!');
    console.log('');
    console.log('📋 Résumé des colis ajoutés:');
    testParcels.forEach((parcel, index) => {
      console.log(`${index + 1}. ${parcel.trackingID} - ${parcel.sender_name} → ${parcel.receiver_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des colis de test:', error);
  }
}

// Exécuter le script
addTestReceptions();