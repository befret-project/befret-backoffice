import { Request } from "firebase-functions/v2/https";
import { Response } from "express";
import * as admin from "firebase-admin";

export async function sortingHandler(
  request: Request,
  response: Response,
  db: admin.firestore.Firestore
) {
  const path = request.path;
  const method = request.method;

  if (method !== "GET" && method !== "POST") {
    return response.status(405).json({ error: "Method not allowed", success: false });
  }

  try {
    if (path === "/api/sorting/stats" || path === "/api/sorting/stats/") {
      return await getSortingStats(response, db);
    } else if (path === "/api/sorting/parcels" || path === "/api/sorting/parcels/") {
      return await getSortedParcels(response, db);
    } else if (path === "/api/sorting/overview" || path === "/api/sorting/overview/") {
      return await getSortingOverview(response, db);
    } else if (path === "/api/sorting/auto-sort" || path === "/api/sorting/auto-sort/") {
      if (method === "POST") {
        return await autoSortParcel(request, response, db);
      } else {
        return response.status(405).json({ error: "Method not allowed", success: false });
      }
    } else if (path === "/api/sorting/batch-sort" || path === "/api/sorting/batch-sort/") {
      if (method === "POST") {
        return await batchSortParcels(request, response, db);
      } else {
        return response.status(405).json({ error: "Method not allowed", success: false });
      }
    } else {
      return response.status(404).json({ error: "Sorting endpoint not found", success: false });
    }
  } catch (error) {
    console.error("Sorting API Error:", error);
    return response.status(500).json({ error: "Failed to process sorting request", success: false });
  }
}

async function getSortingStats(response: Response, db: admin.firestore.Firestore) {
  try {
    console.log('📊 [Sorting Stats] Fetching sorting statistics...');

    const parcelsRef = db.collection('parcel');
    const allParcelsSnapshot = await parcelsRef.get();
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Initialiser les compteurs
    let kinshasaParcels = 0;
    let kinshasaWeight = 0;
    let lubumbashiParcels = 0;
    let lubumbashiWeight = 0;
    let specialCases = 0;
    let pendingPayment = 0;
    let sortedToday = 0;
    let sortedThisWeek = 0;
    
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let lastKinshasaActivity = '';
    let lastLubumbashiActivity = '';

    console.log(`📊 [Sorting Stats] Processing ${allParcelsSnapshot.size} parcels...`);

    allParcelsSnapshot.forEach((doc) => {
      const data = doc.data();
      const logisticsStatus = data.logisticsStatus || '';
      const destination = data.destination || data.city?.toLowerCase();
      const sortedDate = data.sortedAt || data.lastUpdated || '';
      const weight = data.weightReal || data.actualWeight || data.weight || 0;
      const specialCaseType = data.specialCaseType || '';
      
      // Compter les colis triés
      if (logisticsStatus === 'sorted') {
        if (sortedDate.startsWith(today)) {
          sortedToday++;
        }
        if (sortedDate >= sevenDaysAgo) {
          sortedThisWeek++;
        }
        
        // Compteurs par destination
        if (destination === 'kinshasa') {
          kinshasaParcels++;
          kinshasaWeight += weight;
          if (sortedDate > lastKinshasaActivity) {
            lastKinshasaActivity = sortedDate;
          }
        } else if (destination === 'lubumbashi') {
          lubumbashiParcels++;
          lubumbashiWeight += weight;
          if (sortedDate > lastLubumbashiActivity) {
            lastLubumbashiActivity = sortedDate;
          }
        }
      }
      
      // Cas spéciaux
      if (specialCaseType && specialCaseType !== '') {
        specialCases++;
      }
      
      // Paiements en attente
      if (logisticsStatus === 'weight_issue' || specialCaseType === 'payment_pending') {
        pendingPayment++;
      }
    });

    const stats = {
      destinations: {
        kinshasa: {
          count: kinshasaParcels,
          weight: Math.round(kinshasaWeight * 100) / 100,
          lastActivity: lastKinshasaActivity || null
        },
        lubumbashi: {
          count: lubumbashiParcels,
          weight: Math.round(lubumbashiWeight * 100) / 100,
          lastActivity: lastLubumbashiActivity || null
        }
      },
      specialCases: {
        count: specialCases,
        pendingPayment: pendingPayment
      },
      performance: {
        sortedToday: sortedToday,
        sortedThisWeek: sortedThisWeek,
        avgPerDay: sortedThisWeek > 0 ? Math.round(sortedThisWeek / 7 * 100) / 100 : 0
      },
      lastUpdated: new Date().toISOString()
    };

    console.log('📊 [Sorting Stats] Stats calculated:', stats);
    return response.json(stats);

  } catch (error) {
    console.error("Error in getSortingStats:", error);
    throw error;
  }
}

