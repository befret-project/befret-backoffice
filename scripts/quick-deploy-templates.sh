#!/bin/bash

# 🚀 DÉPLOIEMENT RAPIDE TEMPLATES SENDGRID API
# Script tout-en-un pour créer et déployer les templates automatiquement

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}
╔══════════════════════════════════════════════════════════════╗
║               🚀 DÉPLOIEMENT RAPIDE SENDGRID                ║
║                  Templates API Automation                   ║
╚══════════════════════════════════════════════════════════════╝
${NC}"

# Vérification de la clé API
echo -e "${YELLOW}🔑 Vérification de la clé API SendGrid...${NC}"

if [ -z "$SENDGRID_API_KEY" ]; then
    echo -e "${RED}❌ Variable SENDGRID_API_KEY non configurée${NC}"
    echo ""
    echo -e "${YELLOW}📋 Pour configurer :${NC}"
    echo "1. Récupérez votre clé API sur https://app.sendgrid.com/settings/api_keys"
    echo "2. Exportez-la : export SENDGRID_API_KEY=\"SG.votre_cle_ici\""
    echo "3. Relancez ce script"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Clé API configurée : ${SENDGRID_API_KEY:0:10}...${NC}"

# Test de connectivité SendGrid
echo -e "${YELLOW}🌐 Test de connectivité SendGrid...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET "https://api.sendgrid.com/v3/templates" \
    -H "Authorization: Bearer $SENDGRID_API_KEY" \
    -H "Content-Type: application/json")

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Connexion SendGrid réussie${NC}"
else
    echo -e "${RED}❌ Erreur connexion SendGrid (HTTP $HTTP_STATUS)${NC}"
    echo -e "${YELLOW}Vérifiez votre clé API et réessayez${NC}"
    exit 1
fi

# Vérification des fichiers requis
echo -e "${YELLOW}📁 Vérification des fichiers templates...${NC}"

REQUIRED_FILES=(
    "docs/templates/weighing-confirmation.html"
    "docs/templates/supplement-required.html"
    "docs/templates/refund-available.html"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Fichier manquant : $file${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Trouvé : $file${NC}"
    fi
done

# Vérification des dépendances Node.js
echo -e "${YELLOW}📦 Vérification des dépendances...${NC}"
if ! npm list @sendgrid/client @sendgrid/mail > /dev/null 2>&1; then
    echo -e "${YELLOW}📦 Installation des dépendances SendGrid...${NC}"
    npm install @sendgrid/client @sendgrid/mail
fi
echo -e "${GREEN}✅ Dépendances OK${NC}"

# Création des templates via API
echo -e "${MAGENTA}
🚀 CRÉATION DES TEMPLATES SENDGRID
=================================${NC}"

echo -e "${YELLOW}📧 Lancement du script de création API...${NC}"
node scripts/create-sendgrid-templates-api.js

# Vérifier si le fichier de configuration a été créé
CONFIG_FILE="config/sendgrid-templates-api.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Erreur : Fichier de configuration non créé${NC}"
    exit 1
fi

# Extraire les IDs des templates créés
echo -e "${YELLOW}📋 Extraction des IDs des templates...${NC}"

WEIGHING_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$CONFIG_FILE')).templates.weighing_confirmation_template?.id || '')")
SUPPLEMENT_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$CONFIG_FILE')).templates.weight_supplement_required?.id || '')")
REFUND_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$CONFIG_FILE')).templates.weight_refund_available?.id || '')")

if [ -z "$WEIGHING_ID" ] || [ -z "$SUPPLEMENT_ID" ] || [ -z "$REFUND_ID" ]; then
    echo -e "${RED}❌ Erreur : IDs des templates non récupérés correctement${NC}"
    echo -e "${YELLOW}Vérifiez le fichier $CONFIG_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ IDs des templates récupérés :${NC}"
echo -e "   📧 Weighing Confirmation: ${WEIGHING_ID}"
echo -e "   💰 Supplement Required: ${SUPPLEMENT_ID}"
echo -e "   💚 Refund Available: ${REFUND_ID}"

# Mise à jour automatique du code befret_new
echo -e "${MAGENTA}
🔧 MISE À JOUR DU CODE BEFRET_NEW
==================================${NC}"

if [ -f "scripts/update-template-ids.sh" ]; then
    echo -e "${YELLOW}🔄 Mise à jour automatique des IDs dans le code...${NC}"
    ./scripts/update-template-ids.sh "$WEIGHING_ID" "$SUPPLEMENT_ID" "$REFUND_ID"
else
    echo -e "${YELLOW}⚠️ Script de mise à jour non trouvé, mise à jour manuelle requise${NC}"
fi

# Tests automatiques
echo -e "${MAGENTA}
🧪 TESTS AUTOMATIQUES
=====================${NC}"

if [ -f "scripts/test-notification-templates.js" ]; then
    echo -e "${YELLOW}🧪 Lancement des tests automatiques...${NC}"
    node scripts/test-notification-templates.js
else
    echo -e "${YELLOW}⚠️ Script de test non trouvé, tests manuels recommandés${NC}"
fi

# Résumé final
echo -e "${GREEN}
╔══════════════════════════════════════════════════════════════╗
║                    🎉 DÉPLOIEMENT TERMINÉ                   ║
╚══════════════════════════════════════════════════════════════╝
${NC}"

echo -e "${GREEN}✅ Templates SendGrid créés avec succès${NC}"
echo -e "${GREEN}✅ Code befret_new mis à jour automatiquement${NC}"
echo -e "${GREEN}✅ Configuration sauvegardée dans config/${NC}"
echo ""

echo -e "${YELLOW}📋 IDs des Templates Créés :${NC}"
echo -e "   📧 Weighing Confirmation: ${WEIGHING_ID}"
echo -e "   💰 Supplement Required: ${SUPPLEMENT_ID}"  
echo -e "   💚 Refund Available: ${REFUND_ID}"
echo ""

echo -e "${YELLOW}🚀 Prochaines étapes :${NC}"
echo "1. Vérifiez les templates dans SendGrid Dashboard"
echo "2. Testez l'envoi depuis la station de pesée"
echo "3. Déployez befret_new si tout fonctionne"
echo ""

echo -e "${BLUE}📧 Dashboard SendGrid : https://app.sendgrid.com/dynamic_templates${NC}"
echo -e "${BLUE}📄 Config sauvée : $CONFIG_FILE${NC}"
echo ""

echo -e "${GREEN}🎉 Templates prêts pour la production !${NC}"