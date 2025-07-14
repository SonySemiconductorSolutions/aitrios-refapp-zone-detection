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
  sendConfiguration,
  doParametersDifferFromLastConfiguration,
  ConfigurationV1,
  updateParametersInConfigurationV1,
  ConfigurationV2,
  updateParametersInConfigurationV2,
} from "./EdgeAppConfigurationFromConsole";

import { UpdateEdgeAppConfigurationState } from "../hooks/EdgeAppConfigurationUpdateHook";

export async function updateEdgeAppConfigurationIfRequired(
  deviceIdToStart: string,
  state: UpdateEdgeAppConfigurationState,
) {
  if (!state.deviceId && state.deviceId != "") {
    console.error("Device ID is not available.");
    return;
  }

  if (state.deviceId != deviceIdToStart) {
    return;
  }

  if (
    doParametersDifferFromLastConfiguration(
      state.paramState,
      state.configuration,
    ) ||
    state.forceConfigUpdateDevice
  ) {
    let configuration: ConfigurationV1 | ConfigurationV2;
    if ("edge_app" in state.configuration) {
      configuration = updateParametersInConfigurationV2(
        state.paramState,
        state.configuration,
      );
    } else {
      configuration = updateParametersInConfigurationV1(
        state.paramState,
        state.configuration,
      );
    }

    state.setConfiguration(configuration);
    await sendConfiguration(deviceIdToStart, configuration);
    if (state.forceConfigUpdateDevice) {
      state.setForceConfigUpdateDevice(false);
    }
  }
}
