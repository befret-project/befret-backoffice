# ⚖️ STATION DE PESÉE AVANCÉE

## 🎯 **VUE D'ENSEMBLE**

La **Station de Pesée** est un composant avancé intégré au module de réception qui automatise la gestion des écarts de poids et des suppléments financiers.

---

## 🚀 **NOUVELLES FONCTIONNALITÉS**

### **⚖️ Pesée Intelligente**
- ✅ **Input poids réel** avec validation numérique
- ✅ **Capture photo obligatoire** de la balance  
- ✅ **Comparaison automatique** poids déclaré vs réel
- ✅ **Calcul en temps réel** des écarts et pourcentages

### **💰 Gestion Financière Automatique**
- ✅ **Calcul supplément** si écart > 200g (2.5€/kg)
- ✅ **Calcul remboursement** si poids insuffisant
- ✅ **Affichage visuel coloré** selon le statut :
  - 🟢 **Vert** : Poids conforme (écart < 200g)
  - 🔴 **Rouge** : Supplément requis (écart > 200g)
  - 🔵 **Bleu** : Remboursement dû (poids insuffisant)

### **💳 Génération de Paiement**
- ✅ **Bouton "Générer lien paiement"** si supplément
- ✅ **Intégration système de paiement** (Stripe/PayPal)
- ✅ **Liens sécurisés** avec expiration automatique
- ✅ **Notifications clients** automatiques

---

## 🏗️ **ARCHITECTURE TECHNIQUE**

### **📁 Fichiers Créés**

```
src/components/logistic/
├── weighing-station.tsx          # Composant principal station
└── weighing-form.tsx             # Composant existant préservé

src/services/
└── payment-service.ts            # Service calculs et paiements

src/app/logistic/colis/
└── weighing-station/page.tsx     # Page dédiée station

docs/
└── WEIGHING_STATION.md          # Documentation complète
```

### **🔧 Composant Principal**

```typescript
<WeighingStation
  parcel={parcel}
  onWeightUpdated={(updatedParcel) => void}
  onPaymentLinkGenerated={(link) => void}
  disabled={false}
/>
```

### **⚙️ Configuration Tarifaire**

```typescript
const WEIGHT_TOLERANCE = 0.2;     // 200g de tolérance
const SUPPLEMENT_RATE = 2.5;      // €/kg supplémentaire  
const BASE_COST_PER_KG = cost/weight; // Pour remboursements
```

---

## 🔄 **WORKFLOW INTÉGRÉ**

### **Étape 1 : Réception Standard**
1. Scanner QR/code-barres ou saisie manuelle
2. Validation du colis dans le système
3. Affichage des informations colis

### **Étape 2 : Station de Pesée** 🆕
1. **Saisie poids réel** avec validation
2. **Capture photo balance** (obligatoire)
3. **Calcul automatique** :
   - Écart = Poids réel - Poids déclaré
   - Pourcentage d'écart  
   - Statut (OK/SUPPLEMENT/REFUND)
   - Montant supplément/remboursement

### **Étape 3 : Actions Financières** 🆕
- **Si OK** : Validation directe
- **Si SUPPLEMENT** : Génération lien paiement
- **Si REFUND** : Calcul remboursement
- **Enregistrement** données pesée + photos

### **Étape 4 : Finalisation**
- Mise à jour statut logistique
- Notification client automatique
- Archivage photos et données

---

## 📊 **CALCULS AUTOMATIQUES**

### **🔢 Formules Utilisées**

```typescript
// Écart de poids
difference = actualWeight - declaredWeight

// Pourcentage d'écart  
percentage = (difference / declaredWeight) * 100

// Statut selon tolérance
if (|difference| <= 0.2kg) → OK
if (difference > 0.2kg)     → SUPPLEMENT  
if (difference < -0.2kg)    → REFUND

// Calcul supplément
supplementWeight = difference - 0.2
supplementAmount = supplementWeight * 2.5€

// Calcul remboursement
refundWeight = |difference| - 0.2
refundAmount = refundWeight * (cost/declaredWeight)
```

### **💡 Exemples Concrets**

| Déclaré | Réel | Écart | Statut | Action | Montant |
|---------|------|-------|--------|--------|---------|
| 2.0 kg | 2.1 kg | +0.1 kg | ✅ OK | Valider | - |
| 2.0 kg | 2.5 kg | +0.5 kg | 🔴 SUPPLEMENT | Facturer | +0.75€ |
| 2.0 kg | 1.5 kg | -0.5 kg | 🔵 REFUND | Rembourser | -3.75€ |

---

## 🎨 **INTERFACE UTILISATEUR**

