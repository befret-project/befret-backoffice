import { Parcel } from '@/types/parcel';

export interface PaymentCalculation {
  baseAmount: number;
  supplementAmount: number;
  totalAmount: number;
  weightDifference: number;
  reason: string;
}

export interface PaymentLink {
  url: string;
  reference: string;
  amount: number;
  expiresAt: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
}

export class PaymentService {
  private static readonly SUPPLEMENT_RATE = 2.5; // €/kg
  private static readonly WEIGHT_TOLERANCE = 0.2; // 200g
  private static readonly PAYMENT_EXPIRY_HOURS = 24;

  /**
   * Calculer le supplément de poids
   */
  static calculateWeightSupplement(parcel: Parcel, actualWeight: number): PaymentCalculation | null {
    const declaredWeight = parcel.weightDeclared || parcel.weight || 0;
    const difference = actualWeight - declaredWeight;
    
    // Pas de supplément si dans la tolérance
    if (difference <= this.WEIGHT_TOLERANCE) {
      return null;
    }

    const supplementWeight = difference - this.WEIGHT_TOLERANCE;
    const supplementAmount = supplementWeight * this.SUPPLEMENT_RATE;
    
    return {
      baseAmount: parcel.cost,
      supplementAmount: Math.round(supplementAmount * 100) / 100, // Arrondir à 2 décimales
      totalAmount: parcel.cost + supplementAmount,
      weightDifference: difference,
      reason: `Supplément poids: +${difference.toFixed(2)}kg (tolérance: ${this.WEIGHT_TOLERANCE}kg)`
    };
  }

  /**
   * Générer un lien de paiement pour le supplément
   */
  static async generateSupplementPaymentLink(
    parcel: Parcel, 
    calculation: PaymentCalculation,
    userEmail?: string
  ): Promise<PaymentLink> {
    try {
      // Générer une référence unique
      const reference = `SUP_${parcel.trackingID}_${Date.now()}`;
      
      // Date d'expiration
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.PAYMENT_EXPIRY_HOURS);

      // Données pour l'API de paiement (Stripe, PayPal, etc.)
      const paymentData = {
        amount: Math.round(calculation.supplementAmount * 100), // Centimes
        currency: 'EUR',
        reference,
        description: calculation.reason,
        metadata: {
          parcelId: parcel.id,
          trackingId: parcel.trackingID,
          customerEmail: userEmail || parcel.mail2User,
          weightDifference: calculation.weightDifference,
          originalCost: calculation.baseAmount
        },
        successUrl: `${window.location.origin}/payment/success?ref=${reference}`,
        cancelUrl: `${window.location.origin}/payment/cancel?ref=${reference}`,
        expiresAt: expiresAt.toISOString()
      };

      // Ici, vous intégreriez avec votre provider de paiement
      // Exemple avec Stripe, PayPal, ou votre système custom
      const paymentResponse = await this.createPaymentSession(paymentData);

      const paymentLink: PaymentLink = {
        url: paymentResponse.url,
        reference,
        amount: calculation.supplementAmount,
        expiresAt: expiresAt.toISOString(),
        status: 'pending'
      };

      // Enregistrer le lien de paiement dans Firebase
      await this.savePaymentLink(parcel.id!, paymentLink);

      return paymentLink;
    } catch (error) {
      console.error('Erreur génération lien paiement:', error);
      throw new Error('Impossible de générer le lien de paiement');
    }
  }

  /**
   * Créer une session de paiement (à adapter selon votre provider)
   */
  private static async createPaymentSession(paymentData: any): Promise<{ url: string }> {
    // Exemple d'implémentation avec votre API de paiement
    const response = await fetch('/api/payments/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la création de la session de paiement');
    }

    return response.json();
  }

  /**
   * Enregistrer le lien de paiement dans Firebase
   */
  private static async savePaymentLink(parcelId: string, paymentLink: PaymentLink): Promise<void> {
    try {
      // Utiliser Firebase Functions pour enregistrer
      const response = await fetch('/api/payments/save-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parcelId,
          paymentLink
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement du lien');
      }
    } catch (error) {
      console.error('Erreur sauvegarde lien paiement:', error);
      // Ne pas faire échouer la génération du lien pour cette erreur
    }
  }

  /**
   * Vérifier le statut d'un paiement
   */
  static async checkPaymentStatus(reference: string): Promise<'paid' | 'pending' | 'expired' | 'cancelled'> {
    try {
      const response = await fetch(`/api/payments/status/${reference}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la vérification du statut');
      }
      
      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Erreur vérification statut paiement:', error);
      return 'pending';
    }
  }

  /**
   * Calculer un remboursement en cas de poids insuffisant
   */
  static calculateWeightRefund(parcel: Parcel, actualWeight: number): PaymentCalculation | null {
    const declaredWeight = parcel.weightDeclared || parcel.weight || 0;
    const difference = declaredWeight - actualWeight;
    
    // Pas de remboursement si dans la tolérance
    if (difference <= this.WEIGHT_TOLERANCE) {
      return null;
    }

    const baseCostPerKg = parcel.cost / declaredWeight;
    const refundWeight = difference - this.WEIGHT_TOLERANCE;
    const refundAmount = refundWeight * baseCostPerKg;
    
    return {
      baseAmount: parcel.cost,
      supplementAmount: -Math.round(refundAmount * 100) / 100, // Négatif pour remboursement
      totalAmount: parcel.cost - refundAmount,
      weightDifference: -difference,
      reason: `Remboursement poids: -${difference.toFixed(2)}kg (tolérance: ${this.WEIGHT_TOLERANCE}kg)`
    };
  }

  /**
   * Générer un email de notification de supplément
   */
  static generateSupplementNotification(
    parcel: Parcel, 
    calculation: PaymentCalculation, 
    paymentLink: PaymentLink
  ): string {
    return `
Bonjour,

Votre colis ${parcel.trackingID} a été pesé à notre entrepôt.

Détails:
- Poids déclaré: ${parcel.weightDeclared || parcel.weight}kg
- Poids réel: ${(parcel.weightDeclared || parcel.weight || 0) + calculation.weightDifference}kg
- Différence: +${calculation.weightDifference.toFixed(2)}kg

Un supplément de ${calculation.supplementAmount.toFixed(2)}€ est requis.

Lien de paiement: ${paymentLink.url}
(Valide jusqu'au ${new Date(paymentLink.expiresAt).toLocaleString('fr-FR')})

Cordialement,
L'équipe Befret
    `.trim();
  }

  /**
   * Formater un montant pour affichage
   */
  static formatAmount(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Valider les données de pesée
   */
  static validateWeightData(declaredWeight: number, actualWeight: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (actualWeight <= 0) {
      errors.push('Le poids réel doit être supérieur à 0');
    }

    if (declaredWeight <= 0) {
      errors.push('Le poids déclaré doit être supérieur à 0');
    }

    const difference = Math.abs(actualWeight - declaredWeight);
    const percentage = declaredWeight > 0 ? (difference / declaredWeight) * 100 : 0;

    if (percentage > 50) {
      errors.push('L\'écart de poids semble anormalement élevé (>50%)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}