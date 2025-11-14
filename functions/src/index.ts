import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import cors from "cors";

// Initialize Firebase Admin with service account
try {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  logger.info("Firebase Admin initialized with service account");
} catch (error) {
  logger.error("Error loading service account:", error);
  // Fallback to default initialization
  admin.initializeApp();
  logger.info("Firebase Admin initialized with default credentials");
}
const db = admin.firestore();

// Configure CORS
const corsHandler = cors({ origin: true });

// Import API handlers
import { dashboardHandler } from "./api/dashboard-v2"; // ✅ MIGRÉ VERS unified_v2
import { financeHandler } from "./api/finance";
import { commercialHandler } from "./api/commercial";
import { logisticHandler } from "./api/logistic";
import { supportHandler } from "./api/support";
import { sortingHandler } from "./api/sorting";
import { paymentHandler } from "./api/payment";
import { authHandler } from "./auth";

// Main API function that routes to different handlers
export const api = onRequest({
  cors: true,
  region: 'europe-west1',
  secrets: ["WEB_API_KEY"]
}, async (request, response) => {
  try {
    return new Promise<void>((resolve, reject) => {
      corsHandler(request, response, async (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        try {
          const path = request.path;
          const method = request.method;
          
          logger.info(`API Request: ${method} ${path}`);
          logger.info(`API URL: ${request.url}`);

          // Route to appropriate handler based on path
          // Note: Firebase keeps full path including /api prefix
          if (path.startsWith("/api/auth/") || path === "/api/auth") {
            await authHandler(request, response);
          } else if (path.startsWith("/api/dashboard")) {
            await dashboardHandler(request, response, db);
          } else if (path.startsWith("/api/sorting")) {
            await sortingHandler(request, response, db);
          } else if (path.startsWith("/api/payment")) {
            await paymentHandler(request, response, db);
          } else if (path.startsWith("/api/finance")) {
            await financeHandler(request, response, db);
          } else if (path.startsWith("/api/commercial")) {
            await commercialHandler(request, response, db);
          } else if (path.startsWith("/api/logistic")) {
            await logisticHandler(request, response, db);
          } else if (path.startsWith("/api/support")) {
            await supportHandler(request, response, db);
          } else {
            logger.error(`Unmatched route: ${method} ${path}`);
            response.status(404).json({ error: `Route not found: ${method} ${path}`, success: false });
          }
          resolve();
        } catch (handlerError) {
          reject(handlerError);
        }
      });
    });
  } catch (error) {
    logger.error("API Error:", error);
    response.status(500).json({ error: "Internal server error", success: false });
  }
});