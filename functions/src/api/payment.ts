import { Request } from "firebase-functions/v2/https";
import { Response } from "express";
import * as admin from "firebase-admin";

// Configuration Stripe (à adapter selon vos clés)
// const STRIPE_CONFIG = {
//   secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_...',
//   webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...'
// };

export async function paymentHandler(
  request: Request,
  response: Response,
  db: admin.firestore.Firestore
) {
  const path = request.path;
  const method = request.method;

  try {
    if (path === "/api/payment/stripe/create-link" || path === "/api/payment/stripe/create-link/") {
      if (method === "POST") {
        return await createStripePaymentLink(request, response, db);
      } else {
        return response.status(405).json({ error: "Method not allowed", success: false });
      }
    } else if (path.startsWith("/api/payment/stripe/status/")) {
      if (method === "GET") {
        return await getPaymentStatus(request, response, db);
      } else {
        return response.status(405).json({ error: "Method not allowed", success: false });
      }
    } else if (path === "/api/payment/stripe/webhook" || path === "/api/payment/stripe/webhook/") {
      if (method === "POST") {
        return await handleStripeWebhook(request, response, db);
      } else {
        return response.status(405).json({ error: "Method not allowed", success: false });
      }
    } else {
      return response.status(404).json({ error: "Payment endpoint not found", success: false });
    }
  } catch (error) {
    console.error("Payment API Error:", error);
    return response.status(500).json({ error: "Failed to process payment request", success: false });
  }
}

async function createStripePaymentLink(request: Request, response: Response, db: admin.firestore.Firestore) {
  try {
    console.log('💳 [Stripe Payment] Creating payment link...');

    const {
      amount,
      currency = 'eur',
      trackingID,
      parcelId,
      reason,
      customerEmail,
      customerPhone,
      description,
      metadata = {}
    } = request.body;

    // Validation
    if (!amount || amount <= 0) {
      return response.status(400).json({ error: "Invalid amount", success: false });
    }

    if (!trackingID || !parcelId) {
      return response.status(400).json({ error: "Missing parcel information", success: false });
    }

    // Vérifier que le colis existe
    const parcelRef = db.collection('parcel').doc(parcelId);
    const parcelDoc = await parcelRef.get();
    
    if (!parcelDoc.exists) {
      return response.status(404).json({ error: "Parcel not found", success: false });
    }

    // const parcelData = parcelDoc.data()!;

    // Simuler la création du lien Stripe (remplacer par la vraie API Stripe)
    const paymentLinkId = `pl_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h
    
    // En production, utilisez la vraie API Stripe :
    /*
    const stripe = require('stripe')(STRIPE_CONFIG.secretKey);
    
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: description || `Supplément - Colis ${trackingID}`,
              metadata: {
                trackingID,
                parcelId,
                reason
              }
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        trackingID,
        parcelId,
        reason,
        source: 'befret-backoffice',
        ...metadata
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.CLIENT_URL}/payment/success?tracking=${trackingID}&session_id={CHECKOUT_SESSION_ID}`
        }
      }
    });
    */

    // Simulation de la réponse Stripe
    const paymentLink = {
      id: paymentLinkId,
      url: `https://checkout.stripe.com/c/pay/test_payment_link_${paymentLinkId}#fidkdWxOYHwnPyd1blpxYHZxWjA0VWhGR3VLSzR2czZNQ3BGUVZHbnVMcGxcbT1AV0drdGZiaE9xdEd2bmRXZjJ8Y31NZkdxTm9HT0ZcUVJDfFRMSWx1R2w0Q25Tb0Q2TXR0YGpRUzFBVjI1SEA0bGhuZTB3fCcpJ2hsYXYnP34`,
      active: true,
      metadata: {
        trackingID,
        parcelId,
        reason,
        source: 'befret-backoffice'
      }
    };

    // Enregistrer le paiement en attente dans Firestore
    const paymentRecord = {
      id: paymentLinkId,
      parcelId: parcelId,
      trackingID: trackingID,
      amount: amount,
      currency: currency,
      status: 'pending',
      reason: reason,
      customerEmail: customerEmail,
      customerPhone: customerPhone,
      description: description,
      paymentUrl: paymentLink.url,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt,
      metadata: metadata
    };

    await db.collection('payments').doc(paymentLinkId).set(paymentRecord);

    // Mettre à jour le colis avec l'info de paiement
    await parcelRef.update({
      pendingPayment: {
        id: paymentLinkId,
        amount: amount,
        currency: currency,
        reason: reason,
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      lastUpdated: new Date().toISOString()
    });

    console.log(`✅ [Stripe Payment] Payment link created for parcel ${trackingID}: ${paymentLinkId}`);

    return response.json({
      success: true,
      id: paymentLinkId,
      url: paymentLink.url,
      expiresAt: expiresAt,
      amount: amount,
      currency: currency
    });

  } catch (error) {
    console.error("Error creating Stripe payment link:", error);
    return response.status(500).json({ error: "Failed to create payment link", success: false });
  }
}

