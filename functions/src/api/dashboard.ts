import { Request } from "firebase-functions/v2/https";
import { Response } from "express";
import * as admin from "firebase-admin";

export async function dashboardHandler(
  request: Request,
  response: Response,
  db: admin.firestore.Firestore
) {
  const path = request.path;
  const method = request.method;

  if (method !== "GET") {
    return response.status(405).json({ error: "Method not allowed", success: false });
  }

  try {
    if (path === "/api/dashboard/overview" || path === "/api/dashboard/overview/") {
      return await getDashboardOverview(response, db);
    } else if (path === "/api/dashboard/recent-activity" || path === "/api/dashboard/recent-activity/") {
      return await getRecentActivity(response, db);
    } else if (path === "/api/dashboard/stats" || path === "/api/dashboard/stats/") {
      return await getDashboardStats(response, db);
    } else {
      return response.status(404).json({ error: "Dashboard endpoint not found", success: false });
    }
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return response.status(500).json({ error: "Failed to fetch dashboard data", success: false });
  }
}

async function getDashboardOverview(response: Response, db: admin.firestore.Firestore) {
  try {
    console.log('📈 [Dashboard Overview] Fetching overview data from Firestore...');

    // Récupérer tous les colis
    const parcelsRef = db.collection('parcel');
    const allParcelsSnapshot = await parcelsRef.get();
    
    console.log(`📈 [Dashboard Overview] Processing ${allParcelsSnapshot.size} parcels...`);

    // Initialiser les données mensuelles
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyData = monthNames.map(name => ({ name, colis: 0, revenus: 0 }));
    
    // Compter les statuts
    const statusCounts: { [key: string]: number } = {};
    const statusColors: { [key: string]: string } = {
      'draft': '#94a3b8',
      'pending': '#f59e0b',
      'to_warehouse': '#1a7125',        // BeFret green dark
      'from_warehouse_to_congo': '#16a34a', // BeFret green primary
      'arrived_in_congo': '#10b981',    // Existing green
      'delivered': '#059669'            // Existing dark green
    };
    
    const statusLabels: { [key: string]: string } = {
      'draft': 'Brouillon',
      'pending': 'En attente',
      'to_warehouse': 'Vers entrepôt',
      'from_warehouse_to_congo': 'Vers RDC',
      'arrived_in_congo': 'Arrivé RDC',
      'delivered': 'Livré'
    };

    let totalParcels = 0;

    allParcelsSnapshot.forEach((doc) => {
      const data = doc.data();
      const createDate = data.create_date || '';
      const cost = data.cost || 0;
      const status = data.status || 'unknown';

      // Ignorer les brouillons pour les statistiques principales
      if (status !== 'draft') {
        totalParcels++;

        // Extraire le mois de création
        if (createDate) {
          const date = new Date(createDate);
          if (!isNaN(date.getTime())) {
            const month = date.getMonth();
            if (month >= 0 && month < 12) {
              monthlyData[month].colis++;
              monthlyData[month].revenus += cost;
            }
          }
        }
      }

      // Compter tous les statuts (y compris draft)
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Transformer les données de statut pour l'affichage
    const statusData = Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
        color: statusColors[status] || '#6b7280'
      }))
      .sort((a, b) => b.value - a.value); // Trier par ordre décroissant

    // Arrondir les revenus
    monthlyData.forEach(month => {
      month.revenus = Math.round(month.revenus * 100) / 100;
    });

    const overviewData = {
      monthlyData,
      statusData,
      totalParcels,
      lastUpdated: new Date().toISOString()
    };

    console.log('📈 [Dashboard Overview] Overview data calculated:', {
      totalParcels,
      statusCount: statusData.length,
      monthsWithData: monthlyData.filter(m => m.colis > 0).length
    });

    return response.json(overviewData);

  } catch (error) {
    console.error("Error in getDashboardOverview:", error);
    throw error;
  }
}

