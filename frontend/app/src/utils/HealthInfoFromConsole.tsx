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

import { StatusResponse } from "../types/types";

export type OverallTelemetryRates = {
  grouped_telemetry_rates: DeviceTelemetryRates[];
};
export type DeviceTelemetryRates = {
  device_id: string;
  telemetry_rates: DeviceTelemetryRateValueWithTimeStamp[];
};
export type DeviceTelemetryRateValueWithTimeStamp = {
  value: number;
  timestamp: string;
};

export type DeviceDataRateValueWithTimeStamp = {
  value: number;
  timestamp: string;
};
export type DeviceDataRates = {
  device_id: string;
  data_rates: DeviceDataRateValueWithTimeStamp[];
};
export type OverallDataRates = {
  grouped_data_rates: DeviceDataRates[];
};

export type DatabaseInfo = {
  oldest_timestamp: string;
  storage_size: number;
};

interface RateCountings {
  [x: string]: {
    total: number;
  };
}

export function aggregateTelemetryRatesAsSeries(
  telemRates: OverallTelemetryRates,
): any {
  const aggregate = telemRates.grouped_telemetry_rates.reduce<RateCountings>(
    (prev, cur) => {
      return cur.telemetry_rates.reduce<RateCountings>((countings, element) => {
        const key = element.timestamp;
        return {
          ...countings,
          [key]: {
            total: (countings[key]?.total ?? 0) + element.value,
          },
        };
      }, prev);
    },
    {},
  );

  return Object.keys(aggregate)
    .sort()
    .map((ts) => {
      const data = aggregate[ts];
      const tsDate: Date = new Date(ts);
      return {
        x:
          "" +
          String(tsDate.getHours()).padStart(2, "0") +
          ":" +
          String(tsDate.getMinutes()).padStart(2, "0") +
          ":" +
          String(tsDate.getSeconds()).padStart(2, "0"),
        y: data.total,
      };
    });
}

export function telemetryRatesAsSeries(
  telemetryRates: DeviceTelemetryRates,
): any {
  const x_y_pairs = telemetryRates.telemetry_rates.map((item) => {
    const ts: Date = new Date(item.timestamp);
    return {
      x:
        "" +
        String(ts.getHours()).padStart(2, "0") +
        ":" +
        String(ts.getMinutes()).padStart(2, "0") +
        ":" +
        String(ts.getSeconds()).padStart(2, "0"),
      y: item.value,
    };
  });
  return x_y_pairs;
}

export function aggregateDataRates(
  dataRates: OverallDataRates,
): DeviceDataRates {
  const aggregate = dataRates.grouped_data_rates.reduce<RateCountings>(
    (prev, cur) => {
      return cur.data_rates.reduce<RateCountings>((countings, element) => {
        const key = element.timestamp;
        return {
          ...countings,
          [key]: {
            total: (countings[key]?.total ?? 0) + element.value,
          },
        };
      }, prev);
    },
    {},
  );

  const data_rates: DeviceDataRateValueWithTimeStamp[] = Object.keys(aggregate)
    .sort()
    .map((ts) => {
      const data = aggregate[ts];
      return {
        timestamp: ts,
        value: data.total,
      };
    });

  return {
    device_id: "summary",
    data_rates: data_rates,
  };
}

export function getOneHourBefore(startTime: Date) {
  let oneHourBefore = new Date(startTime);
  oneHourBefore.setHours(oneHourBefore.getHours() - 1);
  return oneHourBefore;
}

export async function getTelemetryRates(
  telemetry_rates_interval_ms: number,
): Promise<OverallTelemetryRates> {
  const url = new URL(
    import.meta.env.VITE_BACKEND_URL + `health/telemetry_rates`,
  );
  const currTime: Date = new Date();
  const oneHourBefore = getOneHourBefore(currTime);
  oneHourBefore.setHours(oneHourBefore.getHours() - 1);
  const params = new URLSearchParams({
    start_time: oneHourBefore.toISOString(),
    end_time: currTime.toISOString(),
    average_range: String(telemetry_rates_interval_ms),
  });
  url.search = params.toString();
  console.log("API Call: ", url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch telemetry rate info");
    }
    const telemetryRates: OverallTelemetryRates =
      (await response.json()) as OverallTelemetryRates;
    return telemetryRates;
  } catch (error) {
    console.error("Error retrieving telemetry_rates:", error);
    throw error;
  }
}

export async function getDatabaseInfo(): Promise<DatabaseInfo> {
  const url = import.meta.env.VITE_BACKEND_URL + `health/database_info`;
  console.log("API Call: ", url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch database info");
    }
    const databaseInfo: DatabaseInfo = (await response.json()) as DatabaseInfo;
    return databaseInfo;
  } catch (error) {
    console.error("Error retrieving database_info:", error);
    throw error;
  }
}

export async function getDataRates(): Promise<OverallDataRates> {
  const url = new URL(import.meta.env.VITE_BACKEND_URL + `health/data_rates`);
  const currTime: Date = new Date();
  let thirtySecondsBefore = new Date(currTime);
  thirtySecondsBefore.setSeconds(currTime.getSeconds() - 30);
  const params = new URLSearchParams({
    start_time: thirtySecondsBefore.toISOString(),
    end_time: currTime.toISOString(),
    average_range: "30000",
  });
  url.search = params.toString();
  console.log("API Call: ", url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch data rate info");
    }
    const dataRates: OverallDataRates =
      (await response.json()) as OverallDataRates;
    return dataRates;
  } catch (error) {
    console.error("Error retrieving data_rates:", error);
    throw error;
  }
}

export async function deleteDeviceData(
  deviceId: string,
): Promise<StatusResponse> {
  const url = new URL(
    import.meta.env.VITE_BACKEND_URL + `health/data/${deviceId}`,
  );
  console.log("API Call: ", url);

  try {
    const response = await fetch(url, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(
        `Failed to delete device data ${deviceId}: ${response.statusText}`,
      );
    }

    const statusResponse: StatusResponse =
      (await response.json()) as StatusResponse;
    console.log("Successfully deleted device data");
    return statusResponse;
  } catch (error) {
    console.error("Error deleting device data:", error);
    throw error;
  }
}
