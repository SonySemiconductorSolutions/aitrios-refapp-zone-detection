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

import { Point, StatusResponse } from "../types/types";
import {
  defaultInputHeight,
  defaultInputWidth,
  defaultDetectionThreshold,
  defaultEdgeFilterFlag,
  defaultEndPoint,
  defaultTimeBetweenUploads,
  defaultOverlapThreshold,
  defaultSendImageFlag,
  defaultModelId,
  defaultStartPoint,
  minTimeBetweenUploads,
  maxTimeBetweenUploads,
  minOverlapThreshold,
  maxOverlapThreshold,
  minDetectionThreshold,
  maxDetectionThreshold,
  defaultMaxDetections,
  defaultDnnOutputDetections,
  defaultSendIntervalMs,
} from "../stores/constants";
import { v4 as uuidv4 } from "uuid";
import { ConsoleType } from "../stores/AppContext";

export type CommandParameters = {
  Mode: number;
  UploadMethod?: string;
  FileFormat?: string;
  UploadMethodIR?: string;
  NumberOfImages?: number;
  UploadInterval?: number;
  MaxDetectionsPerFrame?: number;
  ModelId?: string;
  PPLParameter?: any;
};

export type Command = {
  command_name: string;
  parameters: CommandParameters;
};

export type ResInfoData = {
  [key: string]: unknown;
  res_id: string;
};

export type InferenceSettingsData = {
  number_of_iterations: number;
};

export type MetadataData = {
  path: string;
  method: number;
  enabled: boolean;
  endpoint: string;
  storage_name: string;
};

export type InputTensorData = {
  path: string;
  method: number;
  enabled: boolean;
  endpoint: string;
  storage_name: string;
};

export type PortSettingsData = {
  metadata: MetadataData;
  input_tensor: InputTensorData;
};

export type CodecSettingsData = {
  format: number;
};

export type CommonSettingsData = {
  process_state: number;
  log_level: number;
  inference_settings: InferenceSettingsData;
  pq_settings?: any;
  port_settings: PortSettingsData;
  codec_settings: CodecSettingsData;
  number_of_inference_per_message: number;
};

export type MetadataSettingsData = {
  format: number;
};

export type CustomSettingsData = {
  ai_models: any;
  area: any;
  metadata_settings: MetadataSettingsData;
  res_info?: ResInfoData | null;
};

export type EdgeAppInfo = {
  res_info?: ResInfoData;
  common_settings?: CommonSettingsData;
  custom_settings?: CustomSettingsData;
};

export type ConfigurationV1 = {
  file_name: string;
  commands: Command[];
};

export type ConfigurationV2 = {
  edge_app: EdgeAppInfo;
};

export function isConfigurationV2(
  configuration: ConfigurationV1 | ConfigurationV2,
): configuration is ConfigurationV2 {
  return "edge_app" in configuration;
}

export function isConfigurationV1(
  configuration: ConfigurationV1 | ConfigurationV2,
): configuration is ConfigurationV1 {
  return !("edge_app" in configuration);
}

export type ZDHeader = {
  id: string;
  version: string;
};

export type ZDZone = {
  top_left_x: number;
  top_left_y: number;
  bottom_right_x: number;
  bottom_right_y: number;
};

export type ZDThreshold = {
  iou: number;
  score: number;
};

export type ZoneDetectionPPLParameters = {
  header: ZDHeader;
  dnn_output_detections: number;
  max_detections: number;
  mode: number; // mode of "Zone Detection" application: 0: detections not filtered by IoU, 1: detections filtered by IoU,
  zone: ZDZone;
  threshold: ZDThreshold;
  input_width: number;
  input_height: number;
};

export type ConfigurationParameterState = {
  modelId: string;
  startPoint: Point; // corresponds to the "top_left" coordinates in the "zone" in the ZoneDetectionPPLParameters
  endPoint: Point; // corresponds to the "bottom_right" coordinates in the "zone" in the ZoneDetectionPPLParameters
  detectionThreshold: number; // corresponds to the "threshold.iou" in the ZoneDetectionPPLParameters
  overlapThreshold: number; // corresponds to the "threshold.score" in the ZoneDetectionPPLParameters
  uploadInterval: number; // a refresh interval for detection results (web app-specific parameter)
  edgeFilterFlag: boolean; // corresponds to the "mode" in the ZoneDetectionPPLParameters
  sendImageFlag: boolean; // deduced from the "Mode" in the CommandParameters
  inputWidth: number;
  inputHeight: number;
};

