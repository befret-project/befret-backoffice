const admin = require('firebase-admin');

// Configuration Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: "befret-development",
  private_key_id: "5fcbaea67acc49d07d5f8b3f9a52148f30591d69",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDLNp3FNxv6RcC9\nNRpDLr16Zxhurgqndk8nqeI6d8cqPv65BQLB6sW41KUxWF/lRBgMdKxwAHhFg4G2\njWwb+NxBgb/Mei3oKFJXhvCEMLxKclNL6N7SjI+UJHcYKbWlx3ekO5Y+QebxN2R5\nt7zbX5fXJyZtCwTdUT1lF+LQav1D5ah8iuoByPCUGm1bzHPI+4ts4++wMfhRUIzb\n/3GWWnAJtGj1NuK4wobgZ4kAaFJiAHDonwd8UXlaXUku6FhygGlCp1LbDjVjSdIN\nJ8RAre4ZIZW2GogduBRK6FicoKSF2glClEos3ECY9V0UKjMFaGSdjvKtQuqtunlj\njzxkyc+nAgMBAAECggEAE8JtR+JqbYT/z0YNFjBCy1af+Q8iSRNHchdiQIYqDxEO\nCqaSlJGEBUtj/q7VsEDVR8zGgaOCDlxRrhMFSpkBrbr0j+jnctYM36bm1yu3+1Mv\nh0eO9xEk2uZK0EYp/AMvvn/uxYH590WIFw/HJNugM5MCeQLjx7NhEWXnr5VfqAzN\nwK9kmaw+qfUYeIUeUP1UMPHCYtok0fKYqbgcZu0RCbhCuPwxGzMkOhurHHtTT/Us\nGr0qeOCQyfS5r5XuPi1wOtjt/pGMVawAZIdhiOpvYG16Wa1pkQAC+oDQffkmJEtO\nuswrEwab2bRScjJzstgysddVMP9kuymg0ueU9c114QKBgQD10VICHn5QRTRTg/IK\nIOiAYHAah3PrSU3ap/EDHuShgdpIAosanD/bDF9+NCPD8NgDXkhLVn5R5RXFMvZy\nTyjMd3+dBiQHFov2DbF1XU2WaWe9TYvvkQe/aB5hx2nBGT8O9XYqG3pqogrJCBk0\nSrI7F093vqZQM+cMBFTROTKWRwKBgQDToYPGrrtbbJNy3G3kmboX/ksqKPEp5EKg\nWqGUNROBfPkvOCxPb+s+U+exxPV8IcwnFMQ8raWcnuXKO8trpbw6f/IQ7FVs8Kwu\nSlAU06uIrrUYA/ls2GQVtr96tUBdT2wI+uiUj4lzctysK4aQe9h30bswwplmh8qh\nRhBX3znLoQKBgA1GL2qD4QhOpGO6JVDctBFyo7sbA2x6OeUL2pzzhx8dlv76fC6E\nr4IRqfpzsFa9Y7zS046V7h5YA5Pxi5NiqO5ZqZ9+HGXxlr9DwAh5cF4l9P8o99yI\n9WUlpzZagWB3D4usP6RIdZTaiUCP2mSTgApm2Ni7h9me4+QnO7lMoGmzAoGAUO7Y\nvVe/UPRR40BHSoA7ucdHKYVkzRd9H2PpnQs7PW70wMkjsPFlLn3aApMHKoSmVV/M\nUEPULPRbfp6labKFLH4Xrb8j4DieMEm9HGnilK/zk46ZibWreN5dlejRB55C+6Aw\n5/eIoj0QBUvT91dVbmUnyDrzfVF6/XgU8fXtXWECgYEA1Zsg+Pl9o5SI0nYcB9Vb\nJz9WVRI1nKQ3Bl14cJFllOQxsAkYkr5g6E8vuQkrIbODlXz0gjS4Dz7RljiWd10p\nRWaQ+CQkis2t4F5a4bQkfsswMQYuZq+fDjTFk5aytVXZ0bb7gREsdV7FwHHV3bal\n3siEcT2fhBEAhhVOXy5lF8Q=\n-----END PRIVATE KEY-----\n",
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

