import { LogisticsStatusEnum } from '@/types/parcel';

/**
 * Mappings unifiés pour l'affichage des statuts logistiques
 * Sprints 1 & 2 - Version cohérente
 */

// Labels français pour les statuts logistiques - Version compréhensible pour les agents
export const logisticsStatusLabels: Record<LogisticsStatusEnum, string> = {
  'pending_reception': 'En attente de réception',
  'received': 'Reçu à l\'entrepôt',
  'weighed': 'Pesé et contrôlé',
  'verified': 'Vérifié et validé',
  'weight_issue': 'Problème de poids détecté',
  'ready_grouping': 'Prêt pour groupage',
  'grouped': 'Groupé pour expédition',
  'shipped': 'Expédié vers destination',
  'arrived_destination': 'Arrivé en RD Congo',
  'ready_pickup': 'Prêt pour retrait',
  'delivered': 'Livré au destinataire',
  'special_case': 'Cas spécial - Traitement manuel',
  'sorted': 'Trié et organisé'
};

// Couleurs pour les badges de statuts
export const logisticsStatusColors: Record<LogisticsStatusEnum, string> = {
  'pending_reception': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'received': 'bg-blue-100 text-blue-800 border-blue-200',
  'weighed': 'bg-purple-100 text-purple-800 border-purple-200',
  'verified': 'bg-green-100 text-green-800 border-green-200',
  'weight_issue': 'bg-red-100 text-red-800 border-red-200',
  'ready_grouping': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'grouped': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'shipped': 'bg-blue-100 text-blue-800 border-blue-200',
  'arrived_destination': 'bg-green-100 text-green-800 border-green-200',
  'ready_pickup': 'bg-green-100 text-green-800 border-green-200',
  'delivered': 'bg-green-100 text-green-800 border-green-200',
  'special_case': 'bg-orange-100 text-orange-800 border-orange-200',
  'sorted': 'bg-emerald-100 text-emerald-800 border-emerald-200'
};

// Statuts visibles dans l'interface de réception
export const receptionVisibleStatuses: LogisticsStatusEnum[] = [
  'pending_reception',
  'received'
];

// Statuts visibles dans l'interface de pesée/préparation
export const weighingVisibleStatuses: LogisticsStatusEnum[] = [
  'received',
  'weighed',
  'verified',
  'weight_issue'
];

// Statuts visibles dans l'interface de tri
export const sortingVisibleStatuses: LogisticsStatusEnum[] = [
  'verified',
  'weight_issue',
  'sorted',
  'special_case'
];

// Transitions de statuts autorisées
export const allowedStatusTransitions: Record<LogisticsStatusEnum, LogisticsStatusEnum[]> = {
  'pending_reception': ['received'],
  'received': ['weighed', 'verified', 'weight_issue', 'special_case'],
  'weighed': ['verified', 'weight_issue'],
  'verified': ['sorted', 'ready_grouping'],
  'weight_issue': ['verified', 'special_case'],
  'ready_grouping': ['grouped'],
  'grouped': ['shipped'],
  'shipped': ['arrived_destination'],
  'arrived_destination': ['ready_pickup'],
  'ready_pickup': ['delivered'],
  'delivered': [],
  'special_case': ['verified', 'sorted'],
  'sorted': ['ready_grouping']
};

// Mapping des statuts logistiques vers statuts principaux
export const logisticsToMainStatus: Record<LogisticsStatusEnum, string> = {
  'pending_reception': 'pending',
  'received': 'to_warehouse',
  'weighed': 'to_warehouse',
  'verified': 'to_warehouse',
  'weight_issue': 'pending',
  'ready_grouping': 'to_warehouse',
  'grouped': 'from_warehouse_to_congo',
  'shipped': 'from_warehouse_to_congo',
  'arrived_destination': 'arrived_in_congo',
  'ready_pickup': 'arrived_in_congo',
  'delivered': 'delivered',
  'special_case': 'pending',
  'sorted': 'to_warehouse'
};

/**
 * Obtenir le label d'affichage pour un statut logistique
 */
export function getLogisticsStatusLabel(status: LogisticsStatusEnum | string): string {
  return logisticsStatusLabels[status as LogisticsStatusEnum] || status || 'Statut inconnu';
}

/**
 * Obtenir les classes CSS pour un statut logistique
 */
export function getLogisticsStatusColor(status: LogisticsStatusEnum | string): string {
  return logisticsStatusColors[status as LogisticsStatusEnum] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Vérifier si une transition de statut est autorisée
 */
export function isStatusTransitionAllowed(from: LogisticsStatusEnum, to: LogisticsStatusEnum): boolean {
  return allowedStatusTransitions[from]?.includes(to) || false;
}

/**
 * Obtenir le statut principal correspondant à un statut logistique
 */
export function getMainStatusFromLogistics(logisticsStatus: LogisticsStatusEnum): string {
  return logisticsToMainStatus[logisticsStatus] || 'pending';
}

/**
 * Labels avec emojis pour une interface plus visuelle (optionnel)
 */
export const logisticsStatusLabelsWithEmojis: Record<LogisticsStatusEnum, string> = {
  'pending_reception': '⏳ En attente de réception',
  'received': '📥 Reçu à l\'entrepôt',
  'weighed': '⚖️ Pesé et contrôlé',
  'verified': '✅ Vérifié et validé',
  'weight_issue': '⚠️ Problème de poids détecté',
  'ready_grouping': '📋 Prêt pour groupage',
  'grouped': '📦 Groupé pour expédition',
  'shipped': '🚢 Expédié vers destination',
  'arrived_destination': '🛬 Arrivé en RD Congo',
  'ready_pickup': '🏪 Prêt pour retrait',
  'delivered': '✅ Livré au destinataire',
  'special_case': '🔧 Cas spécial - Traitement manuel',
  'sorted': '📑 Trié et organisé'
};

/**
 * Obtenir le label d'affichage avec emojis pour un statut logistique
 */
export function getLogisticsStatusLabelWithEmoji(status: LogisticsStatusEnum | string): string {
  return logisticsStatusLabelsWithEmojis[status as LogisticsStatusEnum] || getLogisticsStatusLabel(status);
}

/**
 * Vérifier si un statut est visible dans une interface donnée
 */
export function isStatusVisibleInInterface(
  status: LogisticsStatusEnum,
  interfaceType: 'reception' | 'weighing' | 'sorting'
): boolean {
  switch (interfaceType) {
    case 'reception':
      return receptionVisibleStatuses.includes(status);
    case 'weighing':
      return weighingVisibleStatuses.includes(status);
    case 'sorting':
      return sortingVisibleStatuses.includes(status);
    default:
      return false;
  }
}