import io
import os
import sys
import cv2
import numpy as np
import torch
import torch.nn as nn
import torchvision.models as models
from PIL import Image
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from self_attention_cv.transunet import TransUnet

# ------------------------------------------------------------------ CONFIG
class Config:
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    SEG_IMG_SIZE = 224
    ROI_IMG_SIZE = 224
    ROI_MARGIN_RATIO = 0.25
    DEFAULT_THRESHOLD = 0.30

    TRANSUNET_WEIGHTS = "transunetsegmentationmodel.pth"
    DENSENET_WEIGHTS = "densenetglaucomaclassificationmodel.pth"


# Normalization constants
MEAN_SEG = torch.tensor([0.485, 0.456, 0.406], device=Config.DEVICE).view(1, 3, 1, 1) * 255.0
STD_SEG = torch.tensor([0.229, 0.224, 0.225], device=Config.DEVICE).view(1, 3, 1, 1) * 255.0

MEAN_CLS = torch.tensor([0.485, 0.456, 0.406], device=Config.DEVICE).view(1, 3, 1, 1)
STD_CLS = torch.tensor([0.229, 0.224, 0.225], device=Config.DEVICE).view(1, 3, 1, 1)


# ------------------------------------------------------------------ MODEL DEFINITIONS
class GlaucomaDenseNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = models.densenet121(weights=None)
        num_ftrs = self.backbone.classifier.in_features
        self.backbone.classifier = nn.Identity()

        self.head = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(num_ftrs, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 1),
        )

    def forward(self, x):
        return self.head(self.backbone(x))


def calculate_vcdr(od_mask: np.ndarray, oc_mask: np.ndarray) -> float:
    """Calculates Vertical Cup-to-Disc Ratio (vCDR)."""
    od_indices = np.where(np.sum(od_mask > 0.5, axis=1) > 0)[0]
    oc_indices = np.where(np.sum(oc_mask > 0.5, axis=1) > 0)[0]

    if len(od_indices) == 0:
        return 0.0
    od_diam = float(od_indices[-1] - od_indices[0])
    oc_diam = float(oc_indices[-1] - oc_indices[0]) if len(oc_indices) > 0 else 0.0

    return round(oc_diam / od_diam, 4) if od_diam > 0 else 0.0


def process_fundus_pipeline(image_rgb: np.ndarray, transunet: nn.Module, densenet: nn.Module, threshold: float = Config.DEFAULT_THRESHOLD):
    h, w, _ = image_rgb.shape

    # 1. TransUNet Segmentation
    resized = cv2.resize(image_rgb, (Config.SEG_IMG_SIZE, Config.SEG_IMG_SIZE), interpolation=cv2.INTER_AREA)
    seg_tensor = torch.from_numpy(resized).permute(2, 0, 1).unsqueeze(0).to(Config.DEVICE).float()
    seg_tensor = (seg_tensor - MEAN_SEG) / STD_SEG

    with torch.inference_mode(), torch.autocast("cuda" if torch.cuda.is_available() else "cpu", dtype=torch.float16):
        seg_logits = transunet(seg_tensor)
        seg_probs = torch.sigmoid(seg_logits).squeeze(0).cpu().float().numpy()

    # Channel 0: Optic Disc (OD), Channel 1: Optic Cup (OC)
    od_mask = cv2.resize((seg_probs[0] > 0.5).astype(np.uint8), (w, h))
    oc_mask = cv2.resize((seg_probs[1] > 0.5).astype(np.uint8), (w, h)) if seg_probs.shape[0] > 1 else np.zeros((h, w), dtype=np.uint8)

    # Calculate Vertical Cup-to-Disc Ratio
    vcdr = calculate_vcdr(od_mask, oc_mask)

    # 2. Extract Optic Disc Region of Interest (ROI)
    contours, _ = cv2.findContours(od_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        x, y, cw, ch = cv2.boundingRect(max(contours, key=cv2.contourArea))
        px, py = int(cw * Config.ROI_MARGIN_RATIO), int(ch * Config.ROI_MARGIN_RATIO)
        cropped = image_rgb[max(0, y - py):min(h, y + ch + py), max(0, x - px):min(w, x + cw + px)]
    else:
        # Fallback to center-crop if no disc detected
        cs = min(h, w) // 2
        cropped = image_rgb[h // 2 - cs // 2 : h // 2 + cs // 2, w // 2 - cs // 2 : w // 2 + cs // 2]

    roi_img = cv2.resize(cropped, (Config.ROI_IMG_SIZE, Config.ROI_IMG_SIZE))

    # 3. DenseNet Glaucoma Classification
    roi_tensor = torch.from_numpy(roi_img).permute(2, 0, 1).unsqueeze(0).to(Config.DEVICE).float() / 255.0
    roi_tensor = (roi_tensor - MEAN_CLS) / STD_CLS

    with torch.inference_mode():
        cls_logits = densenet(roi_tensor)
        prob = torch.sigmoid(cls_logits).item()

    is_positive = bool(prob > threshold)
    prediction = "Glaucoma Positive" if is_positive else "Glaucoma Negative"

    return {
        "prediction": prediction,
        "probability": round(prob, 4),
        "vcdr": vcdr,
        "is_positive": is_positive,
        "threshold": threshold,
    }


# ------------------------------------------------------------------ APP SETUP & MODEL LOADING
app = FastAPI(title="Fundus AI Inference Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"[INFO] Using device: {Config.DEVICE}", file=sys.stderr)

try:
    # Load TransUNet
    transunet_model = TransUnet(
        in_channels=3,
        classes=2,
        img_dim=Config.SEG_IMG_SIZE,
        vit_blocks=8,
        vit_dim_linear_mhsa_block=512,
    ).to(Config.DEVICE)
    transunet_model.load_state_dict(torch.load(Config.TRANSUNET_WEIGHTS, map_location=Config.DEVICE))
    transunet_model.eval()

    # Load DenseNet
    densenet_model = GlaucomaDenseNet().to(Config.DEVICE)
    densenet_model.load_state_dict(torch.load(Config.DENSENET_WEIGHTS, map_location=Config.DEVICE))
    densenet_model.eval()

    print("[INFO] Both models loaded into memory successfully.", file=sys.stderr)
except Exception as e:
    print(f"[ERROR] Failed to load weights: {e}", file=sys.stderr)
    transunet_model = None
    densenet_model = None


# ------------------------------------------------------------------ ENDPOINTS
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "device": str(Config.DEVICE),
        "models_loaded": transunet_model is not None and densenet_model is not None,
    }


@app.post("/api/predict")
async def run_inference(image: UploadFile = File(...), threshold: float = Config.DEFAULT_THRESHOLD):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image.")

    if transunet_model is None or densenet_model is None:
        raise HTTPException(status_code=503, detail="Models are not loaded on server.")

    try:
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        raw_img = np.array(pil_image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image decoding failed: {str(e)}")

    try:
        results = process_fundus_pipeline(
            image_rgb=raw_img,
            transunet=transunet_model,
            densenet=densenet_model,
            threshold=threshold,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference pipeline error: {str(e)}")

    return {
        "status": "success",
        "filename": image.filename,
        "device_used": str(Config.DEVICE),
        **results,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)