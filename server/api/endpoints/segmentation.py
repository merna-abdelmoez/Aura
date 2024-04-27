from fastapi import APIRouter, HTTPException

from api.schemas.segmentation_model import SegmentationModel
from api.services.segmentation_service import Segmentation
from api.utils import convert_image, get_image, read_image

router = APIRouter()

segmentation_methods = ["kmeans", "meanShift", "regionGrowing", "agglemerative"]


@router.post("/segmentation/{image_id}")
async def apply_segmentation(image_id: str, segmentation: SegmentationModel):
    """
    Apply segmentation to the image.
    """
    if segmentation.type not in segmentation_methods:
        raise HTTPException(
            status_code=400, detail="Segmentation method doesn't exist."
        )

    image_path = get_image(image_id)
    segmented_image = None

    if segmentation.type == "kmeans":
        segmented_image = Segmentation.kmeans_segmentation(
            image_path=image_path,
            K=segmentation.k,
            max_iterations=segmentation.maxIterations,
        )
    elif segmentation.type == "meanShift":
        segmented_image = Segmentation.mean_shift_segmentation(
            image_path=image_path,
            window_size=segmentation.windowSize,
            threshold=segmentation.threshold / 100,
        )
    elif segmentation.type == "regionGrowing" :
        segmented_image = Segmentation.region_growing_segmentaion(
            image_path=image_path,
            threshold=segmentation.threshold,
            seed_points=segmentation.seed_points,
            
        )

    segmented_image = convert_image(segmented_image)

    return {
        "success": True,
        "message": "Segmentation applied successfully.",
        "image": segmented_image,
    }
