
import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploaderProps {
  onImageUpload: (file: File | null, previewUrl: string | null) => void;
  detectionLimitReached: boolean;
  disabledReason?: string; // Optional reason for being disabled
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, detectionLimitReached, disabledReason }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File size exceeds 5MB. Please choose a smaller image.");
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError("Invalid file type. Please upload a JPG, PNG, or WEBP image.");
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onImageUpload(file, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (detectionLimitReached) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
       if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB.");
        setPreview(null);
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError("Invalid file type. Please upload a JPG, PNG, or WEBP image.");
        setPreview(null);
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onImageUpload(file, result);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload, detectionLimitReached]);

  const handleRemoveImage = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
    // Notify parent that image is removed by sending nulls
    onImageUpload(null, null); 
  };

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-neutral mb-4">Upload Plant Image</h3>
      {detectionLimitReached && (
        <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
          <p className="font-bold">Detection Limit Reached</p>
          <p>{disabledReason || "You have used all your free detections. Please upgrade for more."}</p>
        </div>
      )}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
                    ${preview ? 'border-primary' : 'border-gray-300'}
                    ${detectionLimitReached ? 'cursor-not-allowed bg-gray-50 opacity-70' : 'cursor-pointer hover:border-primary'}`}
        onClick={() => !detectionLimitReached && fileInputRef.current?.click()}
        onDragOver={detectionLimitReached ? undefined : handleDragOver}
        onDrop={detectionLimitReached ? undefined : handleDrop}
        role="button"
        aria-disabled={detectionLimitReached}
        tabIndex={detectionLimitReached ? -1 : 0}
      >
        <input 
          type="file" 
          accept="image/jpeg, image/png, image/webp" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden"
          disabled={detectionLimitReached}
        />
        {!preview ? (
          <div className="flex flex-col items-center text-gray-500">
            <UploadCloud size={48} className="mb-2" />
            <p className="font-semibold">
                {detectionLimitReached ? "Uploads Disabled" : "Click to upload or drag and drop"}
            </p>
            <p className="text-sm">PNG, JPG, WEBP (MAX. 5MB)</p>
          </div>
        ) : (
          <div className="relative group">
            <img src={preview} alt="Plant preview" className="max-h-64 mx-auto rounded-md shadow-sm" />
            {!detectionLimitReached && (
                <button 
                onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                aria-label="Remove image"
                >
                <X size={18} />
                </button>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
    </div>
  );
};

export default ImageUploader;
