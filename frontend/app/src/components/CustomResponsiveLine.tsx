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

import { ResponsiveLine, Serie } from "@nivo/line";

function timeScaleTicks(data: readonly Serie[], nrTicks?: number): string[] {
  const xVals = data.reduce<string[]>((prev, cur) => {
    return cur.data.reduce<string[]>((united, element) => {
      const item = element as { x: string; y: number };
      return [...united, item.x];
    }, prev);
  }, []);
  xVals.sort();

  if (xVals.length == 0) {
    return [];
  }
  if (xVals.length == 1) {
    return xVals;
  }
  const desiredNrTicks = nrTicks ? nrTicks : 8;
  const moduloValue = Math.ceil(xVals.length / desiredNrTicks);
  const ticks = xVals.filter((_value, index) => index % moduloValue === 0);
  //add last value to always include it in the ticks
  const lastVal = xVals[xVals.length - 1];
  if (!ticks.includes(lastVal)) {
    ticks.push(lastVal);
  }
  return ticks;
}

export default function CustomResponsiveLine({
  data,
  axisLeftLabel,
  axisBottomLabel,
  width,
  height,
  nrTicks,
  showLegend,
}: {
  data: readonly Serie[];
  axisLeftLabel: string;
  axisBottomLabel: string;
  width: number;
  height: number;
  nrTicks?: number;
  showLegend: boolean;
}) {
  const ticks = timeScaleTicks(data, nrTicks);

  return (
    <div style={{ height: height, width: width }}>
      <ResponsiveLine
        data={data}
        margin={{
          top: 20,
          right: showLegend ? 140 : 80,
          bottom: 100,
          left: 60,
        }}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 60,
          format: (val) => (ticks.includes(val) ? val.x : ""),
          legend: axisBottomLabel, //"timestamp",
          legendOffset: 60,
          legendPosition: "middle",
        }}
        axisLeft={{
          tickSize: 5,
          tickValues: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: axisLeftLabel, //"average telemetry rate per second",
          legendOffset: -40,
          legendPosition: "middle",
        }}
        legends={
          showLegend
            ? [
                {
                  anchor: "bottom-right",
                  direction: "column",
                  justify: false,
                  translateX: 100,
                  translateY: 0,
                  itemsSpacing: 0,
                  itemDirection: "left-to-right",
                  itemWidth: 80,
                  itemHeight: 20,
                  itemOpacity: 0.75,
                  symbolSize: 12,
                  symbolShape: "circle",
                  symbolBorderColor: "rgba(0, 0, 0, .5)",
                },
              ]
            : []
        }
        isInteractive={true}
        animate={false}
        useMesh={true}
        gridXValues={ticks}
      />
    </div>
  );
}
