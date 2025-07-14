const admin = require('firebase-admin');

// Configuration Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: "befret-development",
  private_key_id: "5fcbaea67acc49d07d5f8b3f9a52148f30591d69",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDLNp3FNxv6RcC9\nNRpDLr16Zxhurgqndk8nqeI6d8cqPv65BQLB6sW41KUxWF/lRBgMdKxwAHhFg4G2\njWwb+NxBgb/Mei3oKFJXhvCEMLxKclNL6N7SjI+UJHcYKbWlx3ekO5Y+QebxN2R5\nt7zbX5fXJyZtCwTdUT1lF+LQav1D5ah8iuoByPCUGm1bzHPI+4ts4++wMfhRUIzb\n/3GWWnAJtGj1NuK4wobgZ4kAaFJiAHDonwd8UXlaXUku6FhygGlCp1LbDjVjSdIN\nJ8RAre4ZIZW2GogduBRK6FicoKSF2glClEos3ECY9V0UKjMFaGSdjvKtQuqtunlj\njzxkyc+nAgMBAAECggEAE8JtR+JqbYT/z0YNFjBCy1af+Q8iSRNHchdiQIYqDxEO\nCqaSlJGEBUtj/q7VsEDVR8zGgaOCDlxRrhMFSpkBrbr0j+jnctYM36bm1yu3+1Mv\nh0eO9xEk2uZK0EYp/AMvvn/uxYH590WIFw/HJNugM5MCeQLjx7NhEWXnr5VfqAzN\nwK9kmaw+qfUYeIUeUP1UMPHCYtok0fKYqbgcZu0RCbhCuPwxGzMkOhurHHtTT/Us\ngr0qeOCQyfS5r5XuPi1wOtjt/pGMVawAZIdhiOpvYG16Wa1pkQAC+oDQffkmJEtO\nuswrEwab2bRScjJzstgysddVMP9kuymg0ueU9c114QKBgQD10VICHn5QRTRTg/IK\nIOiAYHAah3PrSU3ap/EDHuShgdpIAosanD/bDF9+NCPD8NgDXkhLVn5R5RXFMvZy\nTyjMd3+dBiQHFov2DbF1XU2WaWe9TYvvkQe/aB5hx2nBGT8O9XYqG3pqogrJCBk0\nSrI7F093vqZQM+cMBFTROTKWRwKBgQDToYPGrrtbbJNy3G3kmboX/ksqKPEp5EKg\nWqGUNROBfPkvOCxPb+s+U+exxPV8IcwnFMQ8raWcnuXKO8trpbw6f/IQ7FVs8Kwu\nSlAU06uIrrUYA/ls2GQVtr96tUBdT2wI+uiUj4lzctysK4aQe9h30bswwplmh8qh\nRhBX3znLoQKBgA1GL2qD4QhOpGO6JVDctBFyo7sbA2x6OeUL2pzzhx8dlv76fC6E\nr4IRqfpzsFa9Y7zS046V7h5YA5Pxi5NiqO5ZqZ9+HGXxlr9DwAh5cF4l9P8o99yI\n9WUlpzZagWB3D4usP6RIdZTaiUCP2mSTgApm2Ni7h9me4+QnO7lMoGmzAoGAUO7Y\nvVe/UPRR40BHSoA7ucdHKYVkzRd9H2PpnQs7PW70wMkjsPFlLn3aApMHKoSmVV/M\nuEPULPRbfp6labKFLH4Xrb8j4DieMEm9HGnilK/zk46ZibWreN5dlejRB55C+6Aw\n5/eIoj0QBUvT91dVbmUnyDrzfVF6/XgU8fXtXWECgYEA1Zsg+Pl9o5SI0nYcB9Vb\nJz9WVRI1nKQ3Bl14cJFllOQxsAkYkr5g6E8vuQkrIbODlXz0gjS4Dz7RljiWd10p\nRWaQ+CQkis2t4F5a4bQkfsswMQYuZq+fDjTFk5aytVXZ0bb7gREsdV7FwHHV3bal\n3siEcT2fhBEAhhVOXy5lF8Q=\n-----END PRIVATE KEY-----\n",
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

