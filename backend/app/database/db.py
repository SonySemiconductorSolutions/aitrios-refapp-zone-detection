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
import os
from datetime import datetime
from datetime import timedelta
from datetime import timezone

from app.database import models
from sqlalchemy import text
from sqlmodel import create_engine
from sqlmodel import Session


logger = logging.getLogger(__name__)
engine = create_engine(os.environ.get("SQLALCHEMY_DATABASE_URI"))


def cleanup_old_entries():
    """Removes telemetry entries older than 1 hour."""
    with Session(engine) as session:
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=1)
        logger.info("Cleaning old entries")
        session.exec(
            text("DELETE FROM TelemetryTable WHERE created_at < :cutoff_time"),
            params={"cutoff_time": cutoff_time},
        )
        session.commit()


async def periodic_cleanup():
    """Runs the cleanup task every minute in the background."""
    while True:
        try:
            cleanup_old_entries()
        except Exception as e:
            logger.error(f"Error during cleanup: {e}", flush=True)
        await asyncio.sleep(60)


def init_db():
    """Initialize the database schema."""
    models.SQLModel.metadata.create_all(engine)


def get_db():
    """Provides a new session for each request and ensures it's closed afterwards."""
    with Session(engine) as session:
        yield session
