
import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import Detection from '../models/Detection';
import User, { IUser } from '../models/User';
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { DiseaseInfo } from '../../../frontend/types';
import fs from 'fs';
import path from 'path';

const GEMINI_API_KEY_FROM_ENV = process.env.API_KEY;
const GEMINI_API_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';
const MAX_FREE_PLAN_DETECTIONS_BACKEND = 5;

let ai: GoogleGenAI | null = null;
if (GEMINI_API_KEY_FROM_ENV) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY_FROM_ENV });
} else {
  console.warn("[detectionController] Initial Check: Gemini API key (API_KEY) is not set. AI features will be disabled.");
}

interface PlantVerificationResult {
  isPlant: boolean;
  reason?: string;
}

interface GeminiDiseaseIdentificationResult {
  diseaseName: string;
  diseaseDetails: DiseaseInfo;
}

const verifyImageIsPlantWithGemini = async (imagePath: string, mimeType: string): Promise<PlantVerificationResult> => {
  if (!ai) throw new Error("Image content verification service is currently unavailable.");

  const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });
  const imagePart: Part = { inlineData: { mimeType, data: imageBase64 } };
  const textPart: Part = { text: `Is this image primarily of a plant? Respond ONLY with a JSON object: {"is_plant": boolean, "reason": "concise reason if not a plant"}.` };

  const generationResult: GenerateContentResponse = await ai.models.generateContent({
    model: GEMINI_API_MODEL_TEXT,
    contents: { parts: [imagePart, textPart] },
    config: { responseMimeType: "application/json", temperature: 0.2 }
  });
  
  let jsonStr = generationResult.text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match?.[2]) jsonStr = match[2].trim();

  try {
    const parsed = JSON.parse(jsonStr) as { is_plant: boolean, reason?: string };
    return { isPlant: parsed.is_plant, reason: parsed.reason };
  } catch (e) {
    console.error("Failed to parse plant verification response:", jsonStr, e);
    throw new Error("Could not verify image content due to an AI service error.");
  }
};

const getDiseaseNameAndInfoFromGemini = async (imagePath: string, mimeType: string): Promise<GeminiDiseaseIdentificationResult> => {
  if (!ai) throw new Error("Disease identification service is currently unavailable.");

  const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });
  const imagePart: Part = { inlineData: { mimeType, data: imageBase64 } };
  const textPart: Part = {
    text: `Analyze this plant image. Identify the primary disease. Respond STRICTLY with a JSON object: {"diseaseName": "Common Name", "diseaseDetails": {"description": "...", "symptoms": ["..."], "treatment": ["..."]}}. If healthy, use "Healthy Plant". If unsure, use "Unknown Condition".`
  };

  const generationResult: GenerateContentResponse = await ai.models.generateContent({
    model: GEMINI_API_MODEL_TEXT, 
    contents: { parts: [imagePart, textPart] },
    config: { responseMimeType: "application/json", temperature: 0.4 }
  });
  
  let jsonStr = generationResult.text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match?.[2]) jsonStr = match[2].trim();

  try {
    const parsed = JSON.parse(jsonStr) as GeminiDiseaseIdentificationResult;
    if (!parsed.diseaseName || !parsed.diseaseDetails) throw new Error("Malformed AI response.");
    return parsed;
  } catch (e) {
    console.error("Failed to parse disease ID response:", jsonStr, e);
    throw new Error("Could not identify disease due to an AI service error.");
  }
};


export const createDetection = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Image file is required.');
  }
  const imageFile = req.file;

  try {
    const user = req.user as IUser;
    if (!user?._id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    // Refresh user from DB to get the most up-to-date detectionCount
    const freshUser = await User.findById(user._id);
    if (!freshUser) {
        res.status(401);
        throw new Error('User not found.');
    }

    const isPremium = freshUser.planType === 'premium' && (freshUser.stripeSubscriptionStatus === 'active' || freshUser.stripeSubscriptionStatus === 'trialing');
    if (freshUser.role !== 'admin' && !isPremium) {
      if (freshUser.detectionCount >= MAX_FREE_PLAN_DETECTIONS_BACKEND) {
        res.status(429); 
        throw new Error(`Free detection limit of ${MAX_FREE_PLAN_DETECTIONS_BACKEND} reached. Please upgrade.`);
      }
    }

    const verification = await verifyImageIsPlantWithGemini(imageFile.path, imageFile.mimetype);
    if (!verification.isPlant) {
      res.status(400);
      throw new Error(verification.reason || "The uploaded image does not appear to be a plant.");
    }

    const { diseaseName, diseaseDetails } = await getDiseaseNameAndInfoFromGemini(imageFile.path, imageFile.mimetype);
    const imageUrlPath = `/uploads/${imageFile.filename}`;

    const detection = new Detection({
      user: freshUser._id,
      imageUrl: imageUrlPath,
      diseaseName,
      diseaseDetails,
      timestamp: new Date(),
    });

    const createdDetection = await detection.save();

    if (freshUser.role !== 'admin' && !isPremium) {
      freshUser.detectionCount = (freshUser.detectionCount || 0) + 1;
      await freshUser.save();
    }
    
    res.status(201).json(createdDetection);

  } catch (error: any) {
    if (imageFile?.path && fs.existsSync(imageFile.path)) {
      fs.unlink(imageFile.path, (err) => err && console.error("Failed to clean up file after error:", err.message));
    }
    next(error);
  }
});

export const getUserDetections = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as IUser;
  if (!user?._id) {
    res.status(401);
    throw new Error('User not authorized');
  }
  const detections = await Detection.find({ user: user._id }).sort({ timestamp: -1 });
  res.json(detections);
});

export const deleteDetection = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as IUser;
  const detection = await Detection.findById(req.params.id);

  if (!detection) {
    res.status(404);
    throw new Error('Detection not found');
  }

  if (detection.user.toString() !== user._id.toString() && user.role !== 'admin') {
    res.status(403);
    throw new Error('User not authorized to delete this detection');
  }

  if (detection.imageUrl) {
    const filename = path.basename(detection.imageUrl);
    const fileToDelete = path.resolve((process as any).cwd(), 'uploads', filename);
    if (fs.existsSync(fileToDelete)) {
      fs.unlink(fileToDelete, (err) => err && console.error("Error deleting image file:", err.message));
    }
  }

  await Detection.findByIdAndDelete(req.params.id);
  res.json({ message: 'Detection removed successfully' });
});
