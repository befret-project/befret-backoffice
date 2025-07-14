# Indexes Firestore nécessaires pour BEFRET BACKOFFICE

Pour optimiser les performances des filtres dans la page de recherche, vous pouvez créer ces index composites dans Firestore :

## 1. Index pour (status + create_date)
```
Collection: parcel
Fields: 
- status (Ascending)
- create_date (Descending)
- __name__ (Ascending)
```

## 2. Index pour (logisticStatus + create_date)
```
Collection: parcel
Fields:
- logisticStatus (Ascending) 
- create_date (Descending)
- __name__ (Ascending)
```

## 3. Index pour (status + logisticStatus + create_date)
```
Collection: parcel
Fields:
- status (Ascending)
- logisticStatus (Ascending)
- create_date (Descending)
- __name__ (Ascending)
```

## Comment créer ces index :

1. **Via la console Firebase** :
   - Allez sur https://console.firebase.google.com/
   - Sélectionnez votre projet `befret-development`
   - Allez dans Firestore Database > Indexes
   - Cliquez sur "Create Index" et ajoutez les champs comme indiqué

2. **Automatiquement via les erreurs** :
   - Quand une requête échoue avec une erreur d'index manquant
   - Firebase fournit un lien direct pour créer l'index
   - Cliquez sur le lien dans l'erreur de la console

## Note :
Les index peuvent prendre quelques minutes à se construire selon la taille de votre collection.

En attendant, l'application utilise une stratégie de fallback qui récupère tous les colis et fait le filtrage côté client.