/*
Parses the json object into a CommandParameters object
*/
export function jsonToParameter(json: any): CommandParameters {
  const parameters: CommandParameters = json
    ? (json as CommandParameters)
    : { Mode: -1 };

  if (parameters["Mode"] == -1) {
    console.log("Mode not contained in json: ", json);
  }
  return parameters;
}

/*
Parses a json object into a Command object that contains a command name as `command_name` and command parameters as `parameters`
*/
export function jsonToCommand(json: any): Command {
  const command: Command = {
    command_name: json["command_name"] ? json["command_name"] : "undefined",
    parameters: jsonToParameter(json["parameters"]),
  };
  if (command["command_name"] == "undefined") {
    console.log("command_name not contained in json: ", json);
  }
  return command;
}

export function jsonToCommonSettings(json: any): CommonSettingsData {
  const commonSettings: CommonSettingsData = {
    process_state: json["process_state"],
    log_level: json["log_level"],
    inference_settings: json["inference_settings"],
    pq_settings: json["pq_settings"] ? json["pq_settings"] : {},
    port_settings: json["port_settings"],
    codec_settings: json["codec_settings"],
    number_of_inference_per_message: json["number_of_inference_per_message"],
  };
  return commonSettings;
}

export function jsonToCustomSettings(json: any): CustomSettingsData {
  const customSettings: CustomSettingsData = {
    ai_models: json["ai_models"],
    area: json["area"],
    metadata_settings: json["metadata_settings"],
    res_info: json["res_info"] ? json["res_info"] : null,
  };
  return customSettings;
}

export function jsonToEdgeApp(json: any): EdgeAppInfo {
  const edgeApp: EdgeAppInfo = {
    res_info: json["res_info"] ? json["res_info"] : {},
    common_settings: jsonToCommonSettings(json["common_settings"]),
    custom_settings: jsonToCustomSettings(json["custom_settings"]),
  };
  return edgeApp;
}

/*
Calls backend to retrieve a configuration file for a specific device.
*/
export async function getConfigurationV1(
  deviceId: string,
): Promise<ConfigurationV1> {
  const url = import.meta.env.VITE_BACKEND_URL + "configurations/" + deviceId;
  console.log("API call: ", url);
  const response = await fetch(url);
  let configuration: ConfigurationV1 = {
    file_name: "null",
    commands: [],
  };
  try {
    const json = await response.json();
    console.log("configuration json: ", json);
    configuration = {
      file_name: json["file_name"],
      commands: json["commands"].map((commandJson: any) =>
        jsonToCommand(commandJson),
      ),
    };
  } catch (error) {
    alert(
      "Info: couldn't get configuration information from the Console. Going to create and bind a new command parameter file to the selected device. Set up the values correctly to match the edge app's expectations.",
    );
    console.error(
      "Error getting configuration information from the Console: ",
      error,
    );
    throw error;
  }
  return configuration;
}

export async function getConfigurationV2(
  deviceId: string,
): Promise<ConfigurationV2> {
  const url = import.meta.env.VITE_BACKEND_URL + "configurations/" + deviceId;
  console.log("API call: ", url);
  const response = await fetch(url);
  if (response.ok) {
    try {
      const json = await response.json();
      let configuration: ConfigurationV2 = {
        edge_app: jsonToEdgeApp(json["edge_app"]),
      };
      return configuration;
    } catch (error) {
      alert("Info: couldn't get configuration information from the Console.");
      console.error(
        "Error getting configuration information from the Console: ",
        error,
      );
      throw error;
    }
  } else {
    const errorMessage = await response.json();
    throw new Error(errorMessage.detail);
  }
}

export function frameRateToTimeBetweenUpdates(
  uploadInterval: number,
  denominator?: number,
): number {
  if (typeof denominator != "undefined") {
    return uploadInterval / denominator / 30;
  } else {
    return uploadInterval / 30;
  }
}

