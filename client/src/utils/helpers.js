export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  export const validateFile = (file) => {
    if (!file) return 'No file selected';
    if (file.size > MAX_FILE_SIZE) return 'File size must be less than 10MB';
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'File type not supported. Please use JPEG, PNG, GIF, BMP, TIFF, or WebP';
    }
    return null;
  };
  
  export const createFilePreview = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ file, preview: e.target.result });
      reader.onerror = () => resolve({ file, preview: null });
      reader.readAsDataURL(file);
    });
  };