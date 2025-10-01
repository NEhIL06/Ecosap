# app.py
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import numpy as np
from PIL import Image
import io
import math
from typing import Optional

app = FastAPI(title="Tree Crown Analyzer")

# Add CORS middleware to allow requests from your Express server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this based on your security needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained YOLO model (relative path)
MODEL_PATH = "F:\\New folder\\Yolo_model\\runs\\segment\\tree_crowns\\weights\\best.pt"

model = YOLO(MODEL_PATH)


@app.post("/area")
async def analyze_tree_image(
    file: UploadFile = File(...),
    gsd: Optional[float] = Form(0.45)  # Accept GSD from request, default 0.45
):
    """
    Analyze tree crown image and return area calculations.
    
    Args:
        file: Uploaded image file
        gsd: Ground Sampling Distance in meters per pixel (default: 0.45)
    
    Returns:
        JSON with tree analysis including area in square meters
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            return JSONResponse(
                {"error": "File must be an image"},
                status_code=400
            )
        
        # Load image from upload
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_np = np.array(image)

        # Run prediction
        results = model.predict(image_np, conf=0.25, imgsz=1024, verbose=False)[0]

        if results.masks is None:
            return JSONResponse(
                {
                    "success": False,
                    "message": "No trees detected",
                    "total_trees": 0,
                    "total_area_m2": 0.0,
                    "total_circumference_m": 0.0,
                    "gsd": gsd,
                    "trees": []
                },
                status_code=200
            )

        masks = results.masks.data.cpu().numpy()

        tree_data = []
        total_circumference = 0.0
        total_area = 0.0

        for i, mask in enumerate(masks):
            # Calculate area in pixels
            area_px = mask.sum()
            
            # Convert to square meters using provided GSD
            area_m2 = area_px * (gsd ** 2)

            # Calculate diameter and circumference
            diameter_m = 2 * math.sqrt(area_m2 / math.pi)
            circumference_m = math.pi * diameter_m

            total_circumference += circumference_m
            total_area += area_m2

            tree_data.append({
                "tree_id": i + 1,
                "area_m2": round(area_m2, 2),
                "area_px": int(area_px),
                "diameter_m": round(diameter_m, 2),
                "circumference_m": round(circumference_m, 2)
            })

        return {
            "success": True,
            "total_trees": len(tree_data),
            "total_area_m2": round(total_area, 2),
            "total_circumference_m": round(total_circumference, 2),
            "average_area_m2": round(total_area / len(tree_data), 2) if tree_data else 0.0,
            "gsd": gsd,
            "image_dimensions": {
                "width": image.width,
                "height": image.height
            },
            "trees": tree_data
        }

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error processing image: {error_details}")
        
        return JSONResponse(
            {
                "success": False,
                "error": str(e),
                "details": "Internal processing error occurred"
            },
            status_code=500
        )


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Tree Crown Analyzer",
        "model": MODEL_PATH,
        "endpoints": {
            "/area": "POST - Analyze tree crown images"
        }
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Check if model is loaded
        model_loaded = model is not None
        return {
            "status": "healthy",
            "model_loaded": model_loaded,
            "model_path": MODEL_PATH
        }
    except Exception as e:
        return JSONResponse(
            {
                "status": "unhealthy",
                "error": str(e)
            },
            status_code=503
        )


# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5000,
        log_level="info"
    )