export function timeBetweenUpdatesToFrameRate(
  timeBetweenUpdates: number,
  denominator?: number,
): number {
  if (typeof denominator != "undefined") {
    return timeBetweenUpdates * denominator * 30;
  } else {
    return timeBetweenUpdates * 30;
  }
}

function parseUploadInterval(UploadInterval: number): number {
  if (isNaN(UploadInterval)) {
    return defaultTimeBetweenUploads;
  }
  if (UploadInterval < minTimeBetweenUploads) {
    return minTimeBetweenUploads;
  } else if (UploadInterval > maxTimeBetweenUploads) {
    return maxTimeBetweenUploads;
  }
  return UploadInterval;
}

function parseIouThreshold(IouThreshold: number): number {
  if (isNaN(IouThreshold)) {
    return defaultOverlapThreshold;
  } else if (IouThreshold < minOverlapThreshold) {
    return minOverlapThreshold;
  } else if (IouThreshold > maxOverlapThreshold) {
    return maxOverlapThreshold;
  }
  return IouThreshold;
}

function parseDetectionThreshold(DetectionThreshold: number): number {
  if (isNaN(DetectionThreshold)) {
    return defaultDetectionThreshold;
  } else if (DetectionThreshold < minDetectionThreshold) {
    return minDetectionThreshold;
  } else if (DetectionThreshold > maxDetectionThreshold) {
    return maxDetectionThreshold;
  }
  return DetectionThreshold;
}

function getIouThreshold(threshold: ZDThreshold | undefined): number {
  if (threshold === undefined) {
    return defaultOverlapThreshold;
  }
  return parseIouThreshold(threshold.iou);
}
function getDetectionThreshold(threshold: ZDThreshold | undefined): number {
  if (threshold === undefined) {
    return defaultDetectionThreshold;
  }
  return parseDetectionThreshold(threshold.score);
}

function isValidCoordinate(value: number, maxValue: number): boolean {
  if (isNaN(value)) return false;
  return value >= 0 && value <= maxValue;
}

function getStartPointX(zone: ZDZone | undefined, inputWidth: number): number {
  if (zone === undefined) {
    return 0;
  }
  return isValidCoordinate(zone.top_left_x, inputWidth) ? zone.top_left_x : 0;
}

function getStartPointY(zone: ZDZone | undefined, inputHeight: number): number {
  if (zone === undefined) {
    return 0;
  }
  return isValidCoordinate(zone.top_left_y, inputHeight) ? zone.top_left_y : 0;
}

function getEndPointX(zone: ZDZone | undefined, inputWidth: number): number {
  if (zone === undefined) {
    return inputWidth;
  }
  return isValidCoordinate(zone.bottom_right_x, inputWidth)
    ? zone.bottom_right_x
    : inputWidth;
}

function getEndPointY(zone: ZDZone | undefined, inputHeight: number): number {
  if (zone === undefined) {
    return inputHeight;
  }
  return isValidCoordinate(zone.bottom_right_y, inputHeight)
    ? zone.bottom_right_y
    : inputHeight;
}

export async function putNewConfiguration(
  deviceId: string,
  configuration: ConfigurationV1 | ConfigurationV2,
): Promise<StatusResponse> {
  const url = import.meta.env.VITE_BACKEND_URL + "configurations/" + deviceId;
  const requestOptions = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(configuration),
  };

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    throw new Error("Failed to post new configuration: " + response.json());
  }
  console.log("Replaced with new configuration: " + response.json());
  return { status: response.status.toString() };
}

export function getDefaultConfiguration(file_name: string): ConfigurationV1 {
  const parameters: CommandParameters = {
    Mode: 1,
    PPLParameter: {
      input_height: defaultInputHeight,
      input_width: defaultInputWidth,
      max_detections: defaultMaxDetections,
      dnn_output_detections: defaultDnnOutputDetections,
      send_interval_ms: defaultSendIntervalMs,
    },
  };
  const command: Command = {
    command_name: "StartUploadInferenceData",
    parameters: parameters,
  };
  const configuration: ConfigurationV1 = {
    file_name: file_name,
    commands: [command],
  };
  return configuration;
}

