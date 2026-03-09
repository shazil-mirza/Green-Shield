
import React from 'react';
import { DiseaseInfo } from '../types';
import { Leaf, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DiseaseInfoCardProps {
  diseaseName: string;
  info: DiseaseInfo | null;
  isLoading: boolean;
  // imageUrl?: string; // If we want to display the uploaded image here too
}

const DiseaseInfoCard: React.FC<DiseaseInfoCardProps> = ({ diseaseName, info, isLoading }) => {
  if (isLoading) {
    return (
      <div className="mt-8 p-6 bg-white rounded-lg shadow-xl animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-6"></div>
        <div className="h-5 bg-gray-300 rounded w-1/3 mb-3"></div>
        <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
      </div>
    );
  }

  if (!info) {
    return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-xl text-center">
            <AlertTriangle size={48} className="mx-auto text-yellow-400 mb-4" />
            <h2 className="text-2xl font-semibold text-neutral mb-2">{diseaseName}</h2>
            <p className="text-gray-600">Detailed information could not be loaded for this disease.</p>
            <p className="text-xs text-gray-500 mt-4">
                This might be due to an issue with the AI service or the disease name not being recognized.
            </p>
        </div>
    );
  }
  
  const hasContent = (arr: string[] | undefined) => arr && arr.length > 0 && arr.some(item => item.trim() !== "" && !item.toLowerCase().includes("not available") && !item.toLowerCase().includes("error fetching"));


  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold text-accent mb-4 flex items-center">
        <Leaf size={30} className="mr-3 text-primary" />
        {diseaseName}
      </h2>
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-neutral mb-2">Description</h3>
        <p className="text-gray-700 leading-relaxed">{info.description || "No description available."}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-neutral mb-2 flex items-center">
          <AlertTriangle size={22} className="mr-2 text-yellow-500" />
          Common Symptoms
        </h3>
        {hasContent(info.symptoms) ? (
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {info.symptoms.map((symptom, index) => (
              <li key={index}>{symptom}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 italic">No specific symptoms provided, or information was not available.</p>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold text-neutral mb-2 flex items-center">
          <ShieldCheck size={22} className="mr-2 text-green-500" />
          Treatment & Prevention
        </h3>
        {hasContent(info.treatment) ? (
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {info.treatment.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 italic">No specific treatment advice provided, or information was not available.</p>
        )}
      </div>
    </div>
  );
};

export default DiseaseInfoCard;