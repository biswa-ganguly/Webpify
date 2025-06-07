import { useState, useRef, useCallback } from 'react';

const useFileUpload = (mode = 'single') => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const clearError = () => setError(null);

  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/bmp', 
      'image/tiff', 
      'image/webp'
    ];
    
    if (!file) return 'No file selected';
    if (file.size > maxSize) return 'File size must be less than 10MB';
    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported. Please use JPEG, PNG, GIF, BMP, TIFF, or WebP';
    }
    
    return null;
  };

  const createPreview = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ file, preview: e.target.result });
      reader.onerror = () => resolve({ file, preview: null });
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = useCallback((files) => {
    clearError();
    const fileArray = Array.from(files);
    
    // Validate file count based on mode
    if (mode === 'single' && fileArray.length > 1) {
      setError('Single mode: Please select only one file');
      return;
    }

    if (mode === 'batch' && fileArray.length > 20) {
      setError('Batch mode: Maximum 20 files allowed');
      return;
    }

    // Validate all files
    for (let file of fileArray) {
      const validation = validateFile(file);
      if (validation) {
        setError(`${file.name}: ${validation}`);
        return;
      }
    }

    setSelectedFiles(fileArray);
    
    // Create previews for all files
    const previewPromises = fileArray.map(createPreview);
    Promise.all(previewPromises).then(setPreviews);
  }, [mode]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const removeFile = useCallback((index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  }, [selectedFiles, previews]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const resetFiles = useCallback(() => {
    setSelectedFiles([]);
    setPreviews([]);
    clearError();
  }, []);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // File input props for easy integration
  const fileInputProps = {
    ref: fileInputRef,
    type: 'file',
    accept: 'image/*',
    multiple: mode === 'batch',
    onChange: (e) => handleFileSelect(e.target.files),
    className: 'hidden'
  };

  // Drag and drop props
  const dragProps = {
    onDrop: handleDrop,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave
  };

  return {
    // State
    selectedFiles,
    previews,
    dragActive,
    error,
    
    // Actions
    handleFileSelect,
    removeFile,
    openFileDialog,
    resetFiles,
    clearError,
    
    // Utilities
    formatFileSize,
    validateFile,
    
    // Props for components
    fileInputProps,
    dragProps,
    fileInputRef,
    
    // Computed values
    hasFiles: selectedFiles.length > 0,
    fileCount: selectedFiles.length,
    totalSize: selectedFiles.reduce((total, file) => total + file.size, 0)
  };
};

export default useFileUpload;