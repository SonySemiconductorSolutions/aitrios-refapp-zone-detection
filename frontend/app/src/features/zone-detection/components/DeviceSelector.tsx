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

import { type SelectChangeEvent } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import {
  isInitialStages,
  useScreenContext,
} from "../../../stores/ScreenContext";
import { useDeviceModelIdContext } from "../../../stores/DeviceModelIdContext";
import {
  CustomSelector,
  CustomSelectorItem,
} from "../../../components/CustomSelector";
import { ReloadDevices } from "./ReloadDevices";
import { Device, getDevice } from "../../../utils/DeviceInfoFromConsole";

export interface DeviceSelectorProps {
  devices: Device[];
}

export function DeviceSelector({ devices }: DeviceSelectorProps) {
  const { screenStage } = useScreenContext();
  const { deviceId, setDeviceId, setModelIdsOfDevice } =
    useDeviceModelIdContext();

  function updateModelIdsOfDevice(deviceId: string): void {
    //console.log("updating model ids")
    getDevice(deviceId)
      .then((res) => {
        setModelIdsOfDevice(res["models"] ? res["models"] : []);
      })
      .catch((err) => {
        alert(err);
      });
  }

  const handleDeviceSelection = (event: SelectChangeEvent) => {
    const newDeviceId: string = event.target.value;
    const lastDeviceId = deviceId;
    if (newDeviceId != lastDeviceId) {
      setDeviceId(event.target.value); // overwrites deviceId in context with new value, resets modelIdsOfDevice and modelId.
      updateModelIdsOfDevice(newDeviceId);
    }
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      m={1}
      spacing={1}
      sx={{
        width: "90%",
        align: "stretch",
      }}
    >
      <CustomSelector
        label="Select Device"
        disabled={!isInitialStages(screenStage)}
        items={
          devices
            ? devices.map((device) => {
                return {
                  value: device.device_id,
                  name: device.device_name,
                  state: device.connection_state == "Connected",
                } as CustomSelectorItem;
              })
            : []
        }
        value={deviceId}
        onSelect={handleDeviceSelection}
      />
      <ReloadDevices />
    </Stack>
  );
}
