# ai_server.py (Run this on UBUNTU)
import cv2
import torch
import torch.nn as nn
import numpy as np
import torchvision.models as models
from self_attention_cv.transunet import TransUnet
from fastapi import FastAPI, UploadFile, File
import base64
import uvicorn

# --- CONFIG & MODELS ---
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
SEG_IMG_SIZE, ROI_IMG_SIZE, ROI_MARGIN_RATIO = 224, 224, 0.25
MEAN = torch.tensor([0.485, 0.456, 0.406], device=DEVICE).view(1, 3, 1, 1) * 255
STD = torch.tensor([0.229, 0.224, 0.225], device=DEVICE).view(1, 3, 1, 1) * 255

class GlaucomaDenseNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = models.densenet121(weights=None)
        self.backbone.classifier = nn.Identity()
        self.head = nn.Sequential(
            nn.Dropout(0.3), nn.Linear(1024, 128), nn.BatchNorm1d(128), 
            nn.ReLU(), nn.Dropout(0.3), nn.Linear(128, 1)
        )
    def forward(self, x):
        return self.head(self.backbone(x))

print("[INFO] Booting AI Models into memory...")
transunet = TransUnet(in_channels=3, classes=2, img_dim=SEG_IMG_SIZE, vit_blocks=8, vit_dim_linear_mhsa_block=512).to(DEVICE)
transunet.load_state_dict(torch.load("transunetsegmentationmodel.pth", map_location=DEVICE))
transunet.eval()

densenet = GlaucomaDenseNet().to(DEVICE)
densenet.load_state_dict(torch.load("densenetglaucomaclassificationmodel.pth", map_location=DEVICE))
densenet.eval()
print("[INFO] Server is READY to receive images!")

# --- FASTAPI SERVER ---
app = FastAPI(title="Glaucoma AI Server")

def extract_roi(image_rgb, model, margin):
    h, w, _ = image_rgb.shape
    resized = cv2.resize(image_rgb, (SEG_IMG_SIZE, SEG_IMG_SIZE), interpolation=cv2.INTER_AREA)
    tensor = (torch.from_numpy(resized).permute(2, 0, 1).unsqueeze(0).to(DEVICE).float() - MEAN) / STD
    
    with torch.no_grad(), torch.autocast("cuda" if torch.cuda.is_available() else "cpu", dtype=torch.float16):
        probs = torch.sigmoid(model(tensor)).squeeze(0).cpu().float().numpy()
        
    mask = cv2.resize((probs[0] > 0.5).astype(np.uint8), (w, h))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        x, y, cw, ch = cv2.boundingRect(max(contours, key=cv2.contourArea))
        px, py = int(cw * margin), int(ch * margin)
        cropped = image_rgb[max(0, y-py):min(h, y+ch+py), max(0, x-px):min(w, x+cw+px)]
    else:
        cs = min(h, w) // 2
        cropped = image_rgb[h//2-cs//2:h//2+cs//2, w//2-cs//2:w//2+cs//2]
    return cv2.resize(cropped, (ROI_IMG_SIZE, ROI_IMG_SIZE))

@app.post("/diagnose")
async def diagnose_image(file: UploadFile = File(...)):
    print(f"\n[RECEIVED] Image from Windows: {file.filename}")
    
    # 1. Read incoming image straight from memory
    contents = await file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    raw_img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    raw_img_rgb = cv2.cvtColor(raw_img, cv2.COLOR_BGR2RGB)
    
    # 2. Run Pipeline
    roi_img = extract_roi(raw_img_rgb, transunet, ROI_MARGIN_RATIO)
    roi_tensor = torch.from_numpy(roi_img).permute(2, 0, 1).unsqueeze(0).to(DEVICE).float() / 255.0
    roi_tensor = (roi_tensor - (MEAN/255.0)) / (STD/255.0)
    
    with torch.no_grad():
        prob = torch.sigmoid(densenet(roi_tensor)).item()
        
    prediction = "Glaucoma Positive" if prob > 0.30 else "Glaucoma Negative"
    print(f"[RESULT] {prediction} ({prob:.4f})")
    
    # 3. Encode cropped ROI image to send back
    _, buffer = cv2.imencode('.jpg', cv2.cvtColor(roi_img, cv2.COLOR_RGB2BGR))
    roi_b64 = base64.b64encode(buffer).decode('utf-8')
    
    # 4. Send everything back to Windows
    return {
        "filename": file.filename,
        "prediction": prediction,
        "probability": round(prob, 4),
        "roi_image_base64": roi_b64
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)