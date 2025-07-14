/**
 * 🔧 CONFIGURATION BEFRET_NEW POUR BACKOFFICE
 * Configuration exacte utilisée dans befret_new pour compatibility
 */

// Configuration Firebase pour befret-development (utilisée par befret_new)
export const firebaseConfig = {
  apiKey: "AIzaSyDgU_qyND7LXCY-hESIzUvu8jIqFflc_BE",
  authDomain: "befret-development.firebaseapp.com",
  databaseURL: "https://befret-development-default-rtdb.firebaseio.com",
  projectId: "befret-development",
  storageBucket: "befret-development.appspot.com",
  messagingSenderId: "384879116689",
  appId: "1:384879116689:web:4264e8f53d6d37e3c2da30",
  measurementId: "G-M6VGY46KTE",
};

// URLs des Cloud Functions befret_new (development)
export const apiUrls = {
  createInvoice: "https://us-central1-befret-development.cloudfunctions.net/createInvoice",
  sendPaymentNotification: "https://us-central1-befret-development.cloudfunctions.net/sendPaymentNotification",
  sendArrivalNotification: "https://us-central1-befret-development.cloudfunctions.net/sendArrivalNotification",
  sendDeliveryNotification: "https://us-central1-befret-development.cloudfunctions.net/sendDeliveryNotification",
  sendInvalidationNotification: "https://us-central1-befret-development.cloudfunctions.net/sendInvalidationNotification",
  sendExpeditionNotification: "https://us-central1-befret-development.cloudfunctions.net/sendExpeditionNotification",
  sendReceiptNotification: "https://us-central1-befret-development.cloudfunctions.net/sendReceiptNotification",
  sendOverWeightNotification: "https://us-central1-befret-development.cloudfunctions.net/sendOverWeightNotification",
};

// Templates SendGrid existants dans befret_new
export const sendGridTemplates = {
  // Templates actuels dans befret_new
  paymentConfirmation: "d-bea3cda54ac340c2ae2c35639702210b",
  receiptNotification: "d-4e5b37170b714d20b33f717c099521ff", 
  expeditionNotification: "d-dea60fdea65c49bcbc4c5f80d937224b",
  arrivalWarehouse: "d-f686ee9c6a1447f2b8fa330f13cb57de",
  arrivalHome: "d-d85844c898bb4142a3d0e1bdb1c3d87a",
  deliveryNotification: "d-2cc5e4a9e81643fb9b398df90c39ac32",
  overweightNotification: "d-056cd451f9364440af7b18fa93befd68",
  invalidationNotification: "d-ed54bb3d7a9949a095bbbf7cb2503da2",
  
  // Nouveaux templates pour station de pesée (à créer)
  weighingConfirmation: "d-4e5b37170b714d20b33f717c099521ff", // Fallback vers receipt
  supplementRequired: "d-056cd451f9364440af7b18fa93befd68",   // Fallback vers overweight
  refundAvailable: "d-4e5b37170b714d20b33f717c099521ff"      // Fallback vers receipt
};

// Configuration sécurisée (mêmes variables que befret_new)
export const secureConfig = {
  // Variables d'environnement Firebase Functions (befret_new)
  firebase: {
    sendgridApiKey: "sendgrid.api_key",        // functions.config().sendgrid.api_key
    twilioAccountSid: "twilio.account_sid",     // functions.config().twilio.account_sid
    twilioAuthToken: "twilio.auth_token",       // functions.config().twilio.auth_token
    twilioPhoneNumber: "twilio.phone_number",   // functions.config().twilio.phone_number
    stripeSecretKey: "stripe.secret_key",       // functions.config().stripe.secret_key
    stripeWebhookSecret: "stripe.webhook_secret" // functions.config().stripe.webhook_secret
  },
  
  // Variables d'environnement locales (fallback)
  env: {
    sendgridApiKey: "SENDGRID_API_KEY",
    twilioAccountSid: "TWILIO_ACCOUNT_SID", 
    twilioAuthToken: "TWILIO_AUTH_TOKEN",
    twilioPhoneNumber: "TWILIO_PHONE_NUMBER",
    stripeSecretKey: "STRIPE_SECRET_KEY",
    stripeWebhookSecret: "STRIPE_WEBHOOK_SECRET"
  }
};

// Configuration de l'app (pricing, etc. de befret_new)
export const appConfig = {
  cities: {
    "kinshasa": "Kinshasa", 
    "lubumbashi": "Lubumbashi"
  },
  parcelTypes: {
    "paquet": "Paquet", 
    "mail": "Courrier"
  },
  homeDeliveryFee: 0.6,
  appUrl: "https://dev.befret.be",

  // Pricing de développement (réduit)
  baseCost: {
    courrier: 0.5,
    paquet: {
      kinshasa: 0.65,
      lubumbashi: 0.70,
    },
  },
  normalCost: {
    courrier: 16.5,
    paquet: {
      kinshasa: 16.0,
      lubumbashi: 17.0,
    },
  },
  fragileCost: 2.99,
  emballageCost: 1.99,
};

// Configuration CORS (même que befret_new)
export const corsConfig = {
  origin: [
    "https://befret.be",
    "https://dev.befret.be",
    "http://localhost:4200",   // App principale befret_new
    "http://localhost:3000",   // Backoffice befret_backoffice
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Interface pour la configuration complète
export interface BefretConfig {
  firebase: typeof firebaseConfig;
  api: typeof apiUrls;
  templates: typeof sendGridTemplates;
  secure: typeof secureConfig;
  app: typeof appConfig;
  cors: typeof corsConfig;
}

// Export de la configuration complète
export const befretConfig: BefretConfig = {
  firebase: firebaseConfig,
  api: apiUrls,
  templates: sendGridTemplates,
  secure: secureConfig,
  app: appConfig,
  cors: corsConfig
};

// Helper pour récupérer la configuration selon l'environnement
export function getBefretConfig(environment: 'development' | 'production' = 'development'): BefretConfig {
  if (environment === 'production') {
    // TODO: Configuration production quand disponible
    return {
      ...befretConfig,
      api: {
        ...apiUrls,
        // Remplacer par URLs de production quand disponible
      },
      app: {
        ...appConfig,
        appUrl: "https://befret.be",
        // Pricing de production
      }
    };
  }
  
  return befretConfig;
}