import React from 'react';
import { ImageIcon, Layers } from 'lucide-react';

const ModeSelector = ({ mode, onModeChange }) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="bg-gray-800/50 backdrop-blur-sm p-1 rounded-xl border border-gray-700">
        <button
          onClick={() => onModeChange('single')}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
            mode === 'single' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Single Image
        </button>
        <button
          onClick={() => onModeChange('batch')}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
            mode === 'batch' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          Batch Convert
        </button>
      </div>
    </div>
  );
};

export default ModeSelector;