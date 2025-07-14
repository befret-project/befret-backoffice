# 🔑 CONFIGURATION CLÉ API SENDGRID

## 📋 **RÉCUPÉRATION DE LA CLÉ API**

### **1. Accès SendGrid Dashboard**
1. Se connecter à [SendGrid Dashboard](https://app.sendgrid.com/)
2. Aller dans **Settings** → **API Keys**
3. Cliquer **Create API Key**

### **2. Configuration de la Clé**
- **API Key Name** : `befret-template-automation`
- **API Key Permissions** : **Full Access** (ou minimum: Mail Send + Template Engine)
- **Scopes requis** :
  - ✅ Mail Send
  - ✅ Template Engine (Read & Write)
  - ✅ Dynamic Templates (Read & Write)

### **3. Sauvegarder la Clé**
⚠️ **IMPORTANT** : Copiez la clé immédiatement, elle ne sera plus visible !

Format : `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 🔧 **CONFIGURATION ENVIRONNEMENT**

### **Option A : Variable d'Environnement (Recommandé)**
```bash
# Linux/Mac
export SENDGRID_API_KEY="SG.votre_cle_api_ici"

# Windows (PowerShell)
$env:SENDGRID_API_KEY="SG.votre_cle_api_ici"

# Windows (CMD)
set SENDGRID_API_KEY=SG.votre_cle_api_ici
```

### **Option B : Fichier .env Local**
```bash
# Créer fichier .env dans befret-backoffice/
echo "SENDGRID_API_KEY=SG.votre_cle_api_ici" > .env
```

### **Vérification**
```bash
# Tester que la clé est configurée
echo $SENDGRID_API_KEY
# Doit afficher : SG.xxxxxxxxx...
```

---

## 🧪 **TEST DE LA CLÉ API**

### **Script de Test Rapide**
```bash
# Test de la connectivité SendGrid
curl -X GET "https://api.sendgrid.com/v3/templates" \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json"
```

### **Réponse Attendue**
```json
{
  "templates": [...],
  "metadata": {
    "prev": "",
    "self": "...",
    "next": "",
    "count": X
  }
}
```

---

## ⚠️ **SÉCURITÉ**

### **Bonnes Pratiques**
- ❌ **Ne jamais commit** la clé API dans Git
- ✅ **Utiliser** des variables d'environnement
- ✅ **Créer une clé dédiée** pour automation
- ✅ **Révoquer** si compromise

### **Ajout au .gitignore**
```bash
# Ajouter à .gitignore si pas déjà fait
echo ".env" >> .gitignore
echo "*.key" >> .gitignore
```

---

## 🎯 **PRÊT POUR L'AUTOMATION**

Une fois la clé configurée, vous pouvez exécuter :

```bash
cd /home/yannick/projets/befret-backoffice
node scripts/create-sendgrid-templates-api.js
```

**➡️ Le script va automatiquement créer les 3 templates et mettre à jour befret_new !**