# How to obtain an Edge Application Package for V2

## Overview
This file provides explanations on how to obtain an Edge Application compatible with the current reference solution and its corresponding Package to deploy it to AITRIOS Console V2.

## Getting Started

### Prerequisites
- Download the [aitrios-sdk-edge-app](https://github.com/SonySemiconductorSolutions/aitrios-sdk-edge-app) repository and its submodules by running:
 ```
 git clone --recursive git@github.com:SonySemiconductorSolutions/aitrios-sdk-edge-app.git
 ```

### Build an Edge Application into a .wasm file

Build a sample C/C++ object detection application as indicated in the [`README.md`](https://github.com/SonySemiconductorSolutions/aitrios-sdk-edge-app/tree/main?tab=readme-ov-file#sample-application-for-cc) at the root of the repo. At the moment of writing the current file  it could be done by  calling `make CMAKE_FLAGS="-DAPPS_SELECTION=detection"`. You will then obtain a `.wasm` file to be used in the next step.

### Package the Edge Application to upload it to Console for AITRIOS

Prepare an Edge Application Package as specified in the ["Importing an "Edge Application" tutorial](https://github.com/SonySemiconductorSolutions/aitrios-sdk-edge-app/tree/main/tutorials/2_import_edge_app).
