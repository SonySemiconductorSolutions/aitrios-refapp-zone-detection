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
import CircularProgress from "@mui/material/CircularProgress";
import ExtraSettingsButton from "./ExtraSettingsButton";
import ExtraSettingsPanel from "./ExtraSettingsPanel";
import Grid from "@mui/material/Grid2";
import {
  isInferenceStages,
  isInitialStages,
  isLoadingStage,
  useScreenContext,
} from "../../../stores/ScreenContext";

import { ZoneStatusWithButton } from "./ZoneStatusWithButton";
import DefaultSettingsPanel from "./DefaultSettingsPanel";

export default function ConfigurationParameterPanel() {
  const { screenStage } = useScreenContext();

  const disableExtraSettingsButton: boolean =
    isInferenceStages(screenStage) ||
    isInitialStages(screenStage) ||
    screenStage === "parameter_loading";

  return (
    <>
      {isLoadingStage(screenStage) && (
        <CircularProgress sx={{ position: "fixed", top: "50%", left: "50%" }} />
      )}
      <ZoneStatusWithButton />
      <Grid sx={{ paddingTop: 1.2 }}>
        <Card variant="outlined" sx={{ p: 2, alignLeft: "auto" }}>
          <Stack direction="column" spacing={1}>
            <Grid sx={{ float: "right", alignLeft: "auto" }}>
              <ExtraSettingsButton disabled={disableExtraSettingsButton} />
            </Grid>
            {screenStage === "extra_parameter_selection" ? (
              <ExtraSettingsPanel />
            ) : (
              <DefaultSettingsPanel />
            )}
          </Stack>
        </Card>
      </Grid>
    </>
  );
}
