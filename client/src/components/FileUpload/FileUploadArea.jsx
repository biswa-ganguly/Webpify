import React from 'react';
import { Upload } from 'lucide-react';
import SingleImagePreview from './SingleImagePreview';
import BatchImagesPreview from './BatchImagesPreview';

const FileUploadArea = ({ 
  mode, 
  dragActive, 
  selectedFiles, 
  previews, 
  onDrop, 
  onDragOver, 
  onDragLeave, 
  onFileSelect, 
  onRemoveFile, 
  onReset,
  fileInputRef 
}) => {
  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
        dragActive 
          ? 'border-blue-500 bg-blue-500/10 scale-[1.02] shadow-lg shadow-blue-500/20' 
          : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/30'
      }`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      {previews.length > 0 ? (
        mode === 'single' ? (
          <SingleImagePreview 
            preview={previews[0]} 
            file={selectedFiles[0]}
            onFileChange={() => fileInputRef.current?.click()}
            onReset={onReset}
          />
        ) : (
          <BatchImagesPreview 
            previews={previews}
            files={selectedFiles}
            onRemoveFile={onRemoveFile}
            onAddFiles={() => fileInputRef.current?.click()}
            onReset={onReset}
          />
        )
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl">
              <Upload className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-200">
              Drop your {mode === 'single' ? 'image' : 'images'} here
            </p>
            <p className="text-gray-400 mt-2">or click to browse</p>
            <p className="text-xs text-gray-500 mt-3">
              {mode === 'single' ? 'Maximum file size: 10MB' : 'Up to 20 files, 10MB each'}
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105"
          >
            Select {mode === 'single' ? 'Image' : 'Images'}
          </button>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={mode === 'batch'}
        onChange={(e) => onFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
};

export default FileUploadArea;