export function getDefaultConfigurationV2(modelId: string): CustomSettingsData {
  return {
    ai_models: {
      detection: {
        ai_model_bundle_id: modelId.substring(6, 12),
        parameters: {
          max_detections: 10,
          threshold: 0.3,
          input_width: 480,
          input_height: 480,
          bbox_order: "xyxy",
          bbox_normalization: false,
          class_score_order: "score_cls",
        },
      },
    },
    area: {
      coordinates: {
        left: 0,
        top: 0,
        right: 480,
        bottom: 480,
      },
      overlap: 0.5,
      class_id: [],
    },
    metadata_settings: {
      format: 0,
    },
  };
}

function fillInMissingValuesWithDefault(
  configuration: ConfigurationV2,
  modelId: string,
): [ConfigurationV2, boolean] {
  const defaultCustomSettings: CustomSettingsData =
    getDefaultConfigurationV2(modelId);
  let isUpdated: boolean = false;
  if (!configuration.edge_app.custom_settings?.ai_models) {
    configuration.edge_app.custom_settings = defaultCustomSettings;
    isUpdated = true;
  } else {
    if (
      !configuration.edge_app.custom_settings.ai_models ||
      !configuration.edge_app.custom_settings.ai_models.detection
    ) {
      configuration.edge_app.custom_settings.ai_models =
        defaultCustomSettings.ai_models;
      isUpdated = true;
    } else if (
      !configuration.edge_app.custom_settings.ai_models.detection.parameters
    ) {
      configuration.edge_app.custom_settings.ai_models.detection.parameters =
        defaultCustomSettings.ai_models.detection.parameters;
      isUpdated = true;
    }
    if (!configuration.edge_app.custom_settings.area) {
      configuration.edge_app.custom_settings.area = defaultCustomSettings.area;
      isUpdated = true;
    }
    if (!configuration.edge_app.custom_settings.metadata_settings) {
      configuration.edge_app.custom_settings.metadata_settings =
        defaultCustomSettings.metadata_settings;
      isUpdated = true;
    }
  }
  return [configuration, isUpdated];
}

function extractModelId(input: string): string | null {
  const match = input.match(/\((\d+)\)/);
  if (!match) return null;

  return match[1];
}

/*
Calls backend to retrieve a configuration file for a specific device and parses it to extract only the relevant parameters.
*/
export async function getInitialValuesFromConfiguration(
  deviceId: string,
  consoleType: ConsoleType,
  modelId: string,
): Promise<
  [ConfigurationParameterState, ConfigurationV1 | ConfigurationV2, boolean]
> {
  if (consoleType == "ONLINE V2") {
    let initialConfiguration: ConfigurationV2;
    initialConfiguration = await getConfigurationV2(deviceId);

    let requiresUpdate;
    [initialConfiguration, requiresUpdate] = fillInMissingValuesWithDefault(
      initialConfiguration,
      modelId,
    );
    if (initialConfiguration.edge_app.custom_settings) {
      initialConfiguration.edge_app.custom_settings.ai_models.detection.ai_model_bundle_id =
        extractModelId(modelId);
    }
    if (requiresUpdate) {
      await sendConfiguration(deviceId, initialConfiguration).then(async () => {
        console.log("Replaced configuration of device ", deviceId);
      });
    }

    const configParamState: ConfigurationParameterState =
      parseConfigurationV2(initialConfiguration);
    return [configParamState, initialConfiguration, false];
  } else {
    const file_name: string = uuidv4() + ".json";
    let isDefaultConfig: boolean = false;
    let initialConfiguration: ConfigurationV1 =
      getDefaultConfiguration(file_name);
    await getConfigurationV1(deviceId)
      .then((result: ConfigurationV1) => {
        initialConfiguration = result;
      })
      .catch(async () => {
        await putNewConfiguration(deviceId, initialConfiguration).then(
          async () => {
            console.log("Replaced configuration of device ", deviceId);
          },
        );
      });
    const configParamState: ConfigurationParameterState =
      parseConfigurationV1(initialConfiguration);
    return [configParamState, initialConfiguration, isDefaultConfig];
  }
}

