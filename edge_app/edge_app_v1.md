# How to obtain an Edge Application for V1

## Overview
This file provides explanations on how to obtain an Edge Application compatible with the current reference solution and its corresponding Package to deploy it to AITRIOS Console V1.

## Getting Started

### Prerequisites
- Download the [aitrios-sdk-vision-sensing-app](https://github.com/SonySemiconductorSolutions/aitrios-sdk-vision-sensing-app) repository and its submodules by running:
 ```
 git clone --recursive git@github.com:SonySemiconductorSolutions/aitrios-sdk-vision-sensing-app.git
 ```
- Go to the folder


### Build an Edge Application into a .wasm file

Build a sample object detection application as indicated in the **"2. Build"** subsection of the [`README.md`](https://github.com/SonySemiconductorSolutions/aitrios-sdk-vision-sensing-app/blob/main/tutorials/4_prepare_application/1_develop/README.md#2-build) in the [`/tutorials/4_prepare_application/1_develop`](https://github.com/SonySemiconductorSolutions/aitrios-sdk-vision-sensing-app/tree/main/tutorials/4_prepare_application/1_develop) folder. As a result you will obtain a `.wasm` file that can directly be uploaded to the Console for AITRIOS V1.
