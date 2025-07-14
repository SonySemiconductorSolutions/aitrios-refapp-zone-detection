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
from datetime import timedelta
from typing import Annotated
from typing import Optional

from app.client.client_factory import get_api_client
from app.client.client_interface import ClientInferface
from app.database.db import get_db
from app.database.models import TelemetryTable
from app.database.utils import set_or_adjust_start_and_end_time
from app.schemas.common import StatusResponse
from app.schemas.health import DatabaseInfo
from app.schemas.health import DeviceDataRates
from app.schemas.health import DeviceDataRateValueWithTimeStamp
from app.schemas.health import DeviceTelemetryRates
from app.schemas.health import DeviceTelemetryRateValueWithTimeStamp
from app.schemas.health import OverallDataRates
from app.schemas.health import OverallTelemetryRates
from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Path
from fastapi import Query
from sqlalchemy import text
from sqlalchemy.sql import func
from sqlmodel import select
from sqlmodel import Session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/telemetry_rates", response_model=OverallTelemetryRates)
async def get_telemetry_rates(
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
) -> OverallTelemetryRates:
    """
    Get average telemetry data rates, optionally limited to a time range.

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
        TelemetryRateResponse: A list of telemetry data responses.
    """
    logger.info("Received request to get telemetry rates")

    if average_range <= 0:
        logger.warning("Invalid average range: %d", average_range)
        raise HTTPException(status_code=400, detail="Average range must be positive")

    if start_time and end_time and start_time > end_time:
        logger.warning("Start time %s is after end time %s", start_time, end_time)
        raise HTTPException(
            status_code=400, detail="Start time cannot be after end time"
        )

    start_tzaware, end_tzware = set_or_adjust_start_and_end_time(
        db, TelemetryTable, None, start_time, end_time
    )
    interval_length_seconds: float = float(average_range) / 1000.0
    interval_duration = timedelta(milliseconds=average_range)

    if not start_tzaware or not end_tzware or end_tzware < start_tzaware:
        logger.debug("No valid time range found for telemetry rates")
        return OverallTelemetryRates(grouped_telemetry_rates=[])
    try:
        current_interval_start = start_tzaware
        collected_telemetry_rates = {}
        while current_interval_start + interval_duration <= end_tzware:
            current_interval_end = current_interval_start + interval_duration

            grouped_count_query = (
                select(TelemetryTable.device_id, func.count(TelemetryTable.timestamp))
                .where(
                    TelemetryTable.timestamp >= current_interval_start,
                    TelemetryTable.timestamp < current_interval_end,
                )
                .group_by(TelemetryTable.device_id)
            )
            telemetry_count_groups: list = db.exec(grouped_count_query).all()
            for device_id, telemetry_count in telemetry_count_groups:
                telemetry_rate: float = (
                    telemetry_count / interval_length_seconds
                    if interval_length_seconds > 0
                    else 0.0
                )
                telemRateWithTS = DeviceTelemetryRateValueWithTimeStamp(
                    value=telemetry_rate, timestamp=current_interval_start
                )
                if device_id not in collected_telemetry_rates:
                    collected_telemetry_rates[device_id] = []
                collected_telemetry_rates[device_id].append(telemRateWithTS)
            current_interval_start = current_interval_end

        grouped_telemetry_rates = [
            DeviceTelemetryRates(device_id=device_id, telemetry_rates=telemetry_rates)
            for device_id, telemetry_rates in collected_telemetry_rates.items()
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

    return OverallTelemetryRates(grouped_telemetry_rates=grouped_telemetry_rates)


@router.get("/{device_id}/telemetry_rates", response_model=DeviceTelemetryRates)
async def get_device_telemetry_rates(
    device_id: Annotated[
        str, Path(description="The ID of the device to retrieve telemetries")
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
) -> DeviceTelemetryRates:
    """
    Get average telemetry data rates, optionally limited to a time range.

    This endpoint analyzes the telemetry information and returns the average telemetry rate
    for each time interval of length `average_range`. Each value is calculated as (number_telemetries_in_interval / interval_length_in_seconds).
    If `start_time` and `end_time` are provided, the data
    will be filtered to include only telemetries between these timestamps. Otherwise,
    all available telemetry data will be returned. The `average_range` parameter
    allows you to average the data rate over a specific time interval.
    \f
    Args:
        device_id (str): The ID of the device to retrieve telemetries
        start_time (Optional[datetime]): Start time for telemetry filtering.
        end_time (Optional[datetime]): End time for telemetry filtering.
        average_range (Optional[int]): Time range in milliseconds to average telemetry rate (default is 10 seconds).

    Returns:
        DeviceTelemetryRates: A list of telemetry data responses.
    """

    if average_range <= 0:
        raise HTTPException(status_code=400, detail="Average range must be positive")

    if start_time and end_time and start_time > end_time:
        raise HTTPException(
            status_code=400, detail="Start time cannot be after end time"
        )

    start_tzaware, end_tzware = set_or_adjust_start_and_end_time(
        db, TelemetryTable, device_id, start_time, end_time
    )
    interval_length_seconds: float = float(average_range) / 1000.0
    interval_duration = timedelta(milliseconds=average_range)

    if not start_tzaware or not end_tzware or end_tzware < start_tzaware:
        logger.debug("No valid time range found for telemetry rates")
        return DeviceTelemetryRates(device_id=device_id, telemetry_rates=[])
    try:
        current_interval_start = start_tzaware
        telemetry_rates = []
        while current_interval_start + interval_duration <= end_tzware:
            current_interval_end = current_interval_start + interval_duration

            count_query = select(func.count(TelemetryTable.timestamp)).where(
                TelemetryTable.device_id == device_id,
                TelemetryTable.timestamp >= current_interval_start,
                TelemetryTable.timestamp < current_interval_end,
            )
            telemetry_count: int = db.exec(count_query).all()[0]

            telemetry_rate: float = (
                telemetry_count / interval_length_seconds
                if interval_length_seconds > 0
                else 0.0
            )
            telemRateWithTS = DeviceTelemetryRateValueWithTimeStamp(
                value=telemetry_rate, timestamp=current_interval_start
            )
            telemetry_rates.append(telemRateWithTS)

            current_interval_start = current_interval_end

        logger.debug("Telemetry rates calculated successfully")

    except Exception as e:
        logger.error("Error calculating telemetry rates: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

    return DeviceTelemetryRates(device_id=device_id, telemetry_rates=telemetry_rates)


@router.get("/data_rates", response_model=OverallDataRates)
async def get_data_bandwidth_rates(
    start_time: Optional[datetime] = Query(
        None, description="Start time for data rate calculation"
    ),
    end_time: Optional[datetime] = Query(
        None, description="End time for data rate calculation"
    ),
    average_range: Optional[int] = Query(
        10000, description="Time range (in milliseconds) for averaging the data rate"
    ),
    db: Session = Depends(get_db),
) -> OverallDataRates:
    """
    Calculate the network bandwidth (data rate).

    This endpoint computes the data rate (bandwidth usage) of the telemetries received over a given
    time range. The `start_time` and `end_time` parameters can be used to specify the
    period during which the data rate will be calculated. The `average_range` parameter
    allows you to average the data rate over a specific time interval. Each element of data_rate is
    calculated as sum_over_all_telemetries_in_interval(telemetry_size_in_Kb) / interval_size_in_seconds.
    \f
    Args:
        start_time (Optional[datetime]): Start time for data rate calculation.
        end_time (Optional[datetime]): End time for data rate calculation.
        average_range (Optional[int]): Time range in milliseconds to average the data rate (default is 10 seconds).

    Returns:
        DataRateResponse: Data rate statistics for the specified time range.
    """
    logger.info("Received request to get data bandwidth rates")

    if start_time and end_time and start_time > end_time:
        logger.warning("Start time %s is after end time %s", start_time, end_time)
        raise HTTPException(
            status_code=400, detail="Start time cannot be after end time"
        )

    if average_range <= 0:
        logger.warning("Invalid average range: %d", average_range)
        raise HTTPException(status_code=400, detail="Average range must be positive")

    start_tzaware, end_tzware = set_or_adjust_start_and_end_time(
        db, TelemetryTable, None, start_time, end_time
    )

    interval_length_seconds: float = float(average_range) / 1000.0
    interval_duration = timedelta(milliseconds=average_range)

    if not start_tzaware or not end_tzware or end_tzware < start_tzaware:
        logger.debug("No valid time range found for data rates")
        return OverallDataRates(grouped_data_rates=[])
    try:
        current_interval_start = start_tzaware
        collected_data_rates = {}
        while current_interval_start < end_tzware:
            current_interval_end = current_interval_start + interval_duration

            grouped_size_sum_query = (
                select(
                    TelemetryTable.device_id,
                    func.sum(TelemetryTable.size) / interval_length_seconds,
                )
                .where(
                    TelemetryTable.timestamp >= current_interval_start,
                    TelemetryTable.timestamp < current_interval_end,
                )
                .group_by(TelemetryTable.device_id)
            )
            data_rate_groups = db.exec(grouped_size_sum_query).all()
            for device_id, data_rate in data_rate_groups:
                dataRateWithTimeStamp = DeviceDataRateValueWithTimeStamp(
                    value=data_rate if data_rate else 0,
                    timestamp=current_interval_start,
                )
                if device_id not in collected_data_rates:
                    collected_data_rates[device_id] = []
                collected_data_rates[device_id].append(dataRateWithTimeStamp)
            current_interval_start = current_interval_end

        grouped_data_rates = [
            DeviceDataRates(device_id=device_id, data_rates=data_rates)
            for device_id, data_rates in collected_data_rates.items()
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

    return OverallDataRates(grouped_data_rates=grouped_data_rates)


@router.get("/{device_id}/data_rates", response_model=DeviceDataRates)
async def get_device_data_bandwidth_rates(
    device_id: Annotated[
        str, Path(description="The ID of the device to retrieve telemetries")
    ],
    start_time: Optional[datetime] = Query(
        None, description="Start time for data rate calculation"
    ),
    end_time: Optional[datetime] = Query(
        None, description="End time for data rate calculation"
    ),
    average_range: Optional[int] = Query(
        10000, description="Time range (in milliseconds) for averaging the data rate"
    ),
    db: Session = Depends(get_db),
) -> DeviceDataRates:
    """
    Calculate the network bandwidth (data rate).

    This endpoint computes the data rate (bandwidth usage) of the telemetries received over a given
    time range. The `start_time` and `end_time` parameters can be used to specify the
    period during which the data rate will be calculated. The `average_range` parameter
    allows you to average the data rate over a specific time interval. Each element of data_rate is
    calculated as sum_over_all_telemetries_in_interval(telemetry_size_in_Kb) / interval_size_in_seconds.
    \f
    Args:
        device_id (str): The ID of the device to retrieve telemetries
        start_time (Optional[datetime]): Start time for data rate calculation.
        end_time (Optional[datetime]): End time for data rate calculation.
        average_range (Optional[int]): Time range in milliseconds to average the data rate (default is 10 seconds).

    Returns:
        DeviceDataRates: Data rate statistics for the specified time range.
    """
    if start_time and end_time and start_time > end_time:
        raise HTTPException(
            status_code=400, detail="Start time cannot be after end time"
        )

    if average_range <= 0:
        raise HTTPException(status_code=400, detail="Average range must be positive")

    start_tzaware, end_tzware = set_or_adjust_start_and_end_time(
        db, TelemetryTable, device_id, start_time, end_time
    )

    if not start_tzaware or not end_tzware or end_tzware < start_tzaware:
        return DeviceDataRates(device_id=device_id, data_rates=[])
    try:
        interval_duration = timedelta(milliseconds=average_range)
        current_interval_start = start_tzaware
        data_rates = []

        while current_interval_start < end_tzware:
            current_interval_end = current_interval_start + interval_duration

            size_sum_query = select(func.avg(TelemetryTable.size)).where(
                TelemetryTable.device_id == device_id,
                TelemetryTable.timestamp >= current_interval_start,
                TelemetryTable.timestamp < current_interval_end,
            )
            data_rate = db.exec(size_sum_query).one_or_none()
            dataRateWithTimeStamp = DeviceDataRateValueWithTimeStamp(
                value=data_rate if data_rate else 0,
                timestamp=current_interval_start,
            )
            data_rates.append(dataRateWithTimeStamp)

            current_interval_start = current_interval_end

        logger.debug("Data bandwidth rates calculated successfully")

    except Exception as e:
        logger.error(
            "Error calculating data bandwidth rates: %s", str(e), exc_info=True
        )
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

    return DeviceDataRates(device_id=device_id, data_rates=data_rates)


@router.get("/database_info", response_model=DatabaseInfo)
async def get_database_info(db: Session = Depends(get_db)):
    """
    Fetch database latest telemetry and used storage.
    \f
    Returns:
        DatabaseInfo: Database telemetry and data rate statistics.
    """
    logger.info("Received request to get database information")

    try:
        statement = select(TelemetryTable.timestamp).order_by(
            TelemetryTable.timestamp.asc()
        )
        oldest_timestamp = db.exec(statement).first()
        storage_size = (
            db.exec(text("SELECT pg_total_relation_size('TelemetryTable');")).scalar()
            / 1024
        )
        logger.debug("Successfully fetched database information")
    except Exception as e:
        logger.error("Error fetching database information: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

    if oldest_timestamp:
        return DatabaseInfo(
            oldest_timestamp=oldest_timestamp,
            storage_size=storage_size,
        )

    logger.warning("No telemetry data found in the database")
    return DatabaseInfo(
        oldest_timestamp=None,
        storage_size=0,
    )


@router.delete("/data/{device_id}", response_model=StatusResponse)
async def delete_device_data(
    device_id: Annotated[
        str, Path(description="The ID of the device to delete data from")
    ],
    api_client: ClientInferface = Depends(get_api_client),
) -> StatusResponse:
    """Deletes the saved images and inference metadata from a specific Edge Device.
    \f
    Returns:
        StatusResponse: Status message.
    """
    logger.info(f"Received request to delete data from device '{device_id}'")
    try:
        return api_client.delete_device_data(device_id=device_id)
    except Exception as e:
        logger.error(
            f"Error deleting data from device ID {device_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail=str(e))
