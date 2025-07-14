# 🧪 GUIDE DE TEST - NOTIFICATIONS STATION DE PESÉE

## 🎯 **TESTS DE VALIDATION**

### **Test 1: Rétrocompatibilité (Comportement Original)**

#### **Payload Sans Paramètres Pesée**
```bash
curl -X POST https://us-central1-befret-development.cloudfunctions.net/sendReceiptNotification \
  -H "Content-Type: application/json" \
  -d '{
    "parcelID": "test-parcel-123",
    "phoneNumber": "+243987654321",
    "trackingCode": "TEST123",
    "pType": "paquet",
    "sender": "Jean Dupont",
    "city": "kinshasa"
  }'
```

#### **Résultat Attendu**
```json
{
  "success": true,
  "hasWeighingData": false,
  "templateUsed": "d-4e5b37170b714d20b33f717c099521ff",
  "weighingStatus": "standard"
}
```

---

### **Test 2: Notification Pesée Conforme**

#### **Payload Avec Pesée OK**
```bash
curl -X POST https://us-central1-befret-development.cloudfunctions.net/sendReceiptNotification \
  -H "Content-Type: application/json" \
  -d '{
    "parcelID": "test-parcel-123",
    "phoneNumber": "+243987654321", 
    "trackingCode": "TEST123",
    "pType": "paquet",
    "sender": "Jean Dupont",
    "city": "kinshasa",
    "actualWeight": 2.3,
    "declaredWeight": 2.2,
    "weighingPhotos": [
      "https://example.com/photo1.jpg",
      "https://example.com/photo2.jpg"
    ],
    "weighingStatus": "ok"
  }'
```

#### **Résultat Attendu**
```json
{
  "success": true,
  "hasWeighingData": true,
  "templateUsed": "d-WEIGHING-CONFIRMATION-TEMPLATE-ID",
  "weighingStatus": "ok"
}
```

---

### **Test 3: Notification Supplément Requis**

#### **Payload Avec Supplément**
```bash
curl -X POST https://us-central1-befret-development.cloudfunctions.net/sendReceiptNotification \
  -H "Content-Type: application/json" \
  -d '{
    "parcelID": "test-parcel-123",
    "phoneNumber": "+243987654321",
    "trackingCode": "TEST123", 
    "pType": "paquet",
    "sender": "Jean Dupont",
    "city": "kinshasa",
    "actualWeight": 3.0,
    "declaredWeight": 2.0,
    "weighingPhotos": ["https://example.com/balance.jpg"],
    "weighingStatus": "supplement_required"
  }'
```

#### **SMS Attendu**
```
Cher Jean Dupont, votre paquet TEST123 nécessite un supplément (poids: 3kg vs 2kg). Lien de paiement à suivre. BeFret.
```

---

### **Test 4: Notification Remboursement**

#### **Payload Avec Remboursement**
```bash
curl -X POST https://us-central1-befret-development.cloudfunctions.net/sendReceiptNotification \
  -H "Content-Type: application/json" \
  -d '{
    "parcelID": "test-parcel-123",
    "phoneNumber": "+243987654321",
    "trackingCode": "TEST123",
    "pType": "paquet", 
    "sender": "Jean Dupont",
    "city": "kinshasa",
    "actualWeight": 1.8,
    "declaredWeight": 2.5,
    "weighingPhotos": ["https://example.com/balance.jpg"],
    "weighingStatus": "refund_available"
  }'
```

#### **SMS Attendu**
```
Cher Jean Dupont, votre paquet TEST123 pèse moins que déclaré (1.8kg vs 2.5kg). Remboursement possible. Nous vous contacterons. BeFret.
```

---

## 🔍 **VALIDATION LOGS**

### **Logs Console Attendus**

#### **Pour Notification Pesée**
```
📧 [sendReceiptNotification] Processing notification for TEST123
📊 [sendReceiptNotification] Has weighing data: true
⚖️ [sendReceiptNotification] Using weighing notification template
📧 [sendReceiptNotification] Sending email with template: d-WEIGHING-CONFIRMATION-TEMPLATE-ID
📱 [sendReceiptNotification] Sending SMS: Cher Jean Dupont, votre paquet TEST123...
✅ [sendReceiptNotification] Notification sent successfully for TEST123
📊 [sendReceiptNotification] Used weighing template: true
```

