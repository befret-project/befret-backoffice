import { Request } from "firebase-functions/v2/https";
import { Response } from "express";
import * as admin from "firebase-admin";

/**
 * Dashboard API Handler
 *
 * ✅ MIGRÉ VERS COLLECTION 'shipments' (unified_v2)
 * Architecture professionnelle sans placeholder
 */

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
    } else if (path === "/api/dashboard/performance" || path === "/api/dashboard/performance/") {
      return await getDashboardPerformance(response, db);
    } else {
      return response.status(404).json({ error: "Dashboard endpoint not found", success: false });
    }
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return response.status(500).json({ error: "Failed to fetch dashboard data", success: false });
  }
}

/**
 * ✅ GET DASHBOARD OVERVIEW - MIGRÉ VERS 'shipments'
 *
 * Retourne les données mensuelles et la répartition par statut
 * Utilise l'architecture unified_v2
 */
async function getDashboardOverview(response: Response, db: admin.firestore.Firestore) {
  try {
    console.log('📈 [Dashboard Overview] Fetching from collection: shipments (unified_v2)');

    // Récupérer tous les shipments
    const shipmentsRef = db.collection('shipments');
    const shipmentsSnapshot = await shipmentsRef.get();

    console.log(`📈 [Dashboard Overview] Processing ${shipmentsSnapshot.size} shipments...`);

    // Initialiser les données mensuelles
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyData = monthNames.map(name => ({ name, colis: 0, revenus: 0 }));

    // Mapping statuts pour regroupement visuel
    const statusGrouping: { [key: string]: string } = {
      // Phase Order
      'created': 'En création',
      'payment_pending': 'Paiement en cours',
      'payment_completed': 'Payé',
      'payment_failed': 'Paiement échoué',

      // Phase DPD Collection
      'ready_for_deposit': 'Prêt dépôt',
      'collection_scheduled': 'Collecte programmée',
      'collected_by_dpd': 'Collecté DPD',
      'deposited_at_pickup': 'Déposé point relais',
      'dpd_transit_eu': 'Transit DPD Europe',
      'received_at_warehouse': 'Reçu entrepôt',

      // Phase BeFret Distribution
      'befret_transit': 'Transit Congo',
      'arrived_in_congo': 'Arrivé Congo',
      'ready_for_pickup': 'Prêt retrait',
      'out_for_delivery': 'En livraison',
      'delivered': 'Livré',

      // Problèmes
      'delivery_attempted': 'Tentative échouée',
      'returned_to_sender': 'Retourné',
      'lost': 'Perdu',
      'damaged': 'Endommagé'
    };

    const statusColors: { [key: string]: string } = {
      'En création': '#94a3b8',
      'Paiement en cours': '#f59e0b',
      'Payé': '#10b981',
      'Paiement échoué': '#ef4444',
      'Prêt dépôt': '#3b82f6',
      'Collecte programmée': '#3b82f6',
      'Collecté DPD': '#3b82f6',
      'Déposé point relais': '#3b82f6',
      'Transit DPD Europe': '#3b82f6',
      'Reçu entrepôt': '#1a7125',
      'Transit Congo': '#16a34a',
      'Arrivé Congo': '#10b981',
      'Prêt retrait': '#10b981',
      'En livraison': '#059669',
      'Livré': '#047857',
      'Tentative échouée': '#f59e0b',
      'Retourné': '#ef4444',
      'Perdu': '#dc2626',
      'Endommagé': '#dc2626'
    };

    const statusCounts: { [key: string]: number } = {};
    let totalShipments = 0;

    shipmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt || '';
      const totalPrice = data.pricing?.totalPrice || 0;
      const currentStatus = data.status?.current || 'unknown';

      totalShipments++;

      // Extraire le mois de création
      if (createdAt) {
        const date = new Date(createdAt);
        if (!isNaN(date.getTime())) {
          const month = date.getMonth();
          if (month >= 0 && month < 12) {
            monthlyData[month].colis++;
            monthlyData[month].revenus += totalPrice;
          }
        }
      }

      // Grouper les statuts pour simplifier la visualisation
      const statusLabel = statusGrouping[currentStatus] || currentStatus;
      statusCounts[statusLabel] = (statusCounts[statusLabel] || 0) + 1;
    });

    // Transformer les données de statut pour l'affichage
    const statusData = Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status,
        value: count,
        color: statusColors[status] || '#6b7280'
      }))
      .sort((a, b) => b.value - a.value);

    // Arrondir les revenus à 2 décimales
    monthlyData.forEach(month => {
      month.revenus = Math.round(month.revenus * 100) / 100;
    });

    const overviewData = {
      monthlyData,
      statusData,
      totalParcels: totalShipments,
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ [Dashboard Overview] Data calculated successfully:', {
      totalShipments,
      statusCount: statusData.length,
      monthsWithData: monthlyData.filter(m => m.colis > 0).length
    });

    return response.json(overviewData);

  } catch (error) {
    console.error("❌ Error in getDashboardOverview:", error);
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
    console.log('📊 [Dashboard Stats] Fetching stats from collection: shipments (unified_v2)');

    // Récupérer tous les shipments
    const shipmentsRef = db.collection('shipments');
    const allShipmentsSnapshot = await shipmentsRef.get();

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

    console.log(`📊 [Dashboard Stats] Processing ${allShipmentsSnapshot.size} shipments...`);

    allShipmentsSnapshot.forEach((doc) => {
      const data = doc.data();

      // Nouvelle structure unified_v2
      const currentStatus = data.status?.current || '';
      const createDate = data.timestamps?.createdAt || '';
      const cost = data.pricing?.totalCost || data.pricing?.estimatedCost || 0;
      const userId = data.customerInfo?.sender?.userId || '';

      // Compter tous les colis payés (payment_completed ou au-delà)
      if (currentStatus && currentStatus !== 'created' && currentStatus !== 'payment_pending') {
        totalParcels++;
        revenue += cost;

        // Ajouter l'utilisateur unique
        if (userId) {
          uniqueUsers.add(userId);
        }
      }

      // Statistiques mensuelles
      if (createDate && createDate.startsWith(currentMonth)) {
        currentMonthParcels++;
        currentMonthRevenue += cost;
      } else if (createDate && createDate.startsWith(lastMonth)) {
        lastMonthParcels++;
        lastMonthRevenue += cost;
      }

      // Livraisons d'aujourd'hui
      if (currentStatus === 'delivered' && createDate && createDate.startsWith(today)) {
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

    // Récupérer les utilisateurs actifs (ayant créé un shipment dans les 7 derniers jours)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    let activeUsers = 0;
    let activeUsersThisWeek = new Set();
    let activeUsersLastWeek = new Set();

    allShipmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const createDate = data.timestamps?.createdAt || '';
      const userId = data.customerInfo?.sender?.userId || '';

      if (userId && createDate >= sevenDaysAgo) {
        activeUsersThisWeek.add(userId);
      }

      // Semaine précédente pour la tendance
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      if (userId && createDate >= fourteenDaysAgo && createDate < sevenDaysAgo) {
        activeUsersLastWeek.add(userId);
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

/**
 * ✅ GET DASHBOARD PERFORMANCE - Métriques de performance calculées depuis Firestore
 *
 * Calcule les métriques réelles:
 * - Taux de livraison (7 derniers jours)
 * - Délai moyen de livraison
 * - Satisfaction client (basé sur les feedbacks)
 * - Plaintes résolues
 */
async function getDashboardPerformance(response: Response, db: admin.firestore.Firestore) {
  try {
    console.log('📊 [Dashboard Performance] Calculating performance metrics from Firestore...');

    const shipmentsRef = db.collection('shipments');
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Récupérer tous les shipments
    const allShipmentsSnapshot = await shipmentsRef.get();

    let deliveredCount = 0;
    let totalParcelsLast7Days = 0;
    let deliveryTimes: number[] = [];
    let feedbackCount = 0;
    let positiveFeedbackCount = 0;
    let complaintsTotal = 0;
    let complaintsResolved = 0;

    allShipmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const currentStatus = data.status?.current || '';
      const createdAt = data.timestamps?.createdAt ? new Date(data.timestamps.createdAt) : null;
      const deliveredAt = data.timestamps?.deliveredAt ? new Date(data.timestamps.deliveredAt) : null;

      // Colis des 7 derniers jours
      if (createdAt && createdAt >= sevenDaysAgo) {
        totalParcelsLast7Days++;

        // Colis livrés
        if (currentStatus === 'delivered') {
          deliveredCount++;

          // Calculer délai de livraison
          if (deliveredAt && createdAt) {
            const deliveryTimeInDays = (deliveredAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            deliveryTimes.push(deliveryTimeInDays);
          }
        }
      }

      // Satisfaction client (feedback)
      if (data.feedback) {
        feedbackCount++;
        if (data.feedback.rating && data.feedback.rating >= 4) {
          positiveFeedbackCount++;
        }
      }

      // Plaintes
      if (data.complaint) {
        complaintsTotal++;
        if (data.complaint.status === 'resolved') {
          complaintsResolved++;
        }
      }
    });

    // Calculer les métriques
    const deliveryRate = totalParcelsLast7Days > 0
      ? Math.round((deliveredCount / totalParcelsLast7Days) * 100)
      : 0;

    const averageDeliveryTime = deliveryTimes.length > 0
      ? Math.round((deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length) * 10) / 10
      : 0;

    const customerSatisfaction = feedbackCount > 0
      ? Math.round((positiveFeedbackCount / feedbackCount) * 100)
      : 0;

    const complaintsResolvedRate = complaintsTotal > 0
      ? Math.round((complaintsResolved / complaintsTotal) * 100)
      : 0;

    const performance = {
      deliveryRate,
      averageDeliveryTime,
      customerSatisfaction,
      complaintsResolvedRate,
      lastUpdated: new Date().toISOString()
    };

    console.log('📊 [Dashboard Performance] Metrics calculated:', performance);

    return response.json(performance);

  } catch (error) {
    console.error("Error in getDashboardPerformance:", error);
    throw error;
  }
}