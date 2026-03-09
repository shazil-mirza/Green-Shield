
export const GEMINI_API_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';

// Simulated disease names for mock detection
export const MOCK_DISEASES: string[] = [
  "Tomato Late Blight",
  "Rose Black Spot",
  "Potato Early Blight",
  "Apple Scab",
  "Corn Common Rust",
  "Grape Powdery Mildew",
  "Pepper Bacterial Spot",
  "Strawberry Leaf Scorch",
];

// MAX_FREE_DETECTIONS is now handled by subscription status / planType on the backend
// and reflected in the user object on the frontend.

export const DETECTION_HISTORY_LS_KEY = 'greenShieldDetectionHistory'; 
export const DETECTION_COUNT_LS_KEY = 'greenShieldDetectionCount'; // This might be less relevant now
export const USER_LS_KEY = 'greenShieldUser';

// Backend Base URL for constructing full image URLs for display
export const API_BASE_URL = 'http://localhost:5000';
export const API_ENDPOINT_PREFIX = '/api';
