
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DetectionResult, DiseaseInfo } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Trash2, Info, Search, ExternalLink, AlertTriangle, ImageOff } from 'lucide-react';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import { API_BASE_URL } from '../constants'; // For constructing image URLs

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<DetectionResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDetection, setSelectedDetection] = useState<DetectionResult | null>(null);
  const { user } = useAuth();

  const fetchHistory = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiService.get<DetectionResult[]>('/detections');
        setHistory(data || []);
      } catch (err: any) {
        console.error("Failed to fetch history:", err);
        setError(err.data?.message || err.message || "Could not load your detection history.");
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setHistory([]); 
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id?: string) => {
    if (!id || !user) return;
    
    if (!window.confirm("Are you sure you want to delete this detection record?")) return;

    const originalHistory = [...history];
    setHistory(prevHistory => prevHistory.filter(item => (item._id || item.id) !== id));
    if (selectedDetection && (selectedDetection._id || selectedDetection.id) === id) {
        setSelectedDetection(null);
    }

    try {
      await apiService.delete(`/detections/${id}`);
    } catch (err: any) {
      console.error("Failed to delete detection:", err);
      setError(err.data?.message || err.message || "Could not delete the detection. Please try again.");
      setHistory(originalHistory); 
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter(item => 
      item.diseaseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(item.timestamp).toLocaleDateString().includes(searchTerm)
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [history, searchTerm]);

  const parseGeminiResponseForModal = (detection: DetectionResult | null): DiseaseInfo | null => {
    if (!detection) return null;
    if (detection.diseaseDetails && Object.keys(detection.diseaseDetails).length > 0) return detection.diseaseDetails;
    if (!detection.geminiResponse) return null;
    try {
      // Ensure geminiResponse is not an empty string or malformed before parsing
      if (typeof detection.geminiResponse === 'string' && detection.geminiResponse.trim() !== '') {
        const parsed = JSON.parse(detection.geminiResponse);
        // Basic check to ensure it's somewhat structured like DiseaseInfo
        if (parsed && typeof parsed.description === 'string') {
            return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse Gemini response from history:", e, "Response was:", detection.geminiResponse);
    }
    return {
        description: "Detailed information could not be parsed or is not in the expected format.",
        symptoms: [],
        treatment: []
    };
  }
  
  const getFullImageUrl = (imagePath: string) => {
    if (!imagePath) return "";
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
      return imagePath; // Already a full URL or data URL
    }
    return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary mb-6">Your Detection History</h1>
      
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="mb-4 relative">
        <input 
          type="text"
          placeholder="Search by disease name or date (e.g., MM/DD/YYYY)..."
          className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search detection history"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20}/>
      </div>

      {filteredHistory.length === 0 ? (
        <p className="text-neutral text-center py-8 text-lg">
          {history.length === 0 && !searchTerm && !error ? "You haven't detected any diseases yet." : 
           !error ? `No detections found${searchTerm ? " matching your search" : ""}.` : ""}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((item) => (
            <div key={item._id || item.id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl">
              {item.imageUrl ? (
                <img 
                    src={getFullImageUrl(item.imageUrl)} 
                    alt={`Plant with ${item.diseaseName}`} 
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => setSelectedDetection(item)}
                    onError={(e) => (e.currentTarget.style.display = 'none')} // Hide on error
                />
              ) : (
                 <div 
                    className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
                    onClick={() => setSelectedDetection(item)}
                >
                    <ImageOff size={48} /> 
                 </div>
              )}
              <div className="p-4 flex flex-col flex-grow">
                <h3 
                    className="text-xl font-semibold text-accent mb-1 cursor-pointer hover:underline"
                    onClick={() => setSelectedDetection(item)}
                >
                    {item.diseaseName}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{new Date(item.timestamp).toLocaleString()}</p>
                <div className="mt-auto flex justify-between items-center">
                    <button 
                        onClick={() => setSelectedDetection(item)}
                        className="text-sm text-primary hover:text-green-700 font-medium flex items-center py-1 px-2 rounded hover:bg-green-50 transition-colors"
                        aria-label={`View details for ${item.diseaseName}`}
                    >
                        <Info size={16} className="mr-1" /> View Details
                    </button>
                    <button 
                        onClick={() => handleDelete(item._id || item.id)}
                        className="text-sm text-red-500 hover:text-red-700 font-medium p-1 rounded hover:bg-red-50 transition-colors"
                        aria-label={`Delete detection of ${item.diseaseName}`}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDetection && (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300" 
            onClick={() => setSelectedDetection(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
          <div 
            className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
                <h2 id="modal-title" className="text-2xl font-bold text-primary">{selectedDetection.diseaseName}</h2>
                <button 
                    onClick={() => setSelectedDetection(null)} 
                    className="text-gray-500 hover:text-gray-800 text-2xl leading-none p-1"
                    aria-label="Close modal"
                >
                    &times;
                </button>
            </div>
            {selectedDetection.imageUrl ? (
                 <img 
                    src={getFullImageUrl(selectedDetection.imageUrl)} 
                    alt={`Enlarged view of plant with ${selectedDetection.diseaseName}`} 
                    className="w-full max-h-80 object-contain rounded-md mb-4 bg-gray-100"
                 />
            ): (
                <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-400 rounded-md mb-4">
                    <ImageOff size={64} />
                    <p className="ml-2">Image not available</p>
                </div>
            )}
            
            <div className="text-sm text-gray-500 mb-4">
                Detected on: {new Date(selectedDetection.timestamp).toLocaleString()}
            </div>

            {(() => {
                const info = parseGeminiResponseForModal(selectedDetection);
                if (!info || (!info.description && (!info.symptoms || info.symptoms.length === 0) && (!info.treatment || info.treatment.length === 0))) {
                    return <p className="text-gray-600 italic flex items-center"><AlertTriangle size={18} className="mr-2 text-yellow-500" />Detailed information not available or not in expected format for this entry.</p>;
                }
                const hasContent = (arr: string[] | undefined) => arr && arr.length > 0 && arr.some(item => item.trim() !== "" && !item.toLowerCase().includes("not available") && !item.toLowerCase().includes("error fetching"));

                return (
                    <div className="space-y-3">
                        {info.description && info.description.trim() && (
                            <div>
                                <h4 className="font-semibold text-neutral text-lg mb-1">Description:</h4>
                                <p className="text-gray-700 leading-relaxed">{info.description}</p>
                            </div>
                        )}
                        {hasContent(info.symptoms) && (
                            <div>
                                <h4 className="font-semibold text-neutral text-lg mb-1">Symptoms:</h4>
                                <ul className="list-disc list-inside text-gray-700 space-y-1">
                                    {info.symptoms.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        )}
                        {hasContent(info.treatment) && (
                            <div>
                                <h4 className="font-semibold text-neutral text-lg mb-1">Treatment & Prevention:</h4>
                                <ul className="list-disc list-inside text-gray-700 space-y-1">
                                    {info.treatment.map((t, i) => <li key={i}>{t}</li>)}
                                </ul>
                            </div>
                         )}
                         {(!info.description && !hasContent(info.symptoms) && !hasContent(info.treatment)) && (
                            <p className="text-gray-600 italic">No specific details (description, symptoms, or treatment) were provided.</p>
                         )}
                    </div>
                );
            })()}
             <p className="text-xs text-gray-500 mt-6">
                AI-generated information. Always consult a local expert for definitive advice.
            </p>
            <a 
                href={`https://www.google.com/search?q=plant+disease+${encodeURIComponent(selectedDetection.diseaseName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
                Search for more info on Google <ExternalLink size={14} className="ml-1"/>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
