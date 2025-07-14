# 🔧 ALTERNATIVES CONFIGURATION TEMPLATES - BEFRET_NEW

## 🎯 **PROBLÈME ACTUEL**

### **IDs Hardcodés dans befret_new**
```typescript
// befret_new/functions/dev/src/index.ts - Ligne 417
templateId = "d-WEIGHING-CONFIRMATION-TEMPLATE-ID"; // Hardcodé !

// Templates existants aussi hardcodés
"d-4e5b37170b714d20b33f717c099521ff"  // Receipt
"d-056cd451f9364440af7b18fa93befd68"  // Over weight
```

### **Limitations**
- ❌ Pas de gestion d'environnements (dev/staging/prod)
- ❌ Templates créés manuellement dans dashboard
- ❌ Impossible de versionner les templates
- ❌ Pas de fallback en cas d'erreur

---

## 🛠️ **ALTERNATIVES PROPOSÉES**

### **1. Configuration Centralisée (Recommandé)**

#### **Ajouter à befret_new/functions/dev/src/config/templates-config.js**
```typescript
interface TemplateConfig {
  [environment: string]: {
    sendgrid: {
      [templateName: string]: string;
    };
  };
}

const TEMPLATES: TemplateConfig = {
  development: {
    sendgrid: {
      weighing_confirmation: process.env.TEMPLATE_WEIGHING_CONF_DEV || "d-dev-default",
      supplement_required: process.env.TEMPLATE_SUPPLEMENT_DEV || "d-dev-default",
      refund_available: process.env.TEMPLATE_REFUND_DEV || "d-dev-default",
      receipt_notification: "d-4e5b37170b714d20b33f717c099521ff",
      over_weight: "d-056cd451f9364440af7b18fa93befd68"
    }
  },
  production: {
    sendgrid: {
      weighing_confirmation: process.env.TEMPLATE_WEIGHING_CONF_PROD || "d-prod-default",
      // etc...
    }
  }
};

export function getTemplateId(templateName: string, env?: string): string {
  const environment = env || process.env.NODE_ENV || 'development';
  const config = TEMPLATES[environment];
  
  if (!config) {
    throw new Error(`Configuration non trouvée pour: ${environment}`);
  }
  
  const templateId = config.sendgrid[templateName];
  if (!templateId) {
    throw new Error(`Template '${templateName}' non trouvé`);
  }
  
  return templateId;
}
```

#### **Usage dans sendReceiptNotification**
```typescript
// Au lieu de hardcoder
templateId = "d-WEIGHING-CONFIRMATION-TEMPLATE-ID";

// Utiliser la configuration
import { getTemplateId } from './config/templates-config';
templateId = getTemplateId('weighing_confirmation');
```

### **2. Variables d'Environnement Firebase**

#### **Configuration Firebase Functions**
```bash
# Développement
firebase functions:config:set \
  templates.weighing_confirmation="d-dev-abc123" \
  templates.supplement_required="d-dev-def456" \
  templates.refund_available="d-dev-ghi789"

# Production  
firebase functions:config:set \
  templates.weighing_confirmation="d-prod-abc123" \
  templates.supplement_required="d-prod-def456" \
  templates.refund_available="d-prod-ghi789"
```

#### **Usage dans le Code**
```typescript
import * as functions from "firebase-functions";

const getTemplateId = (templateName: string): string => {
  const templateId = functions.config().templates?.[templateName];
  
  if (!templateId) {
    throw new Error(`Template '${templateName}' non configuré`);
  }
  
  return templateId;
};

// Usage
templateId = getTemplateId('weighing_confirmation');
```

### **3. Service Template Unifié dans befret_new**

#### **Créer befret_new/functions/dev/src/services/template-service.ts**
```typescript
import * as functions from "firebase-functions";
import sgMail from "@sendgrid/mail";

interface TemplateData {
  [key: string]: any;
}

export class NotificationService {
  private static getTemplateId(templateName: string): string {
    // Priorité: Config Firebase > Env variables > Default
    const config = functions.config().templates;
    
    if (config && config[templateName]) {
      return config[templateName];
    }
    
    const envVar = process.env[`TEMPLATE_${templateName.toUpperCase()}`];
    if (envVar) {
      return envVar;
    }
    
    // Fallback vers templates existants
    const defaults: {[key: string]: string} = {
      'receipt_notification': 'd-4e5b37170b714d20b33f717c099521ff',
      'over_weight': 'd-056cd451f9364440af7b18fa93befd68',
      'weighing_confirmation': 'd-4e5b37170b714d20b33f717c099521ff' // Fallback
    };
    
    const defaultId = defaults[templateName];
    if (defaultId) {
      console.warn(`⚠️ Using fallback template for ${templateName}: ${defaultId}`);
      return defaultId;
    }
    
    throw new Error(`Template '${templateName}' non configuré`);
  }
  
  static async sendEmail(
    templateName: string, 
    to: string, 
    dynamicData: TemplateData
  ): Promise<void> {
    try {
      const templateId = this.getTemplateId(templateName);
      
      const msg = {
        to,
        from: "info@befret.be",
        templateId: templateId,
        dynamicTemplateData: dynamicData,
      };
      
      console.log(`📧 Sending email with template: ${templateId} to ${to}`);
      await sgMail.send(msg);
      
    } catch (error) {
      console.error(`❌ Error sending template ${templateName}:`, error);
      throw error;
    }
  }
}
```

