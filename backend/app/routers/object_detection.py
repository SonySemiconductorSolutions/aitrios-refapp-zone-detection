import logging
from datetime import datetime
from datetime import timedelta
from typing import Annotated
from typing import Optional

from app.database.db import get_db
from app.database.models import TelemetryTable
from app.database.utils import set_or_adjust_start_and_end_time
from app.routers.processing import logger
from app.routers.processing import router
from app.schemas.processing import ObjectCounts
from app.schemas.processing import ObjectCountsWithTimeStamp
from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Path
from fastapi import Query
from sqlalchemy.sql import desc
from sqlalchemy.sql import func
from sqlmodel import select
from sqlmodel import Session


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/object_detection", tags=["Object Detection"])


@router.get("/counts/{device_id}", response_model=ObjectCountsWithTimeStamp | None)
async def get_object_counts(
    device_id: Annotated[
        str, Path(description="The ID of the device to retrieve information for")
    ],
    db: Session = Depends(get_db),
) -> ObjectCountsWithTimeStamp | None:
    """
    Get last available number of detected objects.
    \f
    Args:
        device_id (str): ID of the device whose last object count should be returned.

    Returns:
        ObjectCount: A list of object count data responses.
    """
    logger.debug(f"Fetching last object count for device: {device_id}")

    try:
        db_query = (
            select(TelemetryTable)
            .where(
                TelemetryTable.device_id == device_id,
            )
            .order_by(desc(TelemetryTable.timestamp))
            .limit(1)
        )
        result_row = db.exec(db_query).one_or_none()

        if result_row:
            object_count = ObjectCountsWithTimeStamp(
                object_count=result_row.object_count,
                object_count_in_zone=result_row.object_count_in_zone,
                timestamp=result_row.timestamp,
            )
            logger.info(
                f"Successfully retrieved last object count for device: {device_id}"
            )
        else:
            object_count = None
            logger.info(f"No object count found for device: {device_id}")

    except Exception as e:
        logger.error(
            f"Error while retrieving last object count for device {device_id}: {e}, exc_info=True"
        )
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

    return object_count


@router.get("/counts/{device_id}/last", response_model=ObjectCounts)
async def get_last_object_count(
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
) -> ObjectCounts:
    """
    Get average number of detected objects, optionally limited to a time range.

    If `start_time` and `end_time` are provided, the data
    will be filtered to include only information between these timestamps. Otherwise,
    all available data will be returned. The `average_range` parameter
    allows you to average the data rate over a specific time interval.
    \f
    Args:
        start_time (Optional[datetime]): Start time for filtering.
        end_time (Optional[datetime]): End time for filtering.
        average_range (Optional[int]): Time range in milliseconds to average object counts (default is 10 seconds).

    Returns:
        ObjectCounts: A list of object count data responses.
    """
    logger.debug(f"Fetching object counts for device: {device_id}")

    if average_range <= 0:
        logger.warning("Invalid average_range provided")
        raise HTTPException(status_code=400, detail="Average range must be positive")

    if start_time and end_time and start_time > end_time:
        logger.warning("Start time is after end time")
        raise HTTPException(
            status_code=400, detail="Start time cannot be after end time"
        )

    start_tzaware, end_tzware = set_or_adjust_start_and_end_time(
        db, TelemetryTable, device_id, start_time, end_time
    )

    if not start_tzaware or not end_tzware or end_tzware < start_tzaware:
        logger.info("No object counts available for the provided time range")
        return ObjectCounts(object_counts=[])

    try:
        interval_duration = timedelta(milliseconds=average_range)
        current_interval_start = start_tzaware
        object_counts = []
        while current_interval_start + interval_duration <= end_tzware:
            current_interval_end = current_interval_start + interval_duration

            db_query = select(
                func.avg(TelemetryTable.object_count),
                func.avg(TelemetryTable.object_count_in_zone),
            ).where(
                TelemetryTable.timestamp >= current_interval_start,
                TelemetryTable.timestamp < current_interval_end,
                TelemetryTable.device_id == device_id,
            )
            result_tuple = db.exec(db_query).one_or_none()
            if result_tuple != (None, None):
                object_counts.append(
                    ObjectCountsWithTimeStamp(
                        object_count=result_tuple[0],
                        object_count_in_zone=result_tuple[1],
                        timestamp=current_interval_start,
                    )
                )

            current_interval_start = current_interval_end

        logger.info(f"Successfully retrieved object counts for device: {device_id}")
    except Exception as e:
        logger.error(
            f"Error while retrieving object counts for device {device_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

    return ObjectCounts(object_counts=object_counts)
