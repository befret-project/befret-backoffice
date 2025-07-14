// Service Firebase pour la gestion des collectes

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
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase-config';
import { 
  Collecte, 
  CollecteCreate, 
  CollecteUpdate, 
  CollecteSearchResult, 
  CollecteFilters, 
  CollecteStats,
  CollecteCompletion,
  RouteJournaliere
} from '@/types/collecte';

export class CollecteService {
  private static readonly COLLECTION_NAME = 'collectes';

  /**
   * Générer une référence unique pour une collecte
   */
  private static generateReference(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `COL-${year}-${month}-${random}`;
  }

  /**
   * Programmer une nouvelle collecte
   */
  static async schedule(collecteData: Omit<CollecteCreate, 'reference'>): Promise<string> {
    try {
      console.log('Scheduling new collecte:', collecteData);

      const now = new Date().toISOString();
      const reference = this.generateReference();

      const newCollecte = {
        ...collecteData,
        reference,
        createdAt: now,
        updatedAt: now
      };

      const collectesRef = collection(db, this.COLLECTION_NAME);
      const docRef = await addDoc(collectesRef, newCollecte);

      console.log('Collecte scheduled with ID:', docRef.id, 'and reference:', reference);
      return docRef.id;
    } catch (error) {
      console.error('Error scheduling collecte:', error);
      throw new Error('Erreur lors de la programmation de la collecte');
    }
  }

  /**
   * Récupérer une collecte par ID
   */
  static async getById(collecteId: string): Promise<Collecte | null> {
    try {
      console.log('Fetching collecte with ID:', collecteId);

      const collecteRef = doc(db, this.COLLECTION_NAME, collecteId);
      const docSnap = await getDoc(collecteRef);

      if (!docSnap.exists()) {
        console.log('Collecte not found with ID:', collecteId);
        return null;
      }

      const data = docSnap.data();
      const collecte: Collecte = {
        id: docSnap.id,
        ...data
      } as Collecte;

      console.log('Collecte found:', collecte.reference);
      return collecte;
    } catch (error) {
      console.error('Error fetching collecte:', error);
      throw new Error('Erreur lors de la récupération de la collecte');
    }
  }

