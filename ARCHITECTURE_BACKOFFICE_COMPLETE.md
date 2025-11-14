# ARCHITECTURE BACKOFFICE BEFRET - MVP LOGISTIQUE
*Version : 1.0 - 12 Octobre 2025*
*Architecte : Claude AI - Analyse complète du MVP*

## 📋 TABLE DES MATIÈRES

1. [Vision Globale](#vision-globale)
2. [Architecture Technique](#architecture-technique)
3. [Modules Fonctionnels](#modules-fonctionnels)
4. [Modèles de Données](#modèles-de-données)
5. [Workflows](#workflows)
6. [Notifications](#notifications)
7. [Sécurité & Permissions](#sécurité--permissions)
8. [Plan d'Implémentation](#plan-dimplémentation)

---

## 🎯 VISION GLOBALE

### Objectif Business
Le backoffice BeFret est la **colonne vertébrale opérationnelle** permettant aux collaborateurs BeFret (CB) de gérer le cycle de vie complet d'un colis depuis sa réception à Tubize (Belgique) jusqu'à sa livraison finale au Congo (Kinshasa/Lubumbashi).

### Principes Architecturaux
1. **Traçabilité Totale** : Chaque action est enregistrée avec photo, géolocalisation, timestamp
2. **Notifications Automatiques** : WhatsApp + Email à chaque étape clé
3. **Optimisation Tablet** : Interface tactile optimisée pour usage entrepôt
4. **Temps Réel** : Synchronisation instantanée Firestore
5. **Workflow Dirigé** : Impossible de sauter une étape

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Stack Technologique

**Frontend**
- **Framework** : Next.js 14 (App Router)
- **UI** : React 18 + TypeScript
- **Styling** : Tailwind CSS + Shadcn/ui
- **State** : Zustand (state management léger)
- **Forms** : React Hook Form + Zod validation
- **Camera** : react-webcam (photos colis)
- **QR Scanner** : @zxing/library
- **Signature** : react-signature-canvas

**Backend**
- **Database** : Firestore (befret-development)
- **Storage** : Firebase Storage (photos/signatures)
- **Functions** : Firebase Cloud Functions (notifications)
- **Auth** : Firebase Authentication (roles CB)
- **Notifications** : SendGrid (email) + Twilio (SMS/WhatsApp)

### Architecture en Couches

```
┌─────────────────────────────────────────┐
│     PRESENTATION LAYER (Next.js)        │
│  ┌──────────────────────────────────┐   │
│  │  Pages (App Router)              │   │
│  │  - /logistics/reception          │   │
│  │  - /logistics/weighing           │   │
│  │  - /logistics/preparation        │   │
│  │  - /logistics/expedition         │   │
│  │  - /logistics/delivery           │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  Components (Atomic Design)      │   │
│  │  - Organisms : ParcelCard        │   │
│  │  - Molecules : StatusBadge       │   │
│  │  - Atoms : Button, Input         │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      BUSINESS LOGIC LAYER               │
│  ┌──────────────────────────────────┐   │
│  │  Services                        │   │
│  │  - ParcelWorkflowService         │   │
│  │  - NotificationService           │   │
│  │  - WeighingService               │   │
│  │  - GroupingService               │   │
│  │  - DeliveryService               │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  State Management (Zustand)      │   │
│  │  - useParcelStore                │   │
│  │  - useAuthStore                  │   │
│  │  - useWorkflowStore              │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      DATA ACCESS LAYER                  │
│  ┌──────────────────────────────────┐   │
│  │  Repositories                    │   │
│  │  - ParcelRepository              │   │
│  │  - GroupingRepository            │   │
│  │  - HistoryRepository             │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      INFRASTRUCTURE LAYER               │
│  ┌──────────────────────────────────┐   │
│  │  Firebase Services               │   │
│  │  - Firestore Database            │   │
│  │  - Storage (Photos)              │   │
│  │  - Cloud Functions               │   │
│  │  - Authentication                │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 📦 MODULES FONCTIONNELS

### Module 1 : COLIS (ALL) - Vue d'Ensemble

**Route** : `/logistics/parcels`

**Fonctionnalités** :
- Liste exhaustive tous colis (pagination infinie)
- Filtres multicritères :
  - Statut logistique (réception, pesée, préparation, expédition, livraison)
  - Provenance (pays expéditeur)
  - Destination (Kinshasa, Lubumbashi)
  - Poids (tranches)
  - Mode livraison (warehouse, home_delivery)
  - Mode dépôt (shop_pickup, home_pickup)
  - Date (plage)
  - Code BeFret
  - Code DPD
  - Emballage extra (oui/non)
- Recherche full-text (tracking number, nom expéditeur/destinataire)
- Export CSV/Excel
- Vues : Grille (vignettes) ou Liste (tableau)

**Composants** :
```typescript
// src/app/logistics/parcels/page.tsx
export default function AllParcelsPage() {
  // Liste avec virtualization pour performances
}

// src/components/parcels/ParcelFilterPanel.tsx
export function ParcelFilterPanel() {
  // Filtres avancés avec React Hook Form
}

// src/components/parcels/ParcelDataGrid.tsx
export function ParcelDataGrid({ viewMode }: { viewMode: 'grid' | 'list' }) {
  // Affichage adaptatif
}
```

---

### Module 2 : RÉCEPTION DÉPART (Tubize)

#### 2.1 Recherche Colis (Step 1)

**Route** : `/logistics/reception`

**Flow** :
1. CB scanne code DPD (QR/Barcode)
2. Système recherche dans collection `shipments`
3. Si trouvé → Affiche détails colis
4. CB clique "Réception Colis"
5. **Popup confirmation** :
   ```
   Confirmer la réception du colis ?
   Code DPD : 05300000026913
   Code BeFret : BF-BE02-896178-1
   Expéditeur : Yannick KALEMBA
   ```
6. Mise à jour Firestore :
   ```typescript
   {
     logisticsStatus: 'received',
     status: 'to_warehouse',
     'logistics.reception': {
       receivedAt: serverTimestamp(),
       receivedBy: currentUser.uid,
       scannedCode: '05300000026913',
       location: geopoint(50.416, 4.451), // Tubize
       photo: null // Pas de photo à cette étape
     }
   }
   ```
7. **Notification automatique** :
   - WhatsApp expéditeur : "Votre colis BF-BE02-896178-1 a été réceptionné à notre entrepôt BeFret Tubize."
   - Email expéditeur : Template "Colis réceptionné"

**Composants** :
```typescript
// src/app/logistics/reception/page.tsx
'use client';

import { QRScanner } from '@/components/scanner/QRScanner';
import { ParcelReceptionCard } from '@/components/parcels/ParcelReceptionCard';
import { useReceptionWorkflow } from '@/hooks/useReceptionWorkflow';

export default function ReceptionPage() {
  const { scanParcel, confirmReception, isLoading } = useReceptionWorkflow();

  return (
    <div className="container mx-auto p-6">
      <h1>Réception Départ - Tubize</h1>

      <QRScanner onScan={scanParcel} />

      {/* Affichage colis trouvé */}
      {scannedParcel && (
        <ParcelReceptionCard
          parcel={scannedParcel}
          onConfirm={confirmReception}
        />
      )}
    </div>
  );
}
```

#### 2.2 Station Pesée (Step 2)

**Route** : `/logistics/weighing`

**Flow** :
1. CB scanne code BeFret du colis réceptionné
2. Balance électronique connectée (USB/Bluetooth)
3. Lecture automatique poids OR saisie manuelle
4. Système calcule delta :
   ```typescript
   const weightDelta = actualWeight - declaredWeight;
   const isDeltaSignificant = Math.abs(weightDelta) > 0.1; // > 100g

   if (isDeltaSignificant) {
     const priceDifference = calculatePriceDifference(weightDelta);
     // Afficher alert + notif WhatsApp client
   }
   ```
5. Mise à jour Firestore :
   ```typescript
   {
     logisticsStatus: isDeltaSignificant ? 'weight_issue' : 'verified',
     'logistics.weighing': {
       weighedAt: serverTimestamp(),
       weighedBy: currentUser.uid,
       actualWeight: 2.3, // kg
       declaredWeight: 2.0, // kg
       weightDelta: 0.3, // kg
       priceDifference: 2.40, // EUR
       needsReview: true,
       location: geopoint(50.416, 4.451)
     }
   }
   ```
6. **Si delta financier** :
   - WhatsApp expéditeur : "Le poids réel de votre colis est de 2.3kg au lieu de 2kg déclaré. Supplément de 2.40€ à payer."
   - Statut → `weight_issue` (colis bloqué jusqu'à paiement)

**Composants** :
```typescript
// src/app/logistics/weighing/page.tsx
import { WeighingStation } from '@/components/weighing/WeighingStation';
import { WeightComparisonCard } from '@/components/weighing/WeightComparisonCard';
import { useWeighingService } from '@/hooks/useWeighingService';

export default function WeighingPage() {
  const { weighParcel, calculateDelta } = useWeighingService();

  return (
    <WeighingStation onWeigh={weighParcel} />
  );
}
```

---

### Module 3 : PRÉPARATION

#### 3.1 Vérification & Impression Étiquette (Step 1)

**Route** : `/logistics/preparation/verification`

**Flow** :
1. CB recherche colis (barre recherche ou scanner)
2. Affichage fiche colis avec 3 actions possibles :
   - ✅ **Colis OK** → Prêt pour impression
   - ⚠️ **Colis Vide** → Alerte + notification expéditeur
   - 🚨 **Dangereux/Suspect** → Bloquer + notification support
   - ⏳ **Attente Paiement** → Delta poids non payé

3. **Si Colis OK** → Popup :
   ```
   Avez-vous bien emballé le colis avec emballage extra ?
   [OUI - J'ai emballé] [NON - Emballer d'abord]
   ```
4. Si OUI → Génération étiquette BeFret Congo (PDF)
5. Impression automatique (imprimante réseau)
6. **Photo obligatoire** du colis étiqueté
7. Mise à jour Firestore :
   ```typescript
   {
     logisticsStatus: 'prepared',
     'logistics.preparation': {
       verifiedAt: serverTimestamp(),
       verifiedBy: currentUser.uid,
       extraPackaging: true,
       labelPrinted: true,
       labelUrl: 'gs://befret-development/labels/congo/BF-BE02-896178-1.pdf',
       photo: 'gs://befret-development/photos/preparation/BF-BE02-896178-1-20251012.jpg',
       location: geopoint(50.416, 4.451)
     }
   }
   ```

**Si Colis Vide/Dangereux/Attente Paiement** :
- Statut → `blocked`
- Notification expéditeur avec raison
- Log dans historique

#### 3.2 Tri par Destination (Step 2)

**Route** : `/logistics/preparation/sorting`

**Flow** :
1. CB scanne colis préparé
2. Système affiche destination : **KINSHASA** ou **LUBUMBASHI**
3. CB range physiquement colis dans zone appropriée
4. CB confirme dans app : "Colis rangé zone Kinshasa"
5. Mise à jour :
   ```typescript
   {
     logisticsStatus: 'sorted',
     'logistics.sorting': {
       sortedAt: serverTimestamp(),
       sortedBy: currentUser.uid,
       destinationZone: 'KINSHASA',
       physicalLocation: 'ZONE-A-KIN-01',
       location: geopoint(50.416, 4.451)
     }
   }
   ```

#### 3.3 Classement Colis à Préparer (Step 3)

**Route** : `/logistics/preparation/overview`

**Vues** :
- **Mode Vignettes** : Cards visuels avec photo colis
- **Mode Liste** : Tableau avec filtres

**Groupements** :
- Colis OK (verified) → Prêts impression
- Colis avec delta poids (weight_issue) → En attente paiement
- Colis bloqués (blocked) → Nécessite intervention
- Colis triés (sorted) → Prêts expédition

---

### Module 4 : EXPÉDITION

#### 4.1 Groupage (Step 1)

**Route** : `/logistics/expedition/grouping`

**Types de Groupages** :
- **23kg Standard** (aérien)
- **32kg Extended** (aérien)
- **Hors Norme** (maritime, poids libre)

**Flow** :
1. CB crée nouveau groupage :
   ```typescript
   const grouping = {
     id: 'GRP-KIN-20251012-001',
     type: '23kg',
     targetWeight: 23,
     currentWeight: 0,
     maxWeight: 23.5, // Tolérance +0.5kg
     destination: 'KINSHASA',
     parcels: [],
     status: 'in_progress',
     createdAt: serverTimestamp(),
     createdBy: currentUser.uid
   };
   ```

2. CB scanne colis (codes BeFret)
3. Système :
   - Ajoute colis au groupage
   - Cumule poids
   - Check limite :
     ```typescript
     const newTotalWeight = grouping.currentWeight + parcel.weight;

     if (newTotalWeight > grouping.maxWeight) {
       alert('Poids maximum atteint ! Terminer ce groupage.');
       return;
     }

     grouping.parcels.push(parcel.id);
     grouping.currentWeight = newTotalWeight;
     ```

4. Quand limite atteinte → **Popup** :
   ```
   Avez-vous bien filmé le groupage avant impression ?
   [OUI - J'ai filmé] [NON - Filmer d'abord]
   ```

5. Si OUI → Génération étiquette groupage (QR code + infos)
6. Impression étiquette
7. **Photo obligatoire** du groupage filmé + étiqueté
8. Mise à jour :
   ```typescript
   {
     status: 'ready_for_shipping',
     completedAt: serverTimestamp(),
     labelUrl: 'gs://.../grouping-labels/GRP-KIN-20251012-001.pdf',
     photo: 'gs://.../grouping-photos/GRP-KIN-20251012-001.jpg',
     videoUrl: 'gs://.../grouping-videos/GRP-KIN-20251012-001.mp4' // Optionnel
   }
   ```

**Composants** :
```typescript
// src/app/logistics/expedition/grouping/page.tsx
import { GroupingWorkstation } from '@/components/expedition/GroupingWorkstation';

export default function GroupingPage() {
  return <GroupingWorkstation />;
}

// src/components/expedition/GroupingWorkstation.tsx
export function GroupingWorkstation() {
  const [activeGrouping, setActiveGrouping] = useState<Grouping | null>(null);

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Colonne gauche : Scanner + Liste colis */}
      <div>
        <QRScanner onScan={addParcelToGrouping} />
        <ParcelList parcels={activeGrouping?.parcels} />
      </div>

      {/* Colonne droite : Info groupage + Poids */}
      <div>
        <WeightGauge
          current={activeGrouping?.currentWeight}
          target={activeGrouping?.targetWeight}
        />
        <GroupingActions grouping={activeGrouping} />
      </div>
    </div>
  );
}
```

#### 4.2 Mode d'Envoi (Step 2)

**Route** : `/logistics/expedition/shipping-method`

**Choix** :
- **Aérien** :
  - Cargo – LTA
  - MCO (SN Brussels, Ethiopian Airlines, etc.)
  - Tag (Schiphol Airport)
- **Maritime** : (hors norme uniquement)

**Flow** :
1. CB sélectionne mode expédition
2. Si aérien → Sélectionner partenaire dans liste déroulante
3. Mise à jour groupage :
   ```typescript
   {
     shippingMethod: 'aerial',
     shippingPartner: 'SN_BRUSSELS',
     partnerName: 'Brussels Airlines - SN',
     flightNumber: 'SN123', // Optionnel
     estimatedDeparture: '2025-10-15T14:30:00Z'
   }
   ```

#### 4.3 Contact (Step 3) - Chaîne de Responsabilité

**Route** : `/logistics/expedition/contact-chain`

**Intervenants** :
1. **Responsable Groupage (A)** - CB Tubize
2. **Contact Expédition** - Voyageur OU Agent aéroport
3. **Contact Réception** - Agent aéroport destination (intermédiaire)
4. **Responsable Groupage (B)** - CB destination (Kinshasa/Lubumbashi)

**Flow** :
```typescript
interface ContactChain {
  groupingId: string;

  handoverA: {
    responsibleId: string; // CB Tubize
    handoverAt: Timestamp;
    handoverTo: 'contact_expedition',
    signature: string; // Base64
    photo: string; // URL Storage
    location: GeoPoint
  };

  expedition: {
    contactId: string; // From team_logistics
    receivedAt: Timestamp;
    confirmedBy: string; // Signature
    carrierInfo: {
      type: 'traveler' | 'airport_agent',
      flightNumber?: string,
      seatNumber?: string // Si voyageur
    }
  };

  receptionIntermediate: {
    contactId: string; // Agent aéroport arrivée
    receivedAt: Timestamp,
    location: GeoPoint, // Aéroport destination
    photo: string
  };

  handoverB: {
    responsibleId: string; // CB destination
    receivedAt: Timestamp,
    verifiedWeight: number, // Contrôle final
    weightDelta: number,
    signature: string,
    photo: string,
    location: GeoPoint // Entrepôt Congo
  };
}
```

**Interface** :
```typescript
// src/app/logistics/expedition/contact-chain/[groupingId]/page.tsx

export default function ContactChainPage({ params }: { params: { groupingId: string } }) {
  const [currentStep, setCurrentStep] = useState<'handoverA' | 'expedition' | 'reception' | 'handoverB'>('handoverA');

  return (
    <ContactChainStepper
      groupingId={params.groupingId}
      currentStep={currentStep}
      onStepComplete={handleStepComplete}
    />
  );
}

// src/components/expedition/ContactChainStepper.tsx
export function ContactChainStepper({ currentStep, onStepComplete }: Props) {
  return (
    <div className="space-y-6">
      <StepIndicator steps={4} currentStep={stepIndex} />

      {currentStep === 'handoverA' && (
        <HandoverAForm
          onComplete={onStepComplete}
          requireSignature
          requirePhoto
        />
      )}

      {currentStep === 'expedition' && (
        <ContactSelectionForm
          contacts={expeditionContacts}
          onSelect={handleContactSelection}
        />
      )}

      {/* ... autres steps */}
    </div>
  );
}
```

#### 4.4 Confirmer l'Expédition (Step 4)

**Flow** :
1. CB vérifie toutes infos complètes :
   - ✅ Groupage créé et filmé
   - ✅ Mode expédition sélectionné
   - ✅ Chaîne de contact complète
2. CB clique "Confirmer Expédition"
3. Popup finale :
   ```
   Confirmer l'expédition du groupage GRP-KIN-20251012-001 ?
   - 15 colis
   - 22.8 kg total
   - Destination : KINSHASA
   - Via : SN Brussels (SN123)
   - Contact : Jean MUKENDI
   ```
4. Mise à jour :
   ```typescript
   {
     status: 'shipped',
     shippedAt: serverTimestamp(),
     shippedBy: currentUser.uid
   }

   // Pour chaque colis du groupage
   parcels.forEach(parcel => {
     update(parcel, {
       logisticsStatus: 'in_transit',
       status: 'shipped',
       'logistics.expedition': {
         groupingId: 'GRP-KIN-20251012-001',
         shippedAt: serverTimestamp(),
         estimatedArrival: '2025-10-16T08:00:00Z'
       }
     });
   });
   ```

5. **Notifications automatiques** :
   - **Expéditeurs** (tous colis du groupage) :
     - WhatsApp : "Votre colis BF-XX est en route vers Kinshasa ! Arrivée prévue le 16/10."
     - Email : Template "Colis expédié"
   - **Destinataires** :
     - WhatsApp : "Un colis vous attend ! Arrivée prévue le 16/10 à Kinshasa."
     - Email : Template "Colis en route"

---

### Module 5 : RÉCEPTION ARRIVÉE (Kinshasa/Lubumbashi)

#### 5.1 Confirmation (Step 1)

**Route** : `/logistics/arrival/confirmation`

**Flow** :
1. CB destination scanne groupage
2. Vérification automatique :
   - Groupage attendu ?
   - Date arrivée cohérente ?
   - Contact chain complète ?
3. CB clique "Confirmer Réception"
4. Mise à jour :
   ```typescript
   {
     status: 'arrived',
     arrivedAt: serverTimestamp(),
     arrivedBy: currentUser.uid,
     arrivalLocation: 'KINSHASA_WAREHOUSE'
   }
   ```

#### 5.2 Station Pesée & Contrôle (Step 2)

**Flow** :
1. Pesée groupage complet
2. Comparaison poids départ vs arrivée
3. Alert si delta > 50g :
   ```typescript
   const weightDelta = arrivedWeight - shippedWeight;

   if (Math.abs(weightDelta) > 0.05) { // > 50g
     alert(`⚠️ Écart de poids détecté : ${weightDelta}kg`);
     // Log incident
   }
   ```
4. **Photo obligatoire** groupage pesé
5. Mise à jour :
   ```typescript
   {
     'arrival.weighed': true,
     'arrival.weighedAt': serverTimestamp(),
     'arrival.weight': 22.7, // kg
     'arrival.weightDelta': -0.1, // -100g
     'arrival.photo': 'gs://.../arrival-photos/GRP-KIN-20251012-001.jpg'
   }
   ```

---

### Module 6 : DÉGROUPAGE

**Route** : `/logistics/ungrouping`

**Flow** :
1. CB sélectionne groupage arrivé
2. CB scanne chaque colis individuellement
3. Pour chaque colis :
   - Pesée individuelle
   - Comparaison poids Tubize vs Congo
   - Vérification visuelle état
   - **Photo obligatoire**

4. Statuts possibles :
   ```typescript
   type UngroupingStatus =
     | 'validated'      // ✅ Poids OK, état OK
     | 'blocked'        // 🚨 Colis endommagé/ouvert
     | 'pending'        // ⏳ Poids différent, attente vérification
   ```

5. Mise à jour chaque colis :
   ```typescript
   {
     logisticsStatus: 'ungrouped',
     'logistics.ungrouping': {
       ungroupedAt: serverTimestamp(),
       ungroupedBy: currentUser.uid,
       groupingId: 'GRP-KIN-20251012-001',
       actualWeight: 1.5, // kg
       declaredWeight: 1.5, // kg (Tubize)
       weightDelta: 0,
       validationStatus: 'validated',
       photo: 'gs://.../ungrouping-photos/BF-BE02-896178-1.jpg',
       location: geopoint(-4.325, 15.322) // Kinshasa
     }
   }
   ```

6. Quand tous colis traités → Groupage `status: 'ungrouped_complete'`

---

### Module 7 : TRI PAR MODE LIVRAISON

**Route** : `/logistics/delivery-sorting`

**Modes de livraison** :
- **Warehouse** (Retrait entrepôt) → Zone A
- **Home Delivery** (Livraison domicile) → Zone B

**Flow** :
1. CB scanne colis dégroupé
2. Système affiche mode livraison
3. CB range physiquement dans zone appropriée
4. CB confirme dans app
5. Mise à jour :
   ```typescript
   {
     logisticsStatus: 'sorted_for_delivery',
     'logistics.deliverySorting': {
       sortedAt: serverTimestamp(),
       sortedBy: currentUser.uid,
       deliveryZone: deliveryMode === 'warehouse' ? 'ZONE-A-WH' : 'ZONE-B-HD',
       physicalLocation: 'RACK-12-SHELF-3',
       location: geopoint(-4.325, 15.322)
     }
   }
   ```

---

### Module 8 : LIVRAISON

**Route** : `/logistics/delivery`

#### Flow Standard (Warehouse Pickup)

1. CB recherche colis (code BeFret ou nom destinataire)
2. Vérification identité destinataire (pièce d'identité)
3. Capture obligatoire :
   - Photo colis
   - Photo pièce d'identité (recto)
   - Signature électronique
4. Remise colis
5. Mise à jour :
   ```typescript
   {
     logisticsStatus: 'delivered',
     status: 'delivered',
     'logistics.delivery': {
       deliveredAt: serverTimestamp(),
       deliveredBy: currentUser.uid,
       recipientName: 'Joselyne FUNGULA',
       recipientIdType: 'CNI', // ou Passeport
       recipientIdNumber: 'KIN123456',
       idPhotoUrl: 'gs://.../delivery-id/BF-BE02-896178-1-id.jpg',
       parcelPhotoUrl: 'gs://.../delivery-parcel/BF-BE02-896178-1.jpg',
       signatureUrl: 'gs://.../delivery-signatures/BF-BE02-896178-1.png',
       location: geopoint(-4.325, 15.322)
     }
   }
   ```

6. **Notifications finales** :
   - Expéditeur : "Votre colis BF-BE02-896178-1 a été livré avec succès à Joselyne FUNGULA le 16/10/2025 à 14:30."
   - Destinataire : "Merci d'avoir récupéré votre colis BeFret !"

#### Flow Échec Livraison (Home Delivery uniquement)

**Route** : `/logistics/delivery/failed-attempt`

1. CB clique "Tentative de livraison échouée"
2. Sélection raison :
   - Destinataire absent
   - Adresse incorrecte
   - Refus de réception
   - Autre (préciser)
3. Photo domicile (preuve tentative)
4. Mise à jour :
   ```typescript
   {
     logisticsStatus: 'delivery_failed',
     'logistics.deliveryAttempts': arrayUnion({
       attemptedAt: serverTimestamp(),
       attemptedBy: currentUser.uid,
       failureReason: 'recipient_absent',
       notes: 'Voisin indique absent jusqu\'au 18/10',
       photo: 'gs://.../delivery-attempts/BF-BE02-896178-1-attempt1.jpg',
       location: geopoint(-4.325, 15.322)
     })
   }
   ```

5. **Notifications** :
   - Expéditeur : "Tentative de livraison échouée (destinataire absent). Nouvelle tentative prévue le 18/10."
   - Destinataire : "Nous sommes passés mais vous étiez absent. Appelez-nous pour planifier une nouvelle livraison."

6. Après 3 tentatives échouées → Retour entrepôt, frais stockage

---

### Module 9 : HISTORIQUE

**Route** : `/logistics/history/[parcelId]`

**Données enregistrées** :
```typescript
interface ParcelHistory {
  parcelId: string;
  trackingNumber: string; // BeFret
  dpdTrackingNumber: string;

  // Timeline complète
  timeline: {
    // Befret_new (Frontend client)
    orderCreated: {
      timestamp: Timestamp,
      senderInfo: any,
      receiverInfo: any,
      declaredWeight: number,
      declaredDimensions: Dimensions
    },

    paymentCompleted: {
      timestamp: Timestamp,
      amount: number,
      stripeSessionId: string
    },

    dpdLabelGenerated: {
      timestamp: Timestamp,
      dpdShipmentId: string,
      serviceType: 'shop_pickup' | 'home_pickup'
    },

    // Backoffice (Module logistique)
    reception: {
      timestamp: Timestamp,
      operator: string, // CB name
      location: GeoPoint, // Tubize
      photo: null
    },

    weighing: {
      timestamp: Timestamp,
      operator: string,
      actualWeight: number,
      weightDelta: number,
      priceDifference: number,
      location: GeoPoint
    },

    preparation: {
      timestamp: Timestamp,
      operator: string,
      extraPackaging: boolean,
      labelPrinted: boolean,
      photo: string,
      location: GeoPoint
    },

    sorting: {
      timestamp: Timestamp,
      operator: string,
      destinationZone: string,
      physicalLocation: string,
      location: GeoPoint
    },

    grouping: {
      timestamp: Timestamp,
      operator: string,
      groupingId: string,
      totalWeight: number,
      parcelCount: number,
      photo: string,
      videoUrl: string,
      location: GeoPoint
    },

    expedition: {
      timestamp: Timestamp,
      operator: string,
      shippingMethod: string,
      shippingPartner: string,
      flightNumber: string,
      contactChain: ContactChain,
      location: GeoPoint
    },

    arrival: {
      timestamp: Timestamp,
      operator: string,
      arrivalLocation: string,
      weighedWeight: number,
      weightDelta: number,
      photo: string,
      location: GeoPoint
    },

    ungrouping: {
      timestamp: Timestamp,
      operator: string,
      actualWeight: number,
      validationStatus: string,
      photo: string,
      location: GeoPoint
    },

    deliverySorting: {
      timestamp: Timestamp,
      operator: string,
      deliveryZone: string,
      physicalLocation: string,
      location: GeoPoint
    },

    delivery: {
      timestamp: Timestamp,
      operator: string,
      recipientName: string,
      recipientIdType: string,
      recipientIdNumber: string,
      idPhotoUrl: string,
      parcelPhotoUrl: string,
      signatureUrl: string,
      location: GeoPoint
    }
  };

  // Photos (toutes étapes confondues)
  photos: {
    step: string,
    url: string,
    timestamp: Timestamp,
    location: GeoPoint,
    operator: string
  }[];

  // Géolocalisation (tous scans)
  geoTrace: {
    timestamp: Timestamp,
    location: GeoPoint,
    action: string,
    operator: string
  }[];
}
```

**Interface Historique** :
- **Timeline visuelle** (style tracking)
- **Carte interactive** avec points GPS
- **Galerie photos** (toutes étapes)
- **Export PDF** du trajet complet
- **Statistiques** :
  - Temps moyen par étape
  - Distance totale parcourue
  - Nombre de manipulations

---

## 💾 MODÈLES DE DONNÉES FIRESTORE

### Collection : `shipments` (Existante - NE PAS MODIFIER)

**Structure** : (Héritage de befret_new)
```typescript
interface UnifiedShipment {
  // Champs existants de befret_new (NE PAS TOUCHER)
  id: string;
  trackingNumber: string; // BF-*
  userId: string;
  category: 'standard' | 'heavy';
  type: ShipmentType;

  customerInfo: UnifiedCustomerInfo;
  parcelInfo: UnifiedParcelInfo;

  standardData?: StandardShipmentData; // DPD info

  status: UnifiedShipmentStatus;
  phase: UnifiedShipmentPhase;
  timestamps: UnifiedTimestamps;

  // ✅ AJOUT BACKOFFICE : Sous-document logistique
  logistics?: LogisticsData;
}

// ✅ NOUVEAU : Sous-document logistique (n'interfère pas avec befret_new)
interface LogisticsData {
  // Statut logistique global
  logisticsStatus: LogisticsStatus;

  // États par phase
  reception?: ReceptionData;
  weighing?: WeighingData;
  preparation?: PreparationData;
  sorting?: SortingData;
  grouping?: GroupingData;
  expedition?: ExpeditionData;
  arrival?: ArrivalData;
  ungrouping?: UngroupingData;
  deliverySorting?: DeliverySortingData;
  delivery?: DeliveryData;

  // Historique actions (append-only)
  history: LogisticsHistoryEvent[];
}

type LogisticsStatus =
  | 'pending_reception'      // Commande validée, colis pas encore reçu
  | 'received'               // Réceptionné Tubize
  | 'weighed'               // Pesé
  | 'weight_issue'          // Delta poids significatif
  | 'verified'              // Poids OK, vérifié
  | 'prepared'              // Étiqueté, emballé, photo
  | 'blocked'               // Colis vide/dangereux/attente paiement
  | 'sorted'                // Trié par destination
  | 'grouped'               // Ajouté à un groupage
  | 'ready_for_shipping'    // Groupage complet, prêt expédition
  | 'shipped'               // Expédié (en transit aérien/maritime)
  | 'in_transit'            // En transit
  | 'arrived'               // Arrivé destination
  | 'ungrouped'             // Dégroupé, colis individuel validé
  | 'sorted_for_delivery'   // Trié par mode livraison
  | 'out_for_delivery'      // En cours de livraison (home delivery)
  | 'delivery_failed'       // Tentative échouée
  | 'delivered';            // Livré avec succès

interface ReceptionData {
  receivedAt: Timestamp;
  receivedBy: string; // CB uid
  scannedCode: string; // DPD tracking
  location: GeoPoint;
  operator: {
    uid: string;
    name: string;
    email: string;
  };
}

interface WeighingData {
  weighedAt: Timestamp;
  weighedBy: string;
  actualWeight: number; // kg
  declaredWeight: number; // kg (from order)
  weightDelta: number; // kg (actual - declared)
  priceDifference: number; // EUR (if delta)
  needsReview: boolean;
  location: GeoPoint;
  operator: OperatorInfo;
}

interface PreparationData {
  verifiedAt: Timestamp;
  verifiedBy: string;
  status: 'ok' | 'empty' | 'dangerous' | 'awaiting_payment';
  extraPackaging: boolean;
  labelPrinted: boolean;
  labelUrl: string; // Congo label PDF
  photo: string; // Storage URL
  location: GeoPoint;
  operator: OperatorInfo;
}

interface SortingData {
  sortedAt: Timestamp;
  sortedBy: string;
  destinationZone: 'KINSHASA' | 'LUBUMBASHI';
  physicalLocation: string; // ex: ZONE-A-KIN-01
  location: GeoPoint;
  operator: OperatorInfo;
}

interface GroupingData {
  groupingId: string;
  addedAt: Timestamp;
  addedBy: string;
  operator: OperatorInfo;
}

// ... autres interfaces
```

### Collection : `groupings` (Nouvelle)

```typescript
interface Grouping {
  id: string; // GRP-KIN-20251012-001

  // Configuration
  type: '23kg' | '32kg' | 'hors_norme';
  targetWeight: number; // kg
  maxWeight: number; // kg (tolérance)
  destination: 'KINSHASA' | 'LUBUMBASHI';

  // Contenu
  parcels: string[]; // Array of parcel IDs
  currentWeight: number; // kg
  parcelCount: number;

  // Statut
  status: 'in_progress' | 'ready_for_shipping' | 'shipped' | 'arrived' | 'ungrouped_complete';

  // Expédition
  shippingMethod?: 'aerial' | 'maritime';
  shippingPartner?: string; // ex: SN_BRUSSELS
  flightNumber?: string;
  estimatedDeparture?: Timestamp;
  estimatedArrival?: Timestamp;

  // Chaîne de contact
  contactChain?: ContactChain;

  // Arrivée
  arrivedAt?: Timestamp;
  arrivedBy?: string;
  arrivalWeight?: number;
  weightDelta?: number;

  // Médias
  labelUrl?: string;
  photo?: string;
  videoUrl?: string;

  // Métadonnées
  createdAt: Timestamp;
  createdBy: string;
  createdLocation: GeoPoint; // Tubize
  completedAt?: Timestamp;
  shippedAt?: Timestamp;

  // Opérateurs
  operators: {
    created: OperatorInfo;
    shipped?: OperatorInfo;
    received?: OperatorInfo;
  };
}

interface ContactChain {
  handoverA: HandoverInfo;
  expedition: ExpeditionContactInfo;
  receptionIntermediate: ReceptionContactInfo;
  handoverB: HandoverInfo;
}
```

### Collection : `team_logistics` (Nouvelle)

```typescript
interface TeamMember {
  id: string;

  // Identité
  type: 'internal' | 'external';
  role: 'responsable_groupage' | 'contact_expedition' | 'contact_reception';

  // Info personnelle
  firstName: string;
  lastName: string;
  pseudonym?: string; // Surnom
  photo?: string; // Storage URL

  // Contact
  phoneOperator: string; // +243...
  phoneWhatsApp?: string; // Peut être différent
  email?: string;

  // Géographie
  baseLocation: 'TUBIZE' | 'KINSHASA' | 'LUBUMBASHI' | 'SCHIPHOL' | 'OTHER';

  // Spécificités
  carrierType?: 'traveler' | 'airport_agent';
  airportCode?: string; // ex: FIH, FBM, AMS

  // Métadonnées
  createdAt: Timestamp;
  createdBy: string; // Admin uid
  isActive: boolean;
}
```

### Collection : `shipping_partners` (Nouvelle)

```typescript
interface ShippingPartner {
  id: string;

  name: string; // ex: Brussels Airlines
  code: string; // ex: SN_BRUSSELS

  type: 'cargo_lta' | 'mco' | 'tag';

  // Cargo-LTA
  companyName?: string; // ex: APA-AIR

  // MCO (Multiple Carrier Option)
  airlineCode?: string; // ex: SN, ET
  airlineName?: string; // ex: Ethiopian Airlines

  // Tag (Aéroport)
  airportCode?: string; // ex: AMS (Schiphol)
  airportName?: string;

  // Contact
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;

  // Métadonnées
  isActive: boolean;
  createdAt: Timestamp;
  createdBy: string;
}
```

---

## 🔔 SYSTÈME DE NOTIFICATIONS

### Architecture

```typescript
// src/services/notification-service.ts

export class BackofficeNotificationService {

  /**
   * Notification réception colis
   */
  async notifyReception(parcel: Parcel): Promise<void> {
    const sender = parcel.customerInfo.sender;

    // WhatsApp
    await this.sendWhatsApp({
      to: sender.phone.whatsapp,
      template: 'reception_confirmation',
      variables: {
        trackingNumber: parcel.trackingNumber,
        warehouseLocation: 'BeFret Tubize, Belgique'
      }
    });

    // Email
    await this.sendEmail({
      to: sender.email,
      template: 'reception-confirmation-fr.html',
      subject: `✅ Colis ${parcel.trackingNumber} réceptionné`,
      variables: {
        senderName: sender.name,
        trackingNumber: parcel.trackingNumber,
        receptionDate: new Date().toLocaleDateString('fr-BE'),
        trackingUrl: `https://befret.be/tracking/${parcel.trackingNumber}`
      }
    });
  }

  /**
   * Notification delta poids
   */
  async notifyWeightDelta(parcel: Parcel, delta: WeighingData): Promise<void> {
    if (!delta.needsReview) return;

    const sender = parcel.customerInfo.sender;

    // WhatsApp (prioritaire car urgent)
    await this.sendWhatsApp({
      to: sender.phone.whatsapp,
      template: 'weight_difference',
      variables: {
        trackingNumber: parcel.trackingNumber,
        declaredWeight: delta.declaredWeight,
        actualWeight: delta.actualWeight,
        priceDifference: delta.priceDifference,
        paymentLink: `https://befret.be/pay/weight-adjustment/${parcel.id}`
      }
    });

    // Email avec détails complets
    await this.sendEmail({
      to: sender.email,
      template: 'weight-adjustment-fr.html',
      subject: `⚖️ Ajustement de poids - Colis ${parcel.trackingNumber}`,
      variables: {
        senderName: sender.name,
        trackingNumber: parcel.trackingNumber,
        declaredWeight: delta.declaredWeight,
        actualWeight: delta.actualWeight,
        weightDelta: delta.weightDelta,
        priceDifference: delta.priceDifference,
        paymentLink: `https://befret.be/pay/weight-adjustment/${parcel.id}`
      }
    });
  }

  /**
   * Notification colis problématique
   */
  async notifyParcelIssue(parcel: Parcel, issue: 'empty' | 'dangerous' | 'awaiting_payment'): Promise<void> {
    const sender = parcel.customerInfo.sender;

    const messages = {
      empty: 'Votre colis est vide ou ne contient pas ce qui était déclaré.',
      dangerous: 'Votre colis contient un article suspect/dangereux et a été bloqué pour vérification.',
      awaiting_payment: 'Votre colis est en attente de paiement du supplément de poids.'
    };

    // WhatsApp
    await this.sendWhatsApp({
      to: sender.phone.whatsapp,
      template: 'parcel_issue',
      variables: {
        trackingNumber: parcel.trackingNumber,
        issueMessage: messages[issue],
        supportPhone: '+32 473 28 21 39'
      }
    });

    // Email
    await this.sendEmail({
      to: sender.email,
      template: 'parcel-issue-fr.html',
      subject: `⚠️ Action requise - Colis ${parcel.trackingNumber}`,
      variables: {
        senderName: sender.name,
        trackingNumber: parcel.trackingNumber,
        issueType: issue,
        issueMessage: messages[issue],
        supportEmail: 'info@befret.be',
        supportPhone: '+32 473 28 21 39'
      }
    });
  }

  /**
   * Notification expédition
   */
  async notifyExpedition(grouping: Grouping): Promise<void> {
    // Pour chaque colis du groupage
    for (const parcelId of grouping.parcels) {
      const parcel = await this.getParcel(parcelId);
      const sender = parcel.customerInfo.sender;
      const receiver = parcel.customerInfo.receiver;

      // WhatsApp Expéditeur
      await this.sendWhatsApp({
        to: sender.phone.whatsapp,
        template: 'parcel_shipped',
        variables: {
          trackingNumber: parcel.trackingNumber,
          destination: grouping.destination,
          estimatedArrival: grouping.estimatedArrival?.toDate().toLocaleDateString('fr-FR'),
          trackingUrl: `https://befret.be/tracking/${parcel.trackingNumber}`
        }
      });

      // WhatsApp Destinataire
      await this.sendWhatsApp({
        to: receiver.phone.whatsapp,
        template: 'parcel_coming',
        variables: {
          receiverName: receiver.name,
          senderName: sender.name,
          destination: grouping.destination,
          estimatedArrival: grouping.estimatedArrival?.toDate().toLocaleDateString('fr-FR'),
          deliveryMode: parcel.standardData.befretDeliveryMethod === 'home_delivery'
            ? 'livraison à domicile'
            : 'retrait en entrepôt'
        }
      });

      // Emails
      await Promise.all([
        this.sendEmail({
          to: sender.email,
          template: 'expedition-sender-fr.html',
          subject: `✈️ Colis ${parcel.trackingNumber} expédié`,
          variables: { /* ... */ }
        }),
        this.sendEmail({
          to: receiver.email,
          template: 'expedition-receiver-fr.html',
          subject: `📦 Un colis arrive pour vous !`,
          variables: { /* ... */ }
        })
      ]);
    }
  }

  /**
   * Notification tentative livraison échouée
   */
  async notifyDeliveryFailed(parcel: Parcel, attempt: DeliveryAttempt): Promise<void> {
    const sender = parcel.customerInfo.sender;
    const receiver = parcel.customerInfo.receiver;

    const attemptCount = parcel.logistics.deliveryAttempts?.length || 0;

    // WhatsApp Expéditeur
    await this.sendWhatsApp({
      to: sender.phone.whatsapp,
      template: 'delivery_failed',
      variables: {
        trackingNumber: parcel.trackingNumber,
        receiverName: receiver.name,
        failureReason: this.getFailureReasonText(attempt.failureReason),
        attemptCount,
        nextAttemptDate: this.calculateNextAttempt(attemptCount)
      }
    });

    // WhatsApp Destinataire
    await this.sendWhatsApp({
      to: receiver.phone.whatsapp,
      template: 'delivery_missed',
      variables: {
        receiverName: receiver.name,
        attemptDate: attempt.attemptedAt.toDate().toLocaleDateString('fr-FR'),
        contactPhone: '+243 xxx xxx xxx', // Entrepôt Congo
        warehouseAddress: grouping.destination === 'KINSHASA'
          ? 'Avenue Xxx, Kinshasa'
          : 'Avenue Yyy, Lubumbashi'
      }
    });

    // Si 3ème tentative → Alert frais stockage
    if (attemptCount >= 3) {
      await this.sendWhatsApp({
        to: receiver.phone.whatsapp,
        template: 'storage_fees_warning',
        variables: {
          trackingNumber: parcel.trackingNumber,
          storageFee: '5 USD/jour',
          deadlineDate: this.calculateStorageDeadline()
        }
      });
    }
  }

  /**
   * Notification livraison réussie
   */
  async notifyDeliverySuccess(parcel: Parcel, delivery: DeliveryData): Promise<void> {
    const sender = parcel.customerInfo.sender;
    const receiver = parcel.customerInfo.receiver;

    // WhatsApp Expéditeur
    await this.sendWhatsApp({
      to: sender.phone.whatsapp,
      template: 'delivery_success',
      variables: {
        trackingNumber: parcel.trackingNumber,
        receiverName: delivery.recipientName,
        deliveryDate: delivery.deliveredAt.toDate().toLocaleDateString('fr-FR'),
        deliveryTime: delivery.deliveredAt.toDate().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    });

    // Email Expéditeur avec preuve livraison
    await this.sendEmail({
      to: sender.email,
      template: 'delivery-proof-fr.html',
      subject: `✅ Colis ${parcel.trackingNumber} livré avec succès`,
      variables: {
        senderName: sender.name,
        trackingNumber: parcel.trackingNumber,
        receiverName: delivery.recipientName,
        deliveryDate: delivery.deliveredAt.toDate().toLocaleDateString('fr-BE'),
        signatureUrl: delivery.signatureUrl,
        photoUrl: delivery.parcelPhotoUrl
      }
    });

    // WhatsApp Destinataire (merci)
    await this.sendWhatsApp({
      to: receiver.phone.whatsapp,
      template: 'delivery_thanks',
      variables: {
        receiverName: receiver.name,
        feedbackUrl: 'https://befret.be/feedback'
      }
    });
  }
}
```

---

## 🔐 SÉCURITÉ & PERMISSIONS

### Rôles Firebase Auth

```typescript
interface CustomClaims {
  role: 'super_admin' | 'admin' | 'cb_tubize' | 'cb_kinshasa' | 'cb_lubumbashi' | 'viewer';
  location?: 'TUBIZE' | 'KINSHASA' | 'LUBUMBASHI';
  permissions: Permission[];
}

type Permission =
  | 'reception.read'
  | 'reception.write'
  | 'weighing.read'
  | 'weighing.write'
  | 'preparation.read'
  | 'preparation.write'
  | 'expedition.read'
  | 'expedition.write'
  | 'delivery.read'
  | 'delivery.write'
  | 'admin.users'
  | 'admin.partners'
  | 'admin.team';
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function hasRole(role) {
      return isAuthenticated() && request.auth.token.role == role;
    }

    function hasPermission(permission) {
      return isAuthenticated() &&
             request.auth.token.permissions.hasAny([permission]);
    }

    function isLocation(location) {
      return isAuthenticated() &&
             request.auth.token.location == location;
    }

    // Shipments (lecture seule pour backoffice, écriture via befret_new)
    match /shipments/{shipmentId} {
      // Lecture : Tous CB authentifiés
      allow read: if isAuthenticated() &&
                     (hasRole('super_admin') ||
                      hasRole('admin') ||
                      hasRole('cb_tubize') ||
                      hasRole('cb_kinshasa') ||
                      hasRole('cb_lubumbashi'));

      // Écriture : Seulement sous-document logistics
      allow update: if isAuthenticated() &&
                       hasPermission('*.write') &&
                       // Vérifier que seul logistics est modifié
                       request.resource.data.diff(resource.data).affectedKeys()
                         .hasOnly(['logistics', 'logisticsStatus', 'updatedAt']);
    }

    // Groupings
    match /groupings/{groupingId} {
      allow read: if isAuthenticated();

      allow create: if isAuthenticated() &&
                       (hasPermission('expedition.write') ||
                        hasRole('cb_tubize'));

      allow update: if isAuthenticated() &&
                       (hasPermission('expedition.write') ||
                        (hasRole('cb_kinshasa') && resource.data.destination == 'KINSHASA') ||
                        (hasRole('cb_lubumbashi') && resource.data.destination == 'LUBUMBASHI'));
    }

    // Team Logistics
    match /team_logistics/{memberId} {
      allow read: if isAuthenticated();

      allow write: if hasRole('super_admin') ||
                      hasRole('admin') ||
                      hasPermission('admin.team');
    }

    // Shipping Partners
    match /shipping_partners/{partnerId} {
      allow read: if isAuthenticated();

      allow write: if hasRole('super_admin') ||
                      hasPermission('admin.partners');
    }
  }
}
```

---

## 📅 PLAN D'IMPLÉMENTATION

### Phase 1 : Fondations (Semaine 1-2)

**Objectif** : Architecture de base + Auth

**Livrables** :
1. ✅ Setup Next.js 14 + TypeScript + Tailwind
2. ✅ Configuration Firebase (Firestore, Auth, Storage)
3. ✅ Système d'authentification avec rôles
4. ✅ Layout principal avec navigation
5. ✅ Composants UI de base (Shadcn/ui)
6. ✅ State management (Zustand stores)
7. ✅ Types TypeScript complets

**Tests** :
- Login/Logout
- Protection routes par rôle
- Navigation fonctionnelle

---

### Phase 2 : Module Réception (Semaine 3)

**Objectif** : Réception + Pesée

**Livrables** :
1. ✅ Scanner QR/Barcode
2. ✅ Page Réception (recherche + confirmation)
3. ✅ Intégration balance (API Weight)
4. ✅ Page Pesée (calcul delta + validation)
5. ✅ Service notifications (WhatsApp + Email)
6. ✅ Tests notifications réception/pesée

**Tests** :
- Scanner code DPD → Trouve colis
- Confirmer réception → Notif expéditeur
- Peser colis → Calcul delta → Notif si écart

---

### Phase 3 : Module Préparation (Semaine 4)

**Objectif** : Vérification + Étiquetage + Tri

**Livrables** :
1. ✅ Page Vérification colis
2. ✅ Gestion statuts (OK/Vide/Dangereux/Attente)
3. ✅ Génération étiquette Congo (PDF)
4. ✅ Intégration Camera (react-webcam)
5. ✅ Upload photos Firebase Storage
6. ✅ Page Tri destination
7. ✅ Page Classement (vignettes + liste)

**Tests** :
- Vérifier colis → Emballer → Imprimer étiquette
- Prendre photo colis étiqueté
- Trier par destination
- Visualiser colis classés

---

### Phase 4 : Module Expédition (Semaine 5-6)

**Objectif** : Groupage + Expédition

**Livrables** :
1. ✅ Collection `groupings` Firestore
2. ✅ Page Groupage (scanner + poids temps réel)
3. ✅ Gestion limites poids
4. ✅ Génération étiquette groupage
5. ✅ Capture vidéo filmage
6. ✅ Page Choix mode expédition
7. ✅ Page Chaîne de contact (stepper)
8. ✅ Gestion partenaires expédition
9. ✅ Confirmation expédition + Notifications

**Tests** :
- Créer groupage 23kg
- Scanner colis jusqu'à limite
- Filmer → Imprimer étiquette
- Sélectionner mode/partenaire
- Compléter chaîne contact
- Confirmer expédition → Notif tous expéditeurs/destinataires

---

### Phase 5 : Module Arrivée & Dégroupage (Semaine 7)

**Objectif** : Réception Congo + Dégroupage

**Livrables** :
1. ✅ Page Confirmation arrivée
2. ✅ Page Pesée groupage (contrôle final)
3. ✅ Page Dégroupage (scan individuel + pesée)
4. ✅ Validation/Blocage colis
5. ✅ Upload photos dégroupage

**Tests** :
- Réceptionner groupage arrivé
- Peser groupage → Alert si delta
- Dégrouper → Peser chaque colis
- Valider colis OK
- Bloquer colis endommagé

---

### Phase 6 : Module Livraison (Semaine 8)

**Objectif** : Tri + Livraison finale

**Livrables** :
1. ✅ Page Tri mode livraison
2. ✅ Page Livraison warehouse pickup
3. ✅ Scan pièce d'identité
4. ✅ Signature électronique
5. ✅ Page Livraison home delivery
6. ✅ Gestion tentatives échouées
7. ✅ Notifications finales

**Tests** :
- Trier colis par mode livraison
- Livrer colis warehouse : ID + Signature + Photos
- Notif expéditeur + destinataire
- Tenter livraison domicile échouée → Notif

---

### Phase 7 : Module Historique & Admin (Semaine 9)

**Objectif** : Historique + Administration

**Livrables** :
1. ✅ Page Historique complet colis
2. ✅ Timeline visuelle
3. ✅ Carte GPS trajet
4. ✅ Galerie photos toutes étapes
5. ✅ Export PDF historique
6. ✅ Page Gestion utilisateurs (CRUD)
7. ✅ Page Gestion team logistics (CRUD)
8. ✅ Page Gestion partenaires (CRUD)

**Tests** :
- Visualiser historique complet colis livré
- Exporter PDF trajet
- Admin : Créer CB Kinshasa
- Admin : Ajouter contact expédition
- Admin : Ajouter partenaire MCO

---

### Phase 8 : Module Colis (All) & Optimisations (Semaine 10)

**Objectif** : Vue d'ensemble + Performances

**Livrables** :
1. ✅ Page Liste tous colis (virtualization)
2. ✅ Filtres avancés multicritères
3. ✅ Recherche full-text
4. ✅ Export CSV/Excel
5. ✅ Optimisations performances
6. ✅ Cache intelligent
7. ✅ Pagination infinie

**Tests** :
- Filtrer par statut + destination + poids
- Rechercher tracking number
- Export Excel 1000 colis
- Performances < 2s chargement

---

### Phase 9 : Tests & Documentation (Semaine 11)

**Objectif** : Qualité + Formation

**Livrables** :
1. ✅ Tests end-to-end (Playwright)
2. ✅ Tests unitaires composants
3. ✅ Documentation technique complète
4. ✅ Guide utilisateur CB
5. ✅ Vidéos formation par module
6. ✅ Troubleshooting guide

---

### Phase 10 : Déploiement & Monitoring (Semaine 12)

**Objectif** : Production Ready

**Livrables** :
1. ✅ Déploiement Vercel (backoffice.befret.be)
2. ✅ Monitoring Sentry (erreurs)
3. ✅ Analytics Mixpanel (usage)
4. ✅ Logs structurés
5. ✅ Backups automatiques Firestore
6. ✅ Formation équipes terrain
7. ✅ Go Live 🚀

---

## 🎯 CONCLUSION

Cette architecture backoffice BeFret MVP Logistique est conçue pour :

1. **Traçabilité maximale** : Chaque action enregistrée avec photo + GPS + timestamp
2. **Autonomie terrain** : CB peuvent gérer tout le workflow sans intervention IT
3. **Qualité opérationnelle** : Contrôles poids, validations, photos obligatoires
4. **Communication automatique** : Notifications WhatsApp + Email à chaque étape clé
5. **Scalabilité** : Architecture modulaire permettant ajouts futurs (nouvelles destinations, nouveaux workflows)

**Prêt pour implémentation immédiate** avec stack moderne (Next.js 14 + Firestore + Firebase).

---

*Document vivant - Mise à jour continue durant implémentation*
*Prochaine étape : Phase 1 - Setup technique*
