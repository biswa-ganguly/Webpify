import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:3000', 
        'http://127.0.0.1:5173',
        'https://webpify-gamma.vercel.app',  // Add your Vercel domain
        'https://webpify.vercel.app',        // In case you change the subdomain
        // Add any other domains you might deploy to
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'converted');
const batchDir = path.join(__dirname, 'batch');

[uploadsDir, outputDir, batchDir].forEach(dir => {
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
        fileSize: 10 * 1024 * 1024 // 10MB limit per file
    }
});

// Enhanced cleanup function with better error handling and logging
const cleanupOldFiles = (directory, maxAge = 1800000) => { // 30 minutes default
    fs.readdir(directory, (err, files) => {
        if (err) {
            console.error(`Error reading directory ${directory}:`, err);
            return;
        }
        
        if (files.length === 0) return;
        
        let cleanedCount = 0;
        files.forEach(file => {
            const filePath = path.join(directory, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`Error getting stats for ${file}:`, err);
                    return;
                }
                
                const now = new Date().getTime();
                const fileTime = new Date(stats.mtime).getTime();
                
                if (now - fileTime > maxAge) {
                    fs.unlink(filePath, (err) => {
                        if (!err) {
                            cleanedCount++;
                            console.log(`🧹 Cleaned up old file: ${file} (age: ${Math.round((now - fileTime) / 1000 / 60)} minutes)`);
                        } else {
                            console.error(`Error cleaning up ${file}:`, err);
                        }
                    });
                }
            });
        });
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleanup completed: ${cleanedCount} files removed from ${path.basename(directory)}`);
        }
    });
};

// Immediate cleanup function for specific file
const cleanupFile = (filePath, delay = 0) => {
    setTimeout(() => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (!err) {
                    console.log(`🗑️ File cleaned up: ${path.basename(filePath)}`);
                } else {
                    console.error(`Error cleaning up file ${path.basename(filePath)}:`, err);
                }
            });
        }
    }, delay);
};

// Get directory size for monitoring
const getDirectorySize = (dirPath) => {
    let totalSize = 0;
    try {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
        });
    } catch (err) {
        console.error(`Error calculating directory size for ${dirPath}:`, err);
    }
    return totalSize;
};

// Format bytes to human readable
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Enhanced cleanup with monitoring - runs every 15 minutes
setInterval(() => {
    console.log('🧹 Starting scheduled cleanup...');
    
    // Get directory sizes before cleanup
    const uploadsSizeBefore = getDirectorySize(uploadsDir);
    const outputSizeBefore = getDirectorySize(outputDir);
    const batchSizeBefore = getDirectorySize(batchDir);
    
    cleanupOldFiles(uploadsDir, 1800000); // 30 minutes for uploads
    cleanupOldFiles(outputDir, 3600000);  // 1 hour for converted files
    cleanupOldFiles(batchDir, 3600000);   // 1 hour for batch files
    
    // Log storage usage
    setTimeout(() => {
        const uploadsSizeAfter = getDirectorySize(uploadsDir);
        const outputSizeAfter = getDirectorySize(outputDir);
        const batchSizeAfter = getDirectorySize(batchDir);
        
        console.log('📊 Storage Usage:');
        console.log(`   Uploads: ${formatBytes(uploadsSizeAfter)} (freed: ${formatBytes(uploadsSizeBefore - uploadsSizeAfter)})`);
        console.log(`   Converted: ${formatBytes(outputSizeAfter)} (freed: ${formatBytes(outputSizeBefore - outputSizeAfter)})`);
        console.log(`   Batch: ${formatBytes(batchSizeAfter)} (freed: ${formatBytes(batchSizeBefore - batchSizeAfter)})`);
        console.log(`   Total: ${formatBytes(uploadsSizeAfter + outputSizeAfter + batchSizeAfter)}`);
    }, 2000);
    
}, 15 * 60 * 1000); // Every 15 minutes

// Routes
app.get('/', (req, res) => {
    const uploadsSize = getDirectorySize(uploadsDir);
    const outputSize = getDirectorySize(outputDir);
    const batchSize = getDirectorySize(batchDir);
    
    res.json({ 
        message: 'Image to WebP Converter API',
        version: '2.0.0',
        storage: {
            uploads: formatBytes(uploadsSize),
            converted: formatBytes(outputSize),
            batch: formatBytes(batchSize),
            total: formatBytes(uploadsSize + outputSize + batchSize)
        },
        endpoints: {
            convert: 'POST /api/convert',
            batch_convert: 'POST /api/batch-convert',
            download: 'GET /api/download/:filename',
            download_batch: 'GET /api/download-batch/:filename',
            health: 'GET /api/health',
            storage: 'GET /api/storage'
        }
    });
});

// Convert single image to WebP
app.post('/api/convert', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'No file uploaded' 
            });
        }

        console.log(`🔄 Processing file: ${req.file.originalname} (${formatBytes(req.file.size)})`);

        const inputPath = req.file.path;
        const timestamp = Date.now();
        const outputFilename = `converted-${timestamp}.webp`;
        const outputPath = path.join(outputDir, outputFilename);

        // Parse conversion options
        const quality = Math.max(10, Math.min(100, parseInt(req.body.quality) || 80));
        const width = req.body.width ? parseInt(req.body.width) : null;
        const height = req.body.height ? parseInt(req.body.height) : null;

        console.log(`⚙️ Conversion settings - Quality: ${quality}%, Width: ${width || 'auto'}, Height: ${height || 'auto'}`);

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

        // Clean up input file immediately after successful conversion
        cleanupFile(inputPath, 0);

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

        console.log(`✅ Conversion completed: ${req.file.originalname} -> ${outputFilename} (${formatBytes(outputStats.size)}, ${compressionRatio.toFixed(1)}% reduction)`);
        res.json(result);

    } catch (error) {
        console.error('❌ Conversion error:', error);
        
        // Clean up files on error
        if (req.file && fs.existsSync(req.file.path)) {
            cleanupFile(req.file.path, 0);
        }

        res.status(500).json({ 
            success: false,
            error: 'Failed to convert image',
            details: error.message
        });
    }
});

// Batch convert multiple images to WebP and create zip
app.post('/api/batch-convert', upload.array('images', 20), async (req, res) => {
    let processedFiles = [];
    
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No files uploaded' 
            });
        }

        console.log(`🔄 Processing batch of ${req.files.length} files`);

        // Parse conversion options
        const quality = Math.max(10, Math.min(100, parseInt(req.body.quality) || 80));
        const width = req.body.width ? parseInt(req.body.width) : null;
        const height = req.body.height ? parseInt(req.body.height) : null;

        const timestamp = Date.now();
        const batchId = `batch-${timestamp}`;
        const batchOutputDir = path.join(batchDir, batchId);
        
        // Create batch directory
        fs.mkdirSync(batchOutputDir, { recursive: true });

        let totalOriginalSize = 0;
        let totalConvertedSize = 0;
        const results = [];

        // Process each file
        for (const file of req.files) {
            try {
                console.log(`⚙️ Converting: ${file.originalname}`);
                
                const inputPath = file.path;
                const outputFilename = `${path.parse(file.originalname).name}.webp`;
                const outputPath = path.join(batchOutputDir, outputFilename);

                // Get input file info
                const inputStats = fs.statSync(inputPath);
                totalOriginalSize += inputStats.size;

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
                        effort: 4
                    })
                    .toFile(outputPath);

                // Get output file stats
                const outputStats = fs.statSync(outputPath);
                totalConvertedSize += outputStats.size;

                // Calculate compression ratio for this file
                const compressionRatio = ((inputStats.size - outputStats.size) / inputStats.size * 100);

                results.push({
                    originalFilename: file.originalname,
                    convertedFilename: outputFilename,
                    originalSize: inputStats.size,
                    convertedSize: outputStats.size,
                    compressionRatio: Math.round(compressionRatio * 100) / 100,
                    originalDimensions: {
                        width: metadata.width,
                        height: metadata.height
                    }
                });

                processedFiles.push(file.path);
                
                console.log(`✅ Converted: ${file.originalname} -> ${outputFilename} (${formatBytes(outputStats.size)})`);

            } catch (error) {
                console.error(`❌ Error converting ${file.originalname}:`, error);
                results.push({
                    originalFilename: file.originalname,
                    error: error.message
                });
            }
        }

        // Create ZIP file
        const zipFilename = `converted-images-${timestamp}.zip`;
        const zipPath = path.join(batchDir, zipFilename);
        
        console.log(`📦 Creating ZIP file: ${zipFilename}`);
        
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Best compression
        });

        // Handle archive events
        output.on('close', () => {
            console.log(`✅ ZIP created: ${zipFilename} (${formatBytes(archive.pointer())} bytes)`);
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);

        // Add converted files to ZIP
        const convertedFiles = fs.readdirSync(batchOutputDir);
        for (const filename of convertedFiles) {
            const filePath = path.join(batchOutputDir, filename);
            archive.file(filePath, { name: filename });
        }

        await archive.finalize();

        // Clean up input files and batch directory
        processedFiles.forEach(filePath => {
            cleanupFile(filePath, 0);
        });
        
        // Clean up batch directory after some delay
        setTimeout(() => {
            fs.rmSync(batchOutputDir, { recursive: true, force: true });
        }, 5000);

        // Calculate overall compression ratio
        const overallCompressionRatio = totalOriginalSize > 0 
            ? ((totalOriginalSize - totalConvertedSize) / totalOriginalSize * 100)
            : 0;

        const zipStats = fs.statSync(zipPath);

        const response = {
            success: true,
            message: `Successfully converted ${results.filter(r => !r.error).length} out of ${req.files.length} images`,
            data: {
                batchId: batchId,
                totalFiles: req.files.length,
                successfulConversions: results.filter(r => !r.error).length,
                failedConversions: results.filter(r => r.error).length,
                totalOriginalSize: totalOriginalSize,
                totalConvertedSize: totalConvertedSize,
                overallCompressionRatio: Math.round(overallCompressionRatio * 100) / 100,
                zipFilename: zipFilename,
                zipSize: zipStats.size,
                downloadUrl: `/api/download-batch/${zipFilename}`,
                quality: quality,
                results: results,
                timestamp: new Date().toISOString()
            }
        };

        console.log(`✅ Batch conversion completed: ${results.filter(r => !r.error).length}/${req.files.length} files converted`);
        res.json(response);

    } catch (error) {
        console.error('❌ Batch conversion error:', error);
        
        // Clean up input files on error
        processedFiles.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                cleanupFile(filePath, 0);
            }
        });

        res.status(500).json({ 
            success: false,
            error: 'Failed to convert images',
            details: error.message
        });
    }
});

// Download single converted image
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

    console.log(`⬇️ Downloading file: ${filename}`);

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send file
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('❌ Download error:', err);
            if (!res.headersSent) {
                res.status(500).json({ 
                    success: false,
                    error: 'Failed to download file' 
                });
            }
        } else {
            console.log(`✅ File downloaded successfully: ${filename}`);
            
            // Clean up file after successful download
            cleanupFile(filePath, 30000); // Delete after 30 seconds
        }
    });
});

// Download batch ZIP file
app.get('/api/download-batch/:filename', (req, res) => {
    const filename = req.params.filename;
    
    // Validate filename to prevent directory traversal
    if (!/^[a-zA-Z0-9-_.]+$/.test(filename) || !filename.endsWith('.zip')) {
        return res.status(400).json({ 
            success: false,
            error: 'Invalid filename' 
        });
    }

    const filePath = path.join(batchDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
            success: false,
            error: 'File not found' 
        });
    }

    console.log(`⬇️ Downloading batch file: ${filename}`);

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send file
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('❌ Batch download error:', err);
            if (!res.headersSent) {
                res.status(500).json({ 
                    success: false,
                    error: 'Failed to download batch file' 
                });
            }
        } else {
            console.log(`✅ Batch file downloaded successfully: ${filename}`);
            
            // Clean up file after successful download
            cleanupFile(filePath, 60000); // Delete after 1 minute for larger files
        }
    });
});

// Storage monitoring endpoint
app.get('/api/storage', (req, res) => {
    try {
        const uploadsFiles = fs.readdirSync(uploadsDir);
        const outputFiles = fs.readdirSync(outputDir);
        const batchFiles = fs.readdirSync(batchDir);
        const uploadsSize = getDirectorySize(uploadsDir);
        const outputSize = getDirectorySize(outputDir);
        const batchSize = getDirectorySize(batchDir);
        
        res.json({
            success: true,
            storage: {
                uploads: {
                    count: uploadsFiles.length,
                    size: formatBytes(uploadsSize),
                    sizeBytes: uploadsSize
                },
                converted: {
                    count: outputFiles.length,
                    size: formatBytes(outputSize),
                    sizeBytes: outputSize
                },
                batch: {
                    count: batchFiles.length,
                    size: formatBytes(batchSize),
                    sizeBytes: batchSize
                },
                total: {
                    count: uploadsFiles.length + outputFiles.length + batchFiles.length,
                    size: formatBytes(uploadsSize + outputSize + batchSize),
                    sizeBytes: uploadsSize + outputSize + batchSize
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get storage information'
        });
    }
});

app.get('/api/health', (req, res) => {
    const uploadsSize = getDirectorySize(uploadsDir);
    const outputSize = getDirectorySize(outputDir);
    const batchSize = getDirectorySize(batchDir);
    
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        storage: {
            uploads: formatBytes(uploadsSize),
            converted: formatBytes(outputSize),
            batch: formatBytes(batchSize),
            total: formatBytes(uploadsSize + outputSize + batchSize)
        }
    });
});

// Manual cleanup endpoint
app.post('/api/cleanup', (req, res) => {
    console.log('🧹 Manual cleanup initiated...');
    
    const uploadsSizeBefore = getDirectorySize(uploadsDir);
    const outputSizeBefore = getDirectorySize(outputDir);
    const batchSizeBefore = getDirectorySize(batchDir);
    
    // Force cleanup of all files older than 5 minutes
    cleanupOldFiles(uploadsDir, 300000); // 5 minutes
    cleanupOldFiles(outputDir, 300000);  // 5 minutes
    cleanupOldFiles(batchDir, 300000);   // 5 minutes
    
    setTimeout(() => {
        const uploadsSizeAfter = getDirectorySize(uploadsDir);
        const outputSizeAfter = getDirectorySize(outputDir);
        const batchSizeAfter = getDirectorySize(batchDir);
        
        res.json({
            success: true,
            message: 'Manual cleanup completed',
            cleaned: {
                uploads: formatBytes(uploadsSizeBefore - uploadsSizeAfter),
                converted: formatBytes(outputSizeBefore - outputSizeAfter),
                batch: formatBytes(batchSizeBefore - batchSizeAfter),
                total: formatBytes((uploadsSizeBefore + outputSizeBefore + batchSizeBefore) - (uploadsSizeAfter + outputSizeAfter + batchSizeAfter))
            },
            current: {
                uploads: formatBytes(uploadsSizeAfter),
                converted: formatBytes(outputSizeAfter),
                batch: formatBytes(batchSizeAfter),
                total: formatBytes(uploadsSizeAfter + outputSizeAfter + batchSizeAfter)
            }
        });
    }, 2000);
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Error middleware:', error);

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false,
                error: 'File too large. Maximum size is 10MB per file.' 
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                success: false,
                error: 'Too many files or unexpected file field.' 
            });
        }
    }

    res.status(500).json({ 
        success: false,
        error: error.message || 'Internal server error'
    });
});

// Handle 404s
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Endpoint not found' 
    });
});

// Enhanced graceful shutdown with cleanup
const gracefulShutdown = () => {
    console.log('🛑 Graceful shutdown initiated...');
    console.log('🧹 Performing final cleanup...');
    
    // Clean up all temporary files on shutdown
    cleanupOldFiles(uploadsDir, 0);
    cleanupOldFiles(outputDir, 0);
    cleanupOldFiles(batchDir, 0);
    
    setTimeout(() => {
        console.log('👋 Server shut down gracefully');
        process.exit(0);
    }, 2000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Upload directory: ${uploadsDir}`);
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`📁 Batch directory: ${batchDir}`);
    console.log(`🌐 API available at: http://localhost:${PORT}`);
    console.log(`📊 Storage monitoring enabled`);
    console.log(`🧹 Auto-cleanup: Every 15 minutes`);
    console.log(`📦 Batch processing: Up to 20 files per batch`);
    
    // Initial cleanup on startup
    setTimeout(() => {
        console.log('🧹 Initial cleanup on startup...');
        cleanupOldFiles(uploadsDir, 1800000);
        cleanupOldFiles(outputDir, 3600000);
        cleanupOldFiles(batchDir, 3600000);
    }, 5000);
});