### **📱 Optimisé Tablettes**
- **Boutons larges** pour interaction tactile
- **Inputs numériques** avec clavier optimisé
- **Feedback visuel** immédiat sur les calculs
- **Photos en grille** avec preview et suppression

### **🎯 Indicateurs Visuels**
```css
/* Statut OK */
.status-ok {
  background: bg-green-50;
  border: border-green-200;
  color: text-green-800;
}

/* Statut Supplément */
.status-supplement {
  background: bg-red-50;
  border: border-red-200; 
  color: text-red-800;
}

/* Statut Remboursement */
.status-refund {
  background: bg-blue-50;
  border: border-blue-200;
  color: text-blue-800;
}
```

### **📸 Gestion Photos**
- **Caméra temps réel** avec preview vidéo
- **Upload fichier** comme alternative
- **Galerie miniatures** avec actions
- **Modal preview** plein écran

---

## 🔌 **INTÉGRATION SYSTÈME**

### **🔥 Firebase Services**
```typescript
// Mise à jour colis avec données pesée
await ParcelService.updateLogisticFields(parcelId, {
  weightReal: actualWeight,
  weightPhotos: photos,
  weightVerification: calculation,
  logisticsStatus: 'verified' | 'weight_issue',
  weighedAt: timestamp
});
```

### **💳 Service Paiement**
```typescript
// Génération lien paiement sécurisé
const paymentLink = await PaymentService.generateSupplementPaymentLink(
  parcel,
  calculation,
  userEmail
);
```

### **📧 Notifications**
- **Email automatique** avec lien paiement
- **SMS** si configuré
- **Notification push** dans l'app client

---

## 🚦 **VALIDATION & SÉCURITÉ**

### **✅ Validations Automatiques**
- Poids réel > 0
- Au moins 1 photo obligatoire  
- Écart < 50% (seuil sécurité)
- Format numérique correct

### **🔒 Sécurité Paiements**
- **Liens temporaires** (24h d'expiration)
- **Référence unique** par transaction
- **Métadonnées traçables** (parcel, agent, timestamp)
- **Webhook validation** statut paiement

### **📋 Audit Trail**
```typescript
interface WeightVerification {
  difference: number;
  percentage: number;
  status: 'OK' | 'WARNING' | 'ERROR';
  operator: string;
  timestamp: string;
  autoApproved: boolean;
  notes?: string;
}
```

---

## 📈 **MÉTRIQUES & REPORTING**

### **📊 KPIs Disponibles**
- **% colis avec écarts** de poids
- **Montant total suppléments** générés
- **Taux paiement** des suppléments
- **Temps moyen** de pesée
- **Précision** des déclarations clients

### **📋 Rapports Automatiques**
- **Écarts quotidiens** par agent
- **Suppléments impayés** en attente
- **Historique pesées** par colis
- **Photos balance** archivées

---

## 🎓 **FORMATION AGENTS**

### **📚 Points Clés à Retenir**
1. **Photo obligatoire** avant validation
2. **Vérifier poids** plusieurs fois si écart important  
3. **Expliquer supplément** au client si nécessaire
4. **Noter observations** dans le champ commentaires
5. **Générer lien paiement** immédiatement si requis

### **⚠️ Cas Particuliers**
- **Écart > 50%** : Vérifier pesée et contacter superviseur
- **Colis endommagé** : Déclarer cas spécial avant pesée
- **Client refuse supplément** : Garder colis en attente
- **Balance défaillante** : Utiliser balance de secours

---

## 🔗 **URLS D'ACCÈS**

### **🖥️ Interfaces Disponibles**
- **Station complète** : `/logistic/colis/weighing-station`
- **Réception standard** : `/logistic/colis/reception`  
- **Réception avancée** : `/logistic/colis/reception-v2`

### **🎯 Recommandations d'Usage**
- **Agents mobiles/tablettes** → Station complète
- **Desktop standard** → Réception v2
- **Formation nouveaux agents** → Station complète

---

## 🏆 **AVANTAGES BUSINESS**

### **💰 Revenus Supplémentaires**
- **Facturation précise** des écarts de poids
- **Réduction pertes** sur les sous-déclarations
- **Automatisation** calculs et paiements

### **⚡ Efficacité Opérationnelle**  
- **Gain temps** pesée et facturation
- **Réduction erreurs** manuelles
- **Traçabilité complète** process

### **😊 Satisfaction Client**
- **Transparence** sur les écarts
- **Paiement facile** via liens sécurisés
- **Photos preuves** consultables

---

*📅 Documentation créée : 04/01/2025*  
*⚖️ Version Station : 1.0*  
*🔄 Compatible avec workflow existant*