

import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// The DiseaseInfo type is now defined inline within IDetection to avoid cross-package imports.

// Interface for Detection document
export interface IDetection extends Document {
  user: Types.ObjectId; 
  timestamp: Date;
  imageUrl: string; // Server path, e.g., /uploads/image.png
  diseaseName: string;
  geminiResponse?: string;
  diseaseDetails?: {
    description: string;
    symptoms: string[];
    treatment: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const detectionSchemaOptions = {
  timestamps: true,
};

const detectionSchema: Schema<IDetection> = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User', 
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  imageUrl: { // Stores the server-relative path to the uploaded image
    type: String,
    required: [true, 'Image URL/Path is required for a detection entry'],
  },
  diseaseName: {
    type: String,
    required: [true, 'Disease name is required'],
  },
  geminiResponse: { 
    type: String, 
  },
  diseaseDetails: { 
    description: String,
    symptoms: [String],
    treatment: [String],
  },
}, detectionSchemaOptions);

const Detection: Model<IDetection> = mongoose.model<IDetection>('Detection', detectionSchema);

export default Detection;
