# 📧 SETUP COMPLET TEMPLATES SENDGRID - STATION DE PESÉE

## 🎯 **OBJECTIF**
Créer et configurer les 3 templates SendGrid pour les notifications de pesée, puis les intégrer à la fonction `sendReceiptNotification` étendue.

---

## 📋 **ÉTAPES COMPLÈTES**

### **1️⃣ Créer les Templates SendGrid**

#### **Accès SendGrid**
1. Se connecter à [SendGrid Dashboard](https://app.sendgrid.com/)
2. Aller dans **Email API** → **Dynamic Templates**

#### **Templates à créer** (voir détails dans `docs/SENDGRID_TEMPLATES.md`)
- 📧 **Template 1** : Confirmation Pesée (`Weighing Confirmation Template`)
- 💰 **Template 2** : Supplément Requis (`Weight Supplement Required`)
- 💚 **Template 3** : Remboursement (`Weight Refund Available`)

### **2️⃣ Récupérer les IDs SendGrid**

Une fois les templates créés, noter les IDs (format `d-xxxxxxxxxxxxxxxxxxxxxxxxxx`) :

```
Template Confirmation : d-_________________________
Template Supplément   : d-_________________________  
Template Remboursement: d-_________________________
```

### **3️⃣ Mettre à jour le Code**

#### **Automatique avec le script**
```bash
# Remplacer par les vrais IDs récupérés
./scripts/update-template-ids.sh \
  d-abc123def456ghi789jkl012mno345pq \
  d-rst678uvw901xyz234abc567def890gh \
  d-hij012klm345nop678qrs901tuv234wx
```

#### **Manuel (si nécessaire)**
Remplacer dans `befret_new/functions/dev/src/index.ts` ligne 417 :
```typescript
// Remplacer
templateId = "d-WEIGHING-CONFIRMATION-TEMPLATE-ID";

// Par l'ID réel
templateId = "d-abc123def456ghi789jkl012mno345pq";
```

### **4️⃣ Tester les Templates**

#### **Test automatisé**
```bash
cd /home/yannick/projets/befret-backoffice
node scripts/test-notification-templates.js
```

#### **Test manuel avec curl**
Voir exemples dans `docs/NOTIFICATION_TEST_GUIDE.md`

### **5️⃣ Déployer**

#### **Functions befret_new**
```bash
cd /home/yannick/projets/befret_new/functions/dev
npm run deploy
```

#### **Backoffice**
```bash
cd /home/yannick/projets/befret-backoffice  
npm run deploy:dev
```

---

## 📁 **FICHIERS CRÉÉS**

### **Documentation**
- `docs/SENDGRID_TEMPLATES.md` - Templates HTML complets
- `docs/SENDGRID_QUICK_SETUP.md` - Guide rapide
- `docs/WEIGHING_NOTIFICATION_INTEGRATION.md` - Documentation technique
- `docs/NOTIFICATION_TEST_GUIDE.md` - Guide de test

### **Scripts**
- `scripts/update-template-ids.sh` - Mise à jour automatique des IDs
- `scripts/test-notification-templates.js` - Tests automatisés

### **Configuration**
- `config/sendgrid-template-ids.json` - IDs sauvegardés (créé par le script)

---

## ✅ **CHECKLIST DE VALIDATION**

### **SendGrid**
- [ ] 3 templates créés dans SendGrid
- [ ] Templates testés avec Preview
- [ ] IDs récupérés et notés

### **Code**
- [ ] IDs mis à jour dans befret_new
- [ ] Build befret_new réussi
- [ ] Build backoffice réussi

### **Tests**
- [ ] Tests automatisés passés
- [ ] Emails reçus sur adresse de test
- [ ] SMS reçus sur numéro de test
- [ ] Templates correctement formatés

### **Déploiement**
- [ ] Functions befret_new déployées
- [ ] Backoffice déployé
- [ ] Test end-to-end depuis station de pesée

---

## 🎯 **RÉSULTAT ATTENDU**

### **Workflow Complet**
1. **Agent** pèse un colis dans la station
2. **Système** détecte écart de poids
3. **Notification automatique** envoyée avec :
   - Email avec photos de balance
   - SMS contextuel selon statut
   - Template adapté au type de notification

### **Types de Notifications**
- ✅ **Pesée conforme** → Email de confirmation avec photos
- 💰 **Supplément requis** → Email + SMS avec montant et lien paiement  
- 💚 **Remboursement** → Email avec options remboursement/bon d'achat

---

## 🚨 **POINTS D'ATTENTION**

### **IDs Template**
- ⚠️ **Obligatoire** : Remplacer l'ID temporaire par les vrais IDs
- ⚠️ Format exact requis : `d-` suivi de 25-30 caractères alphanumériques

### **Tests**
- 📧 Tester avec de **vraies adresses email**
- 📱 Tester avec de **vrais numéros de téléphone**
- 🖼️ Vérifier que les **photos s'affichent** correctement

### **Production**
- 🔒 S'assurer que les **clés SendGrid sont configurées**
- 📊 **Monitorer les envois** via dashboard SendGrid
- 🚀 **Déployer progressivement** (dev → staging → prod)

---

## 🎉 **SUCCESS !**

**Une fois tous les étapes complétées :**

✅ Station de pesée connectée aux notifications  
✅ Templates SendGrid opérationnels  
✅ Rétrocompatibilité préservée  
✅ Workflow logistique automatisé  

**➡️ Système prêt pour la production !**

---

## 🆘 **SUPPORT**

### **En cas de problème :**
1. Vérifier les logs dans SendGrid Activity Feed
2. Consulter `docs/NOTIFICATION_TEST_GUIDE.md` pour debug
3. Utiliser le script de test pour validation

### **Contacts :**
- 📧 Documentation complète dans `/docs/`
- 🧪 Scripts de test dans `/scripts/`
- 🔧 Configuration dans `/config/`