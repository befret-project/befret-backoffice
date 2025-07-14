const admin = require('firebase-admin');

// Configuration Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: "befret-development",
  private_key_id: "5fcbaea67acc49d07d5f8b3f9a52148f30591d69",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDLNp3FNxv6RcC9\nNRpDLr16Zxhurgqndk8nqeI6d8cqPv65BQLB6sW41KUxWF/lRBgMdKxwAHhFg4G2\njWwb+NxBgb/Mei3oKFJXhvCEMLxKclNL6N7SjI+UJHcYKbWlx3ekO5Y+QebxN2R5\nt7zbX5fXJyZtCwTdUT1lF+LQav1D5ah8iuoByPCUGm1bzHPI+4ts4++wMfhRUIzb\n/3GWWnAJtGj1NuK4wobgZ4kAaFJiAHDonwd8UXlaXUku6FhygGlCp1LbDjVjSdIN\nJ8RAre4ZIZW2GogduBRK6FicoKSF2glClEos3ECY9V0UKjMFaGSdjvKtQuqtunlj\njzxkyc+nAgMBAAECggEAE8JtR+JqbYT/z0YNFjBCy1af+Q8iSRNHchdiQIYqDxEO\nCqaSlJGEBUtj/q7VsEDVR8zGgaOCDlxRrhMFSpkBrbr0j+jnctYM36bm1yu3+1Mv\nh0eO9xEk2uZK0EYp/AMvvn/uxYH590WIFw/HJNugM5MCeQLjx7NhEWXnr5VfqAzN\nwK9kmaw+qfUYeIUeUP1UMPHCYtok0fKYqbgcZu0RCbhCuPwxGzMkOhurHHtTT/Us\nGr0qeOCQyfS5r5XuPi1wOtjt/pGMVawAZIdhiOpvYG16Wa1pkQAC+oDQffkmJEtO\nuswrEwab2bRScjJzstgysddVMP9kuymg0ueU9c114QKBgQD10VICHn5QRTRTg/IK\nIOiAYHAah3PrSU3ap/EDHuShgdpIAosanD/bDF9+NCPD8NgDXkhLVn5R5RXFMvZy\nTyjMd3+dBiQHFov2DbF1XU2WaWe9TYvvkQe/aB5hx2nBGT8O9XYqG3pqogrJCBk0\nSrI7F093vqZQM+cMBFTROTKWRwKBgQDToYPGrrtbbJNy3G3kmboX/ksqKPEp5EKg\nWqGUNROBfPkvOCxPb+s+U+exxPV8IcwnFMQ8raWcnuXKO8trpbw6f/IQ7FVs8Kwu\nSlAU06uIrrUYA/ls2GQVtr96tUBdT2wI+uiUj4lzctysK4aQe9h30bswwplmh8qh\nRhBX3znLoQKBgA1GL2qD4QhOpGO6JVDctBFyo7sbA2x6OeUL2pzzhx8dlv76fC6E\nr4IRqfpzsFa9Y7zS046V7h5YA5Pxi5NiqO5ZqZ9+HGXxlr9DwAh5cF4l9P8o99yI\n9WUlpzZagWB3D4usP6RIdZTaiUCP2mSTgApm2Ni7h9me4+QnO7lMoGmzAoGAUO7Y\nvVe/UPRR40BHSoA7ucdHKYVkzRd9H2PpnQs7PW70wMkjsPFlLn3aApMHKoSmVV/M\nuEPULPRbfp6labKFLH4Xrb8j4DieMEm9HGnilK/zk46ZibWreN5dlejRB55C+6Aw\n5/eIoj0QBUvT91dVbmUnyDrzfVF6/XgU8fXtXWECgYEA1Zsg+Pl9o5SI0nYcB9Vb\nJz9WVRI1nKQ3Bl14cJFllOQxsAkYkr5g6E8vuQkrIbODlXz0gjS4Dz7RljiWd10p\nRWaQ+CQkis2t4F5a4bQkfsswMQYuZq+fDjTFk5aytVXZ0bb7gREsdV7FwHHV3bal\n3siEcT2fhBEAhhVOXy5lF8Q=\n-----END PRIVATE KEY-----\n",
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

async function getSampleParcels() {
  console.log('📦 ÉCHANTILLONS DE DOCUMENTS PARCEL\n');
  
  try {
    const parcelsRef = db.collection('parcel');
    const snapshot = await parcelsRef.limit(3).get();
    
    if (snapshot.empty) {
      console.log('❌ Aucun document trouvé');
      return;
    }
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      
      console.log(`📦 DOCUMENT ${index + 1} - ID: ${doc.id}`);
      console.log('═'.repeat(60));
      console.log(JSON.stringify(data, null, 2));
      console.log('\n');
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
  
  process.exit(0);
}

getSampleParcels();