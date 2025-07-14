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
import enum
import logging
from base64 import b64decode
from typing import Any

from app.data_management.SmartCamera.BoundingBox import BoundingBox
from app.data_management.SmartCamera.BoundingBox2d import BoundingBox2d
from app.data_management.SmartCamera.ObjectDetectionTop import ObjectDetectionTop
from app.data_management.SmartCameraV2.BoundingBox2d import (
    BoundingBox2d as BoundingBox2dV2,
)
from app.data_management.SmartCameraV2.GeneralObject import (
    GeneralObject as GeneralObjectV2,
)
from app.data_management.SmartCameraV2.ObjectDetectionTop import (
    ObjectDetectionTop as ObjectDetectionTopV2,
)


logger = logging.getLogger(__name__)


class InferenceFormat(enum.Enum):
    ZONE_DETECTION = "ZONE_DETECTION"
    OBJECT_DETECTION_EXPANDED = "OBJECT_DETECTION_EXPANDED"


def deserialize(
    inference_data: str, inference_format: InferenceFormat
) -> ObjectDetectionTop | ObjectDetectionTopV2 | None:
    """
    Deserialize the given base64-encoded inference data into a FlatBuffer object.

    Args:
        inference_data (str): Base64-encoded inference data.

    Returns:
        Union[ObjectDetectionTop, None]: Deserialized ObjectDetectionTop or ObjectDetectionTopV2 FlatBuffer object, or None if deserialization fails.
    """
    try:
        decoded_inference = b64decode(inference_data)
        if inference_format == InferenceFormat.OBJECT_DETECTION_EXPANDED:
            return ObjectDetectionTopV2.GetRootAs(decoded_inference, 0)
        elif inference_format == InferenceFormat.ZONE_DETECTION:
            return ObjectDetectionTop.GetRootAsObjectDetectionTop(decoded_inference, 0)
        else:
            raise ValueError(
                f"Given inference format {inference_format} not in supported values: {[elem.value for elem in InferenceFormat]}"
            )
    except (ValueError, TypeError, AttributeError) as e:
        logger.error(f"Failed to deserialize inference data: {e}", exc_info=True)
        return None


def zone_detection_data_to_json(
    obj_detection_top: ObjectDetectionTop,
) -> dict[str, Any] | None:
    perception = obj_detection_top.Perception()
    object_list_length = perception.ObjectDetectionListLength()

    detection_list = []

    for i in range(object_list_length):
        obj = perception.ObjectDetectionList(i)
        detection = {
            "class_id": obj.ClassId(),
            "score": obj.Score(),
            "zone_flag": obj.Zoneflag(),
        }

        bbox_type = obj.BoundingBoxType()

        if bbox_type == BoundingBox.BoundingBox2d:
            bbox2d = BoundingBox2d()
            bbox_table = obj.BoundingBox()
            bbox2d.Init(bbox_table.Bytes, bbox_table.Pos)
            detection["bounding_box"] = {
                "left": bbox2d.Left(),
                "top": bbox2d.Top(),
                "right": bbox2d.Right(),
                "bottom": bbox2d.Bottom(),
            }
        else:
            detection["bounding_box"] = None

        detection_list.append(detection)

    result = {"perception": {"object_detection_list": detection_list}}

    return result


def expanded_object_detection_data_to_json(
    object_detection_root: ObjectDetectionTopV2,
) -> dict[str, Any] | None:

    return_detection_list = []
    object_list_length: int = (
        object_detection_root.Perception().ObjectDetectionListLength()
    )
    for i in range(object_list_length):
        obj: GeneralObjectV2 = object_detection_root.Perception().ObjectDetectionList(i)
        detection = {
            "class_id": obj.ClassId(),
            "score": obj.Score(),
            "zone_flag": True,
        }

        bbox: BoundingBox2dV2 = BoundingBox2dV2()
        bbox.Init(obj.BoundingBox().Bytes, obj.BoundingBox().Pos)
        detection["bounding_box"] = {
            "left": bbox.Left(),
            "top": bbox.Top(),
            "right": bbox.Right(),
            "bottom": bbox.Bottom(),
        }

        return_detection_list.append(detection)

    result = {"perception": {"object_detection_list": return_detection_list}}

    return result


def detection_data_to_json(
    obj_detection: ObjectDetectionTop | ObjectDetectionTopV2,
) -> dict[str, Any] | None:
    """
    Convert the deserialized ObjectDetectionTop FlatBuffer object into a JSON-compatible dictionary.

    Args:
        obj_detection_top (ObjectDetectionTop): Deserialized FlatBuffer object.

    Returns:
        Union[Dict[str, Any], None]: JSON-compatible dictionary representing the object detection data, or None if an error occurs.
    """
    try:
        if isinstance(obj_detection, ObjectDetectionTop):
            return zone_detection_data_to_json(obj_detection)
        elif isinstance(obj_detection, ObjectDetectionTopV2):
            return expanded_object_detection_data_to_json(obj_detection)
        else:
            raise ValueError(
                "Given object detection is not of supported values: [ObjectDetectionTop, ExpandedObjectDetectionTop]"
            )
    except AttributeError as e:
        logger.error(
            f"Attribute error while processing detection data: {e}", exc_info=True
        )
        return None
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return None


def get_object_count_from_telemetry(
    parsed_inference: dict[str, Any] | None, filter_in_zone: bool = False
):
    """
    Obtain the object count from the JSON-compatible dictionary.

    Args:
        parsed_inference (dict[str, Any] | None): Parsed inference in json-compatible format.
        filter_in_zone(bool): Count only the objects that have the in-zone flag set to True.

    Returns:
        Union[Dict[str, Any], None]: JSON-compatible dictionary representing the object detection data, or None if an error occurs.
    """
    if parsed_inference is None:
        return 0
    else:
        try:
            detections = parsed_inference["perception"]["object_detection_list"]
            if filter_in_zone:
                obj_count = 0
                for obj in detections:
                    if obj.get("zone_flag", False):
                        obj_count += 1
            else:
                obj_count = len(detections)
        except:
            obj_count = 0
        return obj_count