async function getSortedParcels(response: Response, db: admin.firestore.Firestore) {
  try {
    console.log('📦 [Sorted Parcels] Fetching sorted parcels...');

    const parcelsRef = db.collection('parcel');
    const sortedParcelsQuery = parcelsRef
      .where('logisticsStatus', '==', 'sorted')
      .orderBy('sortedAt', 'desc')
      .limit(50);
    
    const parcelsSnapshot = await sortedParcelsQuery.get();
    
    const parcels = parcelsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        trackingID: data.trackingID,
        destination: data.destination || data.city?.toLowerCase(),
        weight: data.weightReal || data.actualWeight || data.weight || 0,
        sortedAt: data.sortedAt || data.lastUpdated,
        sortedBy: data.sortedBy || data.lastUpdatedBy,
        zone: data.sortingZone || getZoneFromDestination(data.destination || data.city?.toLowerCase()),
        receiver_name: data.receiver_name,
        specialCaseType: data.specialCaseType || '',
        status: data.logisticsStatus
      };
    });

    console.log(`📦 [Sorted Parcels] Returning ${parcels.length} parcels`);
    return response.json(parcels);

  } catch (error) {
    console.error("Error in getSortedParcels:", error);
    throw error;
  }
}

async function getSortingOverview(response: Response, db: admin.firestore.Firestore) {
  try {
    console.log('📈 [Sorting Overview] Fetching sorting overview...');

    const parcelsRef = db.collection('parcel');
    const allParcelsSnapshot = await parcelsRef.get();
    
    // Données pour les graphiques
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sorted: 0,
      name: `${i}h`
    }));
    
    const destinationData = [
      { name: 'Kinshasa', value: 0, color: '#1a7125' },      // BeFret green dark
      { name: 'Lubumbashi', value: 0, color: '#16a34a' },    // BeFret green primary
      { name: 'Cas spéciaux', value: 0, color: '#f59e0b' },  // Orange for special cases
      { name: 'En attente paiement', value: 0, color: '#ef4444' } // Red for pending payment
    ];
    
    const performanceData: Array<{
      date: string;
      name: string;
      sorted: number;
      efficiency: number;
    }> = [];
    const now = new Date();
    
    // Générer les 7 derniers jours
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      performanceData.push({
        date: dateStr,
        name: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        sorted: 0,
        efficiency: 0
      });
    }

    allParcelsSnapshot.forEach((doc) => {
      const data = doc.data();
      const logisticsStatus = data.logisticsStatus || '';
      const destination = data.destination || data.city?.toLowerCase();
      const sortedAt = data.sortedAt || data.lastUpdated || '';
      const specialCaseType = data.specialCaseType || '';
      
      if (logisticsStatus === 'sorted' && sortedAt) {
        const sortedDate = new Date(sortedAt);
        const hour = sortedDate.getHours();
        const dateStr = sortedDate.toISOString().split('T')[0];
        
        // Données horaires (aujourd'hui seulement)
        if (dateStr === now.toISOString().split('T')[0]) {
          if (hour >= 0 && hour < 24) {
            hourlyData[hour].sorted++;
          }
        }
        
        // Données par destination
        if (destination === 'kinshasa') {
          destinationData[0].value++;
        } else if (destination === 'lubumbashi') {
          destinationData[1].value++;
        }
        
        // Données de performance sur 7 jours
        const dayIndex = performanceData.findIndex(d => d.date === dateStr);
        if (dayIndex !== -1) {
          performanceData[dayIndex].sorted++;
          performanceData[dayIndex].efficiency = Math.min(100, performanceData[dayIndex].sorted * 2);
        }
      }
      
      // Cas spéciaux
      if (specialCaseType && specialCaseType !== '') {
        destinationData[2].value++;
      }
      
      // Paiements en attente
      if (logisticsStatus === 'weight_issue' || specialCaseType === 'payment_pending') {
        destinationData[3].value++;
      }
    });

    const overview = {
      hourlyData: hourlyData,
      destinationData: destinationData.filter(d => d.value > 0),
      performanceData: performanceData,
      lastUpdated: new Date().toISOString()
    };

    console.log('📈 [Sorting Overview] Overview calculated');
    return response.json(overview);

  } catch (error) {
    console.error("Error in getSortingOverview:", error);
    throw error;
  }
}

