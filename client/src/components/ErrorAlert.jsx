import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ErrorAlert = ({ error, onClear }) => {
  if (!error) return null;

  return (
    <div className="bg-red-900/20 backdrop-blur-sm border border-red-800 rounded-xl p-4 mb-6 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-300">{error}</p>
      </div>
      <button
        onClick={onClear}
        className="text-red-400 hover:text-red-300 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ErrorAlert;