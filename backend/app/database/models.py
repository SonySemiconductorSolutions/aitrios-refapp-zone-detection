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
from datetime import timezone

from sqlmodel import Field
from sqlmodel import SQLModel


class TelemetryTable(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    device_id: str = Field(
        description="Device ID of the device that sent the telemetry"
    )
    timestamp: datetime = Field(
        index=True,
        description="Timestamp of the telemetry in '%Y%m%d%H%M%S%L' format e.g.: 20241022145443870",
    )
    size: float = Field(description="Size of the telemetry in Kb")
    telemetry_str: str = Field(
        description="Telemetry value, stringified json-compatible dictionary"
    )
    object_count: int = Field(description="Number of detected objects in telemetry")
    object_count_in_zone: int = Field(
        description="Number of detected objects in telemetry with zone_flag=True"
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Time when the telemetry was created",
    )
