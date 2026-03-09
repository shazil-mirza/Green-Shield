
import React, { useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import DiseaseInfoCard from '../components/DiseaseInfoCard';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import { DetectionResult, DiseaseInfo } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Activity, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const MAX_FREE_PLAN_DETECTIONS = 5; 

const DetectionPage: React.FC = () => {
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [detectedDiseaseName, setDetectedDiseaseName] = useState<string | null>(null);
  const [diseaseInfo, setDiseaseInfo] = useState<DiseaseInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, fetchCurrentUser } = useAuth();
  
  const userDetectionCount = user?.detectionCount ?? 0;
  const isPremiumUser = user?.planType === 'premium' && (user.stripeSubscriptionStatus === 'active' || user.stripeSubscriptionStatus === 'trialing');
  const isAdmin = user?.role === 'admin';
  
  let detectionLimitReached = false;
  let disabledReason = "";

  if (!user) {
    detectionLimitReached = true;
    disabledReason = "Please log in to use the detection feature.";
  } else if (!isAdmin && !isPremiumUser) {
    if (userDetectionCount >= MAX_FREE_PLAN_DETECTIONS) {
      detectionLimitReached = true;
      disabledReason = `You've used your ${MAX_FREE_PLAN_DETECTIONS} free detections. Please upgrade to Premium for unlimited detections.`;
    }
  }

  const handleImageUpload = (file: File | null, previewUrl: string | null) => {
    setUploadedImageFile(file);
    setImagePreviewUrl(previewUrl); 
    if (!file) { // Reset if image is removed
        setDetectedDiseaseName(null);
        setDiseaseInfo(null);
        setError(null);
    }
  };

  const handleDetectDisease = async () => {
    if (!uploadedImageFile) {
      setError("Please upload an image first.");
      return;
    }
    if (detectionLimitReached) {
        setError(disabledReason);
        return;
    }
    if (!user) {
        setError("You must be logged in to detect diseases.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setDiseaseInfo(null);
    setDetectedDiseaseName(null);

    try {
      const formData = new FormData();
      formData.append('image', uploadedImageFile);
      
      const newDetectionResult = await apiService.post<DetectionResult>('/detections', formData);
      
      setDetectedDiseaseName(newDetectionResult.diseaseName);
      
      if (newDetectionResult.diseaseDetails) {
        setDiseaseInfo(newDetectionResult.diseaseDetails);
      } else {
         setError("Detection successful, but no detailed information was returned.");
      }
      
      // Refresh user data to get the latest detection count
      await fetchCurrentUser(); 

    } catch (apiError: any) {
      console.error("API Error in detection:", apiError);
      setError(apiError.data?.message || apiError.message || "Failed to process detection on the server. Please try again.");
      setDiseaseInfo(null);
      setDetectedDiseaseName(null); 
    } finally {
      setIsLoading(false);
    }
  };

  const getDetectionStatusMessage = () => {
    if (!user) return "Log in to start detecting.";
    if (isAdmin) return "Admin: Unlimited detections.";
    if (isPremiumUser) return "Premium: Unlimited detections.";
    return `Free Detections Used: ${userDetectionCount} / ${MAX_FREE_PLAN_DETECTIONS}.`;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Plant Disease Detection</h1>
        <p className="text-lg text-neutral">Upload an image of your plant to get an AI-powered diagnosis.</p>
        <p className="text-sm text-gray-600 mt-1">
            {getDetectionStatusMessage()}
            {!isAdmin && !isPremiumUser && user && !detectionLimitReached &&
              <Link to="/subscription" className="ml-2 text-accent hover:underline">(Upgrade to Premium?)</Link>
            }
        </p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <ImageUploader 
        onImageUpload={handleImageUpload} 
        detectionLimitReached={detectionLimitReached}
        disabledReason={disabledReason}
      />

      {imagePreviewUrl && (
        <div className="text-center mt-6">
          <button 
            onClick={handleDetectDisease}
            disabled={isLoading || detectionLimitReached || !user || !uploadedImageFile}
            className="bg-accent hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" color="text-white" />
                <span className="ml-2">Diagnosing...</span>
              </>
            ) : (
              <>
                <Activity size={20} className="mr-2"/>
                Diagnose Plant
              </>
            )}
          </button>
        </div>
      )}
      
      {isLoading && imagePreviewUrl && ( 
         <div className="mt-8 p-6 bg-white rounded-lg shadow-xl text-center">
            <Spinner size="lg"/>
            <p className="mt-4 text-center text-neutral">Analyzing image and fetching details...</p>
         </div>
       )}

      {!isLoading && detectedDiseaseName && diseaseInfo && (
        <DiseaseInfoCard 
          diseaseName={detectedDiseaseName} 
          info={diseaseInfo}
          isLoading={false}
        />
      )}
     
       {!isLoading && detectedDiseaseName && !diseaseInfo && !error && (
         <div className="mt-8 p-6 bg-white rounded-lg shadow-xl text-center">
           <Info size={24} className="mx-auto text-blue-500 mb-2" />
           <p>Processed: {detectedDiseaseName}. Detailed information was not available for this detection.</p>
         </div>
       )}
    </div>
  );
};

export default DetectionPage;
