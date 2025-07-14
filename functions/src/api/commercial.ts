import { Request } from "firebase-functions/v2/https";
import { Response } from "express";
import * as admin from "firebase-admin";

export async function commercialHandler(
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
    if (path === "/commercial/stats" || path === "/commercial/stats/") {
      return await getCommercialStats(request, response, db);
    } else if (path === "/commercial/clients" || path === "/commercial/clients/") {
      return await getClients(request, response, db);
    } else if (path === "/commercial/opportunities" || path === "/commercial/opportunities/") {
      return await getOpportunities(request, response, db);
    } else {
      return response.status(404).json({ error: "Commercial endpoint not found", success: false });
    }
  } catch (error) {
    console.error("Commercial API Error:", error);
    return response.status(500).json({ error: "Failed to fetch commercial data", success: false });
  }
}

async function getCommercialStats(request: Request, response: Response, db: admin.firestore.Firestore) {
  // const period = request.query.period || '30days'; // Pour usage futur
  
  // Get clients
  const clientsSnapshot = await db.collection('clients')
    .orderBy('dateCreation', 'desc')
    .get();
  
  const clients = clientsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Get opportunities
  const opportunitiesSnapshot = await db.collection('opportunities')
    .orderBy('dateCreation', 'desc')
    .get();
  
  const opportunities = opportunitiesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Get quotes
  const quotesSnapshot = await db.collection('quotes')
    .orderBy('dateCreation', 'desc')
    .get();
  
  const quotes = quotesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Calculate stats
  const totalClients = clients.length;
  const activeClients = clients.filter((client: any) => client.status === 'actif').length;
  const openOpportunities = opportunities.filter((opp: any) => 
    ['qualification', 'proposition', 'negociation'].includes(opp.stage)
  );
  const wonOpportunities = opportunities.filter((opp: any) => opp.stage === 'gagne');
  const totalPipelineValue = opportunities.reduce((sum: number, opp: any) => sum + (opp.valeur || 0), 0);
  const conversionRate = opportunities.length > 0 ? Math.round((wonOpportunities.length / opportunities.length) * 100) : 0;
  const pendingQuotes = quotes.filter((quote: any) => quote.status === 'en_attente');
  const acceptedQuotes = quotes.filter((quote: any) => quote.status === 'accepte');

  return response.json({
    success: true,
    stats: {
      totalClients,
      activeClients,
      totalOpportunities: openOpportunities.length,
      totalPipelineValue,
      conversionRate,
      averageDealSize: wonOpportunities.length > 0 ? Math.round(totalPipelineValue / wonOpportunities.length) : 0,
      totalQuotes: pendingQuotes.length,
      acceptedQuotes: acceptedQuotes.length,
      pipelineTrend: 8.5 // Calculate actual trend
    }
  });
}

async function getClients(request: Request, response: Response, db: admin.firestore.Firestore) {
  const status = request.query.status as string;
  const type = request.query.type as string;
  const searchTerm = request.query.search as string;
  
  let query = db.collection('clients')
    .orderBy('dateCreation', 'desc')
    .limit(100);

  if (status && status !== 'all') {
    query = db.collection('clients')
      .where('status', '==', status)
      .orderBy('dateCreation', 'desc')
      .limit(100);
  }

  const snapshot = await query.get();
  let clients = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Apply filters
  if (type && type !== 'all') {
    clients = clients.filter((client: any) => client.type === type);
  }
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    clients = clients.filter((client: any) => 
      client.nom?.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term) ||
      client.entreprise?.toLowerCase().includes(term)
    );
  }

  return response.json({
    clients,
    total: clients.length,
    success: true
  });
}

async function getOpportunities(request: Request, response: Response, db: admin.firestore.Firestore) {
  const stage = request.query.stage as string;
  const searchTerm = request.query.search as string;
  
  let query = db.collection('opportunities')
    .orderBy('dateCreation', 'desc')
    .limit(100);

  if (stage && stage !== 'all') {
    query = db.collection('opportunities')
      .where('stage', '==', stage)
      .orderBy('dateCreation', 'desc')
      .limit(100);
  }

  const snapshot = await query.get();
  let opportunities = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Apply search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    opportunities = opportunities.filter((opp: any) => 
      opp.nom?.toLowerCase().includes(term) ||
      opp.description?.toLowerCase().includes(term) ||
      opp.client?.nom?.toLowerCase().includes(term)
    );
  }

  return response.json({
    opportunities,
    total: opportunities.length,
    success: true
  });
}