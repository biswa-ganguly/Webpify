import React from 'react';
import { CheckCircle, X, RefreshCw } from 'lucide-react';

const BatchImagesPreview = ({ previews, files, onRemoveFile, onAddFiles, onReset }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 text-green-400 mb-4">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">{files.length} files selected</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {previews.map((item, index) => (
          <div key={index} className="relative group">
            <div className="relative overflow-hidden rounded-lg bg-gray-800">
              <img 
                src={item.preview} 
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover transition-transform group-hover:scale-110"
              />
            </div>
            <button
              onClick={() => onRemoveFile(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
            <p className="text-xs text-gray-400 mt-1 truncate">
              {item.file.name}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 justify-center pt-4">
        <button
          onClick={onAddFiles}
          className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
        >
          Add more files
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

export default BatchImagesPreview;
