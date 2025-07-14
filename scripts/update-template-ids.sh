#!/bin/bash

# 🔧 SCRIPT DE MISE À JOUR DES IDS TEMPLATES SENDGRID
# Usage: ./update-template-ids.sh WEIGHING_ID SUPPLEMENT_ID REFUND_ID

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 MISE À JOUR DES IDS TEMPLATES SENDGRID${NC}"
echo -e "${BLUE}======================================${NC}"

# Validation des paramètres
if [ $# -ne 3 ]; then
    echo -e "${RED}❌ Erreur: 3 IDs requis${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  $0 WEIGHING_ID SUPPLEMENT_ID REFUND_ID"
    echo ""
    echo -e "${YELLOW}Exemple:${NC}"
    echo "  $0 d-abc123def456 d-ghi789jkl012 d-mno345pqr678"
    echo ""
    exit 1
fi

WEIGHING_ID=$1
SUPPLEMENT_ID=$2
REFUND_ID=$3

# Validation du format des IDs
validate_id() {
    local id=$1
    local name=$2
    
    if [[ ! $id =~ ^d-[a-f0-9]{25,30}$ ]]; then
        echo -e "${RED}❌ Format invalide pour $name: $id${NC}"
        echo -e "${YELLOW}Format attendu: d-xxxxxxxxxxxxxxxxxxxxxxxxxx${NC}"
        exit 1
    fi
}

echo -e "${YELLOW}📋 Validation des IDs...${NC}"
validate_id "$WEIGHING_ID" "WEIGHING_ID"
validate_id "$SUPPLEMENT_ID" "SUPPLEMENT_ID"
validate_id "$REFUND_ID" "REFUND_ID"
echo -e "${GREEN}✅ Tous les IDs sont valides${NC}"

# Fichiers à modifier
BEFRET_NEW_FILE="../befret_new/functions/dev/src/index.ts"
BACKOFFICE_DOC="../befret-backoffice/docs/WEIGHING_NOTIFICATION_INTEGRATION.md"

echo ""
echo -e "${YELLOW}🔄 Mise à jour des fichiers...${NC}"

# 1. Mise à jour de befret_new/functions/dev/src/index.ts
if [ -f "$BEFRET_NEW_FILE" ]; then
    echo -e "${BLUE}📝 Mise à jour de $BEFRET_NEW_FILE${NC}"
    
    # Sauvegarde
    cp "$BEFRET_NEW_FILE" "$BEFRET_NEW_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Remplacement de l'ID temporaire
    sed -i "s/d-WEIGHING-CONFIRMATION-TEMPLATE-ID/$WEIGHING_ID/g" "$BEFRET_NEW_FILE"
    
    echo -e "${GREEN}  ✅ Remplacé d-WEIGHING-CONFIRMATION-TEMPLATE-ID par $WEIGHING_ID${NC}"
else
    echo -e "${YELLOW}  ⚠️  Fichier $BEFRET_NEW_FILE non trouvé${NC}"
fi

# 2. Mise à jour de la documentation
if [ -f "$BACKOFFICE_DOC" ]; then
    echo -e "${BLUE}📝 Mise à jour de $BACKOFFICE_DOC${NC}"
    
    # Sauvegarde
    cp "$BACKOFFICE_DOC" "$BACKOFFICE_DOC.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Remplacement des IDs dans la documentation
    sed -i "s/d-WEIGHING-CONFIRMATION-TEMPLATE-ID/$WEIGHING_ID/g" "$BACKOFFICE_DOC"
    sed -i "s/d-SUPPLEMENT-TEMPLATE-ID/$SUPPLEMENT_ID/g" "$BACKOFFICE_DOC"
    sed -i "s/d-REFUND-TEMPLATE-ID/$REFUND_ID/g" "$BACKOFFICE_DOC"
    
    echo -e "${GREEN}  ✅ Documentation mise à jour${NC}"
else
    echo -e "${YELLOW}  ⚠️  Fichier $BACKOFFICE_DOC non trouvé${NC}"
fi

# 3. Création d'un fichier de configuration pour référence
CONFIG_FILE="../befret-backoffice/config/sendgrid-template-ids.json"
mkdir -p "$(dirname "$CONFIG_FILE")"

cat > "$CONFIG_FILE" << EOF
{
  "templates": {
    "weighing_confirmation": {
      "id": "$WEIGHING_ID",
      "name": "Weighing Confirmation Template",
      "description": "Template pour confirmation de pesée conforme"
    },
    "supplement_required": {
      "id": "$SUPPLEMENT_ID", 
      "name": "Weight Supplement Required",
      "description": "Template pour demande de supplément de poids"
    },
    "refund_available": {
      "id": "$REFUND_ID",
      "name": "Weight Refund Available", 
      "description": "Template pour proposition de remboursement"
    }
  },
  "updated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "updated_by": "$(whoami)"
}
EOF

echo -e "${GREEN}📄 Fichier de configuration créé: $CONFIG_FILE${NC}"

# 4. Validation des modifications
echo ""
echo -e "${YELLOW}🔍 Validation des modifications...${NC}"

if [ -f "$BEFRET_NEW_FILE" ]; then
    if grep -q "$WEIGHING_ID" "$BEFRET_NEW_FILE"; then
        echo -e "${GREEN}  ✅ ID de pesée trouvé dans befret_new${NC}"
    else
        echo -e "${RED}  ❌ ID de pesée NON trouvé dans befret_new${NC}"
    fi
fi

# 5. Instructions pour déploiement
echo ""
echo -e "${BLUE}📋 PROCHAINES ÉTAPES${NC}"
echo -e "${BLUE}==================${NC}"
echo ""
echo -e "${YELLOW}1. Déployer befret_new functions:${NC}"
echo "   cd ../befret_new/functions/dev"
echo "   npm run deploy"
echo ""
echo -e "${YELLOW}2. Tester les templates:${NC}"
echo "   - Utiliser le guide dans docs/NOTIFICATION_TEST_GUIDE.md"
echo "   - Vérifier réception email et SMS"
echo ""
echo -e "${YELLOW}3. Déployer backoffice:${NC}"
echo "   cd ../befret-backoffice"
echo "   npm run deploy:dev"
echo ""

# 6. Résumé final
echo -e "${GREEN}🎉 MISE À JOUR TERMINÉE${NC}"
echo -e "${GREEN}======================${NC}"
echo ""
echo -e "${GREEN}✅ Template Pesée:      $WEIGHING_ID${NC}"
echo -e "${GREEN}✅ Template Supplément: $SUPPLEMENT_ID${NC}"
echo -e "${GREEN}✅ Template Remboursement: $REFUND_ID${NC}"
echo ""
echo -e "${BLUE}📝 Sauvegardes créées avec timestamp${NC}"
echo -e "${BLUE}📄 Configuration sauvée dans: $CONFIG_FILE${NC}"
echo ""
echo -e "${YELLOW}⚠️  N'oubliez pas de tester avant la mise en production !${NC}"