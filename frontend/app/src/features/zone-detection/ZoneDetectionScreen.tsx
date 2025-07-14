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

import DeviceModelSelectionPanel from "./components/DeviceModelSelectionPanel";
import ConfigurationParameterPanel from "./components/ConfigurationParameterPanel";
import { ButtonPanel } from "./components/ButtonPanel";
import ImageVisualizationPanel from "./components/ImageVisualizationPanel";
import ExtraInfoPanel from "./components/ExtraInfoPanel";

import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import { isInitialStages, useScreenContext } from "../../stores/ScreenContext";
import { useAppContext } from "../../stores/AppContext";
import { useTheme } from "@mui/material";

function ZoneDetectionScreen() {
  const theme = useTheme();
  const { screenStage } = useScreenContext();
  const { setSocketActive } = useAppContext();

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100%",
        }}
      >
        <Grid container spacing={2} justifyContent="center">
          <Grid display="flex" justifyContent="center">
            <Grid
              container
              rowSpacing={1}
              direction={"column"}
              sx={{
                minWidth: "clamp(300px, 40vw, 500px)",
                [theme.breakpoints.up("lg")]: {
                  minWidth: "clamp(400px, 40vw, 800px)",
                },
              }}
            >
              <Grid>
                <DeviceModelSelectionPanel />
              </Grid>
              {!isInitialStages(screenStage) && (
                <>
                  <Grid>
                    <ConfigurationParameterPanel />
                  </Grid>
                  <Grid>
                    <ButtonPanel setSocketActive={setSocketActive} />
                  </Grid>
                </>
              )}
            </Grid>
          </Grid>

          {!isInitialStages(screenStage) &&
            screenStage != "parameter_loading" && (
              <Grid
                container
                sx={{ minWidth: "clamp(300px, 40vw, 500px)" }}
                columns={12}
                direction={"column"}
              >
                <Grid size={12}>
                  <ImageVisualizationPanel />
                </Grid>
                <Grid size={12}>
                  <ExtraInfoPanel />
                </Grid>
              </Grid>
            )}
        </Grid>
      </Box>
    </>
  );
}

export default ZoneDetectionScreen;
