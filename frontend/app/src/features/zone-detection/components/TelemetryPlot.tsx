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

import { TelemetryOverTimeBarCanvas } from "./TelemetryOverTimeBarCanvas";
import {
  useImageInferenceContext,
  averagingRange,
} from "../../../stores/ImageInferenceContext";
import { Typography } from "@mui/material";

export default function TelemetryPlotPanel() {
  // get inference results
  const { averageBarSeries } = useImageInferenceContext();

  // draw a bar plot
  return (
    <>
      {averageBarSeries.length > 0 ? (
        <h4 style={{ color: "black" }}>
          Average number of detections inside the zone (every{" "}
          {averagingRange / 1000} seconds)
        </h4>
      ) : (
        <div>
          <Typography variant="body1" fontWeight="bold">
            Average number of detections
          </Typography>
          <Typography variant="body2"> No data available</Typography>
        </div>
      )}
      <div style={{ height: 280, width: 600 }}>
        {averageBarSeries.length > 0 && (
          <TelemetryOverTimeBarCanvas data={averageBarSeries} />
        )}
      </div>
    </>
  );
}
