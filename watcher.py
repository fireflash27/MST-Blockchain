# ==============================================================================
# REAL-TIME FOLDER WATCHER INFERENCE SCRIPT
# ==============================================================================
import os
import time
import cv2
import torch
import torch.nn as nn
import numpy as np
import torchvision.models as models
from pathlib import Path
from self_attention_cv.transunet import TransUnet
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# ------------------------------------------------------------------ CONFIG
class Config:
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    SEG_IMG_SIZE = 224
    ROI_IMG_SIZE = 224
    ROI_MARGIN_RATIO = 0.25
    THRESHOLD = 0.30
    
    TRANSUNET_WEIGHTS = "transunetsegmentationmodel.pth"
    DENSENET_WEIGHTS = "densenetglaucomaclassificationmodel.pth"
    
    # Ensure this points to your chosen input folder
    INCOMING_DIR = "/home/ghost/glaucoma-ai/glaucoma-server/uploads" 
    OUTPUT_DIR = "/home/ghost/glaucoma-ai/glaucoma-server/results"

os.makedirs(Config.INCOMING_DIR, exist_ok=True)
os.makedirs(Config.OUTPUT_DIR, exist_ok=True)

# Normalization constants matching training
MEAN = torch.tensor([0.485, 0.456, 0.406], device=Config.DEVICE).view(1, 3, 1, 1) * 255
STD = torch.tensor([0.229, 0.224, 0.225], device=Config.DEVICE).view(1, 3, 1, 1) * 255

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
            nn.Linear(128, 1)
        )

    def forward(self, x):
        return self.head(self.backbone(x))

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

# ------------------------------------------------------------------ LOAD MODELS ON STARTUP
print("[INFO] Loading models into memory...")
transunet_model = TransUnet(
    in_channels=3, classes=2, img_dim=Config.SEG_IMG_SIZE,
    vit_blocks=8, vit_dim_linear_mhsa_block=512
).to(Config.DEVICE)
transunet_model.load_state_dict(torch.load(Config.TRANSUNET_WEIGHTS, map_location=Config.DEVICE))
transunet_model.eval()

densenet_model = GlaucomaDenseNet().to(Config.DEVICE)
densenet_model.load_state_dict(torch.load(Config.DENSENET_WEIGHTS, map_location=Config.DEVICE))
densenet_model.eval()
print("[INFO] Models loaded successfully. Starting folder watcher...")

# ------------------------------------------------------------------ INFERENCE PIPELINE
def process_image(image_path):
    print(f"\n[EVENT] New image detected: {image_path}")
    
    raw_img = cv2.imread(image_path)
    if raw_img is None:
        print("[ERROR] Failed to read image file. It may still be copying.")
        return
    raw_img_rgb = cv2.cvtColor(raw_img, cv2.COLOR_BGR2RGB)
    
    # 1. Extract ROI using TransUNet
    roi_img = extract_roi(raw_img_rgb, transunet_model, margin=Config.ROI_MARGIN_RATIO)
    
    # 2. Format for DenseNet
    roi_tensor = torch.from_numpy(roi_img).permute(2, 0, 1).unsqueeze(0).to(Config.DEVICE).float() / 255.0
    mean_cls = torch.tensor([0.485, 0.456, 0.406], device=Config.DEVICE).view(1, 3, 1, 1)
    std_cls = torch.tensor([0.229, 0.224, 0.225], device=Config.DEVICE).view(1, 3, 1, 1)
    roi_tensor = (roi_tensor - mean_cls) / std_cls
    
    # 3. Predict with DenseNet
    with torch.no_grad():
        logits = densenet_model(roi_tensor)
        prob = torch.sigmoid(logits).item()
        
    prediction = "Glaucoma Positive" if prob > Config.THRESHOLD else "Glaucoma Negative"
    
    # 4. Save Independent Outputs
    file_stem = Path(image_path).stem
    
    # Save text report
    report_path = os.path.join(Config.OUTPUT_DIR, f"{file_stem}_report.txt")
    with open(report_path, "w") as f:
        f.write(f"Image File: {Path(image_path).name}\n")
        f.write(f"Prediction: {prediction}\n")
        f.write(f"Probability: {prob:.4f}\n")
        f.write(f"Threshold Used: {Config.THRESHOLD}\n")
        
    # Save cropped ROI visual confirmation
    roi_save_path = os.path.join(Config.OUTPUT_DIR, f"{file_stem}_roi.jpg")
    cv2.imwrite(roi_save_path, cv2.cvtColor(roi_img, cv2.COLOR_RGB2BGR))
    
    print(f"[SUCCESS] Processed -> Prediction: {prediction} ({prob:.4f})")
    print(f"[SAVED] Results written to {Config.OUTPUT_DIR}/")

# ------------------------------------------------------------------ WATCHER HANDLER
class ImageHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        # Filter for valid image formats
        valid_exts = (".jpg", ".jpeg", ".png", ".bmp", ".tif")
        if event.src_path.lower().endswith(valid_exts):
            # Brief pause to ensure file write is fully completed
            time.sleep(0.5)
            process_image(event.src_path)

if __name__ == "__main__":
    event_handler = ImageHandler()
    observer = Observer()
    observer.schedule(event_handler, path=Config.INCOMING_DIR, recursive=False)
    observer.start()
    
    print(f"\n[WATCHING] Listening for images in folder: {Config.INCOMING_DIR}")
    print("Drop images into the folder to run automated inference. Press Ctrl+C to stop.\n")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()