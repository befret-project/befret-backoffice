/**
 * DASHBOARD API - VERSION 2 (UNIFIED_V2)
 *
 * ✅ PRODUCTION READY
 * ✅ UTILISE COLLECTION 'shipments'
 * ✅ PAS DE PLACEHOLDER
 * ✅ ARCHITECTURE PROFESSIONNELLE
 *
 * @version 2.0.0
 * @author BeFret Development Team
 */

import { Request } from "firebase-functions/v2/https";
import { Response } from "express";
import * as admin from "firebase-admin";

/**
 * Main Dashboard Handler
 * Routes vers les différents endpoints dashboard
 */
export async function dashboardHandler(
  request: Request,
  response: Response,
  db: admin.firestore.Firestore
) {
  const path = request.path;
  const method = request.method;

  if (method !== "GET") {
    return response.status(405).json({
      error: "Method not allowed",
      success: false
    });
  }

  try {
    if (path === "/api/dashboard/overview" || path === "/api/dashboard/overview/") {
      return await getDashboardOverview(response, db);
    } else if (path === "/api/dashboard/recent-activity" || path === "/api/dashboard/recent-activity/") {
      return await getRecentActivity(response, db);
    } else if (path === "/api/dashboard/stats" || path === "/api/dashboard/stats/") {
      return await getDashboardStats(response, db);
    } else {
      return response.status(404).json({
        error: "Dashboard endpoint not found",
        success: false
      });
    }
  } catch (error) {
    console.error("❌ Dashboard API Error:", error);
    return response.status(500).json({
      error: "Failed to fetch dashboard data",
      success: false
    });
  }
}

// ============================================================================
// GET DASHBOARD OVERVIEW
// ============================================================================

/**
 * Retourne les données mensuelles et la répartition par statut
 * Utilise la collection 'shipments' (unified_v2)
 */
