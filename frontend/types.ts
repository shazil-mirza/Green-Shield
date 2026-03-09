
export interface User {
  id: string;
  name: string; // Name is now required
  email: string;
  role: 'user' | 'admin';
  token?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  stripeSubscriptionStatus?: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | null;
  planType?: 'free' | 'premium';
  detectionCount?: number; // Added to track usage
  createdAt?: string | Date;
}

export interface DiseaseInfo {
  description: string;
  symptoms: string[];
  treatment: string[];
}

export interface DetectionResult {
  _id?: string;
  id?: string; 
  user?: string; 
  timestamp: number | string | Date; 
  imageUrl: string; // Will now be a server path like /uploads/image.png
  diseaseName: string;
  geminiResponse?: string;
  diseaseDetails?: DiseaseInfo;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// For Admin Analytics
export interface DetectionCountPerDisease {
  [diseaseName: string]: number;
}

export interface DetectionAnalyticsData {
  totalDetections: number;
  totalUsers: number;
  detectionsPerDisease: DetectionCountPerDisease;
  // Potentially add more fields like detectionsOverTime, etc.
}

export interface SubscriptionAnalyticsData {
  totalActivePremiumSubscribers: number;
  // Potentially add MRR, plan distribution if more plans exist
}

// For Stripe Config
export interface StripeConfig {
  publishableKey: string;
  premiumPriceId: string;
}
