export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_BATCH_FILES = 20;
export const ALLOWED_TYPES = [
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/gif', 
  'image/bmp', 
  'image/tiff', 
  'image/webp'
];