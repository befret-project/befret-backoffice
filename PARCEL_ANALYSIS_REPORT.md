# 📦 ANALYSE COLLECTION "PARCEL" - BEFRET BACKOFFICE

## 🔍 **STRUCTURE ACTUELLE DES DOCUMENTS**

### **📊 Champs identifiés (29 au total)**

#### **🆔 Identification**
- `uid` - ID utilisateur Firebase
- `trackingID` - Numéro de suivi (ex: "BGFXNG") 
- Document ID Firestore - Identifiant unique du document

#### **👤 Informations expéditeur**
- `sender_name` - Nom de l'expéditeur
- `sender_phone` - Téléphone expéditeur
- `mail2User` - Email utilisateur (optionnel)

#### **📮 Informations destinataire**
- `receiver_name` - Nom du destinataire
- `receiver_phone` - Téléphone destinataire
- `phonePrefix1` - Préfixe téléphonique 1
- `phonePrefix2` - Préfixe téléphonique 2 (description pays)
- `city` - Ville de destination
- `address` - Adresse (souvent vide)

#### **📦 Contenu et caractéristiques**
- `type` - Type de colis ("Paquet", "Courrier")
- `weight` - Poids déclaré (nombre)
- `totalWeight` - Poids total (dans certains docs)
- `items[]` - Array des objets contenus
  - `itemDescription` - Description de l'objet
  - `itemValue` - Valeur de l'objet
  - `numberOfItems` - Quantité
- `fragile` - Marquage fragile (boolean)
- `emballage` - Emballage spécial (boolean)
- `condition` - Conditions acceptées (boolean)

#### **💰 Aspects financiers**
- `cost` - Coût de l'expédition
- `codePromo` - Code promo utilisé
- `payment_date` - Date de paiement

#### **📍 Logistique et suivi**
- `status` - Statut actuel ("draft", "in_transit", etc.)
- `logisticStatus` - Statut logistique détaillé
- `pickupMethod` - Méthode de collecte ("warehouse")
- `location` - Géolocalisation (latitude/longitude)
- `create_date` - Date de création
- `notified` - Notifications envoyées (boolean)

---

## 🎯 **ANALYSE DES BESOINS POUR SPRINT 2**

### **❌ MANQUANT - Scanner QR à l'arrivée**
```typescript
// Champs requis à ajouter:
qrCode: string                    // Code QR unique du colis
arrivalScan: {                   // Données du scan d'arrivée
  timestamp: Timestamp,
  operator: string,
  location: string,
  scannerId: string
}
```

### **⚠️ PARTIEL - Pesée avec photo sur balance**
```typescript
// Existant:
weight: number                   // Poids déclaré ✅
totalWeight: number             // Poids total ✅

// À ajouter:
actualWeight: number            // Poids réel mesuré
weightPhotos: [                // Photos de la pesée
  {
    url: string,
    timestamp: Timestamp,
    type: 'balance' | 'parcel' | 'comparison'
  }
]
weightVerification: {           // Données de vérification
  difference: number,           // Différence en kg
  percentage: number,           // Pourcentage d'écart
  status: 'OK' | 'WARNING' | 'ERROR',
  notes: string
}
```

### **⚠️ PARTIEL - Comparaison poids déclaré vs réel**
```typescript
// Utiliser les champs existants:
weight → declaredWeight         // Renommer pour clarité

// Ajouter les calculs automatiques:
weightAnalysis: {
  declared: number,
  actual: number,
  difference: number,
  percentageVariance: number,
  withinTolerance: boolean,
  toleranceThreshold: number     // Ex: 5%
}
```

### **⚠️ PARTIEL - Notifications automatiques clients**
```typescript
// Existant:
mail2User: string              // Email client ✅
receiver_phone: string         // Téléphone ✅
notified: boolean             // Statut notification ✅

// À étendre:
notificationHistory: [         // Historique complet
  {
    type: 'arrival' | 'weight_issue' | 'ready_pickup' | 'delivered',
    timestamp: Timestamp,
    recipient: string,
    channel: 'email' | 'sms' | 'push',
    status: 'sent' | 'delivered' | 'failed',
    template: string,
    data: object
  }
]
```

---

## 🔗 **POINTS D'INTÉGRATION AVEC BEFRET_NEW**

### **✅ Identifiants communs**
- `uid` - Permet de lier client → colis
- `trackingID` - Suivi côté client
- Document ID - Référence unique

### **✅ Workflow de statut**
```typescript
// befret_new (client) → befret-backoffice (admin)
Status Flow:
"draft" → "paid" → "collected" → "in_transit" → "arrived" → "ready_pickup" → "delivered"
```

### **✅ Notifications bidirectionnelles**
```typescript
// befret_new déclenche:
- Nouvelle commande → Notification backoffice
- Paiement confirmé → Mise à jour statut

// befret-backoffice déclenche:
- Colis arrivé → Notification client
- Écart de poids → Alerte client
- Prêt pour retrait → SMS client
```

---

## 📋 **DONNÉES DE TEST EXISTANTES**

### **📦 Échantillon 1 - Document basique**
```json
{
  "trackingID": "BGFXNG",
  "sender_name": "Yannick",
  "receiver_name": "YANNICK NSEKA MBALA",
  "city": "lubumbashi",
  "type": "Paquet",
  "weight": 1,
  "cost": 17,
  "status": "draft",
  "mail2User": "ynmpicture@gmail.com",
  "create_date": "2025-04-27"
}
```

