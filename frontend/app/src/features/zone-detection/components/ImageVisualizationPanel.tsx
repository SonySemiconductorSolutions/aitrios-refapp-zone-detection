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

import Card from "@mui/material/Card";
import Canvas from "./Canvas";
import { useEdgeAppConfigurationContext } from "../../../stores/EdgeAppConfigurationContext";
import { useScreenContext } from "../../../stores/ScreenContext";
import { useImageInferenceContext } from "../../../stores/ImageInferenceContext";

export default function ImageVisualizationPanel() {
  const { screenStage, canvasWidth, canvasHeight } = useScreenContext();
  const { startPoint, endPoint, setStartPoint, setEndPoint } =
    useEdgeAppConfigurationContext();
  const { imageSrc, inferenceData } = useImageInferenceContext();

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Canvas
        width={canvasWidth}
        height={canvasHeight}
        imageSrc={imageSrc}
        dragStart={startPoint}
        dragEnd={endPoint}
        setDragStart={setStartPoint}
        setDragEnd={setEndPoint}
        editable={screenStage === "zone_selection"}
        inferenceData={inferenceData}
      />
    </Card>
  );
}
