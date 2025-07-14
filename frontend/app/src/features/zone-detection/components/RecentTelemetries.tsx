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

import Typography from "@mui/material/Typography";

import { useImageInferenceContext } from "../../../stores/ImageInferenceContext";

import CustomResponsiveLine from "../../../components/CustomResponsiveLine";
import { StatsData } from "../../../stores/ImageInferenceContext";
import { dateParser } from "../../../stores/ImageInferenceContext";

function formatTimestamp(timestamp: string): string {
  const date = new Date(dateParser(timestamp)!);
  const formattedString =
    String(date.getMinutes()).padStart(2, "0") +
    ":" +
    String(date.getSeconds()).padStart(2, "0") +
    "." +
    String(date.getMilliseconds()).padStart(3, "0");
  return formattedString;
}

function convertData(recentTelemetries: StatsData[]): any {
  const data = [
    {
      id: "recent telemetries",
      color: "#000000",
      data: recentTelemetries.map((elem: StatsData) => {
        return {
          x: formatTimestamp(elem.timestamp),
          y: elem.number_of_detections,
        };
      }),
    },
  ];
  return data;
}

export default function RecentTelemetries() {
  const { recentTelemetries } = useImageInferenceContext();

  return (
    <>
      <Typography variant="body1" fontWeight="bold">
        Last 20 telemetries
      </Typography>
      {recentTelemetries.length > 0 ? (
        <CustomResponsiveLine
          data={convertData(recentTelemetries)}
          axisBottomLabel="timestamp"
          axisLeftLabel="number of detections"
          width={600}
          height={200}
          nrTicks={20}
          showLegend={false}
        />
      ) : (
        <Typography variant="body2">No data available</Typography>
      )}
    </>
  );
}
