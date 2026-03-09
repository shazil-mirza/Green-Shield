

import React from 'react';
// Fix: Add AlertTriangle to the import from lucide-react
import { AlertCircle, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
}

const AlertIcons: Record<AlertType, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  // Fix: AlertTriangle was used but not imported. Now imported.
  warning: AlertTriangle, 
  info: Info,
};

const AlertColors: Record<AlertType, string> = {
  success: 'bg-green-100 border-green-500 text-green-700',
  error: 'bg-red-100 border-red-500 text-red-700',
  warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
  info: 'bg-blue-100 border-blue-500 text-blue-700',
};


const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const IconComponent = AlertIcons[type];

  return (
    <div className={`border-l-4 p-4 rounded-md shadow-md ${AlertColors[type]}`} role="alert">
      <div className="flex items-center">
        <IconComponent className="h-6 w-6 mr-3" />
        <p className="font-medium">{message}</p>
        {onClose && (
          <button 
            onClick={onClose} 
            className="ml-auto -mx-1.5 -my-1.5 bg-transparent rounded-lg focus:ring-2 focus:ring-current p-1.5 inline-flex h-8 w-8"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;