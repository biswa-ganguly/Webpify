import React from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { formatFileSize } from '../../utils/helpers';

const SingleImagePreview = ({ preview, file, onFileChange, onReset }) => {
  return (
    <div className="space-y-4">
      <div className="relative inline-block group">
        <img 
          src={preview.preview} 
          alt="Preview" 
          className="max-h-64 max-w-full mx-auto rounded-xl shadow-lg transition-transform group-hover:scale-105"
        />
        <div className="absolute -top-2 -right-2">
          <CheckCircle className="w-6 h-6 text-green-400 bg-gray-900 rounded-full" />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-300">{file.name}</p>
        <p className="text-xs text-gray-500">
          {formatFileSize(file.size)} • {file.type}
        </p>
      </div>
      <div className="flex flex-wrap gap-4 justify-center pt-4">
        <button
          onClick={onFileChange}
          className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
        >
          Choose different file
        </button>
        <span className="text-gray-600">•</span>
        <button
          onClick={onReset}
          className="text-gray-400 hover:text-gray-300 font-medium text-sm transition-colors flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Reset
        </button>
      </div>
    </div>
  );
};

export default SingleImagePreview;