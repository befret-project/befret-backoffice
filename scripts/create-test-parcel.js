/**
 * Script pour créer un colis de test réel dans Firestore
 * Pour tester le workflow Sprint 1 : Recherche → Réception → Pesée
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

async function createTestParcel() {
  const trackingNumber = 'BF-TEST-' + Date.now();
  const dpdTrackingNumber = '05500' + Math.floor(Math.random() * 100000000);

  const testShipment = {
    trackingNumber: trackingNumber,
    dpdTrackingNumber: dpdTrackingNumber,

    // Status
    status: {
      current: 'payment_completed', // Prêt pour réception
      phase: 'pre_deposit',
      lastUpdated: new Date().toISOString(),
      history: [
        {
          status: 'order_created',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // Il y a 1 jour
          location: 'Online'
        },
        {
          status: 'payment_completed',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // Il y a 1h
          location: 'Online'
        }
      ]
    },

    // Customer Info
    customerInfo: {
      sender: {
        name: 'Jean Dupont',
        email: 'jean.dupont@test.befret.com',
        phone: {
          full: '+32499123456',
          countryCode: '+32',
          number: '499123456'
        },
        address: {
          street: 'Rue de Test 123',
          city: 'Bruxelles',
          postalCode: '1000',
          country: 'BE'
        }
      },
      receiver: {
        name: 'Marie Mukendi',
        email: 'marie.mukendi@test.befret.com',
        phone: {
          full: '+243812345678',
          countryCode: '+243',
          number: '812345678'
        },
        address: {
          street: 'Avenue de la Liberation 45',
          city: 'Kinshasa',
          district: 'Gombe',
          country: 'CD'
        }
      },
      preferences: {
        language: 'fr',
        timezone: 'Africa/Kinshasa',
        notifications: {
          email: true,
          sms: true,
          whatsapp: true
        }
      }
    },

    // Parcel Info
    parcelInfo: {
      weight: 5.0, // 5 kg déclaré (on testera avec 5.8 kg réel pour voir l'écart)
      dimensions: {
        length: 40,
        width: 30,
        height: 20,
        unit: 'cm'
      },
      volumetricWeight: 2.4,
      category: 'standard',
      description: 'Vêtements et accessoires',
      value: {
        amount: 150,
        currency: 'EUR'
      },
      fragile: false,
      insurance: true
    },

    // Pricing
    pricing: {
      basePrice: 40.00,
      weightPrice: 40.00, // 8€/kg * 5kg
      insurancePrice: 3.00,
      totalPrice: 83.00,
      currency: 'EUR',
      paid: true,
      paidAt: new Date(Date.now() - 3600000).toISOString()
    },

    // Shipping Details
    shippingDetails: {
      destination: 'Kinshasa',
      deliveryMode: 'home_delivery',
      service: 'standard',
      estimatedDelivery: new Date(Date.now() + 14 * 86400000).toISOString() // Dans 14 jours
    },

    // Logistic Data (vide, sera rempli pendant le workflow)
    logisticData: {
      receptionDepart: {
        status: 'pending',
        photos: {},
        weighing: {}
      },
      preparationDepart: {
        status: 'pending'
      },
      expeditionDepart: {
        status: 'pending'
      },
      scanHistory: [],
      photoHistory: []
    },

    // Metadata
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system-test',
    environment: 'development'
  };

  try {
    console.log('🔄 Création du colis de test...');
    console.log('📦 Tracking BeFret:', trackingNumber);
    console.log('📦 Tracking DPD:', dpdTrackingNumber);

    await db.collection('shipments').doc(trackingNumber).set(testShipment);

    console.log('\n✅ Colis de test créé avec succès !');
    console.log('\n📋 INFORMATIONS POUR LE TEST:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Tracking BeFret:  ', trackingNumber);
    console.log('Tracking DPD:     ', dpdTrackingNumber);
    console.log('Client (sender):  ', testShipment.customerInfo.sender.name);
    console.log('Email sender:     ', testShipment.customerInfo.sender.email);
    console.log('Phone sender:     ', testShipment.customerInfo.sender.phone.full);
    console.log('Destinataire:     ', testShipment.customerInfo.receiver.name);
    console.log('Email receiver:   ', testShipment.customerInfo.receiver.email);
    console.log('Phone receiver:   ', testShipment.customerInfo.receiver.phone.full);
    console.log('Poids déclaré:    ', testShipment.parcelInfo.weight, 'kg');
    console.log('Statut actuel:    ', testShipment.status.current);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 WORKFLOW DE TEST:');
    console.log('1. Aller sur: http://localhost:3000/logistic/reception-depart/recherche');
    console.log('2. Chercher par DPD:', dpdTrackingNumber);
    console.log('   OU par BeFret:', trackingNumber);
    console.log('3. Confirmer la réception → Vérifier notification');
    console.log('4. Sur la page de pesée, entrer: 5.8 kg (écart de 0.8 kg)');
    console.log('5. Prendre une photo de test');
    console.log('6. Valider → Vérifier notification écart de poids');
    console.log('\n💡 Les notifications seront loggées dans Firestore (collection notification_logs)');
    console.log('\n🔥 Firestore Console:');
    console.log('https://console.firebase.google.com/project/befret-development/firestore/data/shipments/' + trackingNumber);

  } catch (error) {
    console.error('❌ Erreur lors de la création du colis:', error);
    throw error;
  } finally {
    // Close Firebase connection
    await admin.app().delete();
  }
}

// Run
createTestParcel()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  });
