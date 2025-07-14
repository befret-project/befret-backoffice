# PLAN DE TEST - BEFRET BACKOFFICE
## Sprints 1 & 2 : Réception et Préparation des Colis

---

## 📋 SPRINT 1 - RÉCEPTION DES COLIS

### 🎯 Objectifs de test
- Vérifier la réception correcte des colis
- Validation des données saisies
- Gestion des statuts logistiques
- Intégration avec la base de données Firestore

### 🔧 Prérequis techniques
- Accès à l'environnement de développement : `https://befret-development-e3cb5.web.app`
- Compte agent logistique configuré
- Base de données Firestore opérationnelle
- Données de test disponibles (430+ colis)

---

### 🧪 SCÉNARIOS DE TEST - RÉCEPTION

#### **TC-R001 : Réception normale d'un colis**
**Objectif :** Vérifier la réception standard d'un colis attendu

**Préconditions :**
- Colis avec trackingID : `BF-TEST-001`
- Statut initial : `pending`
- Poids déclaré : `2.5 kg`
- Destination : `Kinshasa`

**Étapes :**
1. Naviguer vers `/logistic/colis/reception`
2. Scanner/saisir le trackingID `BF-TEST-001`
3. Vérifier l'affichage des informations du colis
4. Confirmer la réception
5. Vérifier le changement de statut vers `received`

**Résultat attendu :**
- Colis affiché avec toutes ses informations
- Statut mis à jour vers `received`
- Timestamp `receivedAt` enregistré
- Agent réceptionniste enregistré

**Critères de réussite :**
- ✅ Informations correctes affichées
- ✅ Statut mis à jour en base
- ✅ Historique des actions créé

---

#### **TC-R002 : Réception avec écart de poids mineur**
**Objectif :** Tester la gestion d'un écart de poids acceptable

**Préconditions :**
- Colis avec trackingID : `BF-TEST-002`
- Poids déclaré : `3.0 kg`
- Tolérance : ±200g

**Étapes :**
1. Réceptionner le colis `BF-TEST-002`
2. Saisir le poids réel : `3.15 kg` (écart de +150g)
3. Confirmer la réception
4. Vérifier le statut final

**Résultat attendu :**
- Réception acceptée automatiquement
- Statut : `received`
- Écart enregistré mais pas de blocage

**Critères de réussite :**
- ✅ Réception automatique
- ✅ Écart documenté
- ✅ Pas d'alerte bloquante

---

#### **TC-R003 : Réception avec écart de poids majeur**
**Objectif :** Tester la gestion d'un écart de poids dépassant la tolérance

**Préconditions :**
- Colis avec trackingID : `BF-TEST-003`
- Poids déclaré : `2.0 kg`
- Tolérance : ±200g

**Étapes :**
1. Réceptionner le colis `BF-TEST-003`
2. Saisir le poids réel : `2.8 kg` (écart de +800g)
3. Vérifier l'alerte d'écart
4. Prendre une photo justificative
5. Ajouter une note explicative
6. Confirmer la réception

**Résultat attendu :**
- Alerte d'écart affiché
- Demande de justification
- Statut : `weight_discrepancy`
- Escalade vers superviseur

**Critères de réussite :**
- ⚠️ Alerte clairement visible
- ✅ Photo obligatoire capturée
- ✅ Workflow d'escalade déclenché

---

#### **TC-R004 : Colis non trouvé**
**Objectif :** Tester la gestion d'un trackingID inexistant

**Préconditions :**
- TrackingID inexistant : `BF-FAKE-999`

**Étapes :**
1. Naviguer vers la réception
2. Saisir le trackingID `BF-FAKE-999`
3. Vérifier le message d'erreur
4. Tenter une recherche alternative

**Résultat attendu :**
- Message d'erreur explicite
- Suggestions de recherche
- Possibilité de créer un nouveau colis

**Critères de réussite :**
- ❌ Message d'erreur informatif
- 🔍 Options de recherche proposées
- ➕ Workflow de création disponible

---

#### **TC-R005 : Réception multiple - Lot de colis**
**Objectif :** Tester la réception de plusieurs colis simultanément

**Préconditions :**
- Lot de 5 colis : `BF-LOT-001` à `BF-LOT-005`
- Tous avec statut `pending`

**Étapes :**
1. Activer le mode "Réception groupée"
2. Scanner successivement les 5 trackingIDs
3. Vérifier la liste des colis scannés
4. Confirmer la réception du lot
5. Vérifier la mise à jour de tous les statuts

**Résultat attendu :**
- Interface de lot fonctionnelle
- Validation groupée possible
- Tous les colis mis à jour

**Critères de réussite :**
- 📦 Interface batch intuitive
- ✅ Validation groupée réussie
- 🔄 Statuts mis à jour en lot

---

### 🧪 SCÉNARIOS DE TEST - GESTION DES ERREURS

#### **TC-R006 : Colis déjà réceptionné**
**Objectif :** Tester la gestion d'un double scan

