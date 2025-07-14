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

import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import { useDeviceModelIdContext } from "../../../stores/DeviceModelIdContext";
import {
  startProcessing,
  stopProcessing,
} from "../../../utils/ProcessingService";
import { useUpdateEdgeAppConfigurationState } from "../../../hooks/EdgeAppConfigurationUpdateHook";
import { updateEdgeAppConfigurationIfRequired } from "../../../utils/EdgeAppConfigurationUpdate";

import {
  useScreenContext,
  isConfigurationStages,
} from "../../../stores/ScreenContext";
import { useEdgeAppConfigurationContext } from "../../../stores/EdgeAppConfigurationContext";
import { useDataStreamActiveContext } from "../../../stores/DataStreamActiveContext";

export function buttonTextFromStage(screenStage: string): string {
  let buttonText: string = "Start Inference";
  if (screenStage === "inference_running") {
    buttonText = "Stop Inference";
  } else if (screenStage === "inference_starting") {
    buttonText = "Starting Inference ...";
  } else if (screenStage === "inference_stopping") {
    buttonText = "Stopping Inference ...";
  }
  return buttonText;
}

export function ButtonPanel({
  setSocketActive,
}: {
  setSocketActive: (active: boolean) => void;
}) {
  const { screenStage, setScreenStage } = useScreenContext();
  const { setDataStreamActive } = useDataStreamActiveContext();
  const { deviceId } = useDeviceModelIdContext();
  const { sendImageFlag } = useEdgeAppConfigurationContext();

  const commandParamState = useUpdateEdgeAppConfigurationState();
  const handleStartInference = async () => {
    setScreenStage("inference_starting");
    await updateEdgeAppConfigurationIfRequired(deviceId, commandParamState)
      .then(async () => {
        const response = await startProcessing(deviceId, sendImageFlag);
        console.log("Start Processing Response:", response);
        setSocketActive(true);
        setDataStreamActive(true);
        setScreenStage("inference_running");
      })
      .catch((error) => {
        console.error("Error starting processing:", error);
        setScreenStage("parameter_selection");
      });
  };

  const handleStopInference = async () => {
    if (!deviceId) {
      console.error("Device ID is not available.");
      return;
    }
    try {
      setScreenStage("inference_stopping");
      const response = await stopProcessing(deviceId);
      console.log("Stop Processing Response:", response);
      setSocketActive(false);
      setDataStreamActive(false);
      setScreenStage("parameter_selection");
    } catch (error) {
      console.error("Error stopping processing:", error);
      setScreenStage("inference_running");
    }
  };

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Button
        variant="contained"
        onClick={
          screenStage === "inference_running" ||
          screenStage === "inference_starting"
            ? handleStopInference
            : handleStartInference
        }
        disabled={
          !isConfigurationStages(screenStage) &&
          screenStage != "inference_running"
        }
        style={{ width: "100%" }}
        children={buttonTextFromStage(screenStage)}
      />
    </Card>
  );
}
