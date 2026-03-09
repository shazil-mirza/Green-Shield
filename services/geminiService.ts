// This file is no longer used on the frontend.
// Gemini API calls are now handled by the backend (e.g., in detectionController.ts)
// to protect the API key and centralize logic.
// You can safely delete this file from the frontend 'services' directory.

// Example of what it previously contained (for reference):
/*
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_API_MODEL_TEXT } from '../constants';
import { DiseaseInfo } from '../types';

const API_KEY = process.env.API_KEY; // This was problematic for frontend security

if (!API_KEY) {
  console.warn("Frontend: Gemini API key not found. Backend should handle this now.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const getDiseaseInformation = async (diseaseName: string): Promise<DiseaseInfo | null> => {
  if (!ai) {
    console.error("Frontend: Gemini API client not initialized.");
    return {
        description: `Mock description for ${diseaseName}. Gemini API key not configured on frontend.`,
        symptoms: ["Mock symptom 1", "Mock symptom 2"],
        treatment: ["Mock treatment 1: Ensure API_KEY is set in your backend environment.", "Mock treatment 2"]
    };
  }
  // ... rest of the logic ...
  // This logic is now in backend/src/controllers/detectionController.ts (or a service it calls)
  return null; 
};
*/
console.info("The geminiService.ts on the frontend is now deprecated. Backend handles Gemini calls.");

export {}; // Make it a module