**Préconditions :**
- Colis `BF-TEST-006` déjà réceptionné
- Statut actuel : `received`

**Étapes :**
1. Tenter de scanner à nouveau `BF-TEST-006`
2. Vérifier le message d'avertissement
3. Consulter l'historique de réception

**Résultat attendu :**
- Avertissement de double réception
- Historique complet visible
- Pas de double enregistrement

**Critères de réussite :**
- ⚠️ Avertissement clair
- 📋 Historique accessible
- 🚫 Pas de duplication

---

#### **TC-R007 : Colis endommagé à la réception**
**Objectif :** Tester le workflow de gestion des dommages

**Préconditions :**
- Colis `BF-TEST-007` avec dommages visibles

**Étapes :**
1. Réceptionner le colis `BF-TEST-007`
2. Marquer comme "Endommagé"
3. Prendre photos des dommages
4. Remplir le rapport de dommage
5. Définir le niveau de gravité
6. Confirmer la réception

**Résultat attendu :**
- Workflow de dommage activé
- Photos et rapport enregistrés
- Statut : `damaged`
- Notification client générée

**Critères de réussite :**
- 📸 Photos de qualité capturées
- 📝 Rapport détaillé complété
- 🔔 Notification envoyée

---

---

## 📋 SPRINT 2 - PRÉPARATION DES COLIS

### 🎯 Objectifs de test
- Vérifier la pesée et vérification des colis
- Validation du système de tri automatique
- Gestion des cas spéciaux
- Intégration des paiements Stripe

### 🔧 Prérequis techniques
- Colis réceptionnés du Sprint 1
- Station de pesée configurée
- Intégration Stripe opérationnelle
- Zones de tri définies (A, B, C, D)

---

### 🧪 SCÉNARIOS DE TEST - PESÉE ET VÉRIFICATION

#### **TC-P001 : Pesée conforme - Tri automatique**
**Objectif :** Tester la pesée normale et le tri automatique

**Préconditions :**
- Colis `BF-TEST-001` réceptionné
- Poids déclaré : `2.5 kg`
- Destination : `Kinshasa`

**Étapes :**
1. Naviguer vers `/logistic/colis/preparation`
2. Rechercher le colis `BF-TEST-001`
3. Peser le colis : `2.45 kg` (écart de -50g)
4. Prendre photo de la balance
5. Enregistrer la pesée
6. Vérifier le déclenchement du tri automatique

**Résultat attendu :**
- Pesée acceptée (écart < 200g)
- Statut : `weighed` puis `sorted`
- Tri automatique vers Zone A (Kinshasa)
- Notification client envoyée

**Critères de réussite :**
- ✅ Pesée dans la tolérance
- 🤖 Tri automatique déclenché
- 📍 Assignation Zone A correcte
- 📧 Notification envoyée

---

#### **TC-P002 : Pesée avec supplément - Génération paiement**
**Objectif :** Tester la gestion des suppléments de poids

**Préconditions :**
- Colis `BF-TEST-002` réceptionné
- Poids déclaré : `2.0 kg`
- Coût initial : `25.00 €`

**Étapes :**
1. Peser le colis : `2.8 kg` (écart de +800g)
2. Vérifier le calcul du supplément
3. Prendre photo justificative
4. Générer le lien de paiement Stripe
5. Vérifier l'e-mail envoyé au client
6. Confirmer le blocage en Zone D

**Résultat attendu :**
- Supplément calculé : `+2.00 €` (800g × 2.5€/kg)
- Lien Stripe généré
- Statut : `weight_issue`
- Assignation Zone D (paiement en attente)

**Critères de réussite :**
- 💰 Calcul supplément correct
- 💳 Lien Stripe fonctionnel
- 🔒 Blocage en Zone D
- 📧 E-mail client envoyé

---

#### **TC-P003 : Cas spécial - Colis fragile**
**Objectif :** Tester la gestion des cas spéciaux

**Préconditions :**
- Colis `BF-TEST-003` contenant des objets fragiles
- Poids conforme : `1.8 kg`

**Étapes :**
1. Peser le colis normalement
2. Cliquer sur "Marquer cas spécial"
3. Sélectionner "Fragile"
4. Prendre photo du contenu
5. Ajouter instructions spéciales
6. Confirmer le cas spécial

**Résultat attendu :**
- Statut : `special_case`
- Type : `fragile`
- Assignation Zone C (cas spéciaux)
- Instructions particulières enregistrées

**Critères de réussite :**
- 🏷️ Marquage cas spécial
- 📸 Photo justificative
- 🎯 Assignation Zone C
- 📝 Instructions conservées

---

#### **TC-P004 : Pesée Lubumbashi - Tri automatique Zone B**
**Objectif :** Tester le tri automatique vers Lubumbashi

**Préconditions :**
- Colis `BF-TEST-004` réceptionné
- Destination : `Lubumbashi`
- Poids déclaré : `3.2 kg`

**Étapes :**
1. Peser le colis : `3.15 kg` (écart de -50g)
2. Prendre photo de la balance
3. Enregistrer la pesée
4. Vérifier le tri automatique

