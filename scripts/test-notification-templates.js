#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE TEST DES TEMPLATES SENDGRID
 * 
 * Ce script teste les 3 templates de notification de pesée
 * Usage: node test-notification-templates.js
 */

const https = require('https');

// Configuration
const FUNCTION_URL = 'https://us-central1-befret-development.cloudfunctions.net/sendReceiptNotification';
const TEST_PHONE = '+243987654321'; // Remplacer par un vrai numéro pour tests
const TEST_EMAIL = 'test@befret.be'; // Email de test

// Couleurs pour console
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    test: (msg) => console.log(`${colors.magenta}🧪 ${msg}${colors.reset}`)
};

/**
 * Effectue un appel HTTP POST vers la fonction SendGrid
 */
async function callNotificationFunction(payload, testName) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        
        const options = {
            hostname: 'us-central1-befret-development.cloudfunctions.net',
            port: 443,
            path: '/sendReceiptNotification',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({
                        statusCode: res.statusCode,
                        response: response,
                        testName: testName
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        response: { raw: body },
                        testName: testName
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject({ error, testName });
        });

        req.write(data);
        req.end();
    });
}

/**
 * Tests des templates
 */
const tests = [
    {
        name: "🔄 Test Rétrocompatibilité (Template Original)",
        payload: {
            parcelID: "test-retro-123",
            phoneNumber: TEST_PHONE,
            trackingCode: "RETRO123",
            pType: "paquet",
            sender: "Test Rétrocompatibilité",
            city: "kinshasa"
        },
        expectedTemplate: "d-4e5b37170b714d20b33f717c099521ff",
        expectedWeighingData: false
    },
    {
        name: "⚖️ Test Pesée Conforme (Nouveau Template)",
        payload: {
            parcelID: "test-weighing-ok-456", 
            phoneNumber: TEST_PHONE,
            trackingCode: "WEIGH456",
            pType: "paquet",
            sender: "Test Pesée OK",
            city: "kinshasa",
            actualWeight: 2.2,
            declaredWeight: 2.0,
            weighingPhotos: [
                "https://picsum.photos/400/300?random=1",
                "https://picsum.photos/400/300?random=2"
            ],
            weighingStatus: "ok"
        },
        expectedWeighingData: true
    },
    {
        name: "💰 Test Supplément Requis",
        payload: {
            parcelID: "test-supplement-789",
            phoneNumber: TEST_PHONE,
            trackingCode: "SUPP789",
            pType: "colis",
            sender: "Test Supplément",
            city: "lubumbashi", 
            actualWeight: 3.5,
            declaredWeight: 2.0,
            weighingPhotos: ["https://picsum.photos/400/300?random=3"],
            weighingStatus: "supplement_required"
        },
        expectedWeighingData: true
    },
    {
        name: "💚 Test Remboursement Disponible",
        payload: {
            parcelID: "test-refund-012",
            phoneNumber: TEST_PHONE,
            trackingCode: "REFUND012", 
            pType: "paquet",
            sender: "Test Remboursement",
            city: "goma",
            actualWeight: 1.2,
            declaredWeight: 2.0,
            weighingPhotos: ["https://picsum.photos/400/300?random=4"],
            weighingStatus: "refund_available"
        },
        expectedWeighingData: true
    }
];

/**
 * Validation des résultats
 */
function validateResult(result, expectedTemplate, expectedWeighingData) {
    const validations = [];
    
    // Statut HTTP
    if (result.statusCode === 200) {
        validations.push({ type: 'success', msg: 'Statut HTTP 200 OK' });
    } else {
        validations.push({ type: 'error', msg: `Statut HTTP ${result.statusCode}` });
    }
    
    // Présence de hasWeighingData
    if (result.response.hasWeighingData === expectedWeighingData) {
        validations.push({ 
            type: 'success', 
            msg: `hasWeighingData: ${expectedWeighingData} ✓` 
        });
    } else {
        validations.push({ 
            type: 'error', 
            msg: `hasWeighingData: attendu ${expectedWeighingData}, reçu ${result.response.hasWeighingData}` 
        });
    }
    
    // Template utilisé
    if (expectedTemplate && result.response.templateUsed === expectedTemplate) {
        validations.push({ 
            type: 'success', 
            msg: `Template correct: ${expectedTemplate}` 
        });
    } else if (expectedTemplate) {
        validations.push({ 
            type: 'warning', 
            msg: `Template: attendu ${expectedTemplate}, reçu ${result.response.templateUsed}` 
        });
    }
    
    return validations;
}

/**
 * Fonction principale
 */
async function runTests() {
    console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                🧪 TEST TEMPLATES SENDGRID                   ║
║              Station de Pesée - BeFret                      ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

    log.info(`Fonction à tester: ${FUNCTION_URL}`);
    log.info(`Téléphone de test: ${TEST_PHONE}`);
    log.warning('Assurez-vous que les templates SendGrid sont créés !');
    
    console.log(`\n${colors.cyan}📋 Tests à exécuter: ${tests.length}${colors.reset}\n`);

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        
        log.test(`${i + 1}/${tests.length} ${test.name}`);
        
        try {
            const result = await callNotificationFunction(test.payload, test.name);
            
            console.log(`   📤 Payload envoyé:`, JSON.stringify(test.payload, null, 2));
            console.log(`   📥 Réponse reçue:`, JSON.stringify(result.response, null, 2));
            
            const validations = validateResult(
                result, 
                test.expectedTemplate, 
                test.expectedWeighingData
            );
            
            let testPassed = true;
            validations.forEach(validation => {
                if (validation.type === 'success') {
                    log.success(`   ${validation.msg}`);
                } else if (validation.type === 'warning') {
                    log.warning(`   ${validation.msg}`);
                } else {
                    log.error(`   ${validation.msg}`);
                    testPassed = false;
                }
            });
            
            if (testPassed) {
                successCount++;
                log.success(`   🎉 Test réussi\n`);
            } else {
                failureCount++;
                log.error(`   💥 Test échoué\n`);
            }
            
        } catch (error) {
            log.error(`   Erreur lors du test: ${error.error || error}`);
            failureCount++;
        }
        
        // Pause entre les tests pour éviter le rate limiting
        if (i < tests.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Résumé final
    console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                        📊 RÉSULTATS                         ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

    log.success(`Tests réussis: ${successCount}/${tests.length}`);
    
    if (failureCount > 0) {
        log.error(`Tests échoués: ${failureCount}/${tests.length}`);
    }

    if (successCount === tests.length) {
        log.success('🎉 Tous les tests sont passés ! Templates prêts pour production.');
    } else {
        log.warning('⚠️  Certains tests ont échoué. Vérifiez la configuration.');
    }

    console.log(`\n${colors.cyan}📋 Prochaines étapes:${colors.reset}`);
    console.log('1. Vérifiez la réception des emails/SMS sur les numéros de test');
    console.log('2. Validez le contenu et la mise en forme des templates');
    console.log('3. Testez avec de vrais colis dans l\'interface de pesée');
    console.log('4. Déployez en production une fois tous les tests validés');
}

// Gestion des arguments en ligne de commande
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, callNotificationFunction };