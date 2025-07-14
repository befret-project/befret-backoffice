// Script pour vérifier les données dans Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

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

async function checkFirestoreData() {
  try {
    console.log('🔍 Vérification des données Firestore...');
    console.log('📡 Projet connecté:', firebaseConfig.projectId);
    
    // Compter tous les colis
    const parcelsRef = collection(db, 'parcel');
    const allParcelsSnapshot = await getDocs(parcelsRef);
    console.log(`📦 Total de colis dans la collection: ${allParcelsSnapshot.size}`);
    
    if (allParcelsSnapshot.size === 0) {
      console.log('⚠️ Aucun colis trouvé dans la collection "parcel"');
      return;
    }
    
    // Récupérer les 10 plus récents
    const recentQuery = query(
      parcelsRef,
      orderBy('create_date', 'desc'),
      limit(10)
    );
    
    const recentSnapshot = await getDocs(recentQuery);
    console.log(`📋 Colis récents (${recentSnapshot.size}/10):`);
    
    recentSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${data.trackingID || 'NO_ID'} - ${data.sender_name || 'NO_SENDER'} → ${data.receiver_name || 'NO_RECEIVER'}`);
      console.log(`   Status: ${data.status || 'NO_STATUS'} | LogisticStatus: ${data.logisticStatus || 'NO_LOGISTIC_STATUS'}`);
      console.log(`   Créé: ${data.create_date || 'NO_DATE'}`);
      console.log('');
    });
    
    // Compter ceux déjà reçus
    const receivedParcels = [];
    allParcelsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.logisticStatus === 'received') {
        receivedParcels.push(data);
      }
    });
    
    console.log(`✅ Colis déjà reçus: ${receivedParcels.length}`);
    receivedParcels.forEach((parcel, index) => {
      console.log(`   ${index + 1}. ${parcel.trackingID} - Reçu le ${parcel.receivedAt || 'DATE_INCONNUE'}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécuter la vérification
checkFirestoreData();