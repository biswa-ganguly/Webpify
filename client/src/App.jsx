import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, FileImage, Settings, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import './App.css';

// Fix for environment variables in React
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ImageConverter = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState(null);
  const [quality, setQuality] = useState(80);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef(null);

  const clearError = () => setError(null);

  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp'];
    
    if (!file) return 'No file selected';
    if (file.size > maxSize) return 'File size must be less than 10MB';
    if (!allowedTypes.includes(file.type)) return 'File type not supported. Please use JPEG, PNG, GIF, BMP, TIFF, or WebP';
    
    return null;
  };

  const handleFileSelect = useCallback((file) => {
    clearError();
    
    const validation = validateFile(file);
    if (validation) {
      setError(validation);
      return;
    }

    setSelectedFile(file);
    setResult(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleConvert = async () => {
    if (!selectedFile) return;

    setConverting(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('quality', quality);
    if (width) formData.append('width', width);
    if (height) formData.append('height', height);

    try {
      const response = await fetch(`${API_BASE_URL}/api/convert`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
        console.log('Conversion successful:', data.data);
      } else {
        setError(data.error || 'Conversion failed');
      }
    } catch (error) {
      console.error('Conversion error:', error);
      setError('Network error. Please check if the server is running.');
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;

    setDownloading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}${result.downloadUrl}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('Download completed');
      
      // Clear the result after successful download
      setTimeout(() => {
        setResult(null);
      }, 1000); // Small delay to show download completion
      
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const resetConverter = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setQuality(80);
    setWidth('');
    setHeight('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Image to WebP Converter
          </h1>
          <p className="text-gray-600 mb-4">
            Convert your images to WebP format for better web performance
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
            <span className="bg-white px-3 py-1 rounded-full">JPEG</span>
            <span className="bg-white px-3 py-1 rounded-full">PNG</span>
            <span className="bg-white px-3 py-1 rounded-full">GIF</span>
            <span className="bg-white px-3 py-1 rounded-full">BMP</span>
            <span className="bg-white px-3 py-1 rounded-full">TIFF</span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">→ WebP</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Upload Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50 scale-105' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {preview ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="max-h-64 max-w-full mx-auto rounded-lg shadow-md"
                  />
                  <div className="absolute -top-2 -right-2">
                    <CheckCircle className="w-6 h-6 text-green-500 bg-white rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Choose different file
                  </button>
                  <span className="text-gray-400">•</span>
                  <button
                    onClick={resetConverter}
                    className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-700">Drop your image here</p>
                  <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                  <p className="text-xs text-gray-400 mt-2">Maximum file size: 10MB</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Select Image
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Settings */}
          {selectedFile && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium text-gray-700">Conversion Settings</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality: {quality}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Smaller</span>
                    <span>Better Quality</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="Auto"
                    min="1"
                    max="10000"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="Auto"
                    min="1"
                    max="10000"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    <strong>Tip:</strong> Leave width/height empty for original size. 
                    Images maintain aspect ratio when only one dimension is specified.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Convert Button */}
          {selectedFile && (
            <div className="mt-6 text-center">
              <button
                onClick={handleConvert}
                disabled={converting}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto transition-colors font-medium"
              >
                {converting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <FileImage className="w-5 h-5" />
                    Convert to WebP
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-800">Conversion Complete!</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">Original Size</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatFileSize(result.originalSize)}
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">WebP Size</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatFileSize(result.convertedSize)}
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">Size Reduction</p>
                <p className="text-lg font-semibold text-purple-600">
                  {result.compressionRatio}%
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">Quality</p>
                <p className="text-lg font-semibold text-yellow-600">
                  {quality}%
                </p>
              </div>
            </div>

            {result.originalDimensions && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Image Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Original:</span>
                    <span className="ml-2 font-medium">
                      {result.originalFilename}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dimensions:</span>
                    <span className="ml-2 font-medium">
                      {result.originalDimensions.width} × {result.originalDimensions.height}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto transition-colors font-medium"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download WebP Image
                  </>
                )}
              </button>
              
              <button
                onClick={resetConverter}
                className="mt-3 text-gray-600 hover:text-gray-800 font-medium text-sm"
              >
                Convert Another Image
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>WebP format reduces file size by 25-35% while maintaining image quality</p>
        </div>
      </div>
    </div>
  );
};

export default ImageConverter;