#### **Pour Notification Standard**
```
📧 [sendReceiptNotification] Processing notification for TEST123
📊 [sendReceiptNotification] Has weighing data: false
📦 [sendReceiptNotification] Using original receipt template (retrocompatible)
📧 [sendReceiptNotification] Sending email with template: d-4e5b37170b714d20b33f717c099521ff
📱 [sendReceiptNotification] Sending SMS: Cher Jean Dupont, votre paquet est en...
✅ [sendReceiptNotification] Notification sent successfully for TEST123
📊 [sendReceiptNotification] Used weighing template: false
```

---

## 📧 **VARIABLES TEMPLATE SENDGRID**

### **Variables Disponibles dans Nouveau Template**

```json
{
  "fullname": "Jean Dupont",
  "pType": "paquet", 
  "city": "kinshasa",
  "trackingCode": "TEST123",
  "trackingURL": "https://befret.be/details?trackingID=TEST123",
  "actualWeight": 2.3,
  "declaredWeight": 2.2,
  "weightDifference": 0.1,
  "weightDifferencePercentage": "4.5",
  "weighingPhotos": [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg"
  ],
  "weighingStatus": "ok",
  "hasWeightIssue": false,
  "isWeightOk": true,
  "requiresSuplement": false,
  "refundAvailable": false,
  "weighingTimestamp": "2024-01-15T14:30:25.123Z",
  "weighingConfirmed": true
}
```

---

## 🛠️ **TEST DEPUIS BACKOFFICE**

### **Test WeighingStation Component**

1. **Aller à** `/logistic/colis/reception`
2. **Scanner un colis** ou utiliser search
3. **Cliquer sur** "Station de pesée"
4. **Saisir poids réel** différent du déclaré
5. **Ajouter photos** de balance
6. **Cliquer** "Enregistrer pesée"
7. **Vérifier** message de succès avec notification

### **Logs Attendus dans Browser Console**
```
📦 Saving weight data: {...}
📧 Sending weighing notification with data: {...}
⚖️ [ParcelService] Sending weighing notification for TEST123
📤 [ParcelService] Sending weighing notification payload: {...}
✅ [ParcelService] Weighing notification sent successfully: {...}
📊 [ParcelService] Used weighing template: true
📧 [ParcelService] Template used: d-WEIGHING-CONFIRMATION-TEMPLATE-ID
```

---

## 🚨 **POINTS DE CONTRÔLE**

### **Validation Technique**
- [ ] ✅ Fonction befret_new **non cassée**
- [ ] ✅ Paramètres originaux **toujours supportés**
- [ ] ✅ Nouveaux paramètres **correctement traités**
- [ ] ✅ Templates **sélectionnés selon contexte**
- [ ] ✅ SMS **adaptés au statut de pesée**

### **Validation Utilisateur**
- [ ] ✅ Notification **reçue sur téléphone**
- [ ] ✅ Email **avec informations pesée**
- [ ] ✅ Photos **visibles dans email**
- [ ] ✅ Données **cohérentes** (poids, différence)
- [ ] ✅ Liens de suivi **fonctionnels**

### **Validation Business**
- [ ] ✅ **Transparence** totale sur pesée
- [ ] ✅ **Preuve photographique** de balance
- [ ] ✅ **Information immédiate** sur suppléments
- [ ] ✅ **Workflow logistique** fluide

---

## 🎉 **SUCCÈS**

**Quand tous les tests passent :**

### **🎯 Résultat**
- ✅ **Infrastructure notification** parfaitement intégrée
- ✅ **Station de pesée** connectée aux notifications
- ✅ **Rétrocompatibilité** totale préservée
- ✅ **Expérience utilisateur** enrichie

### **📈 Bénéfices**
- **Confiance client** renforcée avec transparence
- **Gestion automatisée** des écarts de poids
- **Efficacité opérationnelle** améliorée
- **Traçabilité complète** du processus

**➡️ Prêt pour la mise en production !**