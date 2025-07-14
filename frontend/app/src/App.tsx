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

import "./App.css";
import PrincipalScreen from "./features/PrincipalScreen";
import HeaderBar from "./components/HeaderBar";
import baseTheme from "./styles/baseStyle";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { DeviceModelIdProvider } from "./stores/DeviceModelIdContext";
import { ScreenContextProvider } from "./stores/ScreenContext";
import { EdgeAppConfigurationContextProvider } from "./stores/EdgeAppConfigurationContext";
import { ImageInferenceContextProvider } from "./stores/ImageInferenceContext";
import { DataStreamActiveContextProvider } from "./stores/DataStreamActiveContext";
import { AppContextProvider } from "./stores/AppContext";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";

const theme = createTheme({
  ...baseTheme,
  typography: {
    ...baseTheme.typography,
    fontSize: 16,
    h6: {
      ...baseTheme.typography.h6,
      fontSize: "clamp(1rem, 2.5vmax, 3.5rem)",
    },
    body1: {
      ...baseTheme.typography.body1,
      fontSize: "clamp(1rem, 1.1vmax, 2rem)",
    },
    body2: {
      ...baseTheme.typography.body2,
      fontSize: "clamp(0.8rem, 1vmax, 1.75rem)",
    },
  },
  components: {
    ...baseTheme.components,
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          fontSize: "clamp(1rem, 1.5vmin, 2rem)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: "clamp(0.8rem, 0.8vmax, 1.5rem)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          margin: "auto",
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AppContextProvider>
        <DeviceModelIdProvider>
          <DataStreamActiveContextProvider>
            <ImageInferenceContextProvider>
              <Box
                sx={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <HeaderBar />
                <Toolbar sx={{ width: "100%" }} />
                <Box sx={{ height: "100%", width: "100%" }}>
                  <ScreenContextProvider>
                    <EdgeAppConfigurationContextProvider>
                      <PrincipalScreen />
                    </EdgeAppConfigurationContextProvider>
                  </ScreenContextProvider>
                </Box>
              </Box>
            </ImageInferenceContextProvider>
          </DataStreamActiveContextProvider>
        </DeviceModelIdProvider>
      </AppContextProvider>
    </ThemeProvider>
  );
}

export default App;
