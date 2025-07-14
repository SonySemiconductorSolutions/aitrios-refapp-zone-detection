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
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import CropFreeIcon from "@mui/icons-material/CropFree";
import {
  isInferenceStages,
  isInitialStages,
  useScreenContext,
} from "../../../stores/ScreenContext";
import { useEdgeAppConfigurationContext } from "../../../stores/EdgeAppConfigurationContext";
import CoordinateTable from "../../../components/CoordinateTable";
import OutlinedButton from "../../../components/OutlinedButton";
import { Typography } from "@mui/material";

export function ZoneStatusWithButton() {
  const { screenStage, setScreenStage } = useScreenContext();
  const { startPoint, endPoint, setStartPoint, setEndPoint } =
    useEdgeAppConfigurationContext();

  const disableParameterChange: boolean =
    isInferenceStages(screenStage) ||
    isInitialStages(screenStage) ||
    screenStage === "parameter_loading";

  const button_props =
    screenStage === "zone_selection"
      ? {
          innerText: (
            <div>
              <Typography
                variant="body2"
                sx={{ fontSize: "clamp(0.8rem, 0.8vmax, 1.5rem)" }}
              >
                Accept Zone
              </Typography>
            </div>
          ),
          disabled: false,
          onClick: () => {
            const left = startPoint.x < endPoint.x ? startPoint.x : endPoint.x;
            const right = startPoint.x > endPoint.x ? startPoint.x : endPoint.x;
            const top = startPoint.y < endPoint.y ? startPoint.y : endPoint.y;
            const bottom =
              startPoint.y > endPoint.y ? startPoint.y : endPoint.y;
            setScreenStage("parameter_selection");
            setStartPoint({ x: left, y: top });
            setEndPoint({ x: right, y: bottom });
          },
        }
      : {
          innerText: (
            <Stack direction="row" spacing={1.5} alignItems={"center"}>
              <CropFreeIcon fontSize="large" />
              <div>
                <Typography
                  variant="body2"
                  sx={{ fontSize: "clamp(0.8rem, 0.8vmax, 1.5rem)" }}
                >
                  Select Zone
                </Typography>
              </div>
            </Stack>
          ),
          disabled: disableParameterChange,
          onClick: () => {
            setScreenStage("zone_selection");
          },
        };

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} key="ZoneParameters">
        <Box sx={{ width: "65%" }} key="zoneDescription">
          <CoordinateTable
            firstRowTitle={
              screenStage === "zone_selection" ? "Start Point" : "Top Left"
            }
            secondRowTitle={
              screenStage === "zone_selection" ? "End Point" : "Bottom Right"
            }
            startPoint={startPoint}
            endPoint={endPoint}
          />
        </Box>

        <Box sx={{ width: "35%" }} key="zoneDetectionButton">
          <OutlinedButton
            children={button_props.innerText}
            disabled={button_props.disabled}
            onClick={button_props.onClick}
          />
        </Box>
      </Stack>
    </Card>
  );
}
