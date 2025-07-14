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
import logging
from datetime import datetime
from datetime import timezone
from threading import Event
from threading import Thread

from app.client.client_factory import get_api_client
from app.client.online_client_v1 import OnlineConsoleClientV1
from app.client.online_client_v2 import OnlineConsoleClientV2
from app.data_management.inference_deserialization import deserialize
from app.data_management.inference_deserialization import detection_data_to_json
from app.data_management.inference_deserialization import (
    get_object_count_from_telemetry,
)
from app.data_management.inference_deserialization import InferenceFormat
from app.database.db import get_db
from app.database.models import TelemetryTable
from app.utils.timestamp import convert_iso_timestamp_to_numeric

logger = logging.getLogger(__name__)


def save_telemetry_data(
    device_id: str, timestamp: str, b64_image: str, parsed_inference: dict
):
    """Saves telemetry data to the database, including the parsed_inference and the size of the image and inference.

    Args:
        device_id (str): The device Id of the device to which the image and parsed inference belong.
        timestamp (str): The timestamp of the telemetry data.
        b64_image (str): The base64 encoded image string.
        parsed_inference (dict): The parsed inference data as a dictionary.

    Returns:
        None
    """
    try:
        logger.debug("Starting save_telemetry_data")
        image_size_mb = len(b64_image.encode("utf-8")) / 1024 if b64_image else 0
        inference_size_mb = len(str(parsed_inference).encode("utf-8")) / 1024
        telemetry_size = image_size_mb + inference_size_mb

        telemetry_timestamp = datetime.strptime(timestamp, "%Y%m%d%H%M%S%f").replace(
            tzinfo=timezone.utc
        )

        telemetry_entry = TelemetryTable(
            device_id=device_id,
            timestamp=telemetry_timestamp,
            size=telemetry_size,
            telemetry_str=str(parsed_inference),
            object_count=get_object_count_from_telemetry(
                parsed_inference, filter_in_zone=False
            ),
            object_count_in_zone=get_object_count_from_telemetry(
                parsed_inference, filter_in_zone=True
            ),
        )

        db_session = next(get_db())
        db_session.add(telemetry_entry)
        db_session.commit()
        logger.info(
            f"Telemetry data saved for device_id: {device_id}, timestamp: {timestamp}"
        )
    except Exception as e:
        logger.error(
            f"Error saving telemetry data for device_id: {device_id}: {e}",
            exc_info=True,
        )


class DevicePipeline:
    """DevicePipeline manages a thread that collects data from the device identified by device_id."""

    def __init__(self, device_id: str, api_client, data_queue):
        self.device_id: str = device_id
        self.data_thread = None
        self.active_pipeline: Event = Event()
        self.last_seen = None
        self.api_client = api_client
        self.data_queue = data_queue
        self.console_type: None | InferenceFormat = self._get_console_type()
        logger.debug(f"DevicePipeline initialized for device_id: {device_id}")

    def _get_console_type(self) -> None | InferenceFormat:
        if isinstance(self.api_client, OnlineConsoleClientV1):
            return InferenceFormat.ZONE_DETECTION
        elif isinstance(self.api_client, OnlineConsoleClientV2):
            return InferenceFormat.OBJECT_DETECTION_EXPANDED
        else:
            return None

    def get_client(self):
        """Lazy initialization of the console client."""
        if not self.api_client:
            try:
                logger.debug("Initializing API client")
                self.api_client = get_api_client()
                self.console_type = self._get_console_type()
            except Exception as e:
                logger.error(f"Failed to initialize API client: {e}", exc_info=True)
                raise
        return self.api_client

    def stop_data_collection(self):
        logger.info(f"Stopping data collection for device_id: {self.device_id}")
        self.active_pipeline.clear()
        if self.data_thread is not None:
            self.data_thread.join()
            self.data_queue.clear()

    def is_active(self):
        return self.active_pipeline.is_set()

    def start_data_collection(self, get_image: bool = True):
        if not self.active_pipeline.is_set():
            logger.info(f"Starting data collection for device_id: {self.device_id}")
            self.active_pipeline.set()
            self.data_thread = Thread(target=self.collect_data, args=(get_image,))
            self.data_thread.start()

    def collect_data(self, get_image: bool = True):
        while self.active_pipeline.is_set():
            try:
                api_client = self.get_client()
                b64_image, raw_inference = api_client.get_latest_data(
                    device_id=self.device_id,
                    get_image=get_image,
                )

                if (
                    raw_inference["timestamp"]
                    and raw_inference["timestamp"] != self.last_seen
                ):
                    # Process datetime for better handling
                    processed_timestamp = convert_iso_timestamp_to_numeric(
                        raw_inference["timestamp"]
                    )

                    logger.debug(f"New data received for device_id: {self.device_id}")
                    deserialize_inference = deserialize(
                        raw_inference["content"], inference_format=self.console_type
                    )
                    parsed_inference = detection_data_to_json(deserialize_inference)
                    self.data_queue.append(
                        (
                            b64_image,
                            parsed_inference,
                            processed_timestamp,
                            self.device_id,
                        )
                    )
                    save_telemetry_data(
                        device_id=self.device_id,
                        timestamp=processed_timestamp,
                        b64_image=b64_image,
                        parsed_inference=parsed_inference,
                    )

                    self.last_seen = raw_inference["timestamp"]
            except Exception as e:
                logger.error(f"Data pipeline error in collect_data: {e}", exc_info=True)
                raise


class DataPipeline:
    """DataPipeline is in charge of centralizing the access to data from all devices."""

    def __init__(self):
        self.data_queue = []
        self.device_pipelines: dict[str, DevicePipeline] = {}
        self.api_client = None
        logger.debug("DataPipeline initialized")

    def get_client(self):
        """Lazy initialization of the console client."""
        if not self.api_client:
            try:
                logger.debug("Initializing API client")
                self.api_client = get_api_client()
            except Exception as e:
                logger.error(f"Failed to initialize API client: {e}", exc_info=True)
                raise
        return self.api_client

    def is_active(self, device_id=None):
        if device_id:
            if device_id in self.device_pipelines:
                return self.device_pipelines[device_id].is_active()
            else:
                return False
        else:
            for device_pipeline in self.device_pipelines:
                if self.device_pipelines[device_pipeline].is_active():
                    return True
            return False

    def get_device_pipeline(self, device_id: str):
        device_pipeline = self.device_pipelines.get(device_id, None)
        if not device_pipeline:
            logger.debug(f"Creating new DevicePipeline for device_id: {device_id}")
            device_pipeline = DevicePipeline(
                device_id, self.get_client(), self.data_queue
            )
            self.device_pipelines[device_id] = device_pipeline
        return device_pipeline

    def start_data_collection(self, device_id: str, get_image: bool = True):
        logger.info(f"Starting data collection for device_id: {device_id}")
        device_pipeline = self.get_device_pipeline(device_id)
        device_pipeline.start_data_collection(get_image)

    def stop_data_collection(self, device_id: str):
        logger.info(f"Stopping data collection for device_id: {device_id}")
        device_pipeline = self.get_device_pipeline(device_id)
        device_pipeline.stop_data_collection()

    def reset_client(self) -> None:
        logger.info("Resetting the API client")

        logger.info(
            "Resetting device pipelines: "
            + str([elem.api_client for elem in self.device_pipelines.values()])
        )
        for device_pipeline in self.device_pipelines.values():
            device_pipeline.stop_data_collection()
        self.device_pipelines.clear()

        self.api_client = None

    def get_data(self):
        if self.data_queue:
            logger.debug("Retrieving data from data queue")
            return self.data_queue.pop(0)
        return None
