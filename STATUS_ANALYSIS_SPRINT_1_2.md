# ANALYSE DES STATUTS - SPRINTS 1 & 2

## 🔍 PROBLÈMES IDENTIFIÉS

### 1. Double système de statuts
- `status` : Statut principal (pending, to_warehouse, delivered...)
- `logisticsStatus` : Statut logistique détaillé (pending_reception, received, weighed...)

### 2. Champs dupliqués et incohérents
- `logisticStatus` (string) - Ancien
- `logisticsStatus` (LogisticsStatusEnum) - Nouveau

### 3. Workflows désynchronisés
- Sprint 1 (Réception) modifie `logisticsStatus`
- Sprint 2 (Pesée) modifie `logisticsStatus` mais n'impacte pas `status`
- Interface de réception lit les deux de façon incohérente

## 🎯 SOLUTION UNIFIÉE

### Phase 1 : Standardisation des statuts logistiques

**Flux Sprint 1 - Réception :**
```
1. État initial : logisticsStatus: 'pending_reception'
2. Après réception : logisticsStatus: 'received' + status: 'to_warehouse'
```

**Flux Sprint 2 - Pesée :**
```
1. État initial : logisticsStatus: 'received'
2. Après pesée OK : logisticsStatus: 'verified' + status: 'to_warehouse'
3. Après pesée problème : logisticsStatus: 'weight_issue' + status: 'pending'
4. Après tri : logisticsStatus: 'sorted' + status: 'to_warehouse'
```

### Phase 2 : Mappings d'affichage unifiés

**Interface de réception :**
- Afficher seulement : `pending_reception` et `received`
- Masquer : `verified`, `weight_issue`, `sorted`

**Interface de pesée :**
- Afficher seulement : `received`
- Après traitement : `verified`, `weight_issue`, `sorted`

**Interface de tri :**
- Afficher : `verified`, `weight_issue` 
- Après traitement : `sorted`

## 🛠️ CORRECTIONS À APPLIQUER

### 1. Service Firebase
- ✅ Unifier `updateLogisticFields` pour cohérence status/logisticsStatus
- ✅ Corriger `getRecentReceptions` avec bon filtre
- ✅ Ajouter logs pour traçabilité

### 2. Interfaces
- ✅ Réception : Filtrer par statuts appropriés
- ✅ Pesée : Affichage cohérent des statuts
- ✅ Tri : Workflow complet

### 3. Mappings
- ✅ Créer mappings unifiés pour l'affichage
- ✅ Labels français cohérents
- ✅ Couleurs de statuts standardisées

### 4. Types TypeScript
- ✅ Standardiser LogisticsStatusEnum
- ✅ Supprimer logisticStatus dupliqué
- ✅ Interface Parcel cohérente