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

import {
  createContext,
  useState,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";
import { timeParse, timeFormat } from "d3-time-format";
import { defaultImageSrc } from "./constants";
import { GeneralObject, ObjectDetectionTop } from "../types/types";
import { useDeviceModelIdContext } from "./DeviceModelIdContext";
import { useDataStreamActiveContext } from "./DataStreamActiveContext";

const historyTimeLength: number = 60 * 60 * 1000; // one hour in milliseconds
export const averagingRange: number = 10 * 1000; // 10 seconds in milliseconds
export const dateParser = timeParse("%Y%m%d%H%M%S%L");
const datePrinter = timeFormat("%Y%m%d%H%M%S%L");

export type StatsData = {
  timestamp: string;
  number_of_detections: number;
};

export type PlotStatsState = {
  timeCurrentEventSeries: Date; // time of the current accumulation period of fullEventSeries
  fullEventSeries: StatsData[]; // data points accumulated during current averaging period
  averageBarSeries: StatsData[]; // averaged number of detections (to be visualized in the bar plot)
};

const initialPlotStatsState: PlotStatsState = {
  timeCurrentEventSeries: new Date(),
  fullEventSeries: [],
  averageBarSeries: [],
};

export function removeTimestampsBeforeCutOff(
  arr: StatsData[],
  cutOffDate: Date,
) {
  return arr.filter((entry: StatsData) => {
    const ts = entry.timestamp && dateParser(entry.timestamp);
    if (!ts) return false;
    return ts.getTime() - cutOffDate.getTime() >= 0;
  });
}

export function fillSkippedTime(
  averageBarSeries: StatsData[],
  currDate: Date,
  averagingRange: number,
): StatsData[] {
  let missingTimeSteps: number = 0;
  let lastAvgTime: number = 0;
  if (averageBarSeries.length) {
    lastAvgTime = dateParser(
      averageBarSeries[averageBarSeries.length - 1].timestamp,
    )!.getTime();
    missingTimeSteps = (currDate.getTime() - lastAvgTime) / averagingRange - 1;
  }
  let filledArray: StatsData[] = averageBarSeries;

  for (let i = 1; i <= missingTimeSteps; i++) {
    filledArray.push({
      timestamp: datePrinter(new Date(lastAvgTime + i * averagingRange)),
      number_of_detections: 0,
    });
  }
  return filledArray;
}

export function computeAverage(data: StatsData[]): number {
  let totalDetections: number = 0;
  let count: number = 0;
  data.forEach((entry) => {
    totalDetections += entry.number_of_detections;
    count += 1;
  });
  return count === 0 ? 0 : totalDetections / count;
}

export function countObjectsInZone(arr: GeneralObject[]): number {
  return arr.reduce(
    (count: number, obj: GeneralObject) =>
      obj.zone_flag === true ? count + 1 : count,
    0,
  );
}

export function createStatsData(
  timestamp: string,
  number_of_detections: number,
): StatsData {
  return { timestamp: timestamp, number_of_detections: number_of_detections };
}

function addTimeToDate(time: Date, delta: number): Date {
  return new Date(time.getTime() + delta);
}

function isPlotStatsEmpty(plotStats: PlotStatsState): boolean {
  return plotStats.averageBarSeries.length === 0;
}

function createAverageBarSeriesEntry(
  dataStreamActive: boolean,
  plotStats: PlotStatsState,
): PlotStatsState {
  const average = computeAverage(plotStats.fullEventSeries);
  const cutoffDate: Date = addTimeToDate(
    plotStats.timeCurrentEventSeries,
    -historyTimeLength,
  )!;

  const newDate: Date = addTimeToDate(
    plotStats.timeCurrentEventSeries,
    averagingRange,
  )!;

  //Add timestamps for skipped time, only keep timestamps in history window, and add new element
  return {
    fullEventSeries: [],
    timeCurrentEventSeries: dataStreamActive
      ? newDate
      : plotStats.timeCurrentEventSeries,
    averageBarSeries: [
      ...removeTimestampsBeforeCutOff(
        fillSkippedTime(plotStats.averageBarSeries, newDate, averagingRange),
        cutoffDate,
      ),
      createStatsData(datePrinter(newDate), average),
    ],
  };
}

function addEntryRecentTelemetries(
  newElem: StatsData,
  recentTelemetries: StatsData[],
  setRecentTelemetries: (telems: StatsData[]) => void,
): void {
  const maxNrEntries = 20;
  recentTelemetries.push(newElem);
  while (recentTelemetries.length > maxNrEntries) {
    recentTelemetries.shift();
  }
  setRecentTelemetries(recentTelemetries);
}

interface Props {
  children: ReactNode;
}

interface ImageInferenceContextType {
  imageSrc: string;
  setImageSrc: (value: string) => void;
  inferenceTS: string;
  inferenceData: ObjectDetectionTop | null;
  setInferenceData: (value: ObjectDetectionTop) => void;
  averageBarSeries: StatsData[];
  recentTelemetries: StatsData[];
  setRecentTelemetries: (value: StatsData[]) => void;
  handleReceiveDataPoint: (data: {
    inference: ObjectDetectionTop;
    timestamp: string;
    image: string;
    deviceId: string;
  }) => void;
  handleResetPlotState: () => void;
}

const ImageInferenceContext = createContext<ImageInferenceContextType>(
  {} as ImageInferenceContextType,
);

export function ImageInferenceContextProvider({ children }: Props) {
  const [imageSrc, setImageSrc] = useState<string>(defaultImageSrc);
  const [inferenceTS, setInferenceTS] = useState<string>("");
  const [inferenceData, setInferenceData] = useState<ObjectDetectionTop | null>(
    null,
  );
  const [plotStats, setPlotStats] = useState<PlotStatsState>(
    initialPlotStatsState,
  );
  const [recentTelemetries, setRecentTelemetries] = useState<StatsData[]>([]);
  const { deviceId } = useDeviceModelIdContext();
  const { dataStreamActive } = useDataStreamActiveContext();
  const oldDataStreamActive = useRef(dataStreamActive);

  const handleActivateDataCollecting = (date?: Date) => {
    setPlotStats((plotStats) => ({
      ...plotStats,
      timeCurrentEventSeries: date || new Date(),
    }));
  };

  const handleResetPlotState = () => {
    setPlotStats(initialPlotStatsState);
  };

  const handleReceiveDataPoint = (data: {
    inference: ObjectDetectionTop;
    timestamp: string;
    image: string;
    deviceId: string;
  }) => {
    if (data.deviceId != deviceId) return; // this data is from another device, do nothing
    if (!dataStreamActive) return;
    if (data.image) {
      const base64Image = data.image;
      const imageSrc = `data:image/jpeg;base64,${base64Image}`;
      setImageSrc(imageSrc);
    } else {
      setImageSrc("");
    }
    setInferenceData(data.inference);
    setInferenceTS(data.timestamp);
    addEntryRecentTelemetries(
      createStatsData(
        data.timestamp,
        countObjectsInZone(data.inference.perception.object_detection_list),
      ),
      recentTelemetries,
      setRecentTelemetries,
    );
    setPlotStats((plotStats) => {
      if (!dataStreamActive) return plotStats;
      return {
        ...plotStats,
        fullEventSeries: [
          ...plotStats.fullEventSeries,
          createStatsData(
            data.timestamp,
            countObjectsInZone(data.inference.perception.object_detection_list),
          ),
        ],
      };
    });
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (oldDataStreamActive.current != dataStreamActive) {
        if (dataStreamActive) {
          handleActivateDataCollecting();
        }
      }
      setPlotStats((plotStats) => {
        //console.log("using Effect, plotStats: ", plotStats);
        if (!dataStreamActive && isPlotStatsEmpty(plotStats)) {
          return plotStats;
        }
        return createAverageBarSeriesEntry(dataStreamActive, plotStats);
      });
    }, averagingRange);
    return () => clearTimeout(timeout);
  }, [
    averagingRange,
    initialPlotStatsState,
    setPlotStats,
    dataStreamActive,
    plotStats.timeCurrentEventSeries,
  ]);

  return (
    <ImageInferenceContext.Provider
      value={{
        imageSrc,
        setImageSrc,
        inferenceTS,
        inferenceData,
        setInferenceData,
        recentTelemetries,
        setRecentTelemetries,
        averageBarSeries: plotStats.averageBarSeries,
        handleReceiveDataPoint,
        handleResetPlotState,
      }}
    >
      {children}
    </ImageInferenceContext.Provider>
  );
}

export function useImageInferenceContext(): ImageInferenceContextType {
  return useContext(ImageInferenceContext);
}
