# Available models for use with the zone detection solution

There are two types of object detection models (networks) available for use with the zone detection solution.

- SSD Mobilenet-v1 model (for v1 and v2) and
- Ultralytics YOLO: Yolov8n and Yolo11n model (v2 only)
> [!NOTE]
That although all models can be deployed to the IMX500 independly of whether the device runs v1 or v2 firmware, they need to be matched with a compatible Edge App.
The Edge App that we provide for **v1** is only compatible with the SSD Mobilenet-v1 model and will not work with the Yolov8n/Yolo11n model.*

# How to obtain a ready-to-use Ultralytics YOLO model
## License notice
This Sample Code is meant to be used with AI models such as Ultralytics YOLO.
Please note that for the AI model a different license may apply.
We may not be able to comply with source code request except for the Sample Code.

For example, Ultralytics YOLO is licensed by Ultralytics Enterprise License, Ultralytics Academic License, or AGPL-3.0 License.
If you want to use Ultralytics YOLO for commercial purposes, you need to purchase the Enterprise License from this link: [https://ultralytics.com/license](https://ultralytics.com/license).

## Overview
This directory provides a development container (`.devcontainer`) for exporting an Ultralytics YOLO model pre-trained with COCO 80 to an onnx file compatible with the IMX500.
For Yolov8n, it includes a script (`export_yolov8n.py`) that automates the export process, generating the required `yolov8n_imx.onnx` file.

For Yolo11n, it includes a script (`export_yolo11n.py`) that automates the export process, generating the required `yolo11n_imx.onnx` file.

Users can run the script as-is or modify it based on the official Ultralytics documentation:

[Ultralytics YOLO IMX500 Export Guide](https://docs.ultralytics.com/integrations/sony-imx500/)

## Getting Started

### Prerequisites
- Install [Docker](https://www.docker.com/) and ensure it is running.
- Install [VS Code](https://code.visualstudio.com/) with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

### Using the dev container
1. Clone this repository:
   ```sh
   git clone git@github.com:SonySemiconductorSolutions/aitrios-sample-application-reference.git
   cd ai_model
   ```
2. Open the folder in VS Code.
3. When prompted, reopen the project in the dev container. Alternatively, open the Command Palette (`Ctrl+Shift+P`), select `Remote-Containers: Reopen in Container`.

### Development Environment
Once inside the dev container, you will have access to:
- Python 3.11.
- Installed required dependencies to export YOLO models as onnx files prepared for the IMX500.
- Export scripts to create `yolov8n_imx.onnx` or `yolo11n_imx.onnx` for IMX500

## Exporting YOLO for IMX500

This dev container includes a script, `export_yolov8n.py`, which generates the `yolov8n_imx.onnx` file for the YOLOv8n model as well as a script `export_yolo11n.py`, which generates the `yolo11n_imx.onnx` file for the YOLO11n model with an input size of *544x544*. This reduction of input size from 640x640 to 544x544 enables the retrieval of the input tensor when using an [Edge AI camera](https://www.aitrios.sony-semicon.com/edge-ai-devices) of type Rayprus CSV26 or AIH-IVRW2. To run the export process inside the container:

1. Execute the desired script:
   ```sh
   python export_yolov8n.py
   ```
   or
   ```sh
   python export_yolo11n.py
   ```
2. The script will create a folder containing `yoloXXn_imx.onnx`, ready for deployment to an IMX500. *Note, a file `packerOut.zip` will also be created, but this file is specific for use with the Raspberry Pi AI camera. Do NOT use it with a CSV26 camera.*

You can modify or extend the script as needed based on [Ultralytics' guidelines](https://docs.ultralytics.com/integrations/sony-imx500/#sonys-imx500-export-for-yolov8-models).

*Note: the onnx files created by these scripts require a converter version of 3.16 or higher.*


# How to obtain a ready-to-use SSD Mobilenet-v1 model

You can download a ready-to-use SSD Mobilenet-v1 model from the
[AITRIOS Developer Site](https://developer.aitrios.sony-semicon.com/en/edge-ai-sensing/downloads/console-v2).
Please choose the Sample AI Model
[*ssd_mobilenet_v1_0.75_packerOut*](https://developer.aitrios.sony-semicon.com/en/file/download/ssd_mobilenet_v1_0-75_packerout)
for the Object Detection task.

Make sure to follow the instructions on the Developer Site to ensure to have a compatible set of firmware,
AI model and sample application.

*Note: When using the SSD model with the zone detection application, make sure that the selected zone lies within the maximal size of `((0, 300), (0, 300))`. If not set, the zone detection application
uses a default zone which is set to the full input tensor of the Yolo models. This default zone does not work with the SSD model.*
