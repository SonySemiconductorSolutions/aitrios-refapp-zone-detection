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
import pytest
from app.data_management.device_stream import convert_iso_timestamp_to_numeric


@pytest.mark.parametrize(
    "test_input,expected",
    [
        ("2023-01-01T00:00:00", "20230101000000000"),
        ("2023-01-01T00:00:00.1", "20230101000000100"),
        ("2023-01-01T00:00:00.12", "20230101000000120"),
        ("2023-01-01T00:00:00.123", "20230101000000123"),
    ],
)
def test_convert_iso_timestamp_to_numeric(test_input, expected):
    assert expected == convert_iso_timestamp_to_numeric(test_input)