### **📦 Échantillon 2 - Document complet**
```json
{
  "trackingID": "[Généré automatiquement]",
  "sender_name": "Elais Ntungu Bosenge",
  "receiver_name": "Nseka",
  "city": "lubumbashi", 
  "type": "Paquet",
  "weight": 1,
  "items": [
    {
      "itemDescription": "Bonbon",
      "itemValue": 50,
      "numberOfItems": 1
    }
  ],
  "status": "draft"
}
```

---

## 💡 **PROPOSITION D'EXTENSION DE SCHÉMA**

### **🏗️ Nouveaux champs pour Sprint 2**

```typescript
interface ParcelLogisticExtension {
  // === SCANNER QR ===
  qrCode?: string                      // Code QR unique généré
  qrGenerated?: Timestamp             // Quand le QR a été créé
  
  arrivalScan?: {                     // Données du scan d'arrivée
    timestamp: Timestamp,
    operator: string,
    scannerId: string,
    location: string,
    photo?: string                    // Photo du scan
  }
  
  // === PESÉE ET PHOTOS ===
  actualWeight?: number               // Poids réel mesuré
  weightUnit?: 'kg' | 'g'           // Unité de poids
  
  weightPhotos?: Array<{             // Photos de la pesée
    url: string,
    timestamp: Timestamp,
    type: 'balance' | 'parcel' | 'comparison',
    operator: string,
    metadata?: {
      cameraDevice: string,
      location: string,
      lighting: string
    }
  }>
  
  weightVerification?: {             // Vérification du poids
    difference: number,              // Différence en kg
    percentage: number,              // % d'écart
    status: 'OK' | 'WARNING' | 'ERROR',
    tolerance: number,               // Seuil de tolérance
    autoApproved: boolean,          // Approuvé automatiquement
    notes?: string,
    operator?: string,
    timestamp?: Timestamp
  }
  
  // === WORKFLOW LOGISTIQUE ===
  logisticStatus?: 'pending' | 'scanned' | 'weighed' | 'verified' | 'stored' | 'ready'
  
  processingHistory?: Array<{        // Historique des étapes
    step: string,
    timestamp: Timestamp,
    operator: string,
    data?: any,
    location?: string,
    duration?: number                // Temps passé à cette étape
  }>
  
  storageLocation?: {                // Emplacement de stockage
    zone: string,
    shelf: string,
    position: string,
    assignedAt: Timestamp,
    assignedBy: string
  }
  
  // === NOTIFICATIONS ÉTENDUES ===
  notificationHistory?: Array<{      // Historique complet
    type: 'arrival' | 'weight_issue' | 'ready_pickup' | 'delivered' | 'delay',
    timestamp: Timestamp,
    recipient: string,
    channel: 'email' | 'sms' | 'push' | 'whatsapp',
    status: 'sent' | 'delivered' | 'read' | 'failed',
    template: string,
    subject?: string,
    content?: string,
    data?: any,
    provider?: string,              // Service utilisé (SendGrid, Twilio, etc.)
    cost?: number                   // Coût de l'envoi
  }>
  
  // === MÉTADONNÉES TECHNIQUES ===
  lastUpdated?: Timestamp           // Dernière modification backoffice
  lastUpdatedBy?: string            // Qui a fait la dernière modif
  backofficeNotes?: Array<{         // Notes internes
    note: string,
    timestamp: Timestamp,
    operator: string,
    category: 'general' | 'weight' | 'damage' | 'client'
  }>
  
  // === FLAGS DE QUALITÉ ===
  qualityFlags?: {
    weightVarianceHigh?: boolean,    // Écart de poids important
    packageDamaged?: boolean,        // Colis endommagé
    contentMismatch?: boolean,       // Contenu différent déclaré
    clientNotified?: boolean,        // Client informé des problèmes
    supervisorApproval?: boolean     // Approbation superviseur requise
  }
}
```

---

## 🎯 **PLAN D'IMPLÉMENTATION SPRINT 2**

### **🔄 Phase 1 - Scanner QR (Semaine 1)**
1. **Générer QR codes** pour les colis existants
2. **Interface de scan** avec caméra
3. **Recherche par QR** et validation
4. **Enregistrement du scan** d'arrivée

### **⚖️ Phase 2 - Pesée avec photo (Semaine 2)**
1. **Interface de pesée** avec capture photo
2. **Calcul automatique** des écarts
3. **Validation et approbation** des différences
4. **Stockage photos** dans Firebase Storage

### **📱 Phase 3 - Notifications automatiques (Semaine 3)**
1. **Templates de notifications** (email/SMS)
2. **Système d'envoi automatique**
3. **Historique des notifications**
4. **Intégration avec befret_new**

### **🔧 Phase 4 - Workflow complet (Semaine 4)**
1. **Interface de gestion des emplacements**
2. **Workflow complet** scan → pesée → stockage
3. **Dashboard de suivi** des opérations
4. **Tests et validation**

---

## 🚀 **BÉNÉFICES ATTENDUS**

### **✅ Pour les opérateurs**
- **Workflow guidé** étape par étape
- **Détection automatique** des anomalies
- **Traçabilité complète** des opérations
- **Réduction des erreurs** humaines

### **✅ Pour les clients**
- **Notifications temps réel** du statut
- **Transparence** sur les écarts de poids
- **Suivi précis** de leur colis
- **Communication proactive** en cas de problème

### **✅ Pour l'entreprise**
- **Efficacité opérationnelle** améliorée
- **Réduction des litiges** clients
- **Données analytiques** pour optimiser
- **Conformité** et audit trail complet

---

## 📊 **MÉTRIQUES DE SUCCÈS**

- **Temps de traitement** par colis < 5 minutes
- **Précision de pesée** à ±50g près
- **Taux de notification** delivery > 95%
- **Satisfaction client** améliorée
- **Réduction réclamations** de -30%