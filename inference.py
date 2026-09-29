# ==============================================================================
# LOCAL INFERENCE SCRIPT: TRANSUNET + DENSENET PIPELINE (JSON OUTPUT)
# ==============================================================================
import os
import cv2
import json
import torch
import torch.nn as nn
import numpy as np
import torchvision.models as models
from pathlib import Path
from self_attention_cv.transunet import TransUnet

# ------------------------------------------------------------------ CONFIG
class Config:
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    SEG_IMG_SIZE = 224
    ROI_IMG_SIZE = 224
    ROI_MARGIN_RATIO = 0.25
    
    TRANSUNET_WEIGHTS = "transunetsegmentationmodel.pth"
    DENSENET_WEIGHTS = "densenetglaucomaclassificationmodel.pth"

# Normalization constants matching training
MEAN = torch.tensor([0.485, 0.456, 0.406], device=Config.DEVICE).view(1, 3, 1, 1) * 255
STD = torch.tensor([0.229, 0.224, 0.225], device=Config.DEVICE).view(1, 3, 1, 1) * 255

# ------------------------------------------------------------------ MODEL DEFINITIONS
class GlaucomaDenseNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = models.densenet121(weights=None) # Local load from saved weights
        num_ftrs = self.backbone.classifier.in_features
        self.backbone.classifier = nn.Identity()
        
        self.head = nn.Sequential(
            nn.Dropout(0.3), 
            nn.Linear(num_ftrs, 128), 
            nn.BatchNorm1d(128), 
            nn.ReLU(),
            nn.Dropout(0.3), 
            nn.Linear(128, 1)
        )

    def forward(self, x):
        return self.head(self.backbone(x))

def calculate_vcdr(od_mask, oc_mask):
    od_indices = np.where(np.sum(od_mask > 0.5, axis=1) > 0)[0]
    oc_indices = np.where(np.sum(oc_mask > 0.5, axis=1) > 0)[0]
    if len(od_indices) == 0: return 0.0
    od_diam = float(od_indices[-1] - od_indices[0])
    oc_diam = float(oc_indices[-1] - oc_indices[0]) if len(oc_indices) > 0 else 0.0
    return round(oc_diam / od_diam, 4) if od_diam > 0 else 0.0

def extract_roi(image_rgb, model, margin=0.25):
    h, w, _ = image_rgb.shape
    resized = cv2.resize(image_rgb, (Config.SEG_IMG_SIZE, Config.SEG_IMG_SIZE), interpolation=cv2.INTER_AREA)
    tensor = torch.from_numpy(resized).permute(2, 0, 1).unsqueeze(0).to(Config.DEVICE).float()
    tensor = (tensor - MEAN) / STD
    
    model.eval()
    with torch.no_grad(), torch.autocast("cuda" if torch.cuda.is_available() else "cpu", dtype=torch.float16):
        logits = model(tensor)
        probs = torch.sigmoid(logits).squeeze(0).cpu().float().numpy()
        
    mask = cv2.resize((probs[0] > 0.5).astype(np.uint8), (w, h))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if contours:
        x, y, cw, ch = cv2.boundingRect(max(contours, key=cv2.contourArea))
        px, py = int(cw * margin), int(ch * margin)
        cropped = image_rgb[max(0, y-py):min(h, y+ch+py), max(0, x-px):min(w, x+cw+px)]
    else:
        cs = min(h, w) // 2
        cropped = image_rgb[h//2-cs//2:h//2+cs//2, w//2-cs//2:w//2+cs//2]
        
    return cv2.resize(cropped, (Config.ROI_IMG_SIZE, Config.ROI_IMG_SIZE))

# ------------------------------------------------------------------ LOAD MODELS
# Using standard error for logs to avoid polluting standard output if parsing JSON
import sys
print("[INFO] Loading models locally...", file=sys.stderr)

# 1. Load TransUNet
transunet_model = TransUnet(
    in_channels=3, classes=2, img_dim=Config.SEG_IMG_SIZE,
    vit_blocks=8, vit_dim_linear_mhsa_block=512
).to(Config.DEVICE)
transunet_model.load_state_dict(torch.load(Config.TRANSUNET_WEIGHTS, map_location=Config.DEVICE))
transunet_model.eval()

# 2. Load DenseNet
densenet_model = GlaucomaDenseNet().to(Config.DEVICE)
densenet_model.load_state_dict(torch.load(Config.DENSENET_WEIGHTS, map_location=Config.DEVICE))
densenet_model.eval()

print("[INFO] Models loaded successfully!", file=sys.stderr)

# ------------------------------------------------------------------ INFERENCE FUNCTION
def run_local_inference(image_path, threshold=0.30):
    
    # Load image
    raw_img = cv2.imread(image_path)
    if raw_img is None:
        error_response = {
            "status": "error",
            "message": "Could not read image path",
            "image_path": image_path
        }
        print(json.dumps(error_response, indent=4))
        return error_response
        
    raw_img = cv2.cvtColor(raw_img, cv2.COLOR_BGR2RGB)
    
    # Step 1: TransUNet ROI Zoom
    roi_img = extract_roi(raw_img, transunet_model, margin=Config.ROI_MARGIN_RATIO)
    
    # Step 2: Normalize and format for DenseNet (ImageNet standard matching training)
    roi_tensor = torch.from_numpy(roi_img).permute(2, 0, 1).unsqueeze(0).to(Config.DEVICE).float() / 255.0
    # Manual ImageNet normalization
    mean_cls = torch.tensor([0.485, 0.456, 0.406], device=Config.DEVICE).view(1, 3, 1, 1)
    std_cls = torch.tensor([0.229, 0.224, 0.225], device=Config.DEVICE).view(1, 3, 1, 1)
    roi_tensor = (roi_tensor - mean_cls) / std_cls
    
    # Step 3: DenseNet Classification
    with torch.no_grad():
        logits = densenet_model(roi_tensor)
        prob = torch.sigmoid(logits).item()
        
    prediction = "Glaucoma Positive" if prob > threshold else "Glaucoma Negative"
    
    # Construct JSON payload
    result_payload = {
        "status": "success",
        "image_path": image_path,
        "prediction": prediction,
        "probability": round(prob, 4),
        "threshold": threshold,
        "is_positive": bool(prob > threshold)
    }
    
    # Output as JSON
    json_output = json.dumps(result_payload, indent=4)
    print(json_output)
    
    return result_payload

# Example usage:
if __name__ == "__main__":
    run_local_inference("/home/ghost/neai/test_eye2.png")