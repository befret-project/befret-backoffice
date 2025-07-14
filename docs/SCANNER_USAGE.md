# 📸 GUIDE D'UTILISATION - SCANNERS DE CODES

## 🎯 **DEUX TYPES DE SCANNERS DISPONIBLES**

Dans l'interface de réception des colis (`/logistic/colis/reception`), vous disposez de **2 boutons de scan** distincts :

---

## 📊 **1. BOUTON "SCANNER" (Orange)**

### **🎯 Fonction :**
- Scan des **codes-barres traditionnels** (1D)
- Spécialement conçu pour les **Tracking IDs** BEFRET

### **📱 Formats supportés :**
- `BF-YYYY-XXXXXX` (ex: BF-2024-001234)
- `BGFXNG` (format court existant)
- `XX-YYYY-XXX` (format général)

### **⚙️ Fonctionnalités :**
- ✅ **Scanner caméra** en temps réel
- ✅ **Upload d'image** (alternative)
- ✅ **Détection multi-caméra** (avant/arrière)
- ✅ **Validation automatique** du format
- ✅ **Recherche automatique** après scan

### **📋 Instructions d'usage :**
1. Cliquer sur **"Scanner"** (bouton orange)
2. Autoriser l'accès à la caméra
3. Placer le code-barres dans le cadre rouge
4. Maintenir stable et bien éclairé
5. Le système recherche automatiquement le colis

---

## 🔳 **2. BOUTON "QR CODE" (Bleu)**

### **🎯 Fonction :**
- Scan des **codes QR** (2D) 
- Codes QR spécifiques **BEFRET** avec métadonnées

### **📱 Format supporté :**
- QR codes générés par le système BEFRET
- Contiennent : trackingID, parcelId, timestamp, version

### **⚙️ Fonctionnalités :**
- ✅ **Scanner QR** dédié 
- ✅ **Validation des données** QR
- ✅ **Enregistrement automatique** scan d'arrivée
- ✅ **Métadonnées étendues** (opérateur, localisation)

### **📋 Instructions d'usage :**
1. Cliquer sur **"QR Code"** (bouton bleu)
2. Autoriser l'accès à la caméra  
3. Pointer vers le QR code BEFRET
4. Validation et recherche automatiques

---

## 🔄 **DIFFÉRENCES TECHNIQUES**

| Critère | Scanner (Orange) | QR Code (Bleu) |
|---------|------------------|----------------|
| **Type de code** | Codes-barres 1D | QR codes 2D |
| **Bibliothèque** | @zxing/library MultiFormat | @zxing/library QR |
| **Validation** | Format Tracking ID | Structure JSON QR |
| **Métadonnées** | Tracking ID uniquement | Données complètes |
| **Usage principal** | Codes-barres imprimés | QR codes système |

---

## 🎯 **QUAND UTILISER CHAQUE SCANNER ?**

### **📊 Utilisez "SCANNER" pour :**
- Codes-barres traditionnels imprimés
- Tracking IDs standards BEFRET
- Étiquettes existantes
- Codes linéaires sur emballages

### **🔳 Utilisez "QR CODE" pour :**
- QR codes générés par le système
- Codes avec métadonnées complètes
- Workflow avancé avec historique
- Traçabilité renforcée

---

## ✅ **AVANTAGES DE CETTE APPROCHE**

### **🔧 Flexibilité :**
- Support des **deux standards** de codes
- **Rétrocompatibilité** avec codes existants
- **Future-proof** pour nouveaux formats

### **🎯 Précision :**
- **Validation spécialisée** par type
- **Détection optimisée** selon le format
- **Réduction d'erreurs** de lecture

### **📱 UX Optimisée :**
- **Interface claire** et séparée
- **Instructions spécifiques** par type
- **Feedback visuel** adapté

---

## 🚀 **PERFORMANCES**

- **Scanner codes-barres** : ~200ms de détection
- **Scanner QR codes** : ~150ms de détection  
- **Validation automatique** : <50ms
- **Recherche colis** : ~500ms (selon réseau)

---

## 🛠️ **DÉPANNAGE**

### **❌ Problèmes courants :**

**Scanner ne démarre pas :**
- Vérifier permissions caméra navigateur
- Essayer un autre navigateur (Chrome recommandé)
- Redémarrer la page

**Code non détecté :**
- Améliorer l'éclairage
- Stabiliser l'appareil
- Nettoyer l'objectif caméra
- Vérifier le format du code

**Format invalide :**
- Vérifier que le code correspond aux formats supportés
- Utiliser l'autre scanner si nécessaire
- Saisie manuelle en dernier recours

---

*📅 Documentation mise à jour : 04/01/2025*  
*🔧 Version scanner : 2.0*  
*📱 Compatible : Chrome, Safari, Firefox mobile*