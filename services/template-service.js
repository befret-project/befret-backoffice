/**
 * 🎯 SERVICE TEMPLATE UNIFIÉ
 * 
 * Alternative au hardcoding des IDs dans befret_new
 * Supporte: SendGrid API, configuration, templates locaux
 */

const sgMail = require('@sendgrid/mail');
const sgClient = require('@sendgrid/client');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const { getCurrentConfig, getTemplateId } = require('../config/templates-config');

class TemplateService {
    constructor() {
        this.config = getCurrentConfig();
        this.initialized = false;
    }
    
    /**
     * Initialise le service avec la clé API
     */
    async initialize(apiKey) {
        if (!apiKey) {
            throw new Error('Clé API SendGrid requise');
        }
        
        sgMail.setApiKey(apiKey);
        sgClient.setApiKey(apiKey);
        this.initialized = true;
    }
    
    /**
     * APPROCHE 1: Templates SendGrid classiques (actuel)
     */
    async sendWithSendGridTemplate(templateName, to, dynamicData) {
        if (!this.initialized) {
            throw new Error('Service non initialisé');
        }
        
        const templateId = getTemplateId(templateName);
        
        const msg = {
            to,
            from: 'info@befret.be',
            templateId: templateId,
            dynamicTemplateData: dynamicData
        };
        
        console.log(`📧 Envoi email avec template SendGrid: ${templateId}`);
        return await sgMail.send(msg);
    }
    
    /**
     * APPROCHE 2: Templates locaux avec Handlebars
     */
    async sendWithLocalTemplate(templateName, to, data) {
        if (!this.initialized) {
            throw new Error('Service non initialisé');
        }
        
        // Charger template local
        const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
        
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template local non trouvé: ${templatePath}`);
        }
        
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateContent);
        const htmlContent = template(data);
        
        // Générer sujet à partir des données
        const subject = this.generateSubject(templateName, data);
        
        const msg = {
            to,
            from: 'info@befret.be',
            subject: subject,
            html: htmlContent,
            text: this.htmlToText(htmlContent)
        };
        
        console.log(`📧 Envoi email avec template local: ${templateName}`);
        return await sgMail.send(msg);
    }
    
    /**
     * APPROCHE 3: Création dynamique de template via API
     */
    async createAndSendDynamicTemplate(templateName, to, data, htmlContent) {
        if (!this.initialized) {
            throw new Error('Service non initialisé');
        }
        
        // Créer template temporaire
        const templateRequest = {
            method: 'POST',
            url: '/v3/templates',
            body: {
                name: `Dynamic ${templateName} ${Date.now()}`,
                generation: 'dynamic'
            }
        };
        
        const [templateResponse] = await sgClient.request(templateRequest);
        const templateId = templateResponse.body.id;
        
        // Créer version
        const versionRequest = {
            method: 'POST',
            url: `/v3/templates/${templateId}/versions`,
            body: {
                active: 1,
                name: 'v1.0',
                subject: this.generateSubject(templateName, data),
                html_content: htmlContent,
                plain_content: this.htmlToText(htmlContent)
            }
        };
        
        await sgClient.request(versionRequest);
        
        // Envoyer email
        const result = await this.sendWithSendGridTemplate(`d-${templateId}`, to, data);
        
        // Supprimer template temporaire
        setTimeout(async () => {
            try {
                await sgClient.request({
                    method: 'DELETE',
                    url: `/v3/templates/${templateId}`
                });
                console.log(`🗑️ Template temporaire supprimé: ${templateId}`);
            } catch (error) {
                console.warn(`⚠️ Impossible de supprimer template: ${templateId}`);
            }
        }, 5000);
        
        return result;
    }
    
    /**
     * APPROCHE 4: Fallback avec Nodemailer (alternative à SendGrid)
     */
    async sendWithNodemailer(templateName, to, data) {
        const nodemailer = require('nodemailer');
        
        // Configuration Nodemailer (exemple avec Gmail)
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });
        
        // Charger template local
        const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateContent);
        const htmlContent = template(data);
        
        const mailOptions = {
            from: 'info@befret.be',
            to: to,
            subject: this.generateSubject(templateName, data),
            html: htmlContent,
            text: this.htmlToText(htmlContent)
        };
        
        console.log(`📧 Envoi email avec Nodemailer: ${templateName}`);
        return await transporter.sendMail(mailOptions);
    }
    
    /**
     * Méthode unifiée qui choisit la meilleure approche
     */
    async sendNotification(templateName, to, data, options = {}) {
        const { 
            method = 'sendgrid_template',  // sendgrid_template, local_template, dynamic_template, nodemailer
            fallback = true 
        } = options;
        
        try {
            switch (method) {
                case 'sendgrid_template':
                    return await this.sendWithSendGridTemplate(templateName, to, data);
                    
                case 'local_template':
                    return await this.sendWithLocalTemplate(templateName, to, data);
                    
                case 'dynamic_template':
                    const htmlContent = options.htmlContent || this.loadLocalTemplate(templateName, data);
                    return await this.createAndSendDynamicTemplate(templateName, to, data, htmlContent);
                    
                case 'nodemailer':
                    return await this.sendWithNodemailer(templateName, to, data);
                    
                default:
                    throw new Error(`Méthode inconnue: ${method}`);
            }
            
        } catch (error) {
            console.error(`❌ Erreur envoi ${method}:`, error);
            
            if (fallback && method !== 'local_template') {
                console.log(`🔄 Fallback vers template local`);
                return await this.sendWithLocalTemplate(templateName, to, data);
            }
            
            throw error;
        }
    }
    
    /**
     * Utilitaires
     */
    generateSubject(templateName, data) {
        const subjects = {
            weighing_confirmation: `✅ Pesée confirmée - ${data.trackingCode}`,
            supplement_required: `💰 Supplément requis - ${data.trackingCode}`,
            refund_available: `💚 Remboursement disponible - ${data.trackingCode}`
        };
        
        return subjects[templateName] || `Notification BeFret - ${data.trackingCode}`;
    }
    
    htmlToText(html) {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    loadLocalTemplate(templateName, data) {
        const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateContent);
        return template(data);
    }
}

// Instance singleton
const templateService = new TemplateService();

module.exports = {
    TemplateService,
    templateService
};