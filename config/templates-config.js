/**
 * 🔧 CONFIGURATION TEMPLATES MULTI-ENVIRONNEMENTS
 * 
 * Alternative à la création manuelle de templates SendGrid
 * Permet de gérer dev, staging, prod séparément
 */

const templatesConfig = {
    // Environnement de développement
    development: {
        sendgrid: {
            weighing_confirmation: "d-dev-weighing-conf-123456789",
            supplement_required: "d-dev-supplement-123456789",
            refund_available: "d-dev-refund-123456789",
            // Templates existants
            receipt_notification: "d-4e5b37170b714d20b33f717c099521ff",
            over_weight: "d-056cd451f9364440af7b18fa93befd68",
            delivery: "d-2cc5e4a9e81643fb9b398df90c39ac32"
        },
        functions_url: "https://us-central1-befret-development.cloudfunctions.net"
    },
    
    // Environnement de staging (à configurer)
    staging: {
        sendgrid: {
            weighing_confirmation: "d-stg-weighing-conf-123456789",
            supplement_required: "d-stg-supplement-123456789", 
            refund_available: "d-stg-refund-123456789",
            receipt_notification: "d-stg-receipt-123456789",
            over_weight: "d-stg-overweight-123456789",
            delivery: "d-stg-delivery-123456789"
        },
        functions_url: "https://us-central1-befret-staging.cloudfunctions.net"
    },
    
    // Environnement de production (à configurer)
    production: {
        sendgrid: {
            weighing_confirmation: "d-prod-weighing-conf-123456789",
            supplement_required: "d-prod-supplement-123456789",
            refund_available: "d-prod-refund-123456789", 
            receipt_notification: "d-prod-receipt-123456789",
            over_weight: "d-prod-overweight-123456789",
            delivery: "d-prod-delivery-123456789"
        },
        functions_url: "https://us-central1-befret-production.cloudfunctions.net"
    }
};

/**
 * Récupère la configuration pour un environnement donné
 */
function getTemplateConfig(environment = 'development') {
    const config = templatesConfig[environment];
    
    if (!config) {
        throw new Error(`Configuration non trouvée pour l'environnement: ${environment}`);
    }
    
    return config;
}

/**
 * Récupère l'ID d'un template spécifique
 */
function getTemplateId(templateName, environment = 'development') {
    const config = getTemplateConfig(environment);
    const templateId = config.sendgrid[templateName];
    
    if (!templateId) {
        throw new Error(`Template '${templateName}' non trouvé pour l'environnement '${environment}'`);
    }
    
    return templateId;
}

/**
 * Valide qu'un ID de template est au bon format
 */
function validateTemplateId(templateId) {
    const pattern = /^d-[a-f0-9]{25,30}$/;
    return pattern.test(templateId);
}

/**
 * Met à jour un ID de template pour un environnement
 */
function updateTemplateId(templateName, newId, environment = 'development') {
    if (!validateTemplateId(newId)) {
        throw new Error(`Format d'ID invalide: ${newId}`);
    }
    
    if (!templatesConfig[environment]) {
        templatesConfig[environment] = { sendgrid: {} };
    }
    
    templatesConfig[environment].sendgrid[templateName] = newId;
    
    return templatesConfig[environment];
}

/**
 * Exporte la configuration selon NODE_ENV
 */
function getCurrentConfig() {
    const env = process.env.NODE_ENV || 'development';
    const firebaseEnv = process.env.FIREBASE_ENV || env;
    
    // Mapping entre environnements
    const envMapping = {
        'local': 'development',
        'dev': 'development', 
        'development': 'development',
        'staging': 'staging',
        'stg': 'staging',
        'production': 'production',
        'prod': 'production'
    };
    
    const mappedEnv = envMapping[firebaseEnv] || 'development';
    return getTemplateConfig(mappedEnv);
}

module.exports = {
    templatesConfig,
    getTemplateConfig,
    getTemplateId,
    validateTemplateId,
    updateTemplateId,
    getCurrentConfig
};