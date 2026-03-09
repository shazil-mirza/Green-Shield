import React, { useState, useEffect, useCallback } from 'react';
import ImageUploader from '../components/ImageUploader';
import DiseaseInfoCard from '../components/DiseaseInfoCard';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import { DetectionResult, DiseaseInfo } from '../types';
import { MOCK_DISEASES, API_BASE_URL } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Activity, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const MAX_FREE_PLAN_DETECTIONS = 5; // Define this here or fetch from config

const DetectionPage: React.FC = () => {
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // For local preview
  const [detectedDiseaseName, setDetectedDiseaseName] = useState<string | null>(null);
  const [diseaseInfo, setDiseaseInfo] = useState<DiseaseInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, fetchCurrentUser } = useAuth();
  const [userDetectionCount, setUserDetectionCount] = useState<number>(0);

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
  
  useEffect(() => {
    const fetchUserDetectionsCount = async () => {
        if (user && !isAdmin && !isPremiumUser) { // Only count for free users
            try {
                // This ideally should be a dedicated count endpoint for performance
                const history = await apiService.get<DetectionResult[]>('/api/detections');
                setUserDetectionCount(history.length);
            } catch (err) {
                console.error("Could not fetch history for count:", err);
                setUserDetectionCount(0);
            }
        } else {
            setUserDetectionCount(0); // Reset for premium/admin or if no user
        }
    };
    fetchUserDetectionsCount();
  }, [user, isAdmin, isPremiumUser]);

  const handleImageUpload = (file: File, previewUrl: string) => {
    setUploadedImageFile(file);
    setImagePreviewUrl(previewUrl); // Keep using this for local preview
    setDetectedDiseaseName(null);
    setDiseaseInfo(null);
    setError(null);
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

    // 1. Simulate ML model processing (client-side placeholder for disease name)
    // In a real scenario, the backend might determine the diseaseName from the image.
    // For now, we continue to mock it on the client before sending.
    await new Promise(resolve => setTimeout(resolve, 500)); 
    const randomIndex = Math.floor(Math.random() * MOCK_DISEASES.length);
    const mockDetectedDisease = MOCK_DISEASES[randomIndex];
    setDetectedDiseaseName(mockDetectedDisease);

    // 2. Send to backend (image file + mock disease name) for Gemini info and to save detection
    try {
      const formData = new FormData();
      formData.append('image', uploadedImageFile);
      formData.append('diseaseName', mockDetectedDisease);
      // No need to append imageUrl, backend generates it from the saved file.

      const newDetectionResult = await apiService.post<DetectionResult>('/api/detections', formData);
      
      if (newDetectionResult.diseaseDetails) {
        setDiseaseInfo(newDetectionResult.diseaseDetails);
      } else if (newDetectionResult.geminiResponse) {
        try {
            const parsedInfo = JSON.parse(newDetectionResult.geminiResponse) as DiseaseInfo;
            setDiseaseInfo(parsedInfo);
        } catch (parseError) {
            console.error("Failed to parse geminiResponse from backend:", parseError);
            setError("Received data, but failed to parse disease details.");
        }
      } else {
         setError("Detection successful, but no detailed information was returned.");
      }
      
      // Update UI detection count for free users
      if (!isAdmin && !isPremiumUser) {
          setUserDetectionCount(prevCount => prevCount + 1);
      }
      // Optionally, refresh full user data if backend might have updated something (e.g. credits)
      // await fetchCurrentUser(); 

    } catch (apiError: any) {
      console.error("API Error in detection:", apiError);
      setError(apiError.response?.data?.message || "Failed to process detection on the server. Please try again.");
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
    return `Free Detections Remaining: ${Math.max(0, MAX_FREE_PLAN_DETECTIONS - userDetectionCount)} / ${MAX_FREE_PLAN_DETECTIONS}.`;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Plant Disease Detection</h1>
        <p className="text-lg text-neutral">Upload an image of your plant to detect potential diseases.</p>
        <p className="text-sm text-gray-600 mt-1">
            {getDetectionStatusMessage()}
            {!isAdmin && !isPremiumUser && user && 
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

      {imagePreviewUrl && ( // Show button if an image is selected, regardless of upload status
        <div className="text-center mt-6">
          <button 
            onClick={handleDetectDisease}
            disabled={isLoading || detectionLimitReached || !user || !uploadedImageFile}
            className="bg-accent hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" color="text-white" />
                <span className="ml-2">Processing...</span>
              </>
            ) : (
              <>
                <Activity size={20} className="mr-2"/>
                Detect Disease
              </>
            )}
          </button>
        </div>
      )}
      
      {!isLoading && detectedDiseaseName && diseaseInfo && (
        <DiseaseInfoCard 
          diseaseName={detectedDiseaseName} 
          info={diseaseInfo}
          isLoading={false}
        />
      )}
      {isLoading && detectedDiseaseName && ( 
         <div className="mt-8 p-6 bg-white rounded-lg shadow-xl animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
            <p className="mt-4 text-center text-neutral">Fetching details for {detectedDiseaseName}...</p>
         </div>
       )}
       {!isLoading && detectedDiseaseName && !diseaseInfo && !error && (
         <div className="mt-8 p-6 bg-white rounded-lg shadow-xl text-center">
           <Info size={24} className="mx-auto text-blue-500 mb-2" />
           <p>Processed: {detectedDiseaseName}. Waiting for detailed information or information was not available.</p>
         </div>
       )}
    </div>
  );
};

export default DetectionPage;