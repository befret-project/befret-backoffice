// Script pour déboguer le problème des statistiques
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function debugStats() {
  try {
    console.log('🔍 Analyse des statistiques des colis...');
    
    // Récupérer tous les colis
    const parcelsRef = collection(db, 'parcel');
    const allParcelsSnapshot = await getDocs(parcelsRef);
    
    console.log(`📦 Total de colis dans la collection: ${allParcelsSnapshot.size}`);
    
    // Analyser les statuts
    const statusCounts = {};
    let totalNonDraft = 0;
    let totalWithStatus = 0;
    let totalWithoutStatus = 0;
    
    allParcelsSnapshot.forEach((doc) => {
      const data = doc.data();
      const status = data.status;
      
      if (status) {
        totalWithStatus++;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        
        if (status !== 'draft') {
          totalNonDraft++;
        }
      } else {
        totalWithoutStatus++;
        statusCounts['NO_STATUS'] = (statusCounts['NO_STATUS'] || 0) + 1;
      }
    });
    
    console.log('\n📊 Répartition des statuts:');
    Object.entries(statusCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    
    console.log(`\n✅ Colis avec statut: ${totalWithStatus}`);
    console.log(`❌ Colis sans statut: ${totalWithoutStatus}`);
    console.log(`🔄 Colis non-draft: ${totalNonDraft}`);
    
    // Analyser quelques colis sans statut ou draft
    console.log('\n🔍 Exemples de colis problématiques:');
    let count = 0;
    allParcelsSnapshot.forEach((doc) => {
      if (count >= 5) return;
      
      const data = doc.data();
      const status = data.status;
      
      if (!status || status === 'draft') {
        count++;
        console.log(`   ${count}. ID: ${doc.id}`);
        console.log(`      TrackingID: ${data.trackingID || 'NO_TRACKING'}`);
        console.log(`      Status: ${status || 'NO_STATUS'}`);
        console.log(`      Create Date: ${data.create_date || 'NO_DATE'}`);
        console.log(`      Sender: ${data.sender_name || 'NO_SENDER'}`);
        console.log('');
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

// Exécuter l'analyse
debugStats();