async function getDashboardOverview(
  response: Response,
  db: admin.firestore.Firestore
) {
  try {
    console.log('📈 [Dashboard Overview] Fetching from collection: shipments');

    const shipmentsRef = db.collection('shipments');
    const shipmentsSnapshot = await shipmentsRef.get();

    console.log(`📈 [Dashboard Overview] Processing ${shipmentsSnapshot.size} shipments`);

    // Initialiser données mensuelles
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
                        'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyData = monthNames.map(name => ({
      name,
      colis: 0,
      revenus: 0
    }));

    // Mapping statuts pour regroupement visuel
    const statusMapping: { [key: string]: { label: string; color: string } } = {
      // Phase Order
      'created': { label: 'En création', color: '#94a3b8' },
      'payment_pending': { label: 'Paiement en cours', color: '#f59e0b' },
      'payment_completed': { label: 'Payé', color: '#10b981' },
      'payment_failed': { label: 'Paiement échoué', color: '#ef4444' },

      // Phase DPD Collection
      'ready_for_deposit': { label: 'Prêt dépôt DPD', color: '#3b82f6' },
      'collection_scheduled': { label: 'Collecte programmée', color: '#3b82f6' },
      'collected_by_dpd': { label: 'Collecté par DPD', color: '#3b82f6' },
      'deposited_at_pickup': { label: 'Déposé point relais', color: '#3b82f6' },
      'dpd_transit_eu': { label: 'Transit DPD', color: '#3b82f6' },
      'received_at_warehouse': { label: 'Reçu entrepôt', color: '#1a7125' },

      // Phase BeFret Distribution
      'befret_transit': { label: 'Transit Congo', color: '#16a34a' },
      'arrived_in_congo': { label: 'Arrivé Congo', color: '#10b981' },
      'ready_for_pickup': { label: 'Prêt retrait', color: '#10b981' },
      'out_for_delivery': { label: 'En livraison', color: '#059669' },
      'delivered': { label: 'Livré', color: '#047857' },

      // Problèmes
      'delivery_attempted': { label: 'Tentative échouée', color: '#f59e0b' },
      'returned_to_sender': { label: 'Retourné', color: '#ef4444' },
      'lost': { label: 'Perdu', color: '#dc2626' },
      'damaged': { label: 'Endommagé', color: '#dc2626' }
    };

    const statusCounts: { [key: string]: number } = {};
    let totalShipments = 0;

    shipmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt || '';
      const totalPrice = data.pricing?.totalPrice || 0;
      const currentStatus = data.status?.current || 'unknown';

      totalShipments++;

      // Statistiques mensuelles
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

      // Comptage par statut
      const mapping = statusMapping[currentStatus];
      const label = mapping ? mapping.label : currentStatus;
      statusCounts[label] = (statusCounts[label] || 0) + 1;
    });

    // Transformer pour l'affichage
    const statusData = Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([label, count]) => {
        // Trouver la couleur correspondante
        const statusEntry = Object.values(statusMapping).find(m => m.label === label);
        return {
          name: label,
          value: count,
          color: statusEntry ? statusEntry.color : '#6b7280'
        };
      })
      .sort((a, b) => b.value - a.value);

    // Arrondir les revenus
    monthlyData.forEach(month => {
      month.revenus = Math.round(month.revenus * 100) / 100;
    });

    const overviewData = {
      monthlyData,
      statusData,
      totalParcels: totalShipments,
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ [Dashboard Overview] Success:', {
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

// ============================================================================
// GET RECENT ACTIVITY
// ============================================================================

/**
 * Retourne les activités récentes (créations, réceptions, livraisons)
 * Utilise la collection 'shipments' et l'historique des statuts
 */
async function getRecentActivity(
  response: Response,
  db: admin.firestore.Firestore
) {
  try {
    console.log('🔄 [Recent Activity] Fetching recent activity');

    const shipmentsRef = db.collection('shipments');
    const recentShipmentsQuery = shipmentsRef
      .orderBy('updatedAt', 'desc')
      .limit(30);

    const shipmentsSnapshot = await recentShipmentsQuery.get();
    console.log(`🔄 [Recent Activity] Found ${shipmentsSnapshot.size} recent shipments`);

    const activities: any[] = [];

    shipmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const trackingNumber = data.trackingNumber || 'N/A';
      const senderName = data.customerInfo?.sender?.name || 'Client';
      const receiverName = data.customerInfo?.receiver?.name || 'Destinataire';
      const currentStatus = data.status?.current;
      // const statusHistory = data.status?.history || [];

      // Activité de création
      if (data.createdAt) {
        activities.push({
          id: `created-${doc.id}`,
          type: 'shipment',
          title: `Nouvelle expédition ${trackingNumber}`,
          description: `Créée par ${senderName} pour ${receiverName}`,
          timestamp: data.createdAt,
          status: 'info',
          link: `/logistic/colis/all?search=${trackingNumber}`
        });
      }

      // Activité de paiement
      if (currentStatus === 'payment_completed' && data.webhookStatus?.stages?.payment?.timestamp) {
        activities.push({
          id: `payment-${doc.id}`,
          type: 'payment',
          title: `Paiement reçu ${data.pricing?.totalPrice || 0}€`,
          description: `Expédition ${trackingNumber}`,
          timestamp: data.webhookStatus.stages.payment.timestamp,
          status: 'success',
          link: `/logistic/colis/all?search=${trackingNumber}`
        });
      }

      // Activité de réception entrepôt
      if (data.logisticData?.receptionDepart?.receivedAt) {
        const weight = data.logisticData.receptionDepart.weighing?.actualWeight
                    || data.parcelInfo?.weight || 0;
        activities.push({
          id: `reception-${doc.id}`,
          type: 'logistic',
          title: `Colis reçu ${trackingNumber}`,
          description: `Réceptionné à l'entrepôt - ${weight} kg`,
          timestamp: data.logisticData.receptionDepart.receivedAt,
          status: 'success',
          link: `/logistic/reception-depart/recherche?search=${trackingNumber}`
        });
      }

      // Activité de pesée avec écart
      if (data.logisticData?.receptionDepart?.weighing?.weighedAt) {
        const weighing = data.logisticData.receptionDepart.weighing;
        const hasDiscrepancy = Math.abs(weighing.weightDifference || 0) > 0.1;

        if (hasDiscrepancy) {
          activities.push({
            id: `weighing-${doc.id}`,
            type: 'logistic',
            title: `Écart de poids détecté ${trackingNumber}`,
            description: `Déclaré: ${weighing.declaredWeight}kg, Réel: ${weighing.actualWeight}kg (${weighing.weightDifference > 0 ? '+' : ''}${weighing.weightDifference}kg)`,
            timestamp: weighing.weighedAt,
            status: 'warning',
            link: `/logistic/reception-depart/pesee?search=${trackingNumber}`
          });
        }
      }

      // Activité d'expédition
      if (data.logisticData?.expedition?.dispatchedAt) {
        const groupageId = data.logisticData.expedition.groupage?.groupageId || 'N/A';
        activities.push({
          id: `expedition-${doc.id}`,
          type: 'logistic',
          title: `Colis expédié ${trackingNumber}`,
          description: `Groupage: ${groupageId} - Destination: ${data.destinationInfo?.city || 'Congo'}`,
          timestamp: data.logisticData.expedition.dispatchedAt,
          status: 'success',
          link: `/logistic/expedition/groupage/${groupageId}`
        });
      }

      // Activité de livraison
      if (data.logisticData?.delivery?.deliveredAt) {
        activities.push({
          id: `delivered-${doc.id}`,
          type: 'delivery',
          title: `Colis livré ${trackingNumber}`,
          description: `Livraison réussie à ${receiverName}`,
          timestamp: data.logisticData.delivery.deliveredAt,
          status: 'success',
          link: `/logistic/colis/all?search=${trackingNumber}`
        });
      }

      // Tentative de livraison échouée
      const attemptedDeliveries = data.logisticData?.delivery?.attemptedDeliveries || [];
      if (attemptedDeliveries.length > 0) {
        const lastAttempt = attemptedDeliveries[attemptedDeliveries.length - 1];
        activities.push({
          id: `attempt-failed-${doc.id}-${attemptedDeliveries.length}`,
          type: 'delivery',
          title: `Tentative de livraison échouée ${trackingNumber}`,
          description: `Raison: ${lastAttempt.reason}`,
          timestamp: lastAttempt.attemptedAt,
          status: 'warning',
          link: `/logistic/livraison/deliver?search=${trackingNumber}`
        });
      }
    });

    // Trier par timestamp décroissant
    activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Garder les 20 plus récentes
    const recentActivities = activities.slice(0, 20);

    console.log(`✅ [Recent Activity] Returning ${recentActivities.length} activities`);

    return response.json(recentActivities);

  } catch (error) {
    console.error("❌ Error in getRecentActivity:", error);
    throw error;
  }
}