// Données sample pour les expéditions
const sampleExpeditions = [
  {
    reference: 'EXP-2024-001',
    destination: {
      ville: 'Kinshasa',
      pays: 'RD Congo',
      adresse: 'Avenue Tombalbaye, Gombe'
    },
    status: 'en_cours',
    nbColis: 45,
    transporteur: {
      nom: 'DHL Congo',
      contact: 'Pierre Mukendi',
      telephone: '+243 81 234 5678'
    },
    dateDepart: '2024-01-15',
    dateArriveePrevu: '2024-01-22',
    tracking: 'DHL-CD-789012345',
    responsable: 'Marc Dubois',
    conteneur: 'CONT-001',
    poids: 1250.5,
    valeur: 45000,
    priorite: 'urgente',
    notes: 'Livraison express demandée par le client',
    createdAt: '2024-01-10T08:30:00Z',
    updatedAt: '2024-01-10T08:30:00Z',
    createdBy: 'admin-user'
  },
  {
    reference: 'EXP-2024-002',
    destination: {
      ville: 'Lubumbashi',
      pays: 'RD Congo',
      adresse: 'Boulevard Mobutu, Lubumbashi'
    },
    status: 'preparation',
    nbColis: 32,
    transporteur: {
      nom: 'FedEx Africa',
      contact: 'Sarah Ngandu',
      telephone: '+243 97 876 5432'
    },
    dateDepart: '2024-01-20',
    dateArriveePrevu: '2024-01-27',
    tracking: 'FDX-AF-567890123',
    responsable: 'Julie Martin',
    conteneur: 'CONT-002',
    poids: 890.2,
    valeur: 32000,
    priorite: 'normale',
    notes: 'Matériel médical - manipulation avec précaution',
    createdAt: '2024-01-12T14:15:00Z',
    updatedAt: '2024-01-12T14:15:00Z',
    createdBy: 'admin-user'
  },
  {
    reference: 'EXP-2024-003',
    destination: {
      ville: 'Bukavu',
      pays: 'RD Congo',
      adresse: 'Avenue Patrice Lumumba, Bukavu'
    },
    status: 'arrive',
    nbColis: 28,
    transporteur: {
      nom: 'UPS Congo',
      contact: 'Jean Kabila',
      telephone: '+243 85 345 6789'
    },
    dateDepart: '2024-01-08',
    dateArriveePrevu: '2024-01-15',
    dateArriveeReelle: '2024-01-14',
    tracking: 'UPS-CG-345678901',
    responsable: 'David Leroy',
    conteneur: 'CONT-003',
    poids: 675.8,
    valeur: 28500,
    priorite: 'express',
    notes: 'Arrivé avec 1 jour d\'avance',
    createdAt: '2024-01-05T09:45:00Z',
    updatedAt: '2024-01-05T09:45:00Z',
    createdBy: 'admin-user'
  }
];

// Données sample pour les collectes
const sampleCollectes = [
  {
    reference: 'COL-2024-001',
    client: {
      nom: 'Jean Mukendi',
      telephone: '+243 81 234 5678',
      email: 'jean.mukendi@gmail.com',
      entreprise: 'Mukendi Trading'
    },
    adresse: {
      rue: '123 Avenue de la Paix',
      ville: 'Kinshasa',
      codePostal: '12345',
      pays: 'RD Congo'
    },
    status: 'programmee',
    datePrevue: '2024-01-20',
    heureCollecte: '09:00',
    nbColis: 5,
    poidsTotal: 25.5,
    typeCollecte: 'entreprise',
    priorite: 'normale',
    operateur: 'Marie Dupont',
    notes: 'Collecte matinale préférée',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    createdBy: 'admin-user'
  },
  {
    reference: 'COL-2024-002',
    client: {
      nom: 'Sarah Ngandu',
      telephone: '+243 97 876 5432',
      email: 'sarah.ngandu@medicals.cd',
      entreprise: 'Medicals Congo'
    },
    adresse: {
      rue: '456 Boulevard Lumumba',
      ville: 'Lubumbashi',
      codePostal: '67890',
      pays: 'RD Congo'
    },
    status: 'en_cours',
    datePrevue: '2024-01-18',
    heureCollecte: '14:30',
    nbColis: 12,
    poidsTotal: 45.2,
    typeCollecte: 'entreprise',
    chauffeur: 'Paul Kasongo',
    priorite: 'urgente',
    operateur: 'Marc Dubois',
    notes: 'Matériel médical fragile',
    createdAt: '2024-01-16T08:15:00Z',
    updatedAt: '2024-01-18T14:00:00Z',
    createdBy: 'admin-user'
  }
];

async function seedFirestore() {
  try {
    console.log('🌱 Début du seeding Firestore...');
    
    // Ajouter les expéditions
    console.log('📦 Ajout des expéditions...');
    for (const expedition of sampleExpeditions) {
      await db.collection('expeditions').add(expedition);
      console.log(`✅ Expédition ${expedition.reference} ajoutée`);
    }
    
    // Ajouter les collectes
    console.log('🚚 Ajout des collectes...');
    for (const collecte of sampleCollectes) {
      await db.collection('collectes').add(collecte);
      console.log(`✅ Collecte ${collecte.reference} ajoutée`);
    }
    
    console.log('🎉 Seeding terminé avec succès !');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  }
}

seedFirestore();