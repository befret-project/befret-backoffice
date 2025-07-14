#!/usr/bin/env node

/**
 * 🔧 CRÉATION AUTOMATIQUE DES TEMPLATES SENDGRID VIA API
 * 
 * Ce script utilise l'API SendGrid pour créer automatiquement les templates
 * Au lieu de les créer manuellement dans le dashboard
 */

const sgClient = require('@sendgrid/client');
const fs = require('fs');
const path = require('path');

// Configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY non configurée');
    console.log('Export: export SENDGRID_API_KEY="SG.xxx"');
    process.exit(1);
}

sgClient.setApiKey(SENDGRID_API_KEY);

// Templates à créer
const templates = [
    {
        name: 'Weighing Confirmation Template',
        subject: '✅ Pesée confirmée - {{trackingCode}}',
        htmlFile: './docs/templates/weighing-confirmation.html',
        testData: {
            fullname: 'Jean Dupont',
            trackingCode: 'TEST123',
            actualWeight: 2.3,
            declaredWeight: 2.0,
            weighingStatus: 'ok'
        }
    },
    {
        name: 'Weight Supplement Required',
        subject: '💰 Supplément de poids requis - {{trackingCode}}',
        htmlFile: './docs/templates/supplement-required.html',
        testData: {
            fullname: 'Jean Dupont',
            trackingCode: 'TEST456',
            actualWeight: 3.0,
            declaredWeight: 2.0,
            supplementAmount: 2.50
        }
    },
    {
        name: 'Weight Refund Available',
        subject: '💚 Remboursement disponible - {{trackingCode}}',
        htmlFile: './docs/templates/refund-available.html',
        testData: {
            fullname: 'Jean Dupont',
            trackingCode: 'TEST789',
            actualWeight: 1.5,
            declaredWeight: 2.0,
            refundAmount: 1.25
        }
    }
];

/**
 * Crée un template via l'API SendGrid
 */
async function createTemplate(templateConfig) {
    try {
        console.log(`📧 Création du template: ${templateConfig.name}`);
        
        // 1. Créer le template
        const templateRequest = {
            method: 'POST',
            url: '/v3/templates',
            body: {
                name: templateConfig.name,
                generation: 'dynamic'
            }
        };
        
        const [templateResponse] = await sgClient.request(templateRequest);
        const templateId = templateResponse.body.id;
        
        console.log(`   ✅ Template créé: ${templateId}`);
        
        // 2. Lire le contenu HTML
        const htmlPath = path.resolve(__dirname, templateConfig.htmlFile);
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        // 3. Créer la version du template
        const versionRequest = {
            method: 'POST',
            url: `/v3/templates/${templateId}/versions`,
            body: {
                active: 1,
                name: `${templateConfig.name} v1.0`,
                subject: templateConfig.subject,
                html_content: htmlContent,
                plain_content: generatePlainText(templateConfig),
                test_data: templateConfig.testData
            }
        };
        
        const [versionResponse] = await sgClient.request(versionRequest);
        
        console.log(`   ✅ Version créée: ${versionResponse.body.id}`);
        console.log(`   📋 ID Template: d-${templateId}`);
        
        return {
            name: templateConfig.name,
            templateId: `d-${templateId}`,
            versionId: versionResponse.body.id
        };
        
    } catch (error) {
        console.error(`❌ Erreur création template ${templateConfig.name}:`, error.response?.body || error);
        throw error;
    }
}

/**
 * Génère le contenu texte plain à partir du template
 */
function generatePlainText(templateConfig) {
    return `
${templateConfig.name}

Bonjour {{fullname}},

Votre {{pType}} {{trackingCode}} a été traité.

Détails de pesée:
- Poids déclaré: {{declaredWeight}} kg
- Poids réel: {{actualWeight}} kg

Suivez votre colis: {{trackingURL}}

Merci de faire confiance à BeFret
`;
}

/**
 * Sauvegarde les IDs dans un fichier de configuration
 */
function saveTemplateIds(createdTemplates) {
    const config = {
        templates: {},
        created_at: new Date().toISOString(),
        created_via: 'API Script'
    };
    
    createdTemplates.forEach(template => {
        const key = template.name.toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
        
        config.templates[key] = {
            id: template.templateId,
            name: template.name,
            version_id: template.versionId
        };
    });
    
    const configPath = path.resolve(__dirname, '../config/sendgrid-templates-api.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log(`📄 Configuration sauvée: ${configPath}`);
    return config;
}

/**
 * Met à jour automatiquement le code avec les nouveaux IDs
 */
function updateCodeWithIds(createdTemplates) {
    const weighingTemplate = createdTemplates.find(t => 
        t.name.includes('Weighing Confirmation')
    );
    
    if (weighingTemplate) {
        const befretNewFile = path.resolve(__dirname, 
            '../../befret_new/functions/dev/src/index.ts'
        );
        
        if (fs.existsSync(befretNewFile)) {
            let content = fs.readFileSync(befretNewFile, 'utf8');
            content = content.replace(
                'd-WEIGHING-CONFIRMATION-TEMPLATE-ID',
                weighingTemplate.templateId
            );
            
            fs.writeFileSync(befretNewFile, content);
            console.log(`🔧 Mise à jour automatique: ${befretNewFile}`);
        }
    }
}

/**
 * Fonction principale
 */
async function main() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           🔧 CRÉATION TEMPLATES SENDGRID VIA API            ║
╚══════════════════════════════════════════════════════════════╝
`);
    
    console.log(`📡 API Key: ${SENDGRID_API_KEY.substring(0, 10)}...`);
    console.log(`📋 Templates à créer: ${templates.length}`);
    
    const createdTemplates = [];
    
    for (const template of templates) {
        try {
            const result = await createTemplate(template);
            createdTemplates.push(result);
            
            // Pause entre créations pour éviter rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`💥 Échec pour ${template.name}`);
        }
    }
    
    if (createdTemplates.length > 0) {
        console.log(`\n🎉 Templates créés avec succès: ${createdTemplates.length}`);
        
        // Sauvegarder configuration
        const config = saveTemplateIds(createdTemplates);
        
        // Mise à jour automatique du code
        updateCodeWithIds(createdTemplates);
        
        // Afficher résumé
        console.log('\n📋 IDs Créés:');
        createdTemplates.forEach(template => {
            console.log(`   ${template.name}: ${template.templateId}`);
        });
        
        console.log(`\n✅ Prêt à utiliser ! Les IDs ont été automatiquement mis à jour.`);
        
    } else {
        console.log('❌ Aucun template créé avec succès');
        process.exit(1);
    }
}

// Gestion des erreurs
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Erreur non gérée:', reason);
    process.exit(1);
});

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { createTemplate, saveTemplateIds };