async function getRecentActivity(response: Response, db: admin.firestore.Firestore) {
  try {
    console.log('🔄 [Recent Activity] Fetching recent activity from Firestore...');

    const activities: any[] = [];

    // Récupérer les colis récents
    const parcelsRef = db.collection('parcel');
    const recentParcelsQuery = parcelsRef
      .orderBy('create_date', 'desc')
      .limit(15);
    
    const parcelsSnapshot = await recentParcelsQuery.get();
    console.log(`🔄 [Recent Activity] Found ${parcelsSnapshot.size} recent parcels`);

    parcelsSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Activité de création de colis
      if (data.status !== 'draft') {
        activities.push({
          id: `parcel-created-${doc.id}`,
          type: 'parcel',
          title: `Nouveau colis ${data.trackingID}`,
          description: `Colis créé par ${data.sender_name} pour ${data.receiver_name}`,
          timestamp: data.create_date || new Date().toISOString(),
          status: 'info',
          link: `/logistic/colis/reception?search=${data.trackingID}`
        });
      }

      // Activité de réception
      if (data.logisticStatus === 'received' && data.receivedAt) {
        activities.push({
          id: `parcel-received-${doc.id}`,
          type: 'parcel',
          title: `Colis reçu ${data.trackingID}`,
          description: `Réceptionné à l'entrepôt - ${data.totalWeight || 0} kg`,
          timestamp: data.receivedAt,
          status: 'success',
          link: `/logistic/colis/reception?search=${data.trackingID}`
        });
      }

      // Activité de pesée
      if (data.logisticStatus === 'weighed' && data.weighedAt) {
        const weightDiff = data.weightDifference || 0;
        activities.push({
          id: `parcel-weighed-${doc.id}`,
          type: 'parcel',
          title: `Colis pesé ${data.trackingID}`,
          description: `Poids réel: ${data.actualWeight || 0} kg ${weightDiff !== 0 ? `(écart: ${weightDiff > 0 ? '+' : ''}${weightDiff} kg)` : ''}`,
          timestamp: data.weighedAt,
          status: weightDiff > 0 ? 'warning' : 'success',
          link: `/logistic/colis/preparation?search=${data.trackingID}`
        });
      }

      // Activité de livraison
      if (data.status === 'delivered' && data.deliveredAt) {
        activities.push({
          id: `parcel-delivered-${doc.id}`,
          type: 'parcel',
          title: `Colis livré ${data.trackingID}`,
          description: `Livraison réussie à ${data.receiver_name}`,
          timestamp: data.deliveredAt,
          status: 'success'
        });
      }

      // Activité de paiement
      if (data.payment_date && data.cost > 0) {
        activities.push({
          id: `payment-${doc.id}`,
          type: 'payment',
          title: `Paiement reçu ${data.cost}€`,
          description: `Paiement pour colis ${data.trackingID}`,
          timestamp: data.payment_date,
          status: 'success'
        });
      }
    });

    // Trier toutes les activités par timestamp décroissant
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Garder seulement les 20 plus récentes
    const recentActivities = activities.slice(0, 20);

    console.log(`🔄 [Recent Activity] Returning ${recentActivities.length} activities`);

    return response.json(recentActivities);

  } catch (error) {
    console.error("Error in getRecentActivity:", error);
    throw error;
  }
}

async function getDashboardStats(response: Response, db: admin.firestore.Firestore) {
  try {
    console.log('📊 [Dashboard Stats] Fetching stats from Firestore...');

    // Récupérer tous les colis
    const parcelsRef = db.collection('parcel');
    const allParcelsSnapshot = await parcelsRef.get();
    
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Format YYYY-MM-DD
    const currentMonth = now.toISOString().substring(0, 7); // Format YYYY-MM
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().substring(0, 7);
    
    let totalParcels = 0;
    let parcelsTrend = 0;
    let revenue = 0;
    let revenueTrend = 0;
    let deliveredToday = 0;
    let currentMonthParcels = 0;
    let lastMonthParcels = 0;
    let currentMonthRevenue = 0;
    let lastMonthRevenue = 0;
    let uniqueUsers = new Set();

    console.log(`📊 [Dashboard Stats] Processing ${allParcelsSnapshot.size} parcels...`);

    allParcelsSnapshot.forEach((doc) => {
      const data = doc.data();
      const createDate = data.create_date || '';
      const cost = data.cost || 0;
      
      // Compter tous les colis (non draft)
      if (data.status !== 'draft') {
        totalParcels++;
        revenue += cost;
        
        // Ajouter l'utilisateur unique
        if (data.uid) {
          uniqueUsers.add(data.uid);
        }
      }
      
      // Statistiques mensuelles
      if (createDate.startsWith(currentMonth)) {
        currentMonthParcels++;
        currentMonthRevenue += cost;
      } else if (createDate.startsWith(lastMonth)) {
        lastMonthParcels++;
        lastMonthRevenue += cost;
      }
      
      // Livraisons d'aujourd'hui
      if (data.status === 'delivered' && createDate.startsWith(today)) {
        deliveredToday++;
      }
    });

    // Calculer les tendances
    parcelsTrend = lastMonthParcels > 0 
      ? Math.round(((currentMonthParcels - lastMonthParcels) / lastMonthParcels) * 100)
      : currentMonthParcels > 0 ? 100 : 0;

    revenueTrend = lastMonthRevenue > 0 
      ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : currentMonthRevenue > 0 ? 100 : 0;

    // Récupérer les utilisateurs actifs (ayant créé un colis dans les 7 derniers jours)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    let activeUsers = 0;
    let activeUsersThisWeek = new Set();
    let activeUsersLastWeek = new Set();

    allParcelsSnapshot.forEach((doc) => {
      const data = doc.data();
      const createDate = data.create_date || '';
      
      if (data.uid && createDate >= sevenDaysAgo) {
        activeUsersThisWeek.add(data.uid);
      }
      
      // Semaine précédente pour la tendance
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      if (data.uid && createDate >= fourteenDaysAgo && createDate < sevenDaysAgo) {
        activeUsersLastWeek.add(data.uid);
      }
    });

    activeUsers = activeUsersThisWeek.size;
    const usersTrend = activeUsersLastWeek.size > 0 
      ? Math.round(((activeUsers - activeUsersLastWeek.size) / activeUsersLastWeek.size) * 100)
      : activeUsers > 0 ? 100 : 0;

    const stats = {
      totalParcels,
      parcelsTrend,
      activeUsers,
      usersTrend,
      revenue: Math.round(revenue * 100) / 100, // Arrondir à 2 décimales
      revenueTrend,
      deliveredToday,
      deliveredTrend: 0 // Difficile à calculer sans données historiques précises
    };

    console.log('📊 [Dashboard Stats] Stats calculated:', stats);

    return response.json(stats);

  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    throw error;
  }
}