// Fonction pour générer un code unique
function generateUniqueCode(trackingID, index) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `${trackingID}-${timestamp}-${random}`.toUpperCase();
}

// Fonction pour déduire la destination depuis les données existantes
function deduceDestination(parcelData) {
  // Vérifier d'abord le champ city existant
  if (parcelData.city) {
    const city = parcelData.city.toLowerCase();
    if (city.includes('kinshasa') || city.includes('kin')) {
      return 'kinshasa';
    }
    if (city.includes('lubumbashi') || city.includes('lub')) {
      return 'lubumbashi';
    }
  }
  
  // Vérifier dans l'adresse du destinataire
  if (parcelData.address) {
    const address = parcelData.address.toLowerCase();
    if (address.includes('kinshasa') || address.includes('kin')) {
      return 'kinshasa';
    }
    if (address.includes('lubumbashi') || address.includes('lub')) {
      return 'lubumbashi';
    }
  }
  
  // Vérifier dans le nom du destinataire (parfois la ville y est mentionnée)
  if (parcelData.receiver_name) {
    const receiver = parcelData.receiver_name.toLowerCase();
    if (receiver.includes('kinshasa') || receiver.includes('kin')) {
      return 'kinshasa';
    }
    if (receiver.includes('lubumbashi') || receiver.includes('lub')) {
      return 'lubumbashi';
    }
  }
  
  // Par défaut, Kinshasa (ville principale)
  return 'kinshasa';
}

// Fonction pour déduire le statut logistique depuis le statut existant
function deduceLogisticsStatus(parcelData) {
  const status = parcelData.status;
  const logisticStatus = parcelData.logisticStatus;
  
  // Si un logisticStatus existe déjà, le mapper vers les nouveaux enums
  if (logisticStatus) {
    switch (logisticStatus) {
      case 'pending_reception': return 'pending_reception';
      case 'received': return 'received';
      case 'weighed': return 'weighed';
      case 'ready_grouping': return 'ready_grouping';
      default: return 'pending_reception';
    }
  }
  
  // Sinon, déduire depuis le statut principal
  switch (status) {
    case 'draft': return 'pending_reception';
    case 'pending': return 'pending_reception';
    case 'to_warehouse': return 'pending_reception';
    case 'from_warehouse_to_congo': return 'shipped';
    case 'arrived_in_congo': return 'arrived_destination';
    case 'delivered': return 'delivered';
    default: return 'pending_reception';
  }
}

// Fonction pour détecter les cas spéciaux
function detectSpecialCase(parcelData) {
  // Vérifier si c'est fragile
  if (parcelData.fragile === true) {
    return {
      type: 'fragile',
      reason: 'Colis marqué comme fragile par le client'
    };
  }
  
  // Vérifier si le paiement est en attente
  if (!parcelData.payment_date && parcelData.status === 'draft') {
    return {
      type: 'payment_pending',
      reason: 'Paiement non confirmé'
    };
  }
  
  // Vérifier si c'est une haute valeur (> 500€)
  if (parcelData.cost && parcelData.cost > 500) {
    return {
      type: 'high_value',
      reason: `Valeur élevée: ${parcelData.cost}€`
    };
  }
  
  // Vérifier si c'est surdimensionné (poids > 20kg)
  const weight = parcelData.totalWeight || parcelData.weight || 0;
  if (weight > 20) {
    return {
      type: 'oversized',
      reason: `Poids élevé: ${weight}kg`
    };
  }
  
  // Pas de cas spécial
  return {
    type: '',
    reason: ''
  };
}