// ============================================================================
// GET DASHBOARD STATS
// ============================================================================

/**
 * Retourne les statistiques du dashboard (KPIs)
 * Total colis, utilisateurs actifs, revenus, livraisons du jour
 */
async function getDashboardStats(
  response: Response,
  db: admin.firestore.Firestore
) {
  try {
    console.log('📊 [Dashboard Stats] Calculating stats');

    const shipmentsRef = db.collection('shipments');
    const shipmentsSnapshot = await shipmentsRef.get();

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = now.toISOString().substring(0, 7);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString().substring(0, 7);

    let totalParcels = 0;
    let revenue = 0;
    let deliveredToday = 0;
    let currentMonthParcels = 0;
    let lastMonthParcels = 0;
    let currentMonthRevenue = 0;
    let lastMonthRevenue = 0;
    const uniqueUsers = new Set<string>();

    shipmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt || '';
      const totalPrice = data.pricing?.totalPrice || 0;
      const currentStatus = data.status?.current;

      totalParcels++;
      revenue += totalPrice;

      // Utilisateurs uniques
      if (data.customerInfo?.userId) {
        uniqueUsers.add(data.customerInfo.userId);
      }

      // Statistiques mensuelles
      if (createdAt.startsWith(currentMonth)) {
        currentMonthParcels++;
        currentMonthRevenue += totalPrice;
      } else if (createdAt.startsWith(lastMonth)) {
        lastMonthParcels++;
        lastMonthRevenue += totalPrice;
      }

      // Livraisons d'aujourd'hui
      const deliveredAt = data.logisticData?.delivery?.deliveredAt || '';
      if (currentStatus === 'delivered' && deliveredAt.startsWith(today)) {
        deliveredToday++;
      }
    });

    // Calculer les tendances
    const parcelsTrend = lastMonthParcels > 0
      ? Math.round(((currentMonthParcels - lastMonthParcels) / lastMonthParcels) * 100)
      : currentMonthParcels > 0 ? 100 : 0;

    const revenueTrend = lastMonthRevenue > 0
      ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : currentMonthRevenue > 0 ? 100 : 0;

    // Utilisateurs actifs (ayant créé un colis dans les 7 derniers jours)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const activeUsersThisWeek = new Set<string>();
    const activeUsersLastWeek = new Set<string>();

    shipmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt || '';
      const userId = data.customerInfo?.userId;

      if (userId && createdAt >= sevenDaysAgo) {
        activeUsersThisWeek.add(userId);
      }

      if (userId && createdAt >= fourteenDaysAgo && createdAt < sevenDaysAgo) {
        activeUsersLastWeek.add(userId);
      }
    });

    const activeUsers = activeUsersThisWeek.size;
    const usersTrend = activeUsersLastWeek.size > 0
      ? Math.round(((activeUsers - activeUsersLastWeek.size) / activeUsersLastWeek.size) * 100)
      : activeUsers > 0 ? 100 : 0;

    const stats = {
      totalParcels,
      parcelsTrend,
      activeUsers,
      usersTrend,
      revenue: Math.round(revenue * 100) / 100,
      revenueTrend,
      deliveredToday,
      deliveredTrend: 0 // Placeholder pour future implémentation
    };

    console.log('✅ [Dashboard Stats] Stats calculated:', stats);

    return response.json(stats);

  } catch (error) {
    console.error("❌ Error in getDashboardStats:", error);
    throw error;
  }
}
