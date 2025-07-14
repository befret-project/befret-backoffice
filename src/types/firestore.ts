// Types based on existing Firestore structure from befret_new

export interface Parcel {
  uid: string;
  trackingID: string;
  status: 'draft' | 'pending' | 'received' | 'sent' | 'arrived' | 'delivered';
  type: string;
  cost: number;
  
  // Sender Information
  sender_name: string;
  sender_phone: string;
  phonePrefix2: string;
  
  // Receiver Information
  receiver_name: string;
  receiver_phone: string;
  phonePrefix1: string;
  city: string;
  address: string;
  
  // Shipping Details
  pickupMethod: 'warehouse' | 'home_delivery';
  weight: number;
  items: Item[];
  
  // Business Logic
  appliedPromotions?: Promotion[];
  
  // Timestamps & Tracking
  create_date: string;
  payment_date?: string;
  mail2User: string;
  notified: boolean;
  
  // Location Tracking
  location?: { latitude: number; longitude: number }; // GeoPoint
}

export interface Item {
  description: string;
  unit_value: number;
  qty: number;
  unit_weight: number;
  parcelID: string;
  uid: string;
}

export interface UserProfile {
  uid: string;
  email?: string;
  fullname: string;
  country?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  
  // Employee System
  isEmployee?: boolean;
  ability?: 'delivery' | 'warehouse' | 'transitory' | 'manager' | 'topManager';
}

export interface Receiver {
  id?: string;
  fullname: string;
  country: string;
  phoneNumber: string;
  userId: string;
}

export interface Promotion {
  id?: string;
  title: string;
  description: string;
  startDate: Date | string;
  endDate: Date | string;
  
  // Promotion Type & Logic
  type: string;
  typeOfComputing: string;
  amount: number;
  code: string;
  
  // Constraints
  hasAmountTranche: boolean;
  hasWeightTranche: boolean;
  minAmount: number;
  maxAmount: number;
  minWeight: number;
  maxWeight: number;
  countiesAllowed: string[];
  
  // Usage & Status
  status: string;
  cumulable: boolean;
  limit: boolean;
  limitAmount: number;
  usageCount?: number;
  
  // Analytics
  newCustomers?: number;
  countriesOfUse?: string[];
  totalAmountUsed?: number;
  totalAmountDiscounted?: number;
}

export interface Message {
  content: string;
  timestamp: Date | string;
  userId: string;
  contact_sender_name: string;
  email: string;
  phone: string;
  subject: string;
  question: string;
  status: 'unread' | 'read';
  submit_date: string;
  display_submit_date: string;
}

export interface Contact {
  name: string;
  email: string;
  phone: string;
  userId: string;
}

// Enums and reference data
export enum ShipmentStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  RECEIVED = 'received',
  SENT = 'sent',
  ARRIVED = 'arrived',
  DELIVERED = 'delivered'
}

export enum DeliveryType {
  EXPRESS = 'express',
  STANDARD = 'standard'
}

export enum PickupMethod {
  AIRPORT = 'A',
  LOCALPOINT = 'L',
  HOME = 'H'
}

export enum StaffRole {
  DELIVERY = 'delivery',
  WAREHOUSE = 'warehouse',
  TRANSITORY = 'transitory',
  MANAGER = 'manager',
  TOP_MANAGER = 'topManager'
}