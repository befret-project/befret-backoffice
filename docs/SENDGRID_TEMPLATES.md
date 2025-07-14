# 📧 TEMPLATES SENDGRID - STATION DE PESÉE

## 🎯 **TEMPLATES À CRÉER DANS SENDGRID**

### **ACCÈS SENDGRID**
1. Se connecter à [SendGrid Dashboard](https://app.sendgrid.com/)
2. Aller dans **Email API** → **Dynamic Templates**
3. Cliquer **Create a Dynamic Template**

---

## 📋 **TEMPLATE 1 - CONFIRMATION PESÉE**

### **Informations Template**
- **Nom** : `Weighing Confirmation Template`
- **Type** : Dynamic Template
- **Subject** : `✅ Pesée confirmée - {{trackingCode}}`

### **HTML Template**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pesée Confirmée - BeFret</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .weight-info { background: #e8f5e8; border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 20px 0; }
        .photo-item { border: 2px solid #ddd; border-radius: 8px; overflow: hidden; }
        .photo-item img { width: 100%; height: auto; display: block; }
        .status-ok { color: #4CAF50; font-weight: bold; }
        .btn { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>✅ Pesée Confirmée</h1>
            <p>Votre {{pType}} {{trackingCode}} a été reçu et pesé</p>
        </div>

        <!-- Content -->
        <div class="content">
            <p>Bonjour <strong>{{fullname}}</strong>,</p>
            
            <p>Excellente nouvelle ! Votre {{pType}} est arrivé à notre entrepôt de Tubize et a été pesé avec succès.</p>

            <!-- Weight Information -->
            <div class="weight-info">
                <h3>📊 Informations de pesée</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Poids déclaré :</td>
                        <td style="padding: 8px 0;">{{declaredWeight}} kg</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Poids réel :</td>
                        <td style="padding: 8px 0;">{{actualWeight}} kg</td>
                    </tr>
                    {{#if weightDifference}}
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Différence :</td>
                        <td style="padding: 8px 0;">{{weightDifference}} kg ({{weightDifferencePercentage}}%)</td>
                    </tr>
                    {{/if}}
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Statut :</td>
                        <td style="padding: 8px 0;">
                            {{#if isWeightOk}}
                                <span class="status-ok">✅ Poids conforme - Aucun supplément requis</span>
                            {{else}}
                                <span style="color: #ff9800;">⚠️ Écart de poids détecté</span>
                            {{/if}}
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Photos -->
            {{#if weighingPhotos}}
            <h3>📸 Photos de pesée</h3>
            <p>Voici les photos prises lors de la pesée de votre colis :</p>
            <div class="photo-grid">
                {{#each weighingPhotos}}
                <div class="photo-item">
                    <img src="{{this}}" alt="Photo de pesée" style="max-width: 100%; height: auto;" />
                </div>
                {{/each}}
            </div>
            {{/if}}

            <!-- Next Steps -->
            <h3>🚚 Prochaines étapes</h3>
            <p>Votre {{pType}} est maintenant en préparation pour expédition vers <strong>{{city}}</strong>. Nous vous tiendrons informé de chaque étape.</p>

            <!-- Tracking Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{trackingURL}}" class="btn">Suivre mon colis</a>
            </div>

            <!-- Additional Info -->
            <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>Pesée effectuée le :</strong> {{weighingTimestamp}}</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Référence :</strong> {{trackingCode}}</p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Merci de faire confiance à <strong>BeFret</strong></p>
            <p>📱 Support : +32 XXX XXX XXX | 📧 info@befret.be</p>
            <p><a href="{{trackingURL}}" style="color: #4CAF50;">Suivre votre colis en temps réel</a></p>
        </div>
    </div>
</body>
</html>
```

---

## 📋 **TEMPLATE 2 - SUPPLÉMENT REQUIS**

### **Informations Template**
- **Nom** : `Weight Supplement Required`
- **Type** : Dynamic Template
- **Subject** : `💰 Supplément de poids requis - {{trackingCode}}`

### **HTML Template**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Supplément Requis - BeFret</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ff9800, #f57c00); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .weight-comparison { background: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .supplement-amount { background: #ffebee; border: 2px solid #f44336; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 20px 0; }
        .photo-item { border: 2px solid #ff9800; border-radius: 8px; overflow: hidden; }
        .photo-item img { width: 100%; height: auto; display: block; }
        .payment-btn { display: inline-block; padding: 15px 40px; background: #f44336; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; font-size: 16px; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>💰 Supplément de Poids Requis</h1>
            <p>{{pType}} {{trackingCode}} - Action requise</p>
        </div>

        <!-- Content -->
        <div class="content">
            <p>Bonjour <strong>{{fullname}}</strong>,</p>
            
            <p>Lors de la pesée de votre {{pType}} à notre entrepôt, nous avons constaté une différence de poids par rapport à ce qui avait été déclaré.</p>

            <!-- Weight Comparison -->
            <div class="weight-comparison">
                <h3>⚖️ Comparaison des poids</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; font-weight: bold;">Poids déclaré :</td>
                        <td style="padding: 10px 0;">{{declaredWeight}} kg</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; font-weight: bold;">Poids réel mesuré :</td>
                        <td style="padding: 10px 0; color: #f44336; font-weight: bold;">{{actualWeight}} kg</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; font-weight: bold;">Différence :</td>
                        <td style="padding: 10px 0; color: #f44336; font-weight: bold;">+{{weightDifference}} kg ({{weightDifferencePercentage}}%)</td>
                    </tr>
                </table>
            </div>

            <!-- Photos -->
            {{#if weighingPhotos}}
            <h3>📸 Preuve photographique</h3>
            <p>Voici les photos de la pesée effectuée à notre entrepôt :</p>
            <div class="photo-grid">
                {{#each weighingPhotos}}
                <div class="photo-item">
                    <img src="{{this}}" alt="Photo de pesée avec balance" style="max-width: 100%; height: auto;" />
                </div>
                {{/each}}
            </div>
            {{/if}}

            <!-- Supplement Amount -->
            <div class="supplement-amount">
                <h3 style="margin: 0 0 10px 0; color: #f44336;">💰 Supplément à régler</h3>
                <div style="font-size: 24px; font-weight: bold; color: #f44336;">{{supplementAmount}} €</div>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Tarif : 2,50€/kg supplémentaire</p>
            </div>

            <!-- Payment Section -->
            <h3>💳 Règlement du supplément</h3>
            <p>Pour que votre {{pType}} puisse être expédié vers {{city}}, veuillez régler le supplément en cliquant sur le bouton ci-dessous :</p>

            <div style="text-align: center; margin: 30px 0;">
                {{#if paymentLink}}
                <a href="{{paymentLink}}" class="payment-btn">💳 Payer {{supplementAmount}} €</a>
                {{else}}
                <p style="color: #f44336; font-weight: bold;">Lien de paiement en cours de génération...</p>
                {{/if}}
            </div>

            {{#if expiryDate}}
            <p style="text-align: center; color: #666; font-size: 14px;">
                <em>Ce lien de paiement expire le {{expiryDate}}</em>
            </p>
            {{/if}}

            <!-- Contact Info -->
            <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0;">❓ Questions ou préoccupations ?</h4>
                <p style="margin: 0; font-size: 14px;">Notre équipe est disponible pour répondre à toutes vos questions concernant cette différence de poids.</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>📞 Support :</strong> +32 XXX XXX XXX</p>
            </div>

            <!-- Tracking -->
            <p>Vous pouvez suivre l'état de votre colis sur : <a href="{{trackingURL}}" style="color: #ff9800;">{{trackingURL}}</a></p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Merci de votre compréhension - <strong>BeFret</strong></p>
            <p>📱 Support : +32 XXX XXX XXX | 📧 info@befret.be</p>
        </div>
    </div>
</body>
</html>
```

---

## 📋 **TEMPLATE 3 - REMBOURSEMENT DISPONIBLE**

### **Informations Template**
- **Nom** : `Weight Refund Available`
- **Type** : Dynamic Template
- **Subject** : `💚 Remboursement disponible - {{trackingCode}}`

### **HTML Template**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Remboursement Disponible - BeFret</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #2196F3, #1976D2); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .weight-comparison { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .refund-amount { background: #e8f5e8; border: 2px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 20px 0; }
        .photo-item { border: 2px solid #2196F3; border-radius: 8px; overflow: hidden; }
        .photo-item img { width: 100%; height: auto; display: block; }
        .options { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .option-btn { display: block; padding: 15px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; text-align: center; font-weight: bold; }
        .option-voucher { background: #4CAF50; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>💚 Bonne Nouvelle !</h1>
            <p>Remboursement disponible pour {{trackingCode}}</p>
        </div>

        <!-- Content -->
        <div class="content">
            <p>Bonjour <strong>{{fullname}}</strong>,</p>
            
            <p>Lors de la pesée de votre {{pType}} à notre entrepôt, nous avons constaté que le poids réel est <strong>inférieur</strong> à ce qui avait été déclaré. Cela signifie que vous avez payé plus que nécessaire !</p>

            <!-- Weight Comparison -->
            <div class="weight-comparison">
                <h3>⚖️ Comparaison des poids</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; font-weight: bold;">Poids déclaré :</td>
                        <td style="padding: 10px 0;">{{declaredWeight}} kg</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; font-weight: bold;">Poids réel mesuré :</td>
                        <td style="padding: 10px 0; color: #4CAF50; font-weight: bold;">{{actualWeight}} kg</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; font-weight: bold;">Différence :</td>
                        <td style="padding: 10px 0; color: #4CAF50; font-weight: bold;">{{weightDifference}} kg ({{weightDifferencePercentage}}%)</td>
                    </tr>
                </table>
            </div>

            <!-- Photos -->
            {{#if weighingPhotos}}
            <h3>📸 Preuve photographique</h3>
            <p>Voici les photos de la pesée effectuée à notre entrepôt :</p>
            <div class="photo-grid">
                {{#each weighingPhotos}}
                <div class="photo-item">
                    <img src="{{this}}" alt="Photo de pesée avec balance" style="max-width: 100%; height: auto;" />
                </div>
                {{/each}}
            </div>
            {{/if}}

            <!-- Refund Amount -->
            <div class="refund-amount">
                <h3 style="margin: 0 0 10px 0; color: #4CAF50;">💰 Remboursement disponible</h3>
                <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">{{refundAmount}} €</div>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Calculé selon notre grille tarifaire</p>
            </div>

            <!-- Options -->
            <h3>🎯 Choisissez votre option</h3>
            <p>Nous vous proposons deux options pour récupérer cette somme :</p>

            <div class="options">
                <a href="{{refundLink}}" class="option-btn">
                    💳 Remboursement<br>
                    <small>Sur votre compte bancaire</small>
                </a>
                <a href="{{voucherLink}}" class="option-btn option-voucher">
                    🎁 Bon d'achat +10%<br>
                    <small>{{bonusAmount}} € de crédit</small>
                </a>
            </div>

            <!-- Automatic Processing -->
            <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0;">⚡ Traitement automatique</h4>
                <p style="margin: 0; font-size: 14px;">Si vous ne choisissez pas d'option dans les 7 jours, nous procéderons automatiquement au remboursement sur votre moyen de paiement original.</p>
            </div>

            <!-- Shipment Continues -->
            <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #4CAF50;">🚚 Expédition maintenue</h4>
                <p style="margin: 0; font-size: 14px;">Votre {{pType}} continue son parcours vers {{city}} normalement. Cette différence de poids n'affecte pas l'expédition.</p>
            </div>

            <!-- Tracking -->
            <p>Suivez votre colis sur : <a href="{{trackingURL}}" style="color: #2196F3;">{{trackingURL}}</a></p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Merci de faire confiance à <strong>BeFret</strong></p>
            <p>📱 Support : +32 XXX XXX XXX | 📧 info@befret.be</p>
            <p>Notre politique : Toujours juste, toujours transparent</p>
        </div>
    </div>
</body>
</html>
```

---

## 🔧 **INSTRUCTIONS DE CRÉATION**

### **Étapes dans SendGrid**

1. **Se connecter à SendGrid** → [app.sendgrid.com](https://app.sendgrid.com/)

2. **Créer les templates** :
   - Email API → Dynamic Templates → Create a Dynamic Template
   - Nom : (voir ci-dessus)
   - Add Version → Edit Code → Coller le HTML

3. **Récupérer les IDs** :
   - Une fois créé, noter l'ID (format : `d-xxxxxxxxxxxxxxxxxxxxxxxxxx`)

4. **Test des templates** :
   - Test Data → Utiliser les variables du guide
   - Preview → Vérifier le rendu

### **Variables de Test**
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
  "weighingPhotos": ["https://example.com/balance1.jpg"],
  "weighingStatus": "supplement_required",
  "supplementAmount": 0.75,
  "refundAmount": 1.50,
  "paymentLink": "https://payment.befret.com/pay/123",
  "expiryDate": "15/01/2024"
}
```

---

## 📝 **RÉCUPÉRATION DES IDS**

### **Une fois les templates créés, remplacer dans le code :**

**Dans befret_new/functions/dev/src/index.ts :**
```typescript
// Ligne 417 - Remplacer
templateId = "d-WEIGHING-CONFIRMATION-TEMPLATE-ID";

// Par l'ID réel récupéré, exemple :
templateId = "d-abc123def456ghi789jkl012mno345pq";
```

### **IDs à récupérer :**
- 📋 **Template Confirmation** : `d-___________________________`
- 💰 **Template Supplément** : `d-___________________________`  
- 💚 **Template Remboursement** : `d-___________________________`

**➡️ Une fois créés, notez ici les vrais IDs pour mise à jour du code !**