from ultralytics import YOLO

# Load a YOLO11n PyTorch model pretrained with COCO 80
model = YOLO("yolo11n.pt")

# Export the model
model.export(format="imx", imgsz=(544, 544))
