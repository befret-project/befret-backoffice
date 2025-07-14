# 🚀 SETUP RAPIDE SENDGRID - TEMPLATES PESÉE

## 📋 **CHECKLIST RAPIDE**

### **✅ Étape 1: Accès SendGrid**
- [ ] Se connecter à [SendGrid Dashboard](https://app.sendgrid.com/)
- [ ] Aller dans **Email API** → **Dynamic Templates**

### **✅ Étape 2: Créer Template 1 - Confirmation Pesée**
- [ ] Cliquer **Create a Dynamic Template**
- [ ] **Template Name** : `Weighing Confirmation Template`
- [ ] **Add Version** → **Code Editor**
- [ ] Copier le HTML du template 1 depuis `SENDGRID_TEMPLATES.md`
- [ ] **Subject** : `✅ Pesée confirmée - {{trackingCode}}`
- [ ] **Save** → Noter l'ID : `d-_________________________`

### **✅ Étape 3: Créer Template 2 - Supplément**
- [ ] Créer nouveau template
- [ ] **Template Name** : `Weight Supplement Required`
- [ ] Copier le HTML du template 2
- [ ] **Subject** : `💰 Supplément de poids requis - {{trackingCode}}`
- [ ] **Save** → Noter l'ID : `d-_________________________`

### **✅ Étape 4: Créer Template 3 - Remboursement**
- [ ] Créer nouveau template  
- [ ] **Template Name** : `Weight Refund Available`
- [ ] Copier le HTML du template 3
- [ ] **Subject** : `💚 Remboursement disponible - {{trackingCode}}`
- [ ] **Save** → Noter l'ID : `d-_________________________`

---

## ⚡ **MISE À JOUR AUTOMATIQUE**

### **Une fois les 3 IDs récupérés :**

```bash
# Exemple avec de vrais IDs SendGrid
./scripts/update-template-ids.sh \
  d-abc123def456ghi789jkl012mno345pq \
  d-rst678uvw901xyz234abc567def890gh \
  d-hij012klm345nop678qrs901tuv234wx
```

### **Le script va automatiquement :**
- ✅ Valider le format des IDs
- ✅ Mettre à jour `befret_new/functions/dev/src/index.ts`
- ✅ Mettre à jour la documentation
- ✅ Créer un fichier de configuration JSON
- ✅ Créer des sauvegardes horodatées

---

## 🧪 **TEST RAPIDE**

### **Dans SendGrid - Test Data :**
```json
{
  "fullname": "Jean Dupont",
  "pType": "paquet",
  "trackingCode": "TEST123",
  "city": "Kinshasa",
  "trackingURL": "https://befret.be/details?trackingID=TEST123",
  "actualWeight": 2.3,
  "declaredWeight": 2.0,
  "weightDifference": 0.3,
  "weightDifferencePercentage": "15.0",
  "weighingPhotos": ["https://picsum.photos/300/200"],
  "weighingStatus": "supplement_required",
  "supplementAmount": 0.75
}
```

### **Preview attendu :**
- 📧 Email avec photos de balance
- ⚖️ Comparaison poids déclaré vs réel
- 💰 Montant supplément calculé
- 🔗 Bouton de paiement (si applicable)

---

## 🎯 **RÉSULTAT FINAL**

### **Après setup complet :**
- ✅ **3 templates SendGrid** opérationnels
- ✅ **befret_new** mis à jour avec vrais IDs
- ✅ **Station de pesée** connectée aux notifications
- ✅ **Tests** prêts à être exécutés

### **Ready for production !** 🚀

---

## 📞 **EN CAS DE PROBLÈME**

### **Templates non visibles :**
- Vérifier les permissions SendGrid
- S'assurer d'être dans le bon compte/subuser

### **Erreurs de format HTML :**
- Utiliser le mode "Code Editor"
- Tester avec Preview avant de sauver

### **Variables non remplacées :**
- Vérifier la syntaxe Handlebars `{{variable}}`
- Tester avec les données d'exemple fournies

---

## 🎉 **PRÊT !**

**Une fois les templates créés et les IDs récupérés, exécuter le script et les notifications de pesée seront opérationnelles !**