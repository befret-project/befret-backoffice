import { Request } from "firebase-functions/v2/https";
import { Response } from "express";
import * as admin from "firebase-admin";
import * as QRCode from "qrcode";
import { receptionHandler } from "./logistic-reception"; // ✅ NOUVEAU

/**
 * LOGISTIC API HANDLER - ROUTER PRINCIPAL
 *
 * Route vers les différents sous-modules logistiques
 */
export async function logisticHandler(
  request: Request,
  response: Response,
  db: admin.firestore.Firestore
) {
  const path = request.path;
  const method = request.method;

  console.log(`📦 [Logistic API] ${method} ${path}`);

  try {
    // ✅ NOUVEAU: Routes Réception Départ
    if (path.startsWith("/api/logistic/reception/")) {
      return await receptionHandler(request, response, db);
    }

    // Routes existantes
    if (path === "/api/logistic/expeditions" || path === "/api/logistic/expeditions/") {
      return await getExpeditions(request, response, db);
    } else if (path === "/api/logistic/reporting" || path === "/api/logistic/reporting/") {
      return await getLogisticReporting(request, response, db);
    } else if (path === "/api/logistic/qr-codes/generate" || path === "/api/logistic/qr-codes/generate/") {
      return await generateQRCodes(request, response, db);
    } else if (path === "/api/logistic/qr-codes/validate" || path === "/api/logistic/qr-codes/validate/") {
      return await validateQRCode(request, response, db);
    } else if (path.startsWith("/api/logistic/parcels/") && path.endsWith("/arrival-scan")) {
      return await recordArrivalScan(request, response, db);
    } else {
      return response.status(404).json({ error: "Logistic endpoint not found", success: false });
    }
  } catch (error) {
    console.error("❌ Logistic API Error:", error);
    return response.status(500).json({ error: "Failed to fetch logistic data", success: false });
  }
}

async function getExpeditions(request: Request, response: Response, db: admin.firestore.Firestore) {
  const status = request.query.status as string;
  const priority = request.query.priority as string;
  const searchTerm = request.query.search as string;
  
  let query = db.collection('expeditions')
    .orderBy('dateCreation', 'desc')
    .limit(100);

  if (status && status !== 'all') {
    query = db.collection('expeditions')
      .where('status', '==', status)
      .orderBy('dateCreation', 'desc')
      .limit(100);
  }

  const snapshot = await query.get();
  let expeditions = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Apply filters
  if (priority && priority !== 'all') {
    expeditions = expeditions.filter((exp: any) => exp.priority === priority);
  }
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    expeditions = expeditions.filter((exp: any) => 
      exp.reference?.toLowerCase().includes(term) ||
      exp.client?.nom?.toLowerCase().includes(term) ||
      exp.destination?.toLowerCase().includes(term)
    );
  }

  return response.json({
    expeditions,
    total: expeditions.length,
    success: true
  });
}

