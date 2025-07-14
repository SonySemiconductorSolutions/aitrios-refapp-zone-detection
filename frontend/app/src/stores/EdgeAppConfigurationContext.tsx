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

import { createContext, useState, type ReactNode, useContext } from "react";
import { Point } from "../types/types";
import {
  ConfigurationV1,
  ConfigurationV2,
} from "../utils/EdgeAppConfigurationFromConsole";
import {
  defaultConfiguration,
  defaultDetectionThreshold,
  defaultEdgeFilterFlag,
  defaultEndPoint,
  defaultTimeBetweenUploads,
  defaultOverlapThreshold,
  defaultSendImageFlag,
  defaultStartPoint,
} from "./constants";

interface Props {
  children: ReactNode;
}

interface ContextType {
  startPoint: Point;
  endPoint: Point;
  detectionThreshold: number;
  overlapThreshold: number;
  uploadInterval: number;
  edgeFilterFlag: boolean;
  sendImageFlag: boolean;
  configuration: ConfigurationV1 | ConfigurationV2;
  forceConfigUpdateDevice: boolean;
  setStartPoint: (coordinates: Point) => void;
  setEndPoint: (coordinates: Point) => void;
  setDetectionThreshold: (value: number) => void;
  setOverlapThreshold: (value: number) => void;
  setUploadInterval: (value: number) => void;
  setEdgeFilterFlag: (value: boolean) => void;
  setSendImageFlag: (value: boolean) => void;
  setConfiguration: (value: ConfigurationV1 | ConfigurationV2) => void;
  setForceConfigUpdateDevice: (value: boolean) => void;
}

const EdgeAppConfigurationContext = createContext<ContextType>(
  {} as ContextType,
);

export function EdgeAppConfigurationContextProvider({ children }: Props) {
  const [startPoint, setStartPoint] = useState<Point>(defaultStartPoint);
  const [endPoint, setEndPoint] = useState<Point>(defaultEndPoint);
  const [detectionThreshold, setDetectionThreshold] = useState<number>(
    defaultDetectionThreshold,
  );
  const [overlapThreshold, setOverlapThreshold] = useState<number>(
    defaultOverlapThreshold,
  );
  const [uploadInterval, setUploadInterval] = useState<number>(
    defaultTimeBetweenUploads,
  );
  const [edgeFilterFlag, setEdgeFilterFlag] = useState<boolean>(
    defaultEdgeFilterFlag,
  );
  const [sendImageFlag, setSendImageFlag] =
    useState<boolean>(defaultSendImageFlag);
  const [configuration, setConfiguration] = useState<
    ConfigurationV1 | ConfigurationV2
  >(defaultConfiguration);

  const [forceConfigUpdateDevice, setForceConfigUpdateDevice] =
    useState<boolean>(false);

  return (
    <EdgeAppConfigurationContext.Provider
      value={{
        startPoint,
        endPoint,
        detectionThreshold,
        overlapThreshold,
        uploadInterval,
        edgeFilterFlag,
        sendImageFlag,
        configuration,
        forceConfigUpdateDevice,
        setStartPoint,
        setEndPoint,
        setDetectionThreshold,
        setOverlapThreshold,
        setUploadInterval,
        setEdgeFilterFlag,
        setSendImageFlag,
        setConfiguration,
        setForceConfigUpdateDevice,
      }}
    >
      {children}
    </EdgeAppConfigurationContext.Provider>
  );
}

export function useEdgeAppConfigurationContext(): ContextType {
  return useContext(EdgeAppConfigurationContext);
}
