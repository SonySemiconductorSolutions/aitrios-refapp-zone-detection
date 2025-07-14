# Copyright 2025 Sony Semiconductor Solutions Corp.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0
from datetime import datetime

from pydantic import BaseModel
from pydantic import Field


class DeviceTelemetryRateValueWithTimeStamp(BaseModel):
    value: float = Field(
        ...,
        description="Telemetry rate corresponding to the timestamp and a single device.",
    )
    timestamp: datetime = Field(
        ..., description="Timestamps, returned as ISO 8601 string."
    )


class DeviceTelemetryRates(BaseModel):
    device_id: str = Field(..., description="The Id of the device.")
    telemetry_rates: list[DeviceTelemetryRateValueWithTimeStamp] = Field(
        ...,
        description="List of telemetry rates with their timestamps for the single device.",
    )


class OverallTelemetryRates(BaseModel):
    grouped_telemetry_rates: list[DeviceTelemetryRates] = Field(
        ..., description="List of device-specific collections TelemetryRates."
    )


class DeviceDataRateValueWithTimeStamp(BaseModel):
    value: float = Field(
        ..., description="Data rate corresponding to the timestamp and a single device."
    )
    timestamp: datetime = Field(
        ..., description="Timestamps, returned as ISO 8601 string."
    )


class DeviceDataRates(BaseModel):
    device_id: str = Field(..., description="The Id of the device.")
    data_rates: list[DeviceDataRateValueWithTimeStamp] = Field(
        ...,
        description="List of data rates with their timestamps for the single device.",
    )


class OverallDataRates(BaseModel):
    grouped_data_rates: list[DeviceDataRates] = Field(
        ..., description="List of device-specific collections of data rates."
    )


class DatabaseInfo(BaseModel):
    oldest_timestamp: datetime | None = Field(
        ...,
        description="Oldest timestamp of stored telemetry, returned as ISO 8601 string.",
    )
    storage_size: float = Field(
        ...,
        description="Size of the storage used for telemetry data, in kilobytes (KB).",
    )