async function getLogisticReporting(request: Request, response: Response, db: admin.firestore.Firestore) {
  const period = request.query.period || '30days';
  
  // Calculate date range
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case '7days':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30days':
      startDate.setDate(now.getDate() - 30);
      break;
    case '3months':
      startDate.setMonth(now.getMonth() - 3);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }

  // Get expeditions
  const expeditionsSnapshot = await db.collection('expeditions')
    .where('dateCreation', '>=', startDate.toISOString())
    .orderBy('dateCreation', 'desc')
    .get();
  
  const expeditions = expeditionsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Calculate performance metrics
  const totalColis = expeditions.length;
  const deliveredExpeditions = expeditions.filter((exp: any) => exp.status === 'livre');
  const averageDeliveryTime = 7; // Calculate from actual data
  const successRate = expeditions.length > 0 ? Math.round((deliveredExpeditions.length / expeditions.length) * 100) : 0;
  const totalRevenue = expeditions.reduce((sum: number, exp: any) => sum + (exp.valeur || 0), 0);

  // Monthly breakdown
  const monthlyData = [];
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - i);
    
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    const monthExpeditions = expeditions.filter((exp: any) => {
      const expDate = new Date(exp.dateCreation);
      return expDate >= monthStart && expDate <= monthEnd;
    });
    
    monthlyData.push({
      mois: monthNames[monthDate.getMonth()],
      expeditions: monthExpeditions.length,
      colis: monthExpeditions.length,
      revenus: monthExpeditions.reduce((sum: number, exp: any) => sum + (exp.valeur || 0), 0)
    });
  }

  // Status distribution
  const statusCounts = expeditions.reduce((acc: any, exp: any) => {
    const status = exp.status || 'preparation';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusDistribution = Object.entries(statusCounts).map(([status, count]: [string, any]) => ({
    status,
    count,
    percentage: Math.round((count / totalColis) * 100)
  }));

  // Top destinations
  const destinations = expeditions.reduce((acc: any, exp: any) => {
    const dest = exp.destination || 'Destination inconnue';
    acc[dest] = (acc[dest] || 0) + 1;
    return acc;
  }, {});

  const topDestinations = Object.entries(destinations)
    .map(([destination, count]: [string, any]) => ({
      destination,
      count,
      percentage: Math.round((count / totalColis) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return response.json({
    success: true,
    performanceMetrics: {
      totalColis,
      colisTrend: 5.2, // Calculate actual trend
      delaiMoyenLivraison: averageDeliveryTime,
      tauxReussite: successRate,
      chiffreAffaires: totalRevenue
    },
    expeditionsParMois: monthlyData,
    statusDistribution,
    topDestinations
  });
}

// QR Code Generation Interface
interface QRCodeData {
  trackingID: string;
  parcelId: string;
  timestamp: string;
  version: number;
}

async function generateQRCodes(request: Request, response: Response, db: admin.firestore.Firestore) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed", success: false });
  }

  const { parcelIds, generateAll } = request.body;

  try {
    const results = [];
    let parcelsQuery;

    if (generateAll) {
      // Générer pour tous les colis sans QR code
      parcelsQuery = db.collection('parcel')
        .where('qrCode', '==', null)
        .limit(50);
    } else if (parcelIds && Array.isArray(parcelIds)) {
      // Générer pour des colis spécifiques
      parcelsQuery = db.collection('parcel')
        .where(admin.firestore.FieldPath.documentId(), 'in', parcelIds.slice(0, 10));
    } else {
      return response.status(400).json({ error: "Invalid request parameters", success: false });
    }

    const snapshot = await parcelsQuery.get();
    
    for (const doc of snapshot.docs) {
      const parcelData = doc.data();
      const parcelId = doc.id;
      const trackingID = parcelData.trackingID;

      if (!trackingID) {
        console.warn(`Parcel ${parcelId} has no trackingID`);
        continue;
      }

      // Générer les données QR
      const qrData: QRCodeData = {
        trackingID,
        parcelId,
        timestamp: new Date().toISOString(),
        version: 1
      };

      const qrString = `BEFRET:${JSON.stringify(qrData)}`;
      
      // Générer le QR code image
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 200
      });

      // Mettre à jour le document avec le QR code
      await db.collection('parcel').doc(parcelId).update({
        qrCode: qrString,
        qrCodeImage: qrCodeDataURL,
        qrGenerated: admin.firestore.FieldValue.serverTimestamp()
      });

      results.push({
        parcelId,
        trackingID,
        qrCode: qrString,
        qrCodeImage: qrCodeDataURL,
        success: true
      });
    }

    return response.json({
      success: true,
      message: `Generated ${results.length} QR codes`,
      results
    });

  } catch (error) {
    console.error("QR Code generation error:", error);
    return response.status(500).json({ 
      error: "Failed to generate QR codes", 
      success: false 
    });
  }
}

async function validateQRCode(request: Request, response: Response, db: admin.firestore.Firestore) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed", success: false });
  }

  const { qrCode } = request.body;

  if (!qrCode) {
    return response.status(400).json({ error: "QR code is required", success: false });
  }

  try {
    // Décoder le QR code
    if (!qrCode.startsWith('BEFRET:')) {
      return response.json({
        valid: false,
        error: "Invalid QR code format",
        success: false
      });
    }

    const jsonPart = qrCode.substring(7); // Remove 'BEFRET:' prefix
    const qrData = JSON.parse(jsonPart) as QRCodeData;

    // Validation des données
    if (!qrData.trackingID || !qrData.parcelId) {
      return response.json({
        valid: false,
        error: "Invalid QR code data",
        success: false
      });
    }

    // Vérifier si le colis existe
    const parcelDoc = await db.collection('parcel').doc(qrData.parcelId).get();
    
    if (!parcelDoc.exists) {
      return response.json({
        valid: false,
        error: "Parcel not found",
        success: false
      });
    }

    const parcelData = parcelDoc.data();
    
    // Vérifier la cohérence
    if (parcelData?.trackingID !== qrData.trackingID) {
      return response.json({
        valid: false,
        error: "QR code data mismatch",
        success: false
      });
    }

    return response.json({
      valid: true,
      parcel: {
        id: qrData.parcelId,
        trackingID: qrData.trackingID,
        ...parcelData
      },
      success: true
    });

  } catch (error) {
    console.error("QR Code validation error:", error);
    return response.status(500).json({ 
      error: "Failed to validate QR code", 
      success: false 
    });
  }
}

async function recordArrivalScan(request: Request, response: Response, db: admin.firestore.Firestore) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed", success: false });
  }

  const parcelId = request.path.split('/')[3]; // Extract parcelId from path
  const { operator, location, scannerId, photo } = request.body;

  if (!parcelId || !operator || !location) {
    return response.status(400).json({ 
      error: "Missing required fields", 
      success: false 
    });
  }

  try {
    const parcelRef = db.collection('parcel').doc(parcelId);
    const parcelDoc = await parcelRef.get();
    
    if (!parcelDoc.exists) {
      return response.status(404).json({ 
        error: "Parcel not found", 
        success: false 
      });
    }

    const scanData = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      operator,
      location,
      scannerId: scannerId || 'manual',
      photo: photo || null
    };

    // Ajouter le scan d'arrivée
    await parcelRef.update({
      arrivalScan: scanData,
      logisticStatus: 'scanned',
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdatedBy: operator
    });

    // Ajouter à l'historique des étapes
    const processingStep = {
      step: 'arrival_scan',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      operator,
      location,
      data: scanData
    };

    await parcelRef.update({
      processingHistory: admin.firestore.FieldValue.arrayUnion(processingStep)
    });

    return response.json({
      success: true,
      message: "Arrival scan recorded successfully",
      scanData
    });

  } catch (error) {
    console.error("Arrival scan error:", error);
    return response.status(500).json({ 
      error: "Failed to record arrival scan", 
      success: false 
    });
  }
}