from ultralytics import YOLO

# Load a YOLOv8n PyTorch model pretrained with COCO 80
model = YOLO("yolov8n.pt")

# Export the model
model.export(format="imx", imgsz=(544, 544))