async function autoSortParcel(request: Request, response: Response, db: admin.firestore.Firestore) {
  try {
    console.log('🤖 [Auto Sort] Processing auto-sort request...');

    const { parcelId } = request.body;
    
    if (!parcelId) {
      return response.status(400).json({ error: "Parcel ID required", success: false });
    }

    const parcelRef = db.collection('parcel').doc(parcelId);
    const parcelDoc = await parcelRef.get();
    
    if (!parcelDoc.exists) {
      return response.status(404).json({ error: "Parcel not found", success: false });
    }
    
    const parcelData = parcelDoc.data()!;
    const destination = parcelData.destination || parcelData.city?.toLowerCase();
    const specialCaseType = parcelData.specialCaseType || '';
    
    // Logique de tri
    let sortingZone = 'D'; // Zone par défaut (bloqué)
    let sortingReason = 'Destination inconnue';
    
    if (specialCaseType === 'payment_pending') {
      sortingZone = 'D';
      sortingReason = 'Paiement en attente';
    } else if (specialCaseType && specialCaseType !== '') {
      sortingZone = 'C';
      sortingReason = 'Cas spécial';
    } else if (destination === 'kinshasa') {
      sortingZone = 'A';
      sortingReason = 'Destination Kinshasa';
    } else if (destination === 'lubumbashi') {
      sortingZone = 'B';
      sortingReason = 'Destination Lubumbashi';
    }
    
    // Mise à jour du colis
    const updateData = {
      logisticsStatus: 'sorted',
      sortingZone: sortingZone,
      sortingReason: sortingReason,
      sortedAt: new Date().toISOString(),
      sortedBy: 'auto-sort-system',
      lastUpdated: new Date().toISOString()
    };
    
    await parcelRef.update(updateData);
    
    console.log(`🤖 [Auto Sort] Parcel ${parcelData.trackingID} sorted to zone ${sortingZone}`);
    
    return response.json({
      success: true,
      parcelId: parcelId,
      trackingID: parcelData.trackingID,
      sortingZone: sortingZone,
      sortingReason: sortingReason,
      sortedAt: updateData.sortedAt
    });

  } catch (error) {
    console.error("Error in autoSortParcel:", error);
    return response.status(500).json({ error: "Failed to auto-sort parcel", success: false });
  }
}

async function batchSortParcels(request: Request, response: Response, db: admin.firestore.Firestore) {
  try {
    console.log('📦 [Batch Sort] Processing batch sort request...');

    const { parcelIds } = request.body;
    
    if (!parcelIds || !Array.isArray(parcelIds) || parcelIds.length === 0) {
      return response.status(400).json({ error: "Parcel IDs array required", success: false });
    }

    const results = [];
    const batch = db.batch();
    
    for (const parcelId of parcelIds) {
      const parcelRef = db.collection('parcel').doc(parcelId);
      const parcelDoc = await parcelRef.get();
      
      if (!parcelDoc.exists) {
        results.push({ parcelId, success: false, error: "Parcel not found" });
        continue;
      }
      
      const parcelData = parcelDoc.data()!;
      const destination = parcelData.destination || parcelData.city?.toLowerCase();
      const specialCaseType = parcelData.specialCaseType || '';
      
      // Logique de tri
      let sortingZone = 'D';
      let sortingReason = 'Destination inconnue';
      
      if (specialCaseType === 'payment_pending') {
        sortingZone = 'D';
        sortingReason = 'Paiement en attente';
      } else if (specialCaseType && specialCaseType !== '') {
        sortingZone = 'C';
        sortingReason = 'Cas spécial';
      } else if (destination === 'kinshasa') {
        sortingZone = 'A';
        sortingReason = 'Destination Kinshasa';
      } else if (destination === 'lubumbashi') {
        sortingZone = 'B';
        sortingReason = 'Destination Lubumbashi';
      }
      
      const updateData = {
        logisticsStatus: 'sorted',
        sortingZone: sortingZone,
        sortingReason: sortingReason,
        sortedAt: new Date().toISOString(),
        sortedBy: 'batch-sort-system',
        lastUpdated: new Date().toISOString()
      };
      
      batch.update(parcelRef, updateData);
      results.push({ 
        parcelId, 
        success: true, 
        trackingID: parcelData.trackingID,
        sortingZone,
        sortingReason 
      });
    }
    
    await batch.commit();
    
    console.log(`📦 [Batch Sort] Processed ${results.length} parcels`);
    
    return response.json({
      success: true,
      processed: results.length,
      results: results
    });

  } catch (error) {
    console.error("Error in batchSortParcels:", error);
    return response.status(500).json({ error: "Failed to batch sort parcels", success: false });
  }
}

function getZoneFromDestination(destination: string): string {
  switch (destination?.toLowerCase()) {
    case 'kinshasa':
      return 'A';
    case 'lubumbashi':
      return 'B';
    default:
      return 'D';
  }
}