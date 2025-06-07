import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'converted');

[uploadsDir, outputDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `upload-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 
        'image/jpg', 
        'image/png', 
        'image/gif', 
        'image/bmp', 
        'image/tiff',
        'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, BMP, TIFF, and WebP are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Utility function to clean up old files
const cleanupOldFiles = (directory, maxAge = 3600000) => { // 1 hour default
    fs.readdir(directory, (err, files) => {
        if (err) return;
        
        files.forEach(file => {
            const filePath = path.join(directory, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                
                const now = new Date().getTime();
                const fileTime = new Date(stats.mtime).getTime();
                
                if (now - fileTime > maxAge) {
                    fs.unlink(filePath, (err) => {
                        if (!err) console.log(`Cleaned up old file: ${file}`);
                    });
                }
            });
        });
    });
};

// Clean up old files every 30 minutes
setInterval(() => {
    cleanupOldFiles(uploadsDir);
    cleanupOldFiles(outputDir);
}, 30 * 60 * 1000);

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'Image to WebP Converter API',
        version: '1.0.0',
        endpoints: {
            convert: 'POST /api/convert',
            download: 'GET /api/download/:filename',
            health: 'GET /api/health'
        }
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Convert image to WebP
app.post('/api/convert', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'No file uploaded' 
            });
        }

        console.log(`Processing file: ${req.file.originalname}`);

        const inputPath = req.file.path;
        const timestamp = Date.now();
        const outputFilename = `converted-${timestamp}.webp`;
        const outputPath = path.join(outputDir, outputFilename);

        // Parse conversion options
        const quality = Math.max(10, Math.min(100, parseInt(req.body.quality) || 80));
        const width = req.body.width ? parseInt(req.body.width) : null;
        const height = req.body.height ? parseInt(req.body.height) : null;

        console.log(`Conversion settings - Quality: ${quality}%, Width: ${width || 'auto'}, Height: ${height || 'auto'}`);

        // Get input file info
        const inputStats = fs.statSync(inputPath);
        
        // Process image with Sharp
        let sharpInstance = sharp(inputPath);

        // Get original image metadata
        const metadata = await sharpInstance.metadata();

        // Apply resize if dimensions provided
        if (width || height) {
            sharpInstance = sharpInstance.resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // Convert to WebP
        await sharpInstance
            .webp({ 
                quality: quality,
                effort: 4 // Better compression
            })
            .toFile(outputPath);

        // Get output file stats
        const outputStats = fs.statSync(outputPath);
        
        // Calculate compression ratio
        const compressionRatio = ((inputStats.size - outputStats.size) / inputStats.size * 100);

        // Clean up input file
        fs.unlink(inputPath, (err) => {
            if (err) console.error('Error cleaning up input file:', err);
        });

        const result = {
            success: true,
            message: 'Image converted successfully',
            data: {
                originalFilename: req.file.originalname,
                originalSize: inputStats.size,
                originalDimensions: {
                    width: metadata.width,
                    height: metadata.height
                },
                convertedSize: outputStats.size,
                compressionRatio: Math.round(compressionRatio * 100) / 100,
                quality: quality,
                filename: outputFilename,
                downloadUrl: `/api/download/${outputFilename}`,
                timestamp: new Date().toISOString()
            }
        };

        console.log(`Conversion completed: ${req.file.originalname} -> ${outputFilename}`);
        res.json(result);

    } catch (error) {
        console.error('Conversion error:', error);
        
        // Clean up files on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, () => {});
        }

        res.status(500).json({ 
            success: false,
            error: 'Failed to convert image',
            details: error.message
        });
    }
});

// Download converted image
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    
    // Validate filename to prevent directory traversal
    if (!/^[a-zA-Z0-9-_.]+$/.test(filename) || !filename.endsWith('.webp')) {
        return res.status(400).json({ 
            success: false,
            error: 'Invalid filename' 
        });
    }

    const filePath = path.join(outputDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
            success: false,
            error: 'File not found' 
        });
    }

    console.log(`Downloading file: ${filename}`);

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send file
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Download error:', err);
            if (!res.headersSent) {
                res.status(500).json({ 
                    success: false,
                    error: 'Failed to download file' 
                });
            }
        } else {
            console.log(`File downloaded successfully: ${filename}`);
            
            // Schedule file cleanup after successful download
            setTimeout(() => {
                if (fs.existsSync(filePath)) {
                    fs.unlink(filePath, (err) => {
                        if (!err) console.log(`Cleaned up downloaded file: ${filename}`);
                    });
                }
            }, 60000); // Delete after 1 minute
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error middleware:', error);

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false,
                error: 'File too large. Maximum size is 10MB.' 
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                success: false,
                error: 'Unexpected file field.' 
            });
        }
    }

    res.status(500).json({ 
        success: false,
        error: error.message || 'Internal server error'
    });
});

// Handle 404s - FIXED: Use a function instead of '*' pattern
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Endpoint not found' 
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Upload directory: ${uploadsDir}`);
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`🌐 API available at: http://localhost:${PORT}`);
});