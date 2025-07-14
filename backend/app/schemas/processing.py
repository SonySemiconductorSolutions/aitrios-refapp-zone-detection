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


class TelemetryWithTimeStamp(BaseModel):
    telemetry_str: str = Field(
        ..., description="Telemetry corresponding to the timestamp."
    )
    timestamp: datetime = Field(
        ..., description="Timestamps, returned as ISO 8601 string."
    )


class Telemetries(BaseModel):
    telemetries: list[TelemetryWithTimeStamp] = Field(
        ..., description="List of telemetries with their timestamp."
    )


class ObjectCountsWithTimeStamp(BaseModel):
    object_count: float | None = Field(
        ..., description="Average object count of detected objects."
    )
    object_count_in_zone: float | None = Field(
        ...,
        description="Average object count of detected objects that are within the defined zone.",
    )
    timestamp: datetime = Field(
        ..., description="Timestamps, returned as ISO 8601 string."
    )


class ObjectCounts(BaseModel):
    object_counts: list[ObjectCountsWithTimeStamp] = Field(
        ..., description="List of object counts (all and in_zone) with their timestamp."
    )
