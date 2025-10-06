import { Router } from 'express';
import { auth } from '../../middleware/auth';
import axios from 'axios';
import FormData from 'form-data';
import users from '../../models/users';
import multer from 'multer';

export const saplingRoute = Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

saplingRoute.post("/credits", auth, upload.single('image'), async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const gsdValue = parseFloat(req.body.gsd);
        
        // Validate uploaded file
        if (!req.file) {
            return res.status(400).json({ error: "Image file is required" });
        }

        // Validate GSD
        if (isNaN(gsdValue) || !isFinite(gsdValue) || gsdValue <= 0) {
            return res.status(400).json({ error: "gsd must be a positive number" });
        }

        console.log('Processing image upload:', {
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            gsd: gsdValue
        });

        // Prepare FormData to send to the area calculation endpoint
        // IMPORTANT: FastAPI expects field name 'file', not 'image'
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname || 'image.jpg',
            contentType: req.file.mimetype
        });
        formData.append('gsd', gsdValue.toString());

        console.log('Sending request to Python service...');

        // Send request to python area service
        const areaServiceUrl = process.env.AREA_SERVICE_URL || 'http://127.0.0.1:5000/area';
        const areaResponse = await axios.post(areaServiceUrl, formData, {
            headers: {
                ...formData.getHeaders()
            },
            timeout: 30000, // 30 second timeout
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log('Response from Python service:', areaResponse.data);

        // Check if detection was successful
        if (!areaResponse.data.success) {
            return res.status(200).json({
                success: false,
                message: areaResponse.data.message || "No trees detected in the image",
                area: 0,
                creditsAdded: 0,
                totalCredits: req.user.ecocredits
            });
        }

        const calculatedArea = areaResponse.data.total_area_m2;

        if (!calculatedArea || calculatedArea <= 0) {
            return res.status(200).json({
                success: false,
                message: "No tree area detected in the image",
                area: 0,
                creditsAdded: 0,
                totalCredits: req.user.ecocredits
            });
        }

        // Calculate credits based on area and gsd
        const creditsToAdd = calculateCredits(calculatedArea, gsdValue);

        // Update user's ecocredits in database
        const updatedUser = await users.findByIdAndUpdate(
            userId,
            { 
                $inc: { ecocredits: creditsToAdd }
            },
            { new: true, select: 'ecocredits username email' }
        );

        if (!updatedUser) {
            return res.status(404).json({ 
                error: "User not found" 
            });
        }

        console.log('Credits updated successfully:', {
            userId,
            area: calculatedArea,
            creditsAdded: creditsToAdd,
            totalCredits: updatedUser.ecocredits
        });

        // Return success response with detailed tree data
        res.status(200).json({
            success: true,
            area: calculatedArea,
            creditsAdded: creditsToAdd,
            totalCredits: updatedUser.ecocredits,
            message: `Successfully added ${creditsToAdd} credits based on area ${calculatedArea.toFixed(2)} m²`,
            treeDetails: {
                totalTrees: areaResponse.data.total_trees,
                totalArea: areaResponse.data.total_area_m2,
                averageArea: areaResponse.data.average_area_m2,
                totalCircumference: areaResponse.data.total_circumference_m,
                gsdUsed: gsdValue,
                trees: areaResponse.data.trees
            }
        });

    } catch (error: any) {
        console.error("Error in credits route:", error);
        
        // Handle specific error types
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ 
                error: "Area calculation service is unavailable",
                details: "Please ensure the Python service is running on port 5000"
            });
        }
        
        if (error.code === 'ETIMEDOUT') {
            return res.status(504).json({ 
                error: "Request timeout",
                details: "The area calculation took too long"
            });
        }
        
        if (axios.isAxiosError(error)) {
            // Log the actual error response from Python service
            console.error('Python service error:', error.response?.data);
            
            return res.status(500).json({ 
                error: "Failed to calculate area",
                details: error.response?.data?.error || error.response?.data?.detail || error.message 
            });
        }

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    error: "File too large",
                    details: "Maximum file size is 10MB"
                });
            }
            return res.status(400).json({ 
                error: "File upload error",
                details: error.message 
            });
        }

        res.status(500).json({ 
            error: "Internal server error",
            details: error.message 
        });
    }
});


// Credit calculation function with multiple factors
function calculateCredits(area: number, gsd?: number, additionalFactors?: {
    vegetationDensity?: number;
    previousArea?: number;
    treeSpecies?: string;
    locationMultiplier?: number;
}): number {
    
    // Base credits from area (square meters)
    let baseCredits = 0;
    
    // Tiered calculation with diminishing returns
    if (area <= 10) {
        baseCredits = area * 10;
    } else if (area <= 50) {
        baseCredits = 100 + ((area - 10) * 8);
    } else if (area <= 100) {
        baseCredits = 420 + ((area - 50) * 6);
    } else if (area <= 500) {
        baseCredits = 720 + ((area - 100) * 4);
    } else if (area <= 1000) {
        baseCredits = 2320 + ((area - 500) * 2);
    } else {
        baseCredits = 3320 + (Math.log10(area - 999) * 500);
    }
    
    // GSD Quality Factor
    let gsdMultiplier = 1.0;
    if (gsd) {
        if (gsd <= 0.5) {
            gsdMultiplier = 1.5;
        } else if (gsd <= 1.0) {
            gsdMultiplier = 1.3;
        } else if (gsd <= 2.0) {
            gsdMultiplier = 1.15;
        } else if (gsd <= 5.0) {
            gsdMultiplier = 1.0;
        } else {
            gsdMultiplier = 0.8;
        }
    }
    
    let adjustedCredits = baseCredits * gsdMultiplier;
    
    // Vegetation Density Bonus
    if (additionalFactors?.vegetationDensity) {
        const densityBonus = additionalFactors.vegetationDensity * 0.5;
        adjustedCredits *= (1 + densityBonus);
    }
    
    // Growth Bonus
    if (additionalFactors?.previousArea && additionalFactors.previousArea > 0) {
        const growthRate = (area - additionalFactors.previousArea) / additionalFactors.previousArea;
        
        if (growthRate > 0) {
            const growthBonus = Math.min(growthRate, 1.0) * 0.3;
            adjustedCredits *= (1 + growthBonus);
        } else if (growthRate < -0.2) {
            adjustedCredits *= 0.7;
        }
    }
    
    // Tree Species Multiplier
    const speciesMultipliers: { [key: string]: number } = {
        'oak': 1.3,
        'pine': 1.25,
        'eucalyptus': 1.4,
        'mangrove': 1.5,
        'bamboo': 1.35,
        'teak': 1.2,
        'neem': 1.15,
        'fruit_tree': 1.1,
        'default': 1.0
    };
    
    if (additionalFactors?.treeSpecies) {
        const speciesKey = additionalFactors.treeSpecies.toLowerCase().replace(/\s+/g, '_');
        const speciesMultiplier = speciesMultipliers[speciesKey] || speciesMultipliers['default'];
        adjustedCredits *= speciesMultiplier;
    }
    
    // Location-based multiplier
    if (additionalFactors?.locationMultiplier) {
        adjustedCredits *= additionalFactors.locationMultiplier;
    }
    
    const finalCredits = Math.floor(adjustedCredits);
    
    return Math.max(finalCredits, 1);
}