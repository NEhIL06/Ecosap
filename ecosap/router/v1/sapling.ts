import { Router } from 'express';
import { auth } from '../../middleware/auth';
import axios from 'axios';
import FormData from 'form-data';
import users from '../../models/users'; // Adjust the path as needed

export const saplingRoute = Router();

saplingRoute.post("/credits", auth, async (req, res) => {
    try {
        const userId = req.body.user._id || req.body.user.id; // Get user ID from auth middleware
        const { image, gsd } = req.body; // Expecting image (base64 or file) and gsd in request body
        
        // Validate required fields
        if (!image || !gsd) {
            return res.status(400).json({ 
                error: "Image and GSD information are required" 
            });
        }

        // Prepare FormData to send to the area calculation endpoint
        const formData = new FormData();
        
        // If image is a file from multer, use it directly
        // If it's base64, you may need to convert it to a buffer
        if (req.body) {
            formData.append('image', req.body.buffer, req.body.originalname);
        } else if (typeof image === 'string') {
            // Assuming base64 string
            const buffer = Buffer.from(image, 'base64');
            formData.append('image', buffer, 'image.jpg');
        } else {
            formData.append('image', image);
        }
        
        formData.append('gsd', gsd.toString());

        // Send request to localhost:5000/area
        const areaResponse = await axios.post('http://localhost:5000/area', formData, {
            headers: formData.getHeaders(),
            timeout: 30000 // 30 second timeout
        });

        const calculatedArea = areaResponse.data.area; // Adjust based on actual response structure

        if (!calculatedArea || calculatedArea <= 0) {
            return res.status(400).json({ 
                error: "Invalid area calculation received" 
            });
        }

        // Calculate credits based on area
        // Formula: More growth (area) = More credits
        // You can adjust this formula based on your requirements
        const creditsToAdd = calculateCredits(calculatedArea);

        // Update user's ecocredits in database
        const updatedUser = await users.findByIdAndUpdate(
            userId,
            { 
                $inc: { ecocredits: creditsToAdd } // Increment credits
            },
            { new: true, select: 'ecocredits username email' } // Return updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ 
                error: "User not found" 
            });
        }

        // Return success response
        res.status(200).json({
            success: true,
            area: calculatedArea,
            creditsAdded: creditsToAdd,
            totalCredits: updatedUser.ecocredits,
            message: `Successfully added ${creditsToAdd} credits based on area ${calculatedArea}`
        });

    } catch (error: any) {
        console.error("Error in credits route:", error);
        
        // Handle specific error types
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ 
                error: "Area calculation service is unavailable" 
            });
        }
        
        if (axios.isAxiosError(error)) {
            return res.status(500).json({ 
                error: "Failed to calculate area",
                details: error.message 
            });
        }

        res.status(500).json({ 
            error: "Internal server error",
            details: error.message 
        });
    }
});


// function calculateCredits(area: number): number {
//     // Example formulas (choose one or create your own):
    
//     // Option 1: Linear calculation (1 credit per square meter)
//     const credits = Math.floor(area * 1);
    
//     // Option 2: Tiered calculation
//     // if (area < 10) return Math.floor(area * 1);
//     // if (area < 50) return Math.floor(area * 1.5);
//     // if (area < 100) return Math.floor(area * 2);
//     // return Math.floor(area * 2.5);
    
//     // Option 3: Logarithmic (rewards larger areas but with diminishing returns)
//     // const credits = Math.floor(area * Math.log10(area + 1) * 10);
    
//     return credits > 0 ? credits : 1; // Ensure at least 1 credit
// }

// Credit calculation function with multiple factors
function calculateCredits(area: number, gsd?: number, additionalFactors?: {
    vegetationDensity?: number; // 0-1 scale
    previousArea?: number; // For growth comparison
    treeSpecies?: string; // Different species have different carbon absorption
    locationMultiplier?: number; // Regional importance
}): number {
    
    // Base credits from area (square meters)
    let baseCredits = 0;
    
    // Tiered calculation with diminishing returns for very large areas
    // This prevents gaming the system with satellite imagery of forests
    if (area <= 10) {
        baseCredits = area * 10; // High reward for small saplings (10 credits/m²)
    } else if (area <= 50) {
        baseCredits = 100 + ((area - 10) * 8); // 8 credits/m²
    } else if (area <= 100) {
        baseCredits = 420 + ((area - 50) * 6); // 6 credits/m²
    } else if (area <= 500) {
        baseCredits = 720 + ((area - 100) * 4); // 4 credits/m²
    } else if (area <= 1000) {
        baseCredits = 2320 + ((area - 500) * 2); // 2 credits/m²
    } else {
        // Very large areas get logarithmic scaling to prevent abuse
        baseCredits = 3320 + (Math.log10(area - 999) * 500);
    }
    
    // GSD (Ground Sample Distance) Quality Factor
    // Lower GSD = higher resolution = more accurate = higher multiplier
    let gsdMultiplier = 1.0;
    if (gsd) {
        if (gsd <= 0.5) {
            gsdMultiplier = 1.5; // Excellent quality (< 50cm/pixel)
        } else if (gsd <= 1.0) {
            gsdMultiplier = 1.3; // Very good quality (50cm-1m/pixel)
        } else if (gsd <= 2.0) {
            gsdMultiplier = 1.15; // Good quality (1-2m/pixel)
        } else if (gsd <= 5.0) {
            gsdMultiplier = 1.0; // Acceptable quality (2-5m/pixel)
        } else {
            gsdMultiplier = 0.8; // Lower quality reduces credits
        }
    }
    
    // Apply GSD multiplier
    let adjustedCredits = baseCredits * gsdMultiplier;
    
    // Vegetation Density Bonus (if available)
    // Denser vegetation = more carbon sequestration
    if (additionalFactors?.vegetationDensity) {
        const densityBonus = additionalFactors.vegetationDensity * 0.5; // Up to 50% bonus
        adjustedCredits *= (1 + densityBonus);
    }
    
    // Growth Bonus - reward continued growth
    if (additionalFactors?.previousArea && additionalFactors.previousArea > 0) {
        const growthRate = (area - additionalFactors.previousArea) / additionalFactors.previousArea;
        
        if (growthRate > 0) {
            // Positive growth gets bonus (up to 100% bonus for doubling)
            const growthBonus = Math.min(growthRate, 1.0) * 0.3; // Max 30% bonus
            adjustedCredits *= (1 + growthBonus);
        } else if (growthRate < -0.2) {
            // Significant shrinkage (>20%) gets penalty
            adjustedCredits *= 0.7;
        }
    }
    
    // Tree Species Multiplier (carbon sequestration rates)
    const speciesMultipliers: { [key: string]: number } = {
        'oak': 1.3,           // High carbon absorption
        'pine': 1.25,
        'eucalyptus': 1.4,    // Very high growth and absorption
        'mangrove': 1.5,      // Exceptional carbon storage
        'bamboo': 1.35,       // Fast growing
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
    
    // Location-based multiplier (regional importance)
    // e.g., deforestation hotspots, urban areas, water catchment zones
    if (additionalFactors?.locationMultiplier) {
        adjustedCredits *= additionalFactors.locationMultiplier;
    }
    
    // Final rounding and minimum credit
    const finalCredits = Math.floor(adjustedCredits);
    
    return Math.max(finalCredits, 1); // Minimum 1 credit
}
