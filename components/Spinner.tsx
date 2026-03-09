
import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; // Tailwind color class e.g., text-primary
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'text-primary' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex justify-center items-center`}>
      <div 
        className={`animate-spin rounded-full border-t-2 border-b-2 border-transparent ${sizeClasses[size]} ${color.replace('text-', 'border-')}`}
        style={{ borderTopColor: 'currentColor', borderBottomColor: 'currentColor' }} // Ensure current color is used for borders
      ></div>
    </div>
  );
};

export default Spinner;
    