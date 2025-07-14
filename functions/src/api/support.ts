import { Request } from "firebase-functions/v2/https";
import { Response } from "express";
import * as admin from "firebase-admin";

export async function supportHandler(
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
    if (path === "/support/tickets" || path === "/support/tickets/") {
      return await getTickets(request, response, db);
    } else {
      return response.status(404).json({ error: "Support endpoint not found", success: false });
    }
  } catch (error) {
    console.error("Support API Error:", error);
    return response.status(500).json({ error: "Failed to fetch support data", success: false });
  }
}

async function getTickets(request: Request, response: Response, db: admin.firestore.Firestore) {
  const status = request.query.status as string;
  const priority = request.query.priority as string;
  const searchTerm = request.query.search as string;
  
  let query = db.collection('support_tickets')
    .orderBy('dateCreation', 'desc')
    .limit(100);

  if (status && status !== 'all') {
    query = db.collection('support_tickets')
      .where('status', '==', status)
      .orderBy('dateCreation', 'desc')
      .limit(100);
  }

  const snapshot = await query.get();
  let tickets = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Apply filters
  if (priority && priority !== 'all') {
    tickets = tickets.filter((ticket: any) => ticket.priorite === priority);
  }
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    tickets = tickets.filter((ticket: any) => 
      ticket.numero?.toLowerCase().includes(term) ||
      ticket.sujet?.toLowerCase().includes(term) ||
      ticket.client?.nom?.toLowerCase().includes(term)
    );
  }

  return response.json({
    tickets,
    total: tickets.length,
    success: true
  });
}