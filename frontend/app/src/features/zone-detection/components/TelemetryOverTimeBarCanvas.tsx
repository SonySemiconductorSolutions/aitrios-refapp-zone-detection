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

import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { ResponsiveBarCanvas, BarDatum } from "@nivo/bar";
import { timeFormat } from "d3-time-format";
import { dateParser, StatsData } from "../../../stores/ImageInferenceContext";

const tickDateFormatter = timeFormat("%H:%M:%S");
const tooltipDateFormatter = timeFormat("%d-%m-%Y, %H:%M:%S:%L");

export function TelemetryOverTimeBarCanvas({ data }: { data: StatsData[] }) {
  const theme = useTheme();

  const timeScaleTicks: string[] = useMemo(() => {
    if (data.length == 0) {
      return [];
    }
    if (data.length == 1) {
      return [tickDateFormatter(dateParser(data[0].timestamp)!)];
    }
    const desiredNrTicks = 8;
    const moduloValue = Math.ceil(data.length / desiredNrTicks);
    const ticks = data.filter((_value, index) => index % moduloValue === 0);
    return ticks.map((entry) =>
      tickDateFormatter(dateParser(entry.timestamp)!),
    );
  }, [data]);

  return (
    <ResponsiveBarCanvas
      data={data as BarDatum[]}
      margin={{ top: 10, right: 0, bottom: 60, left: 60 }}
      keys={["number_of_detections"]}
      indexBy="timestamp"
      colorBy="id"
      indexScale={{ type: "band", round: true }}
      valueScale={{ type: "linear" }}
      minValue="auto"
      maxValue="auto"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 45,
        format: (val) =>
          dateParser(val) &&
          timeScaleTicks.includes(tickDateFormatter(dateParser(val)!))
            ? tickDateFormatter(dateParser(val)!)
            : "",
        legend: "timestamp",
        legendPosition: "middle",
        legendOffset: 55,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        format: (e: number) => (Number.isInteger(e) ? e : e.toFixed(1)),
        legend: "Average number of detections",
        legendOffset: -40,
        legendPosition: "middle",
      }}
      enableLabel={false}
      enableGridY={true}
      enableGridX={true}
      colors={[theme.palette.primary.main]}
      pixelRatio={1}
      padding={0}
      borderWidth={1}
      borderRadius={0}
      borderColor={{
        from: "color",
        modifiers: [["brighter", 0.999]],
      }}
      isInteractive={true}
      tooltip={(e) => {
        return (
          <div
            style={{
              padding: 5,
              background: "white",
              border: "1px solid #ccc",
              borderRadius: "3px",
              textAlign: "left",
            }}
          >
            <strong>{"Average number of detections"}</strong>
            <br />
            {"value: "}
            <strong>
              {(e.data.number_of_detections as number).toFixed(2)}
            </strong>
            <br />
            {"time: "}
            {dateParser(e.data.timestamp as string) &&
              tooltipDateFormatter(
                dateParser(e.data.timestamp as string) as Date,
              )}
          </div>
        );
      }}
    />
  );
}
