# 📧 ANALYSE DES NOTIFICATIONS BEFRET_NEW

## 🎯 **OBJECTIF**
Analyser les fonctions de notifications existantes dans befret_new pour étendre ou créer de nouvelles notifications pour la station de pesée.

---

## 📋 **FONCTIONS DE NOTIFICATION EXISTANTES**

### **🏗️ Infrastructure en Place**

#### **Services configurés :**
- **SendGrid** : Email avec templates dynamiques
- **Twilio** : SMS  
- **Stripe** : Paiements intégrés

#### **Configuration sécurisée :**
```typescript
// /functions/dev/src/config/secure-config.ts
SENDGRID_API_KEY
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
```

### **📱 Fonctions Helper Communes**

```typescript
// Helper email avec template SendGrid
const sendEmailWithTemplate = async (
  to: string, 
  templateId: string, 
  dynamicData: any
) => {
  const msg = {
    to,
    from: "info@befret.be",
    templateId: templateId,
    dynamicTemplateData: dynamicData,
  };
  await sgMail.send(msg);
};

// Helper SMS avec Twilio
const sendSMS = async (to: string, message: string) => {
  await twilioClient.messages.create({
    to,
    from: twilioPhoneNumber,
    body: message,
  });
};
```

---

## 🔄 **FONCTIONS EXISTANTES ANALYSÉES**

### **1. sendReceiptNotification** ✅ **RÉUTILISABLE**
**Usage actuel :** Confirmation réception colis à l'entrepôt  
**Template SendGrid :** `d-4e5b37170b714d20b33f717c099521ff`

**Paramètres actuels :**
```typescript
{
  parcelID: string,
  phoneNumber: string,
  trackingCode: string,
  pType: string,
  sender: string,
  city: string
}
```

**Variables template :**
```typescript
{
  fullname: sender,
  pType: pType,
  city: city,
  trackingCode: trackingCode,
  trackingURL: `${appUrl}/details?trackingID=${trackingCode}`
}
```

### **2. sendOverWeightNotification** ⭐ **PARFAIT POUR EXTENSION**
**Usage actuel :** Alert différence de poids + supplément  
**Template SendGrid :** `d-056cd451f9364440af7b18fa93befd68`

**Paramètres actuels :**
```typescript
{
  overWeight: number,
  phoneNumber: string,
  trackingCode: string,
  pType: string,
  parcelID: string,
  overCost: number,
  sender: string
}
```

**Variables template :**
```typescript
{
  fullname: sender,
  pType: pType,
  overCost: overCost,
  overWeight: overWeight,
  trackingCode: trackingCode
}
```

**Message SMS actuel :**
```
"Bonjour ${sender}, le poids de votre ${pType}: ${trackingCode} ne correspond pas à celui indiqué. Nous vous contacterons très rapidement pour le paiement de ${overCost}euros afin d'assurer l'envoi. Merci"
```

---

## 📊 **BESOINS STATION DE PESÉE**

### **Nouveaux types de notifications requis :**

#### **1. Confirmation réception + pesée conforme**
- Colis reçu et pesé → poids conforme
- Préparation pour expédition

#### **2. Alerte différence poids + photo balance**  
- Écart détecté lors de la pesée
- Photo de la balance comme preuve

#### **3. Lien paiement supplément**
- Supplément requis pour écart > 200g
- Lien de paiement sécurisé avec expiration

#### **4. Proposition remboursement/avoir**
- Poids inférieur au déclaré
- Proposition de remboursement ou avoir

---

## 🎯 **RECOMMANDATIONS D'IMPLÉMENTATION**

### **OPTION 1 : ÉTENDRE LES FONCTIONS EXISTANTES** ⭐ **RECOMMANDÉE**

#### **A. Étendre `sendReceiptNotification`**
```typescript
// Ajouter paramètres optionnels
{
  // Paramètres existants...
  actualWeight?: number,
  declaredWeight?: number,
  weighingPhotos?: string[],
  weighingStatus?: 'confirmed' | 'discrepancy'
}
```