export function parseConfigurationV2(
  initialConfiguration: ConfigurationV2,
): ConfigurationParameterState {
  const configParamState: ConfigurationParameterState = {
    modelId: defaultModelId,
    startPoint: defaultStartPoint,
    endPoint: defaultEndPoint,
    detectionThreshold: defaultDetectionThreshold,
    overlapThreshold: defaultOverlapThreshold,
    uploadInterval: defaultTimeBetweenUploads,
    edgeFilterFlag: defaultEdgeFilterFlag,
    sendImageFlag: defaultSendImageFlag,
    inputWidth: defaultInputWidth,
    inputHeight: defaultInputHeight,
  };

  try {
    configParamState["sendImageFlag"] =
      initialConfiguration.edge_app.common_settings?.port_settings.input_tensor
        .enabled ?? false;
    configParamState["inputWidth"] =
      initialConfiguration.edge_app.custom_settings?.ai_models["detection"][
        "parameters"
      ]["input_width"] ?? defaultInputWidth;
    configParamState["inputHeight"] =
      initialConfiguration.edge_app.custom_settings?.ai_models["detection"][
        "parameters"
      ]["input_height"] ?? defaultInputHeight;
    configParamState["uploadInterval"] = frameRateToTimeBetweenUpdates(
      initialConfiguration.edge_app.common_settings?.pq_settings["frame_rate"][
        "num"
      ],
      initialConfiguration.edge_app.common_settings?.pq_settings["frame_rate"][
        "denom"
      ],
    );
    configParamState["startPoint"] = {
      x: initialConfiguration.edge_app.custom_settings?.area["coordinates"][
        "left"
      ],
      y: initialConfiguration.edge_app.custom_settings?.area["coordinates"][
        "top"
      ],
    };
    configParamState["endPoint"] = {
      x: initialConfiguration.edge_app.custom_settings?.area["coordinates"][
        "right"
      ],
      y: initialConfiguration.edge_app.custom_settings?.area["coordinates"][
        "bottom"
      ],
    };
    configParamState["edgeFilterFlag"] =
      initialConfiguration.edge_app.custom_settings?.metadata_settings.format ==
      1;
    configParamState["overlapThreshold"] =
      initialConfiguration.edge_app.custom_settings?.area["overlap"];
    configParamState["detectionThreshold"] =
      initialConfiguration.edge_app.custom_settings?.ai_models["detection"][
        "parameters"
      ]["threshold"];
  } catch (e) {
    console.log("error parsing configuration", e);
  }
  return configParamState;
}

export function parseConfigurationV1(
  initialConfiguration: ConfigurationV1,
): ConfigurationParameterState {
  const configParamState: ConfigurationParameterState = {
    modelId: defaultModelId,
    startPoint: defaultStartPoint,
    endPoint: defaultEndPoint,
    detectionThreshold: defaultDetectionThreshold,
    overlapThreshold: defaultOverlapThreshold,
    uploadInterval: defaultTimeBetweenUploads,
    edgeFilterFlag: defaultEdgeFilterFlag,
    sendImageFlag: defaultSendImageFlag,
    inputWidth: defaultInputWidth,
    inputHeight: defaultInputHeight,
  };

  try {
    const commands = initialConfiguration["commands"];

    commands.map((command) => {
      const parameters: CommandParameters = command["parameters"];
      configParamState["sendImageFlag"] = parameters["Mode"] != 2;
      if (parameters["UploadInterval"]) {
        configParamState["uploadInterval"] = parseUploadInterval(
          parameters["UploadInterval"],
        );
      }

      if (parameters["PPLParameter"]) {
        configParamState["edgeFilterFlag"] =
          parameters["PPLParameter"]["mode"] == 1;

        if (parameters["PPLParameter"]["input_width"]) {
          configParamState["inputWidth"] =
            parameters["PPLParameter"]["input_width"];
        }
        if (parameters["PPLParameter"]["input_height"]) {
          configParamState["inputHeight"] =
            parameters["PPLParameter"]["input_height"];
        }

        configParamState["startPoint"] = {
          x: getStartPointX(
            parameters["PPLParameter"]["zone"],
            configParamState["inputWidth"],
          ),
          y: getStartPointY(
            parameters["PPLParameter"]["zone"],
            configParamState["inputHeight"],
          ),
        };
        configParamState["endPoint"] = {
          x: getEndPointX(
            parameters["PPLParameter"]["zone"],
            configParamState["inputWidth"],
          ),
          y: getEndPointY(
            parameters["PPLParameter"]["zone"],
            configParamState["inputHeight"],
          ),
        };

        configParamState["overlapThreshold"] = getIouThreshold(
          parameters["PPLParameter"]["threshold"],
        );
        configParamState["detectionThreshold"] = getDetectionThreshold(
          parameters["PPLParameter"]["threshold"],
        );
      }
    });
  } catch (e) {
    console.log("error parsing configuration", e);
  }
  return configParamState;
}