async function migrateParcelSchema() {
  console.log('🔄 MIGRATION DU SCHÉMA DE LA COLLECTION PARCEL\n');
  
  try {
    // Récupérer tous les colis
    console.log('📦 Récupération de tous les colis...');
    const parcelsRef = db.collection('parcel');
    const snapshot = await parcelsRef.get();
    
    if (snapshot.empty) {
      console.log('❌ Aucun colis trouvé dans la collection');
      return;
    }
    
    console.log(`✅ ${snapshot.size} colis trouvés\n`);
    
    let migratedCount = 0;
    let errorCount = 0;
    const batch = db.batch();
    
    // Traiter chaque colis
    for (const doc of snapshot.docs) {
      try {
        const parcelData = doc.data();
        const parcelId = doc.id;
        
        console.log(`🔄 Migration du colis ${parcelData.trackingID || parcelId}...`);
        
        // Préparer les nouveaux champs
        const newFields = {};
        
        // 1. Code unique (si pas déjà présent)
        if (!parcelData.uniqueCode) {
          newFields.uniqueCode = generateUniqueCode(parcelData.trackingID || parcelId, migratedCount);
        }
        
        // 2. Poids déclaré (mapper depuis weight ou totalWeight existant)
        if (!parcelData.weightDeclared && (parcelData.weight || parcelData.totalWeight)) {
          newFields.weightDeclared = parcelData.weight || parcelData.totalWeight;
        }
        
        // 3. Poids réel (initialiser à null, sera renseigné lors de la pesée)
        if (!parcelData.weightReal) {
          newFields.weightReal = null;
        }
        
        // 4. Photos de poids (initialiser tableau vide)
        if (!parcelData.weightPhotos) {
          newFields.weightPhotos = [];
        }
        
        // 5. Timestamp de réception (utiliser receivedAt existant ou null)
        if (!parcelData.receptionTimestamp && parcelData.receivedAt) {
          newFields.receptionTimestamp = parcelData.receivedAt;
        }
        
        // 6. Agent ID (initialiser à null, sera renseigné lors du traitement)
        if (!parcelData.agentId) {
          newFields.agentId = null;
        }
        
        // 7. Destination (déduire depuis les données existantes)
        if (!parcelData.destination) {
          newFields.destination = deduceDestination(parcelData);
        }
        
        // 8. Statut logistique (mapper depuis les statuts existants)
        if (!parcelData.logisticsStatus) {
          newFields.logisticsStatus = deduceLogisticsStatus(parcelData);
        }
        
        // 9. Cas spéciaux (détecter automatiquement)
        if (!parcelData.specialCaseType) {
          const specialCase = detectSpecialCase(parcelData);
          newFields.specialCaseType = specialCase.type;
          if (specialCase.reason) {
            newFields.specialCaseReason = specialCase.reason;
          }
        }
        
        // 10. Historique de traitement (initialiser si vide)
        if (!parcelData.processingHistory) {
          newFields.processingHistory = [];
          
          // Ajouter une entrée de création
          if (parcelData.create_date) {
            newFields.processingHistory.push({
              step: 'created',
              timestamp: parcelData.create_date,
              operator: 'system',
              data: {
                source: 'befret_new_migration'
              }
            });
          }
          
          // Ajouter une entrée de réception si le colis est déjà reçu
          if (parcelData.receivedAt) {
            newFields.processingHistory.push({
              step: 'received',
              timestamp: parcelData.receivedAt,
              operator: parcelData.lastUpdatedBy || 'unknown_agent',
              data: {
                location: 'warehouse'
              }
            });
          }
        }
        
        // 11. Historique des notifications (initialiser si vide)
        if (!parcelData.notificationHistory) {
          newFields.notificationHistory = [];
          
          // Si le colis a été notifié, ajouter une entrée
          if (parcelData.notified) {
            newFields.notificationHistory.push({
              type: 'arrival',
              timestamp: parcelData.receivedAt || parcelData.create_date,
              recipient: parcelData.mail2User || 'unknown',
              channel: 'sms',
              status: 'sent',
              template: 'arrival_notification'
            });
          }
        }
        
        // 12. Métadonnées de migration
        newFields.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
        newFields.lastUpdatedBy = 'migration_script';
        newFields.migrationVersion = '1.0';
        newFields.migratedAt = admin.firestore.FieldValue.serverTimestamp();
        
        // Ajouter à la batch si il y a des champs à mettre à jour
        if (Object.keys(newFields).length > 0) {
          const docRef = parcelsRef.doc(parcelId);
          batch.update(docRef, newFields);
          migratedCount++;
          
          console.log(`  ✅ ${Object.keys(newFields).length} nouveaux champs ajoutés`);
          console.log(`  📍 Destination: ${newFields.destination || parcelData.destination}`);
          console.log(`  🏷️  Statut logistique: ${newFields.logisticsStatus || parcelData.logisticsStatus}`);
          if (newFields.specialCaseType) {
            console.log(`  ⚠️  Cas spécial: ${newFields.specialCaseType} - ${newFields.specialCaseReason}`);
          }
        } else {
          console.log(`  ℹ️  Aucune migration nécessaire (déjà à jour)`);
        }
        
        console.log('');
        
      } catch (error) {
        console.error(`❌ Erreur lors de la migration du colis ${doc.id}:`, error);
        errorCount++;
      }
    }
    
    // Exécuter la batch si il y a des modifications
    if (migratedCount > 0) {
      console.log(`💾 Sauvegarde des modifications (${migratedCount} colis)...`);
      await batch.commit();
      console.log(`✅ Migration terminée avec succès!`);
    } else {
      console.log(`ℹ️  Aucune migration nécessaire - tous les colis sont déjà à jour`);
    }
    
    // Résumé
    console.log('\n📊 === RÉSUMÉ DE LA MIGRATION ===');
    console.log(`📦 Total des colis: ${snapshot.size}`);
    console.log(`✅ Colis migrés: ${migratedCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`🔧 Nouveaux champs ajoutés par colis:`);
    console.log(`   - uniqueCode: Code scanner unique`);
    console.log(`   - weightDeclared: Poids déclaré client`);
    console.log(`   - weightReal: Poids réel (null, à renseigner)`);
    console.log(`   - weightPhotos: Array photos balance`);
    console.log(`   - receptionTimestamp: Timestamp scan arrivée`);
    console.log(`   - agentId: ID agent traitant`);
    console.log(`   - destination: kinshasa/lubumbashi`);
    console.log(`   - logisticsStatus: Statut logistique détaillé`);
    console.log(`   - specialCaseType: Type cas spécial`);
    console.log(`   - processingHistory: Historique étapes`);
    console.log(`   - notificationHistory: Historique notifications`);
    
    console.log('\n✅ Migration du schéma terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Fonction de vérification avant migration
async function verifyMigration() {
  console.log('🔍 VÉRIFICATION POST-MIGRATION\n');
  
  try {
    const parcelsRef = db.collection('parcel');
    const snapshot = await parcelsRef.limit(5).get();
    
    if (snapshot.empty) {
      console.log('❌ Aucun colis pour vérification');
      return;
    }
    
    console.log('📋 Échantillon de colis après migration:\n');
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📦 COLIS ${index + 1} - ${data.trackingID}:`);
      console.log(`   uniqueCode: ${data.uniqueCode || 'NON DÉFINI'}`);
      console.log(`   weightDeclared: ${data.weightDeclared || 'NON DÉFINI'} kg`);
      console.log(`   weightReal: ${data.weightReal || 'À PESER'}`);
      console.log(`   destination: ${data.destination || 'NON DÉFINI'}`);
      console.log(`   logisticsStatus: ${data.logisticsStatus || 'NON DÉFINI'}`);
      console.log(`   specialCaseType: ${data.specialCaseType || 'AUCUN'}`);
      console.log(`   processingHistory: ${data.processingHistory ? data.processingHistory.length + ' étapes' : 'VIDE'}`);
      console.log(`   migrationVersion: ${data.migrationVersion || 'NON MIGRÉ'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécution
const args = process.argv.slice(2);
if (args.includes('--verify')) {
  verifyMigration();
} else {
  migrateParcelSchema();
}