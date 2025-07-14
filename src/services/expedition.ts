// Service Firebase pour la gestion des expéditions

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  QueryDocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase-config';
import { 
  Expedition, 
  ExpeditionCreate, 
  ExpeditionUpdate, 
  ExpeditionSearchResult, 
  ExpeditionFilters, 
  ExpeditionStats 
} from '@/types/expedition';

export class ExpeditionService {
  private static readonly COLLECTION_NAME = 'expeditions';

  /**
   * Générer une référence unique pour une expédition
   */
  private static generateReference(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EXP-${year}-${month}-${random}`;
  }

  /**
   * Créer une nouvelle expédition
   */
  static async create(expeditionData: Omit<ExpeditionCreate, 'reference'>): Promise<string> {
    try {
      console.log('Creating new expedition:', expeditionData);

      const now = new Date().toISOString();
      const reference = this.generateReference();

      const newExpedition = {
        ...expeditionData,
        reference,
        createdAt: now,
        updatedAt: now
      };

      const expeditionsRef = collection(db, this.COLLECTION_NAME);
      const docRef = await addDoc(expeditionsRef, newExpedition);

      console.log('Expedition created with ID:', docRef.id, 'and reference:', reference);
      return docRef.id;
    } catch (error) {
      console.error('Error creating expedition:', error);
      throw new Error('Erreur lors de la création de l\'expédition');
    }
  }

  /**
   * Récupérer une expédition par ID
   */
  static async getById(expeditionId: string): Promise<Expedition | null> {
    try {
      console.log('Fetching expedition with ID:', expeditionId);

      const expeditionRef = doc(db, this.COLLECTION_NAME, expeditionId);
      const docSnap = await getDoc(expeditionRef);

      if (!docSnap.exists()) {
        console.log('Expedition not found with ID:', expeditionId);
        return null;
      }

      const data = docSnap.data();
      const expedition: Expedition = {
        id: docSnap.id,
        ...data
      } as Expedition;

      console.log('Expedition found:', expedition.reference);
      return expedition;
    } catch (error) {
      console.error('Error fetching expedition:', error);
      throw new Error('Erreur lors de la récupération de l\'expédition');
    }
  }

  /**
   * Rechercher des expéditions par référence ou tracking
   */
  static async searchByReference(reference: string): Promise<ExpeditionSearchResult> {
    try {
      console.log('Searching expedition with reference:', reference);

      const expeditionsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        expeditionsRef,
        where('reference', '==', reference.toUpperCase())
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Essayer aussi par tracking
        const trackingQuery = query(
          expeditionsRef,
          where('tracking', '==', reference.toUpperCase())
        );
        const trackingSnapshot = await getDocs(trackingQuery);
        
        if (trackingSnapshot.empty) {
          return { found: false, error: 'Expédition non trouvée' };
        }

        const expeditionDoc = trackingSnapshot.docs[0];
        const expedition: Expedition = {
          id: expeditionDoc.id,
          ...expeditionDoc.data()
        } as Expedition;

        return { found: true, expedition };
      }

      const expeditionDoc = querySnapshot.docs[0];
      const expedition: Expedition = {
        id: expeditionDoc.id,
        ...expeditionDoc.data()
      } as Expedition;

      return { found: true, expedition };
    } catch (error) {
      console.error('Error searching expedition:', error);
      return { found: false, error: 'Erreur lors de la recherche' };
    }
  }

  /**
   * Récupérer les expéditions avec filtres
   */
  static async getWithFilters(
    filters: ExpeditionFilters = {}, 
    limitCount: number = 50,
    lastDoc?: QueryDocumentSnapshot
  ): Promise<Expedition[]> {
    try {
      console.log('Fetching expeditions with filters:', filters);

      const expeditionsRef = collection(db, this.COLLECTION_NAME);
      let q = query(expeditionsRef, orderBy('createdAt', 'desc'));

      // Appliquer les filtres
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.transporteur) {
        q = query(q, where('transporteur.nom', '==', filters.transporteur));
      }
      if (filters.priorite) {
        q = query(q, where('priorite', '==', filters.priorite));
      }
      if (filters.responsable) {
        q = query(q, where('responsable', '==', filters.responsable));
      }

      // Pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      q = query(q, limit(limitCount));

      const querySnapshot = await getDocs(q);
      const expeditions: Expedition[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Expedition));

      // Filtrer côté client pour les champs non indexés
      let filteredExpeditions = expeditions;
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredExpeditions = expeditions.filter(exp =>
          exp.reference.toLowerCase().includes(searchTerm) ||
          exp.tracking.toLowerCase().includes(searchTerm) ||
          exp.destination.ville.toLowerCase().includes(searchTerm) ||
          exp.destination.pays.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.destination) {
        const destTerm = filters.destination.toLowerCase();
        filteredExpeditions = filteredExpeditions.filter(exp =>
          exp.destination.ville.toLowerCase().includes(destTerm) ||
          exp.destination.pays.toLowerCase().includes(destTerm)
        );
      }

      console.log(`Found ${filteredExpeditions.length} expeditions`);
      return filteredExpeditions;
    } catch (error) {
      console.error('Error fetching expeditions:', error);
      throw new Error('Erreur lors de la récupération des expéditions');
    }
  }

  /**
   * Mettre à jour une expédition
   */
  static async update(expeditionId: string, updates: ExpeditionUpdate): Promise<boolean> {
    try {
      console.log('Updating expedition:', expeditionId, updates);

      const expeditionRef = doc(db, this.COLLECTION_NAME, expeditionId);
      
      // Vérifier que l'expédition existe
      const docSnap = await getDoc(expeditionRef);
      if (!docSnap.exists()) {
        throw new Error('Expédition non trouvée');
      }

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(expeditionRef, updateData);
      console.log('Expedition updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating expedition:', error);
      throw new Error('Erreur lors de la mise à jour de l\'expédition');
    }
  }

  /**
   * Mettre à jour le statut d'une expédition
   */
  static async updateStatus(
    expeditionId: string, 
    newStatus: Expedition['status'],
    dateArriveeReelle?: string
  ): Promise<boolean> {
    try {
      const updates: ExpeditionUpdate = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      if (newStatus === 'livre' && dateArriveeReelle) {
        updates.dateArriveeReelle = dateArriveeReelle;
      }

      return await this.update(expeditionId, updates);
    } catch (error) {
      console.error('Error updating expedition status:', error);
      throw new Error('Erreur lors de la mise à jour du statut');
    }
  }

  /**
   * Supprimer une expédition
   */
  static async delete(expeditionId: string): Promise<boolean> {
    try {
      console.log('Deleting expedition:', expeditionId);

      const expeditionRef = doc(db, this.COLLECTION_NAME, expeditionId);
      
      // Vérifier que l'expédition existe
      const docSnap = await getDoc(expeditionRef);
      if (!docSnap.exists()) {
        throw new Error('Expédition non trouvée');
      }

      await deleteDoc(expeditionRef);
      console.log('Expedition deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting expedition:', error);
      throw new Error('Erreur lors de la suppression de l\'expédition');
    }
  }

  /**
   * Récupérer les statistiques des expéditions
   */
  static async getStats(period: 'week' | 'month' | 'year' = 'month'): Promise<ExpeditionStats> {
    try {
      console.log('Fetching expedition stats for period:', period);

      // Calculer la date de début selon la période
      const now = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const expeditionsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        expeditionsRef,
        where('createdAt', '>=', startDate.toISOString()),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const expeditions: Expedition[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Expedition));

      // Calculer les statistiques
      const stats: ExpeditionStats = {
        total: expeditions.length,
        byStatus: {
          preparation: 0,
          en_cours: 0,
          arrive: 0,
          livre: 0
        },
        byPriorite: {
          normale: 0,
          urgente: 0,
          express: 0
        },
        byTransporteur: {},
        totalPoids: 0,
        totalValeur: 0,
        averageDeliveryTime: 0
      };

      let totalDeliveryDays = 0;
      let deliveredCount = 0;

      expeditions.forEach(exp => {
        // Compter par statut
        stats.byStatus[exp.status]++;
        
        // Compter par priorité
        stats.byPriorite[exp.priorite]++;
        
        // Compter par transporteur
        if (!stats.byTransporteur[exp.transporteur.nom]) {
          stats.byTransporteur[exp.transporteur.nom] = 0;
        }
        stats.byTransporteur[exp.transporteur.nom]++;
        
        // Sommer poids et valeur
        stats.totalPoids += exp.poids;
        stats.totalValeur += exp.valeur;
        
        // Calculer le temps de livraison moyen
        if (exp.status === 'livre' && exp.dateArriveeReelle) {
          const departDate = new Date(exp.dateDepart);
          const arriveeDate = new Date(exp.dateArriveeReelle);
          const deliveryDays = Math.ceil(
            (arriveeDate.getTime() - departDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          totalDeliveryDays += deliveryDays;
          deliveredCount++;
        }
      });

      if (deliveredCount > 0) {
        stats.averageDeliveryTime = Math.round(totalDeliveryDays / deliveredCount);
      }

      console.log('Expedition stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching expedition stats:', error);
      throw new Error('Erreur lors du calcul des statistiques');
    }
  }

  /**
   * Récupérer les expéditions récentes
   */
  static async getRecent(limitCount: number = 10): Promise<Expedition[]> {
    try {
      console.log('Fetching recent expeditions, limit:', limitCount);

      const expeditionsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        expeditionsRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const expeditions: Expedition[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Expedition));

      console.log(`Found ${expeditions.length} recent expeditions`);
      return expeditions;
    } catch (error) {
      console.error('Error fetching recent expeditions:', error);
      throw new Error('Erreur lors de la récupération des expéditions récentes');
    }
  }

  /**
   * Exporter les expéditions en CSV
   */
  static async exportToCSV(filters: ExpeditionFilters = {}): Promise<string> {
    try {
      const expeditions = await this.getWithFilters(filters, 1000); // Limite élevée pour export
      
      const headers = [
        'Référence',
        'Statut',
        'Destination',
        'Transporteur',
        'Date départ',
        'Date arrivée prévue',
        'Date arrivée réelle',
        'Nb colis',
        'Poids (kg)',
        'Valeur (€)',
        'Priorité',
        'Responsable',
        'Tracking'
      ];

      const rows = expeditions.map(exp => [
        exp.reference,
        exp.status,
        `${exp.destination.ville}, ${exp.destination.pays}`,
        exp.transporteur.nom,
        exp.dateDepart,
        exp.dateArriveePrevu,
        exp.dateArriveeReelle || '',
        exp.nbColis.toString(),
        exp.poids.toString(),
        exp.valeur.toString(),
        exp.priorite,
        exp.responsable,
        exp.tracking
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting expeditions to CSV:', error);
      throw new Error('Erreur lors de l\'export CSV');
    }
  }
}