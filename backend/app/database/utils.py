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
from typing import Optional

from sqlmodel import select
from sqlmodel import Session
from sqlmodel import SQLModel


def get_oldest_timestamp(
    db: Session, dbTableWithTimestamp: SQLModel, device_id: Optional[str] = None
) -> datetime:
    """Obtain the oldest timestamp present in the data base table dbTableWithTimestamp"""
    if device_id is None:
        return db.exec(
            select(dbTableWithTimestamp.timestamp)
            .order_by(dbTableWithTimestamp.timestamp)
            .limit(1)
        ).one_or_none()
    else:
        return db.exec(
            select(dbTableWithTimestamp.timestamp)
            .where(dbTableWithTimestamp.device_id == device_id)
            .order_by(dbTableWithTimestamp.timestamp)
            .limit(1)
        ).one_or_none()


def get_newest_timestamp(
    db: Session, dbTableWithTimestamp: SQLModel, device_id: Optional[str] = None
) -> datetime:
    """Obtain the newest timestamp present in the data base table dbTableWithTimestamp"""
    if device_id is None:
        return db.exec(
            select(dbTableWithTimestamp.timestamp)
            .order_by(dbTableWithTimestamp.timestamp.desc())
            .limit(1)
        ).one_or_none()
    else:
        return db.exec(
            select(dbTableWithTimestamp.timestamp)
            .where(dbTableWithTimestamp.device_id == device_id)
            .order_by(dbTableWithTimestamp.timestamp.desc())
            .limit(1)
        ).one_or_none()


def set_or_adjust_start_and_end_time(
    db: Session,
    dbTable: SQLModel,
    device_id: Optional[str],
    start_time: Optional[datetime],
    end_time: Optional[datetime],
) -> tuple[datetime, datetime]:
    """Return timezone-aware values of the start_time and end_time based on the content of the database table

    This endpoint checks the available timestamps in the data base.
    If `start_time` is not provided, then start_tzaware is set to be the oldest timestamp in the database.
    If `end_time` is not provided, then end_tzaware is set to be the newest timestamp in the database.
    `start_tzaware` is calculated as max(oldest_timestamp, start_time). `end_tzaware` is not adjusted.

    \f
    Args:
        db (Session): Database session.
        dbTable (SQLModel): Database table with timestamp column.
        start_time (Optional[datetime]): Start time.
        end_time (Optional[datetime]): End time.

    Returns:
        start_tzaware, end_tzaware(tuple[datetime, datetime])): Timezone-aware corrected start and end times.
    """
    oldest_timestamp = get_oldest_timestamp(db, dbTable, device_id)
    if not oldest_timestamp:  # database empty
        return None, None

    start_tzaware = (
        start_time.replace(tzinfo=oldest_timestamp.tzinfo) if start_time else None
    )
    end_tzware = end_time.replace(tzinfo=oldest_timestamp.tzinfo) if end_time else None

    start_tzaware = (
        max(start_tzaware, oldest_timestamp) if start_tzaware else oldest_timestamp
    )

    if end_tzware is None:
        end_tzware = get_newest_timestamp(db, dbTable, device_id)
    return start_tzaware, end_tzware
