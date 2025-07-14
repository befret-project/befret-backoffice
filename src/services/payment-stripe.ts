/**
 * Service de paiement Stripe pour gestion des suppléments de poids
 * Intégré avec les notifications de pesée SendGrid
 */

interface StripePaymentData {
  amount: number; // En centimes
  currency: string;
  trackingID: string;
  parcelId: string;
  reason: 'weight_supplement' | 'customs_fees' | 'special_handling';
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
}

interface StripePaymentLink {
  url: string;
  id: string;
  expiresAt: string;
}

interface StripeConfig {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
}

// Configuration Stripe (à récupérer depuis befret_new)
const STRIPE_CONFIG: StripeConfig = {
  publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_...',
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_...',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...'
};

export class StripePaymentService {
  
  /**
   * Créer un lien de paiement Stripe pour un supplément
   */
  static async createPaymentLink(paymentData: StripePaymentData): Promise<{ success: boolean; paymentLink?: StripePaymentLink; error?: string }> {
    try {
      console.log('💳 Creating Stripe payment link for:', paymentData);

      // Validation des données
      if (!paymentData.amount || paymentData.amount <= 0) {
        return { success: false, error: 'Montant invalide' };
      }

      if (!paymentData.trackingID || !paymentData.parcelId) {
        return { success: false, error: 'Informations de colis manquantes' };
      }

      // Appel à l'API Firebase Functions pour créer le paiement
      const functionUrl = 'https://api-rcai6nfrla-uc.a.run.app/api/payment/stripe/create-link';
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          currency: paymentData.currency,
          trackingID: paymentData.trackingID,
          parcelId: paymentData.parcelId,
          reason: paymentData.reason,
          customerEmail: paymentData.customerEmail,
          customerPhone: paymentData.customerPhone,
          description: paymentData.description || `Supplément de poids - Colis ${paymentData.trackingID}`,
          metadata: {
            trackingID: paymentData.trackingID,
            parcelId: paymentData.parcelId,
            reason: paymentData.reason,
            source: 'befret-backoffice'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create payment link: ${errorText}`);
      }

      const result = await response.json();
      
      console.log('✅ Stripe payment link created:', result);
      
      return {
        success: true,
        paymentLink: {
          url: result.url,
          id: result.id,
          expiresAt: result.expiresAt
        }
      };

    } catch (error) {
      console.error('❌ Error creating Stripe payment link:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la création du lien de paiement'
      };
    }
  }

  /**
   * Calculer le montant du supplément basé sur l'écart de poids
   */
  static calculateWeightSupplement(
    declaredWeight: number, 
    actualWeight: number, 
    ratePerKg: number = 2.5,
    tolerance: number = 0.2
  ): { needsSupplement: boolean; supplementAmount: number; weightDifference: number } {
    
    const weightDifference = actualWeight - declaredWeight;
    const needsSupplement = weightDifference > tolerance;
    
    let supplementAmount = 0;
    if (needsSupplement) {
      const chargeableWeight = weightDifference - tolerance;
      supplementAmount = Math.round(chargeableWeight * ratePerKg * 100) / 100; // Arrondir à 2 décimales
    }

    return {
      needsSupplement,
      supplementAmount,
      weightDifference
    };
  }

  /**
   * Générer un lien de paiement pour un supplément de poids
   */
  static async generateWeightSupplementPayment(
    trackingID: string,
    parcelId: string,
    declaredWeight: number,
    actualWeight: number,
    customerEmail?: string,
    customerPhone?: string
  ): Promise<{ success: boolean; paymentLink?: StripePaymentLink; supplementAmount?: number; error?: string }> {
    
    try {
      // Calculer le supplément
      const supplement = this.calculateWeightSupplement(declaredWeight, actualWeight);
      
      if (!supplement.needsSupplement) {
        return { success: false, error: 'Aucun supplément nécessaire' };
      }

      // Créer le lien de paiement
      const paymentData: StripePaymentData = {
        amount: Math.round(supplement.supplementAmount * 100), // Convertir en centimes
        currency: 'eur',
        trackingID,
        parcelId,
        reason: 'weight_supplement',
        customerEmail,
        customerPhone,
        description: `Supplément de poids - Colis ${trackingID} (+${supplement.weightDifference.toFixed(2)} kg)`
      };

      const result = await this.createPaymentLink(paymentData);
      
      if (result.success) {
        return {
          success: true,
          paymentLink: result.paymentLink,
          supplementAmount: supplement.supplementAmount
        };
      } else {
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('❌ Error generating weight supplement payment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la génération du paiement'
      };
    }
  }

  /**
   * Vérifier le statut d'un paiement
   */
  static async checkPaymentStatus(paymentId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const functionUrl = `https://api-rcai6nfrla-uc.a.run.app/api/payment/stripe/status/${paymentId}`;
      
      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to check payment status: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        status: result.status
      };

    } catch (error) {
      console.error('❌ Error checking payment status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la vérification du paiement'
      };
    }
  }

  /**
   * Formater un montant en euros pour affichage
   */
  static formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  /**
   * Valider les données de paiement
   */
  static validatePaymentData(data: Partial<StripePaymentData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.amount || data.amount <= 0) {
      errors.push('Le montant doit être supérieur à 0');
    }

    if (!data.trackingID) {
      errors.push('Le code de suivi est requis');
    }

    if (!data.parcelId) {
      errors.push('L\'ID du colis est requis');
    }

    if (!data.reason) {
      errors.push('La raison du paiement est requise');
    }

    if (data.customerEmail && !this.isValidEmail(data.customerEmail)) {
      errors.push('L\'email client n\'est pas valide');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valider un email
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Obtenir l'URL de paiement pour redirection client
   */
  static buildPaymentRedirectUrl(paymentLinkId: string, trackingID: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'https://befret.com';
    return `${baseUrl}/payment?link=${paymentLinkId}&tracking=${trackingID}`;
  }
}

export default StripePaymentService;