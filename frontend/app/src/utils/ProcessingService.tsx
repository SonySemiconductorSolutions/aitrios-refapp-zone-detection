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

export type ObjectCountWithTimestamp = {
  object_count: number | null;
  object_count_in_zone: number | null;
  timestamp: string;
};

export async function startProcessing(
  deviceId: string,
  sendImageFlag: boolean,
): Promise<StatusResponse> {
  const url =
    import.meta.env.VITE_BACKEND_URL +
    `processing/start_processing/${deviceId}?receive_image=${sendImageFlag}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to start processing: " + response.json());
  }
  return await response.json();
}

export async function stopProcessing(
  deviceId: string,
): Promise<StatusResponse> {
  const url =
    import.meta.env.VITE_BACKEND_URL + "processing/stop_processing/" + deviceId;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to stop processing");
  }
  return await response.json();
}

export async function getLastObjCount(
  deviceId: string,
): Promise<ObjectCountWithTimestamp | null> {
  const url =
    import.meta.env.VITE_BACKEND_URL +
    "object_detection/counts/" +
    deviceId +
    "/last";
  const response = await fetch(url);
  console.log(url);
  if (response == null || !response.ok) {
    throw new Error("Failed to get last object count for device " + deviceId);
  }
  let objCountObj: ObjectCountWithTimestamp = {
    object_count: null,
    object_count_in_zone: null,
    timestamp: new Date().toISOString(),
  };
  try {
    objCountObj = await response.json();
  } catch {
    console.log("Error parsing last object count for device " + deviceId);
  }
  return objCountObj;
}