**Résultat attendu :**
- Pesée acceptée
- Tri automatique vers Zone B (Lubumbashi)
- Statut : `sorted`
- Zone assignée : `B`

**Critères de réussite :**
- ✅ Tri automatique réussi
- 🎯 Zone B assignée
- 📍 Destination correcte

---

#### **TC-P005 : Lot de pesée - Traitement groupé**
**Objectif :** Tester le traitement par lot

**Préconditions :**
- Lot de 10 colis réceptionnés
- Destinations mixtes (5 Kinshasa, 5 Lubumbashi)

**Étapes :**
1. Activer le mode "Pesée groupée"
2. Peser successivement les 10 colis
3. Valider toutes les pesées conformes
4. Déclencher le tri automatique groupé
5. Vérifier la répartition en zones

**Résultat attendu :**
- 5 colis en Zone A (Kinshasa)
- 5 colis en Zone B (Lubumbashi)
- Tous les statuts mis à jour
- Rapport de traitement généré

**Critères de réussite :**
- 📦 Traitement par lot efficace
- 🎯 Répartition correcte
- 📊 Rapport complet généré

---

### 🧪 SCÉNARIOS DE TEST - INTÉGRATION STRIPE

#### **TC-P006 : Paiement Stripe - Workflow complet**
**Objectif :** Tester l'intégration complète des paiements

**Préconditions :**
- Colis avec supplément de `5.00 €`
- Clés Stripe configurées
- E-mail client valide

**Étapes :**
1. Générer le lien de paiement
2. Simuler le paiement client (mode test)
3. Vérifier le webhook de confirmation
4. Contrôler la mise à jour du statut
5. Vérifier le déblocage automatique

**Résultat attendu :**
- Lien Stripe fonctionnel
- Paiement test réussi
- Statut mis à jour vers `paid`
- Tri automatique déclenché

**Critères de réussite :**
- 💳 Paiement Stripe réussi
- 🔄 Webhook traité
- ✅ Statut mis à jour
- 🚀 Tri automatique post-paiement

---

### 🧪 SCÉNARIOS DE TEST - DASHBOARD DE TRI

#### **TC-P007 : Dashboard temps réel**
**Objectif :** Vérifier l'affichage temps réel du dashboard

**Préconditions :**
- Plusieurs colis triés dans différentes zones
- Dashboard de tri accessible

**Étapes :**
1. Naviguer vers `/logistic/sorting`
2. Vérifier les statistiques par zone
3. Trier un nouveau colis
4. Vérifier la mise à jour temps réel
5. Tester les filtres par zone

**Résultat attendu :**
- Statistiques correctes affichées
- Mise à jour temps réel fonctionnelle
- Filtres opérationnels
- Graphiques mis à jour

**Critères de réussite :**
- 📊 Statistiques exactes
- 🔄 Temps réel fonctionnel
- 🔍 Filtres efficaces
- 📈 Graphiques dynamiques

---

## 📊 CRITÈRES DE VALIDATION GLOBAUX

### ✅ Sprint 1 - Critères de réussite
- **Fonctionnalité** : 100% des scénarios de réception passent
- **Performance** : Réception d'un colis < 30 secondes
- **Fiabilité** : 0% de perte de données
- **Utilisabilité** : Interface intuitive pour les agents

### ✅ Sprint 2 - Critères de réussite
- **Fonctionnalité** : 100% des scénarios de pesée/tri passent
- **Performance** : Pesée + tri automatique < 45 secondes
- **Intégration** : Stripe 100% opérationnel
- **Précision** : Tri automatique 100% correct

### 🔧 Environnement de test
- **URL** : `https://befret-development-e3cb5.web.app`
- **APIs** : `https://api-rcai6nfrla-uc.a.run.app`
- **Base de données** : Firestore (befret-development)
- **Paiements** : Stripe (mode test)

### 📋 Livrables attendus
- [ ] Rapport de test détaillé
- [ ] Screenshots des interfaces
- [ ] Logs d'erreurs identifiées
- [ ] Recommandations d'amélioration
- [ ] Validation des performances

---

## 🚀 PLANNING D'EXÉCUTION

### Phase 1 - Sprint 1 (Semaine 1)
- **Jours 1-2** : Tests de réception normale
- **Jours 3-4** : Tests de gestion d'erreurs
- **Jour 5** : Tests de performance et rapport

### Phase 2 - Sprint 2 (Semaine 2)
- **Jours 1-2** : Tests de pesée et tri
- **Jours 3-4** : Tests d'intégration Stripe
- **Jour 5** : Tests dashboard et rapport final

### Phase 3 - Validation croisée (Semaine 3)
- **Jours 1-2** : Tests de non-régression
- **Jours 3-4** : Tests de charge
- **Jour 5** : Validation finale et déploiement

---

*Plan de test généré pour BEFRET Backoffice - Sprints 1 & 2*
*Version 1.0 - Environnement de développement*