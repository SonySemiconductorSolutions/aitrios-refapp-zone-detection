/**
 * Copyright 2025 Sony Semiconductor Solutions Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point } from "../types/types";
import { ConfigurationV1 } from "../utils/EdgeAppConfigurationFromConsole";

export const canvasMaxWidth: number = 640;
export const canvasMaxHeight: number = 480;

export const defaultInputWidth: number = 300;
export const defaultInputHeight: number = 300;

export const defaultMaxDetections: number = 5;
export const defaultDnnOutputDetections: number = 50;

export const defaultSendIntervalMs: number = 0;

export const defaultImageSrc: string = "";
export const defaultModelId: string = "";

export const defaultStartPoint: Point = { x: 0, y: 0 };

export const defaultEndPoint: Point = { x: 0, y: 0 };

export const minDetectionThreshold: number = 0.0;
export const defaultDetectionThreshold: number = 0.5;
export const maxDetectionThreshold: number = 1.0;
export const stepDetectionThreshold: number = 0.005;

export const minOverlapThreshold: number = 0.0;
export const defaultOverlapThreshold: number = 0.5;
export const maxOverlapThreshold: number = 1.0;
export const stepIouThreshold: number = 0.005;

export const minTimeBetweenUploads: number = 0.1; // 0.1 seconds
export const defaultTimeBetweenUploads: number = 1;
export const maxTimeBetweenUploads: number = 600; // 10 minutes
export const stepUploadInterval: number = 1; // 1 second

export const defaultEdgeFilterFlag: boolean = false;

export const defaultSendImageFlag: boolean = true;

export const defaultConfiguration: ConfigurationV1 = {
  file_name: "none",
  commands: [],
};
