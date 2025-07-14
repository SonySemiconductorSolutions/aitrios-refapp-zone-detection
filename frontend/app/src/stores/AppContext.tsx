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
import { Device } from "../utils/DeviceInfoFromConsole";

export type ConsoleType = "ONLINE V1" | "ONLINE V2" | "None";

export type CredentialsState = "none" | "validated" | "erroneous";
export function isFirstAccess(state: CredentialsState): boolean {
  return state == "none";
}
export function isLoggedIn(state: CredentialsState): boolean {
  return state == "validated";
}

export type AppState = "main_view" | "login";


export function isMainScreenActive(state: AppState): boolean {
  return state == "main_view";
}

export function isLoginScreenActive(state: AppState): boolean {
  return state == "login";
}

interface AppContextType {
  consoleType: ConsoleType;
  appState: AppState;
  isSocketActive: boolean;
  deviceList: Device[];
  credentialsState: CredentialsState;
  setConsoleType: (value: ConsoleType) => void;
  setAppState: (value: AppState) => void;
  setSocketActive: (value: boolean) => void;
  setDeviceList: (value: Device[]) => void;
  setCredentialsState: (value: CredentialsState) => void;
}

interface AppContextProps {
  children: ReactNode;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppContextProvider({ children }: AppContextProps) {
  const [consoleType, setConsoleType] = useState<ConsoleType>("None");
  const [appState, setAppState] = useState<AppState>("login");
  const [isSocketActive, setSocketActive] = useState<boolean>(false);
  const [deviceList, setDeviceList] = useState<Device[]>([]);
  const [credentialsState, setCredentialsState] =
    useState<CredentialsState>("none");

  return (
    <AppContext.Provider
      value={{
        consoleType,
        appState,
        isSocketActive,
        deviceList,
        credentialsState,
        setConsoleType,
        setAppState,
        setSocketActive,
        setDeviceList,
        setCredentialsState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  return useContext(AppContext);
}