#### **Usage dans sendReceiptNotification**
```typescript
import { NotificationService } from './services/template-service';

// Remplacer
await sendEmailWithTemplate(userEmail, templateId, dynamicData);

// Par
await NotificationService.sendEmail(
  hasWeighingData ? 'weighing_confirmation' : 'receipt_notification',
  userEmail,
  dynamicData
);
```

### **4. Templates Locaux (Alternative Complète)**

#### **Structure des Fichiers**
```
befret_new/functions/dev/src/
├── templates/
│   ├── weighing-confirmation.html
│   ├── supplement-required.html
│   └── refund-available.html
├── services/
│   └── local-template-service.ts
```

#### **Service Templates Locaux**
```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

export class LocalTemplateService {
  private static loadTemplate(templateName: string): HandlebarsTemplateDelegate {
    const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template local non trouvé: ${templatePath}`);
    }
    
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(templateContent);
  }
  
  static async sendEmail(
    templateName: string,
    to: string, 
    data: any
  ): Promise<void> {
    try {
      const template = this.loadTemplate(templateName);
      const htmlContent = template(data);
      
      const msg = {
        to,
        from: "info@befret.be",
        subject: this.generateSubject(templateName, data),
        html: htmlContent
      };
      
      await sgMail.send(msg);
      
    } catch (error) {
      console.error(`❌ Error sending local template ${templateName}:`, error);
      throw error;
    }
  }
  
  private static generateSubject(templateName: string, data: any): string {
    const subjects: {[key: string]: string} = {
      'weighing-confirmation': `✅ Pesée confirmée - ${data.trackingCode}`,
      'supplement-required': `💰 Supplément requis - ${data.trackingCode}`,
      'refund-available': `💚 Remboursement disponible - ${data.trackingCode}`
    };
    
    return subjects[templateName] || `Notification BeFret - ${data.trackingCode}`;
  }
}
```

---

## 🚀 **RECOMMANDATION FINALE**

### **Approche Hybride Recommandée**

#### **1. Configuration + Fallback**
```typescript
// befret_new/functions/dev/src/config/notification-config.ts
export class NotificationConfig {
  static getTemplateId(templateName: string): string {
    // 1. Firebase Config (priorité)
    const config = functions.config().templates;
    if (config?.[templateName]) {
      return config[templateName];
    }
    
    // 2. Variables d'environnement
    const envTemplate = process.env[`TEMPLATE_${templateName.toUpperCase()}`];
    if (envTemplate) {
      return envTemplate;
    }
    
    // 3. Configuration par défaut
    const defaults = {
      'receipt_notification': 'd-4e5b37170b714d20b33f717c099521ff',
      'over_weight': 'd-056cd451f9364440af7b18fa93befd68',
      'weighing_confirmation': 'd-4e5b37170b714d20b33f717c099521ff' // Fallback
    };
    
    const defaultId = defaults[templateName];
    if (defaultId) {
      console.warn(`⚠️ Using fallback template for ${templateName}`);
      return defaultId;
    }
    
    throw new Error(`Template '${templateName}' non configuré`);
  }
}
```

#### **2. Usage Simplifié**
```typescript
// Dans sendReceiptNotification
import { NotificationConfig } from './config/notification-config';

// Déterminer le template selon les données
const templateName = hasWeighingData ? 'weighing_confirmation' : 'receipt_notification';
const templateId = NotificationConfig.getTemplateId(templateName);

await sendEmailWithTemplate(userEmail, templateId, dynamicData);
```

### **✅ Avantages de cette Approche**
- 🔄 **Rétrocompatible** : Templates existants continuent de fonctionner
- 🎯 **Flexible** : Support config Firebase + env variables + fallback
- 🛡️ **Robuste** : Fallback automatique en cas de problème
- 🚀 **Déployable** : Pas de breaking changes
- 📊 **Monitorable** : Logs clairs pour debug

### **📋 Étapes d'Implémentation**
1. **Ajouter configuration** dans befret_new
2. **Configurer templates** via Firebase config ou env variables
3. **Tester** avec fallback automatique
4. **Déployer** sans casser l'existant
5. **Migrer progressivement** vers nouveaux templates

**➡️ Cette approche vous permet de garder la flexibilité tout en éliminant les IDs hardcodés !**