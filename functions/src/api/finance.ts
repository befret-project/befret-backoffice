import { Request } from "firebase-functions/v2/https";
import { Response } from "express";
import * as admin from "firebase-admin";

export async function financeHandler(
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
    if (path === "/finance/stats" || path === "/finance/stats/") {
      return await getFinanceStats(request, response, db);
    } else if (path === "/finance/invoices" || path === "/finance/invoices/") {
      return await getInvoices(request, response, db);
    } else if (path === "/finance/payments" || path === "/finance/payments/") {
      return await getPayments(request, response, db);
    } else {
      return response.status(404).json({ error: "Finance endpoint not found", success: false });
    }
  } catch (error) {
    console.error("Finance API Error:", error);
    return response.status(500).json({ error: "Failed to fetch finance data", success: false });
  }
}

async function getFinanceStats(request: Request, response: Response, db: admin.firestore.Firestore) {
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

  // Get invoices
  const invoicesSnapshot = await db.collection('invoices')
    .where('dateEmission', '>=', startDate.toISOString())
    .orderBy('dateEmission', 'desc')
    .get();
  
  const invoices = invoicesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Get payments
  const paymentsSnapshot = await db.collection('payments')
    .where('datePaiement', '>=', startDate.toISOString())
    .orderBy('datePaiement', 'desc')
    .get();
  
  const payments = paymentsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Calculate stats
  const totalRevenue = invoices.reduce((sum: number, invoice: any) => sum + (invoice.montant || 0), 0);
  const unpaidInvoices = invoices.filter((invoice: any) => invoice.status === 'impaye');
  const totalUnpaid = unpaidInvoices.reduce((sum: number, invoice: any) => sum + (invoice.montant || 0), 0);
  const totalPaid = payments.reduce((sum: number, payment: any) => sum + (payment.montant || 0), 0);

  return response.json({
    success: true,
    stats: {
      totalInvoices: invoices.length,
      totalRevenue,
      totalUnpaid,
      unpaidCount: unpaidInvoices.length,
      totalPayments: payments.length,
      totalPaid,
      revenueTrend: 12.5, // Calculate actual trend
      averageInvoiceAmount: invoices.length > 0 ? Math.round(totalRevenue / invoices.length) : 0,
      paymentRate: totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0
    }
  });
}

async function getInvoices(request: Request, response: Response, db: admin.firestore.Firestore) {
  const status = request.query.status as string;
  const searchTerm = request.query.search as string;
  
  let query = db.collection('invoices')
    .orderBy('dateEmission', 'desc')
    .limit(100);

  if (status && status !== 'all') {
    query = db.collection('invoices')
      .where('status', '==', status)
      .orderBy('dateEmission', 'desc')
      .limit(100);
  }

  const snapshot = await query.get();
  let invoices = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Apply search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    invoices = invoices.filter((invoice: any) => 
      invoice.numero?.toLowerCase().includes(term) ||
      invoice.client?.nom?.toLowerCase().includes(term)
    );
  }

  return response.json({
    invoices,
    total: invoices.length,
    success: true
  });
}

async function getPayments(request: Request, response: Response, db: admin.firestore.Firestore) {
  const status = request.query.status as string;
  const method = request.query.method as string;
  const searchTerm = request.query.search as string;
  
  let query = db.collection('payments')
    .orderBy('datePaiement', 'desc')
    .limit(100);

  if (status && status !== 'all') {
    query = db.collection('payments')
      .where('status', '==', status)
      .orderBy('datePaiement', 'desc')
      .limit(100);
  }

  const snapshot = await query.get();
  let payments = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Apply filters
  if (method && method !== 'all') {
    payments = payments.filter((payment: any) => payment.methode === method);
  }
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    payments = payments.filter((payment: any) => 
      payment.reference?.toLowerCase().includes(term) ||
      payment.client?.nom?.toLowerCase().includes(term)
    );
  }

  return response.json({
    payments,
    total: payments.length,
    success: true
  });
}