/*
Patches the values of the CommandParamaterFile file specified in the config.file_name
*/
export async function sendConfiguration(
  deviceId: string,
  config: ConfigurationV1 | ConfigurationV2,
): Promise<void> {
  const url = import.meta.env.VITE_BACKEND_URL + "configurations/" + deviceId;
  console.log("API call: ", url);
  try {
    await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin":
          "Origin, X-Requested-With, Content-Type, Accept",
      },
      body: JSON.stringify(config),
    });
    console.log(
      "Waiting for 5 seconds to give time to the configuration to be applied.",
    );
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } catch (e) {
    console.log(
      "Error sending configuration information to the Console. Error: ",
      e,
    );
  }
}

/*Cleans up an object by deleting fields with undefined values.*/
export function deleteUndefinedValuesIteratively(elem: object): void {
  for (const keyStr in elem) {
    let key = keyStr as keyof typeof elem;
    if (elem[key] === undefined || elem[key] === null) {
      delete elem[key];
    }
    if (typeof elem[key] === "object") {
      deleteUndefinedValuesIteratively(elem[key]);
    }
  }
}

/*
Updates the Configuration with the values of ConfigurationParameterState.
*/
export function updateParametersInConfigurationV1(
  paramState: ConfigurationParameterState,
  configuration: ConfigurationV1,
): ConfigurationV1 {
  let new_configuration: ConfigurationV1 = configuration;
  new_configuration.commands.forEach((command) => {
    command.parameters.ModelId = paramState.modelId;
    command.parameters.Mode = paramState.sendImageFlag ? 1 : 2;
    command.parameters.UploadInterval = paramState.uploadInterval;
    if (command.parameters.PPLParameter) {
      command.parameters.PPLParameter = {
        ...command.parameters.PPLParameter,
        mode: Number(paramState.edgeFilterFlag),
        zone: {
          top_left_x: paramState.startPoint.x,
          top_left_y: paramState.startPoint.y,
          bottom_right_x: paramState.endPoint.x,
          bottom_right_y: paramState.endPoint.y,
        },
        threshold: {
          iou: paramState.overlapThreshold,
          score: paramState.detectionThreshold,
        },
      };
    }
    deleteUndefinedValuesIteratively(command);
  });
  return new_configuration;
}

export function updateParametersInConfigurationV2(
  paramState: ConfigurationParameterState,
  configuration: ConfigurationV2,
): ConfigurationV2 {
  let new_configuration: ConfigurationV2 = configuration;
  if (new_configuration.edge_app.common_settings) {
    new_configuration.edge_app.common_settings.port_settings.input_tensor.enabled =
      paramState.sendImageFlag;
    new_configuration.edge_app.common_settings.pq_settings["frame_rate"][
      "num"
    ] = timeBetweenUpdatesToFrameRate(
      paramState.uploadInterval,
      new_configuration.edge_app.common_settings.pq_settings["frame_rate"][
        "denom"
      ],
    );
  }
  if (new_configuration.edge_app.custom_settings) {
    new_configuration.edge_app.custom_settings.area["coordinates"]["left"] =
      paramState.startPoint.x;
    new_configuration.edge_app.custom_settings.area["coordinates"]["top"] =
      paramState.startPoint.y;
    new_configuration.edge_app.custom_settings.area["coordinates"]["right"] =
      paramState.endPoint.x;
    new_configuration.edge_app.custom_settings.area["coordinates"]["bottom"] =
      paramState.endPoint.y;
    new_configuration.edge_app.custom_settings.area["overlap"] =
      paramState.overlapThreshold;
    new_configuration.edge_app.custom_settings.metadata_settings.format =
      Number(paramState.edgeFilterFlag);
    new_configuration.edge_app.custom_settings.ai_models["detection"][
      "parameters"
    ]["threshold"] = paramState.detectionThreshold;
  }
  return new_configuration;
}

