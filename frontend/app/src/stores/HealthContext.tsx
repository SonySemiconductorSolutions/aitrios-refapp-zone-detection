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
import {
  OverallTelemetryRates,
  OverallDataRates,
  DatabaseInfo,
} from "../utils/HealthInfoFromConsole";

interface HealthContextType {
  telemetryRates: OverallTelemetryRates;
  databaseInfo: DatabaseInfo;
  dataRates: OverallDataRates;
  setTelemetryRates: (value: OverallTelemetryRates) => void;
  setDatabaseInfo: (value: DatabaseInfo) => void;
  setDataRates: (value: OverallDataRates) => void;
}

interface HealthContextProps {
  children: ReactNode;
}

const healthContext = createContext<HealthContextType>({} as HealthContextType);

export function HealthContextProvider({ children }: HealthContextProps) {
  const [telemetryRates, setTelemetryRates] = useState<OverallTelemetryRates>({
    grouped_telemetry_rates: [],
  });
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo>({
    storage_size: 0,
    oldest_timestamp: "",
  });
  const [dataRates, setDataRates] = useState<OverallDataRates>({
    grouped_data_rates: [],
  });
  return (
    <healthContext.Provider
      value={{
        telemetryRates,
        databaseInfo,
        dataRates,
        setTelemetryRates,
        setDatabaseInfo,
        setDataRates,
      }}
    >
      {children}
    </healthContext.Provider>
  );
}

export function useHealthContext(): HealthContextType {
  return useContext(healthContext);
}