#### **B. Étendre `sendOverWeightNotification`**
```typescript
// Renommer en sendWeightNotification et ajouter types
{
  // Paramètres existants...
  notificationType: 'discrepancy' | 'supplement' | 'refund',
  actualWeight: number,
  declaredWeight: number,
  balancePhotos: string[],
  paymentLink?: string,
  expiryDate?: string,
  refundAmount?: number
}
```

### **OPTION 2 : CRÉER NOUVELLES FONCTIONS SPÉCIALISÉES**

#### **Fonctions à créer :**
1. `sendWeighingConfirmationNotification`
2. `sendWeightDiscrepancyNotification`  
3. `sendSupplementPaymentNotification`
4. `sendRefundProposalNotification`

---

## 🏗️ **PLAN D'IMPLÉMENTATION RECOMMANDÉ**

### **PHASE 1 : Extension Compatible**

#### **1. Modifier `sendReceiptNotification` (Retrocompatible)**
```typescript
export const sendReceiptNotification = functions.https.onRequest(async (req, res) => {
  const {
    parcelID, phoneNumber, trackingCode, pType, sender, city,
    // NOUVEAUX PARAMÈTRES OPTIONNELS
    actualWeight, declaredWeight, weighingPhotos, weighingStatus
  } = req.body;

  // Logique existante préservée...
  
  // Nouvelles variables pour template
  const dynamicData = {
    fullname: sender,
    pType: pType,
    city: city,
    trackingCode: trackingCode,
    trackingURL: `${environment.appConfig.appUrl}/details?trackingID=${trackingCode}`,
    
    // NOUVELLES VARIABLES
    actualWeight: actualWeight || null,
    declaredWeight: declaredWeight || null,
    weighingPhotos: weighingPhotos || [],
    weighingStatus: weighingStatus || 'confirmed'
  };
  
  // Template reste le même → COMPATIBILITÉ TOTALE
  await sendEmailWithTemplate(userEmail, "d-4e5b37170b714d20b33f717c099521ff", dynamicData);
});
```

#### **2. Créer `sendWeightNotification` (Basé sur sendOverWeightNotification)**
```typescript
export const sendWeightNotification = functions.https.onRequest(async (req, res) => {
  const {
    parcelID, phoneNumber, trackingCode, pType, sender,
    notificationType, // 'discrepancy' | 'supplement' | 'refund'
    actualWeight, declaredWeight, balancePhotos,
    supplementAmount, paymentLink, expiryDate, refundAmount
  } = req.body;

  // Logique commune (GeoPoint, fetch parcel, get email)...
  
  // Templates selon type
  const templates = {
    discrepancy: "d-056cd451f9364440af7b18fa93befd68", // Réutilise existant
    supplement: "d-NEW-SUPPLEMENT-TEMPLATE-ID",         // Nouveau
    refund: "d-NEW-REFUND-TEMPLATE-ID"                 // Nouveau
  };
  
  const dynamicData = {
    fullname: sender,
    pType: pType,
    trackingCode: trackingCode,
    actualWeight,
    declaredWeight,
    difference: actualWeight - declaredWeight,
    balancePhotos,
    supplementAmount,
    paymentLink,
    expiryDate,
    refundAmount
  };
  
  await sendEmailWithTemplate(userEmail, templates[notificationType], dynamicData);
  
  // SMS personnalisé selon type
  const messages = {
    discrepancy: `Bonjour ${sender}, différence de poids détectée pour ${trackingCode}. Poids réel: ${actualWeight}kg vs déclaré: ${declaredWeight}kg.`,
    supplement: `Bonjour ${sender}, supplément de ${supplementAmount}€ requis pour ${trackingCode}. Payez via: ${paymentLink}`,
    refund: `Bonjour ${sender}, remboursement de ${refundAmount}€ proposé pour ${trackingCode} (poids inférieur).`
  };
  
  await sendSMS(phoneNumber, messages[notificationType]);
});
```

### **PHASE 2 : Nouveaux Templates SendGrid**

#### **Templates à créer :**