export function updateParametersInConfiguration(
  paramState: ConfigurationParameterState,
  configuration: ConfigurationV1 | ConfigurationV2,
): ConfigurationV1 | ConfigurationV2 {
  if (isConfigurationV2(configuration)) {
    return updateParametersInConfigurationV2(paramState, configuration);
  } else {
    return updateParametersInConfigurationV1(paramState, configuration);
  }
}

export function doParametersDifferFromLastConfigurationV1(
  paramState: ConfigurationParameterState,
  configuration: ConfigurationV1,
): boolean {
  for (const command of configuration.commands) {
    const modeParamState: number = paramState.sendImageFlag ? 1 : 2;
    if (
      command.parameters.Mode != modeParamState ||
      command.parameters.UploadInterval != paramState.uploadInterval ||
      command.parameters.ModelId != paramState.modelId
    ) {
      return true;
    }
    if (command.parameters.PPLParameter) {
      if (
        command.parameters.PPLParameter.mode !=
          Number(paramState.edgeFilterFlag) ||
        command.parameters.PPLParameter.zone.top_left_x !=
          paramState.startPoint.x ||
        command.parameters.PPLParameter.zone.top_left_x !=
          paramState.startPoint.x ||
        command.parameters.PPLParameter.zone.top_left_y !=
          paramState.startPoint.y ||
        command.parameters.PPLParameter.zone.bottom_right_x !=
          paramState.endPoint.x ||
        command.parameters.PPLParameter.zone.bottom_right_y !=
          paramState.endPoint.y ||
        command.parameters.PPLParameter.threshold.iou !=
          Number(paramState.overlapThreshold) ||
        command.parameters.PPLParameter.threshold.score !=
          Number(paramState.detectionThreshold)
      ) {
        return true;
      }
    }
  }
  return false;
}

export function doParametersDifferFromLastConfigurationV2(
  paramState: ConfigurationParameterState,
  configuration: ConfigurationV2,
): boolean {
  if (
    configuration.edge_app.common_settings?.port_settings.input_tensor
      .enabled != paramState.sendImageFlag ||
    frameRateToTimeBetweenUpdates(
      configuration.edge_app.common_settings?.pq_settings["frame_rate"]["num"],
      configuration.edge_app.common_settings?.pq_settings["frame_rate"][
        "denom"
      ],
    ) != paramState.uploadInterval
  ) {
    return true;
  }
  if (configuration.edge_app.custom_settings) {
    if (
      configuration.edge_app.custom_settings.metadata_settings.format !=
        Number(paramState.edgeFilterFlag) ||
      configuration.edge_app.custom_settings.area["coordinates"]["left"] !=
        paramState.startPoint.x ||
      configuration.edge_app.custom_settings.area["coordinates"]["top"] !=
        paramState.startPoint.y ||
      configuration.edge_app.custom_settings.area["coordinates"]["right"] !=
        paramState.endPoint.x ||
      configuration.edge_app.custom_settings.area["coordinates"]["bottom"] !=
        paramState.endPoint.y ||
      configuration.edge_app.custom_settings.area["overlap"] !=
        Number(paramState.overlapThreshold) ||
      configuration.edge_app.custom_settings.ai_models["detection"][
        "parameters"
      ]["threshold"] != Number(paramState.detectionThreshold)
    ) {
      return true;
    }
  }
  return false;
}

/*
Checks if any parameter in the Configuration was changed by comparing it with the ConfigurationParameterState.
*/
export function doParametersDifferFromLastConfiguration(
  paramState: ConfigurationParameterState,
  configuration: ConfigurationV1 | ConfigurationV2,
): boolean {
  if (isConfigurationV2(configuration)) {
    return doParametersDifferFromLastConfigurationV2(paramState, configuration);
  } else {
    return doParametersDifferFromLastConfigurationV1(paramState, configuration);
  }
}
