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
import os
from abc import ABC
from abc import abstractmethod
from typing import Generic
from typing import Optional
from typing import TypeVar

from app.schemas.common import StatusResponse
from app.schemas.configuration import Configuration
from app.schemas.device import Device
from app.schemas.device import Devices


Conf = TypeVar("Conf", bound=Configuration)


class ClientInferface(ABC, Generic[Conf]):
    """Abstract base class for interacting with an API client."""

    def __init__(self, timeout: int = None):
        self.timeout = timeout or int(os.getenv("API_TIMEOUT", 60))

    @abstractmethod
    def reload_client(self):
        """Reloads API Client"""

    @abstractmethod
    def get_devices(self) -> Devices:
        """Retrieve all enrolled devices as a device list in Device format (List[str])

        Returns:
            Devices: Devices id list
        """

    @abstractmethod
    def get_device(self, device_id: str) -> Device:
        """Retrieve detailed information for a specific device.

        Args:
            device_id (str): Device id to get information from

        Returns:
            Device: Device information (id, connection state, models and applications)
        """

    @abstractmethod
    def get_configuration(self, device_id: str) -> Conf:
        """Retrieve the configuration file for a specific device

        Args:
            device_id (str): ID of the device whose configuration will be returned

        Returns:
            Conf: Configuration file
        """

    @abstractmethod
    async def update_configuration(
        self, device_id: str, configuration: Conf
    ) -> StatusResponse:
        """Update some configuration values in a device.
        Args:
            device_id (str): The ID of the device in which to apply the configuration update.
            configuration (Conf): Configuration object containing the updated configuration.

        Returns:
            StatusResponse: API response status.
        """

    @abstractmethod
    async def set_configuration(
        self, device_id: str, configuration: Conf
    ) -> StatusResponse:
        """
        Replace the configuration in a device with the one provided by the caller.

        Args:
            device_id (str): The ID of the device in which to put the configuration file.
            configuration (Conf): Configuration object containing the new configuration.

        Returns:
            StatusResponse: API response status.
        """

    @abstractmethod
    def get_direct_image(self, device_id: str) -> str:
        """Get the image of a specified device in real-time.

        Args:
            device_id (str): Device ID

        Returns:
            str: Base64 jpeg encoded image string
        """

    @abstractmethod
    def get_latest_data(
        self, device_id: str, get_image: bool = False
    ) -> tuple[Optional[str], dict[str, str]]:
        """Get the latest image and its inference result from the specified device.

        Args:
            device_id (str): Device ID
            get_image (bool): Whether to get the image or not

        Returns:
            tuple[str | None, dict[str, str]]: Tuple containing the latest image (if requested) as string and its inference result
        """

    @abstractmethod
    def start_upload_inference_data(
        self, device_id: str, get_image: bool = False
    ) -> StatusResponse:
        """Start the upload process for inference data from a specified device.

        Args:
            device_id (str): Device ID
            get_image (bool): Whether to get the image or not

        Returns:
            dict: Dictionary containing the status and message of the upload process
        """

    @abstractmethod
    def stop_upload_inference_data(self, device_id: str) -> StatusResponse:
        """Stop the upload process for inference data from a specified device.

        Args:
            device_id (str): Device ID

        Returns:
            dict: Dictionary containing the status and message of the stop upload process
        """

    @abstractmethod
    def delete_device_data(self, device_id: str) -> StatusResponse:
        """Deletes the saved images and inference metadata from a specific Edge Device.

        Args:
            device_id (str): Device ID

        Returns:
            StatusResponse: API response status.
        """