| Template | Usage | Variables Clés |
|----------|-------|----------------|
| **Pesée Conforme** | Confirmation réception + pesée OK | `actualWeight`, `weighingPhotos`, `trackingURL` |
| **Supplément** | Lien paiement écart poids | `supplementAmount`, `paymentLink`, `expiryDate`, `balancePhotos` |
| **Remboursement** | Proposition avoir/remboursement | `refundAmount`, `excessWeight`, `contactInfo` |

#### **Structure template supplément :**
```html
<h2>Supplément requis pour votre envoi {{trackingCode}}</h2>
<p>Bonjour {{fullname}},</p>
<p>Lors de la pesée de votre {{pType}}, nous avons détecté un écart de poids :</p>
<ul>
  <li>Poids déclaré : {{declaredWeight}} kg</li>
  <li>Poids réel : {{actualWeight}} kg</li>
  <li>Différence : +{{difference}} kg</li>
</ul>

<div class="photos">
  {{#each balancePhotos}}
    <img src="{{this}}" alt="Photo balance" style="max-width: 200px;" />
  {{/each}}
</div>

<p><strong>Supplément requis : {{supplementAmount}}€</strong></p>
<a href="{{paymentLink}}" class="btn">Payer maintenant</a>
<p><small>Lien valide jusqu'au {{expiryDate}}</small></p>
```

---

## ✅ **AVANTAGES DE CETTE APPROCHE**

### **🔄 Compatibilité Totale**
- ✅ Fonctions existantes **non cassées**
- ✅ Templates actuels **préservés**
- ✅ Intégration **progressive** possible

### **⚡ Réutilisation Maximum**
- ✅ Infrastructure **déjà testée**
- ✅ Services **configurés** et **opérationnels**
- ✅ Patterns **éprouvés** réutilisés

### **🎯 Spécialisation Ciblée**
- ✅ Nouveaux besoins **parfaitement couverts**
- ✅ Templates **optimisés** pour chaque cas
- ✅ Workflow **station de pesée** intégré

---

## 🔧 **INTÉGRATION DANS LE BACKOFFICE**

### **Service d'appel dans le backoffice :**
```typescript
// /src/services/notification-service.ts
export class NotificationService {
  
  static async sendWeighingConfirmation(parcel: Parcel, weighingData: WeighingData) {
    const response = await fetch(`${FUNCTIONS_URL}/sendReceiptNotification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parcelID: parcel.id,
        phoneNumber: parcel.receiver_phone,
        trackingCode: parcel.trackingID,
        pType: parcel.type,
        sender: parcel.sender_name,
        city: parcel.city,
        actualWeight: weighingData.actualWeight,
        declaredWeight: parcel.weightDeclared,
        weighingPhotos: weighingData.photos,
        weighingStatus: 'confirmed'
      })
    });
    return response.json();
  }

  static async sendWeightNotification(
    parcel: Parcel, 
    type: 'discrepancy' | 'supplement' | 'refund',
    data: WeightNotificationData
  ) {
    const response = await fetch(`${FUNCTIONS_URL}/sendWeightNotification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parcelID: parcel.id,
        phoneNumber: parcel.receiver_phone,
        trackingCode: parcel.trackingID,
        pType: parcel.type,
        sender: parcel.sender_name,
        notificationType: type,
        ...data
      })
    });
    return response.json();
  }
}
```

---

## 🎉 **CONCLUSION**

**L'infrastructure de notifications de befret_new est parfaitement réutilisable !**

### **✅ Plan recommandé :**
1. **Étendre `sendReceiptNotification`** avec paramètres pesée (retrocompatible)
2. **Créer `sendWeightNotification`** basé sur `sendOverWeightNotification` 
3. **Ajouter 2 nouveaux templates** SendGrid (supplément + remboursement)
4. **Intégrer dans la station de pesée** via service dédié

### **🎯 Bénéfices :**
- **Zero breaking change** sur l'existant
- **Réutilisation maximum** de l'infrastructure 
- **Templates optimisés** pour les nouveaux besoins
- **Intégration fluide** dans le workflow pesée

**➡️ Prêt à implémenter cette solution !**