async function getPaymentStatus(request: Request, response: Response, db: admin.firestore.Firestore) {
  try {
    const paymentId = request.path.split('/').pop();
    
    if (!paymentId) {
      return response.status(400).json({ error: "Payment ID required", success: false });
    }

    console.log(`💳 [Stripe Payment] Checking status for payment ${paymentId}...`);

    // Récupérer le statut depuis Firestore
    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    
    if (!paymentDoc.exists) {
      return response.status(404).json({ error: "Payment not found", success: false });
    }

    const paymentData = paymentDoc.data()!;

    // En production, vérifier avec Stripe :
    /*
    const stripe = require('stripe')(STRIPE_CONFIG.secretKey);
    const paymentLink = await stripe.paymentLinks.retrieve(paymentId);
    */

    return response.json({
      success: true,
      status: paymentData.status,
      amount: paymentData.amount,
      currency: paymentData.currency,
      trackingID: paymentData.trackingID,
      createdAt: paymentData.createdAt,
      updatedAt: paymentData.updatedAt || paymentData.createdAt
    });

  } catch (error) {
    console.error("Error checking payment status:", error);
    return response.status(500).json({ error: "Failed to check payment status", success: false });
  }
}

async function handleStripeWebhook(request: Request, response: Response, db: admin.firestore.Firestore) {
  try {
    console.log('🔔 [Stripe Webhook] Received webhook...');

    // En production, vérifier la signature du webhook :
    /*
    const stripe = require('stripe')(STRIPE_CONFIG.secretKey);
    const sig = request.headers['stripe-signature'];
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, STRIPE_CONFIG.webhookSecret);
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }
    */

    // Simulation d'événement Stripe
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          payment_status: 'paid',
          metadata: {
            trackingID: 'BGFXNG',
            parcelId: 'parcel123',
            reason: 'weight_supplement'
          }
        }
      }
    };

    // Traiter l'événement
    switch (event.type) {
      case 'checkout.session.completed':
        await handlePaymentSuccess(event.data.object, db);
        break;
      case 'checkout.session.expired':
        await handlePaymentExpired(event.data.object, db);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return response.json({ received: true });

  } catch (error) {
    console.error("Error handling Stripe webhook:", error);
    return response.status(500).json({ error: "Failed to handle webhook", success: false });
  }
}

async function handlePaymentSuccess(session: any, db: admin.firestore.Firestore) {
  try {
    const { trackingID, parcelId, reason } = session.metadata;
    
    console.log(`✅ [Stripe Webhook] Payment successful for parcel ${trackingID}`);

    // Mettre à jour le statut du paiement
    const paymentQuery = await db.collection('payments')
      .where('trackingID', '==', trackingID)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!paymentQuery.empty) {
      const paymentDoc = paymentQuery.docs[0];
      await paymentDoc.ref.update({
        status: 'completed',
        paidAt: new Date().toISOString(),
        stripeSessionId: session.id,
        updatedAt: new Date().toISOString()
      });
    }

    // Mettre à jour le colis
    if (parcelId) {
      const parcelRef = db.collection('parcel').doc(parcelId);
      await parcelRef.update({
        'pendingPayment.status': 'completed',
        'pendingPayment.paidAt': new Date().toISOString(),
        paymentStatus: 'paid',
        lastUpdated: new Date().toISOString()
      });

      // Si c'était un supplément de poids, on peut maintenant procéder au tri
      if (reason === 'weight_supplement') {
        await parcelRef.update({
          logisticsStatus: 'verified', // Le colis peut maintenant être trié
          paymentResolved: true
        });
      }
    }

    console.log(`✅ [Stripe Webhook] Payment processed successfully for ${trackingID}`);

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentExpired(session: any, db: admin.firestore.Firestore) {
  try {
    const { trackingID, parcelId } = session.metadata;
    
    console.log(`⏰ [Stripe Webhook] Payment expired for parcel ${trackingID}`);

    // Mettre à jour le statut du paiement
    const paymentQuery = await db.collection('payments')
      .where('trackingID', '==', trackingID)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!paymentQuery.empty) {
      const paymentDoc = paymentQuery.docs[0];
      await paymentDoc.ref.update({
        status: 'expired',
        expiredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Mettre à jour le colis
    if (parcelId) {
      await db.collection('parcel').doc(parcelId).update({
        'pendingPayment.status': 'expired',
        'pendingPayment.expiredAt': new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error handling payment expiration:', error);
  }
}