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
import asyncio
import logging
from datetime import datetime
from datetime import timedelta
from typing import Annotated
from typing import Optional

from app.client.client_factory import get_api_client
from app.client.client_interface import ClientInferface
from app.database.db import get_db
from app.database.models import TelemetryTable
from app.database.utils import set_or_adjust_start_and_end_time
from app.routers.dependencies import InjectDataPipeline
from app.schemas.common import StatusResponse
from app.schemas.processing import Telemetries
from app.schemas.processing import TelemetryWithTimeStamp
from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Path
from fastapi import Query
from fastapi import WebSocket
from fastapi import WebSocketDisconnect
from sqlmodel import select
from sqlmodel import Session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/processing", tags=["Processing"])

active_data_pipeline = asyncio.Event()


@router.get("/image/{device_id}", response_model=str)
async def get_image(
    device_id: str, api_client: ClientInferface = Depends(get_api_client)
) -> str:
    """Get image from device.

    Args:
        device_id (str): Device ID

    Returns:
        str: Image in base64 format
    """
    logger.debug(f"Received request to get image for device: {device_id}")
    try:
        api_client.stop_upload_inference_data(device_id=device_id)
        base64_image = api_client.get_direct_image(device_id=device_id)
        if base64_image is None:
            logger.warning(f"Image retrieval failed for device: {device_id}")
            raise HTTPException(status_code=500, detail="Couldn't retrieve image")
        logger.info(f"Successfully retrieved image for device: {device_id}")
        return base64_image
    except Exception as e:
        logger.error(
            f"Error while retrieving image for device {device_id}: {e}", exc_info=True
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start_processing/{device_id}", response_model=StatusResponse)
async def start_processing(
    device_id: str,
    data_pipeline: InjectDataPipeline,
    receive_image: bool = Query(False),
    api_client: ClientInferface = Depends(get_api_client),
) -> StatusResponse:
    """This endpoint starts the data processing for a specific device,
       as well as the data collection.

    Args:
        device_id (str): Device ID
        receive_image (bool): Whether or not to receive image data

    Returns:
        StatusResponse: Status of the operation
    """
    logger.debug(f"Received request to start processing for device: {device_id}")
    try:
        api_client.stop_upload_inference_data(device_id=device_id)

        response = api_client.start_upload_inference_data(
            device_id=device_id, get_image=receive_image
        )
        if not active_data_pipeline.is_set() or not data_pipeline.is_active(device_id):
            logger.info(f"Starting data collection for device: {device_id}")
            data_pipeline.start_data_collection(
                device_id=device_id, get_image=receive_image
            )
            if not active_data_pipeline.is_set():
                active_data_pipeline.set()

        logger.info(f"Data processing started for device: {device_id}")
        return response

    except Exception as e:
        logger.error(
            f"Error while starting processing for device {device_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop_processing/{device_id}", response_model=StatusResponse)
async def stop_processing(
    device_id: str,
    data_pipeline: InjectDataPipeline,
    api_client: ClientInferface = Depends(get_api_client),
) -> StatusResponse:
    """This endpoint stops the data processing for a specific device, as well as the data collection.

    Args:
        device_id (str): Device ID

    Returns:
        StatusResponse: Status of the operation
    """
    logger.debug(f"Received request to stop processing for device: {device_id}")
    try:
        if active_data_pipeline.is_set():
            logger.info(f"Stopping data collection for device: {device_id}")
            data_pipeline.stop_data_collection(device_id)
            if not data_pipeline.is_active():
                active_data_pipeline.clear()
        logger.info(f"Data processing stopped for device: {device_id}")
        return api_client.stop_upload_inference_data(device_id=device_id)
    except Exception as e:
        logger.error(
            f"Error while stopping processing for device {device_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, data_pipeline: InjectDataPipeline):
    """This endpoint handles the WebSocket connection for real-time data streaming."""
    logger.debug("WebSocket connection initiated")
    await websocket.accept()
    websocket_closed = False

    try:
        await active_data_pipeline.wait()

        logger.info("WebSocket data streaming started")
        while active_data_pipeline.is_set():
            data = data_pipeline.get_data()
            if data:
                image, inference, timestamp, device_id = data
                data_to_send = {
                    "image": image,
                    "inference": inference,
                    "timestamp": timestamp,
                    "deviceId": device_id,
                }
                await websocket.send_json(data_to_send)
            await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
        websocket_closed = True

    except Exception as e:
        logger.error(f"Unexpected error in WebSocket connection: {e}")

    finally:
        if not websocket_closed:
            logger.debug("Closing WebSocket connection")
            await websocket.close()


@router.get("/telemetries/{device_id}", response_model=Telemetries)
async def get_telemetries(
    device_id: Annotated[
        str, Path(description="The ID of the device to retrieve information for")
    ],
    start_time: Optional[datetime] = Query(
        None, description="Start time for filtering telemetry data"
    ),
    end_time: Optional[datetime] = Query(
        None, description="End time for filtering telemetry data"
    ),
    average_range: Optional[int] = Query(
        10000,
        description="Time range (in milliseconds) for averaging the telemetry rate",
    ),
    db: Session = Depends(get_db),
) -> Telemetries:
    """
    Get raw telemetries or average number of received objects, optionally limited to a time range.

    This endpoint analyzes the telemetry information and returns the average telemetry rate
    for each time interval of length `average_range`. Each value is calculated as (number_telemetries_in_interval / interval_length_in_seconds).
    If `start_time` and `end_time` are provided, the data
    will be filtered to include only telemetries between these timestamps. Otherwise,
    all available telemetry data will be returned. The `average_range` parameter
    allows you to average the data rate over a specific time interval.
    \f
    Args:
        start_time (Optional[datetime]): Start time for telemetry filtering.
        end_time (Optional[datetime]): End time for telemetry filtering.
        average_range (Optional[int]): Time range in milliseconds to average telemetry rate (default is 10 seconds).

    Returns:
        Telemetries: A list of telemetry data responses.
    """

    logger.debug(f"Retrieving telemetries for device: {device_id}")
    if average_range <= 0:
        logger.warning("Invalid average_range provided")
        raise HTTPException(status_code=400, detail="Average range must be positive")

    if start_time and end_time and start_time > end_time:
        logger.warning("Start time is after end time")
        raise HTTPException(
            status_code=400, detail="Start time cannot be after end time"
        )

    start_tzaware, end_tzware = set_or_adjust_start_and_end_time(
        db, TelemetryTable, start_time, end_time
    )

    if not start_tzaware or not end_tzware or end_tzware < start_tzaware:
        logger.info("No telemetry data available for the provided time range")
        return Telemetries(telemetries=[])

    try:
        interval_duration = timedelta(milliseconds=average_range)
        current_interval_start = start_tzaware
        telemetries = []
        while current_interval_start + interval_duration <= end_tzware:
            current_interval_end = current_interval_start + interval_duration

            retrieve_telemetries_query = select(TelemetryTable).where(
                TelemetryTable.timestamp >= current_interval_start,
                TelemetryTable.timestamp < current_interval_end,
                TelemetryTable.device_id == device_id,
            )
            result_table = db.exec(retrieve_telemetries_query).all()
            telem_list = [row.telemetry_str for row in result_table]

            telemetries.append(
                TelemetryWithTimeStamp(
                    telemetry_str=", ".join(telem_list),
                    timestamp=current_interval_start,
                )
            )

            current_interval_start = current_interval_end

        logger.info(f"Successfully retrieved telemetries for device: {device_id}")
    except Exception as e:
        logger.error(
            f"Error while retrieving telemetries for device {device_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

    return Telemetries(telemetries=telemetries)
