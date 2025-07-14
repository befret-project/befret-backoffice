// Script pour nettoyer les données de test dans Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc, doc } = require('firebase/firestore');

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

async function cleanupTestData() {
  try {
    console.log('🧹 Nettoyage des données de test...');
    
    // Chercher tous les colis avec des UIDs de test
    const testUIDs = [
      'test_user_001', 'test_user_002', 'test_user_003', 
      'test_user_004', 'test_user_005', 'test_user_006',
      'test_user_007', 'test_user_008'
    ];
    
    let totalDeleted = 0;
    
    for (const uid of testUIDs) {
      const q = query(collection(db, 'parcel'), where('uid', '==', uid));
      const querySnapshot = await getDocs(q);
      
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        console.log(`🗑️ Suppression: ${data.trackingID} - ${data.sender_name}`);
        await deleteDoc(doc(db, 'parcel', docSnapshot.id));
        totalDeleted++;
      }
    }
    
    console.log(`✅ Nettoyage terminé! ${totalDeleted} colis de test supprimés.`);
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

// Décommenter la ligne suivante pour exécuter le nettoyage
// cleanupTestData();

console.log('⚠️ Script de nettoyage prêt.');
console.log('💡 Pour exécuter le nettoyage, décommentez la dernière ligne dans le fichier.');