  /**
   * Rechercher des collectes par référence
   */
  static async searchByReference(reference: string): Promise<CollecteSearchResult> {
    try {
      console.log('Searching collecte with reference:', reference);

      const collectesRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        collectesRef,
        where('reference', '==', reference.toUpperCase())
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { found: false, error: 'Collecte non trouvée' };
      }

      const collecteDoc = querySnapshot.docs[0];
      const collecte: Collecte = {
        id: collecteDoc.id,
        ...collecteDoc.data()
      } as Collecte;

      return { found: true, collecte };
    } catch (error) {
      console.error('Error searching collecte:', error);
      return { found: false, error: 'Erreur lors de la recherche' };
    }
  }

  /**
   * Récupérer les collectes avec filtres
   */
  static async getWithFilters(
    filters: CollecteFilters = {}, 
    limitCount: number = 50,
    lastDoc?: QueryDocumentSnapshot
  ): Promise<Collecte[]> {
    try {
      console.log('Fetching collectes with filters:', filters);

      const collectesRef = collection(db, this.COLLECTION_NAME);
      let q = query(collectesRef, orderBy('datePrevue', 'desc'));

      // Appliquer les filtres
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.chauffeur) {
        q = query(q, where('chauffeur', '==', filters.chauffeur));
      }
      if (filters.typeCollecte) {
        q = query(q, where('typeCollecte', '==', filters.typeCollecte));
      }
      if (filters.priorite) {
        q = query(q, where('priorite', '==', filters.priorite));
      }
      if (filters.operateur) {
        q = query(q, where('operateur', '==', filters.operateur));
      }

      // Pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      q = query(q, limit(limitCount));

      const querySnapshot = await getDocs(q);
      const collectes: Collecte[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Collecte));

      // Filtrer côté client pour les champs non indexés
      let filteredCollectes = collectes;
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredCollectes = collectes.filter(col =>
          col.reference.toLowerCase().includes(searchTerm) ||
          col.client.nom.toLowerCase().includes(searchTerm) ||
          col.client.email.toLowerCase().includes(searchTerm) ||
          col.adresse.ville.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.ville) {
        const villeTerm = filters.ville.toLowerCase();
        filteredCollectes = filteredCollectes.filter(col =>
          col.adresse.ville.toLowerCase().includes(villeTerm)
        );
      }

      console.log(`Found ${filteredCollectes.length} collectes`);
      return filteredCollectes;
    } catch (error) {
      console.error('Error fetching collectes:', error);
      throw new Error('Erreur lors de la récupération des collectes');
    }
  }

  /**
   * Récupérer les collectes d'une journée
   */
  static async getDailyCollectes(
    date: string, 
    chauffeur?: string
  ): Promise<Collecte[]> {
    try {
      console.log('Fetching daily collectes for date:', date, 'chauffeur:', chauffeur);

      const collectesRef = collection(db, this.COLLECTION_NAME);
      let q = query(
        collectesRef,
        where('datePrevue', '==', date),
        orderBy('heureCollecte', 'asc')
      );

      if (chauffeur) {
        q = query(q, where('chauffeur', '==', chauffeur));
      }

      const querySnapshot = await getDocs(q);
      const collectes: Collecte[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Collecte));

      console.log(`Found ${collectes.length} collectes for ${date}`);
      return collectes;
    } catch (error) {
      console.error('Error fetching daily collectes:', error);
      throw new Error('Erreur lors de la récupération des collectes du jour');
    }
  }

  /**
   * Mettre à jour une collecte
   */
  static async update(collecteId: string, updates: CollecteUpdate): Promise<boolean> {
    try {
      console.log('Updating collecte:', collecteId, updates);

      const collecteRef = doc(db, this.COLLECTION_NAME, collecteId);
      
      // Vérifier que la collecte existe
      const docSnap = await getDoc(collecteRef);
      if (!docSnap.exists()) {
        throw new Error('Collecte non trouvée');
      }

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(collecteRef, updateData);
      console.log('Collecte updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating collecte:', error);
      throw new Error('Erreur lors de la mise à jour de la collecte');
    }
  }

  /**
   * Reprogrammer une collecte
   */
  static async reschedule(
    collecteId: string, 
    newDate: string, 
    newTime: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const updates: CollecteUpdate = {
        datePrevue: newDate,
        heureCollecte: newTime,
        status: 'programmee', // Reset status
        notes: reason ? `Reprogrammée: ${reason}` : undefined
      };

      return await this.update(collecteId, updates);
    } catch (error) {
      console.error('Error rescheduling collecte:', error);
      throw new Error('Erreur lors de la reprogrammation');
    }
  }

  /**
   * Assigner un chauffeur à une collecte
   */
  static async assignDriver(collecteId: string, chauffeur: string): Promise<boolean> {
    try {
      const updates: CollecteUpdate = {
        chauffeur,
        status: 'programmee'
      };

      return await this.update(collecteId, updates);
    } catch (error) {
      console.error('Error assigning driver:', error);
      throw new Error('Erreur lors de l\'assignation du chauffeur');
    }
  }

  /**
   * Marquer une collecte comme terminée
   */
  static async markCompleted(
    collecteId: string, 
    completionData: CollecteCompletion
  ): Promise<boolean> {
    try {
      const updates: CollecteUpdate = {
        status: 'terminee',
        dateCollecte: new Date().toISOString(),
        nbColis: completionData.nbColisReel,
        poidsTotal: completionData.poidsReel,
        notes: completionData.notesCollecteur
      };

      return await this.update(collecteId, updates);
    } catch (error) {
      console.error('Error marking collecte as completed:', error);
      throw new Error('Erreur lors de la finalisation de la collecte');
    }
  }

  /**
   * Annuler une collecte
   */
  static async cancel(collecteId: string, reason: string): Promise<boolean> {
    try {
      const updates: CollecteUpdate = {
        status: 'annulee',
        notes: `Annulée: ${reason}`
      };

      return await this.update(collecteId, updates);
    } catch (error) {
      console.error('Error canceling collecte:', error);
      throw new Error('Erreur lors de l\'annulation de la collecte');
    }
  }

  /**
   * Supprimer une collecte
   */
  static async delete(collecteId: string): Promise<boolean> {
    try {
      console.log('Deleting collecte:', collecteId);

      const collecteRef = doc(db, this.COLLECTION_NAME, collecteId);
      
      // Vérifier que la collecte existe
      const docSnap = await getDoc(collecteRef);
      if (!docSnap.exists()) {
        throw new Error('Collecte non trouvée');
      }

      await deleteDoc(collecteRef);
      console.log('Collecte deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting collecte:', error);
      throw new Error('Erreur lors de la suppression de la collecte');
    }
  }

  /**
   * Récupérer les statistiques des collectes
   */
  static async getStats(period: 'week' | 'month' | 'year' = 'month'): Promise<CollecteStats> {
    try {
      console.log('Fetching collecte stats for period:', period);

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

      const collectesRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        collectesRef,
        where('createdAt', '>=', startDate.toISOString()),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const collectes: Collecte[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Collecte));

      // Calculer les statistiques
      const stats: CollecteStats = {
        total: collectes.length,
        byStatus: {
          programmee: 0,
          en_cours: 0,
          terminee: 0,
          annulee: 0
        },
        byType: {
          domicile: 0,
          entreprise: 0,
          point_relais: 0
        },
        byPriorite: {
          normale: 0,
          urgente: 0,
          express: 0
        },
        byChauffeur: {},
        totalColis: 0,
        totalPoids: 0,
        averageCollectionTime: 0
      };

      let totalMinutes = 0;
      let completedCount = 0;

      collectes.forEach(col => {
        // Compter par statut
        stats.byStatus[col.status]++;
        
        // Compter par type
        stats.byType[col.typeCollecte]++;
        
        // Compter par priorité
        stats.byPriorite[col.priorite]++;
        
        // Compter par chauffeur
        if (col.chauffeur) {
          if (!stats.byChauffeur[col.chauffeur]) {
            stats.byChauffeur[col.chauffeur] = 0;
          }
          stats.byChauffeur[col.chauffeur]++;
        }
        
        // Sommer colis et poids
        stats.totalColis += col.nbColis;
        stats.totalPoids += col.poidsTotal;
        
        // Calculer le temps de collecte moyen (estimation basée sur le type)
        if (col.status === 'terminee') {
          let estimatedMinutes = 15; // Défaut
          switch (col.typeCollecte) {
            case 'domicile': estimatedMinutes = 15; break;
            case 'entreprise': estimatedMinutes = 30; break;
            case 'point_relais': estimatedMinutes = 10; break;
          }
          totalMinutes += estimatedMinutes;
          completedCount++;
        }
      });

      if (completedCount > 0) {
        stats.averageCollectionTime = Math.round(totalMinutes / completedCount);
      }

      console.log('Collecte stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching collecte stats:', error);
      throw new Error('Erreur lors du calcul des statistiques');
    }
  }

  /**
   * Générer la route journalière pour un chauffeur
   */
  static async getDailyRoute(date: string, chauffeur: string): Promise<RouteJournaliere> {
    try {
      console.log('Generating daily route for', chauffeur, 'on', date);

      const collectes = await this.getDailyCollectes(date, chauffeur);
      
      // Calculer les totaux estimés
      let totalColis = 0;
      let totalPoids = 0;
      let totalDuree = 0;
      const zones: string[] = [];

      collectes.forEach(col => {
        totalColis += col.nbColis;
        totalPoids += col.poidsTotal;
        
        // Estimation de durée selon le type
        switch (col.typeCollecte) {
          case 'domicile': totalDuree += 15; break;
          case 'entreprise': totalDuree += 30; break;
          case 'point_relais': totalDuree += 10; break;
        }
        
        // Collecter les zones uniques
        if (!zones.includes(col.adresse.ville)) {
          zones.push(col.adresse.ville);
        }
      });

      const route: RouteJournaliere = {
        date,
        chauffeur,
        collectes,
        totalEstime: {
          colis: totalColis,
          poids: totalPoids,
          duree: totalDuree
        },
        zones
      };

      console.log('Daily route generated:', route);
      return route;
    } catch (error) {
      console.error('Error generating daily route:', error);
      throw new Error('Erreur lors de la génération de la route');
    }
  }

  /**
   * Exporter les collectes en CSV
   */
  static async exportToCSV(filters: CollecteFilters = {}): Promise<string> {
    try {
      const collectes = await this.getWithFilters(filters, 1000); // Limite élevée pour export
      
      const headers = [
        'Référence',
        'Statut',
        'Client',
        'Entreprise',
        'Email',
        'Téléphone',
        'Adresse',
        'Ville',
        'Date prévue',
        'Heure',
        'Type collecte',
        'Nb colis',
        'Poids (kg)',
        'Priorité',
        'Chauffeur',
        'Opérateur'
      ];

      const rows = collectes.map(col => [
        col.reference,
        col.status,
        col.client.nom,
        col.client.entreprise || '',
        col.client.email,
        col.client.telephone,
        col.adresse.rue,
        col.adresse.ville,
        col.datePrevue,
        col.heureCollecte,
        col.typeCollecte,
        col.nbColis.toString(),
        col.poidsTotal.toString(),
        col.priorite,
        col.chauffeur || '',
        col.operateur
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting collectes to CSV:', error);
      throw new Error('Erreur lors de l\'export CSV');
    }
  }
}