/**
 * Copyright 2025 Sony Semiconductor Solutions Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, MouseEvent } from "react";
import { Point } from "../../../types/types";

interface CanvasProps {
  height: number;
  width: number;
  imageSrc: string;
  dragStart: Point;
  dragEnd: Point;
  setDragStart: (coordinates: Point) => void;
  setDragEnd: (coordinates: Point) => void;
  editable: boolean;
  inferenceData: any;
}

function Canvas({
  height,
  width,
  imageSrc,
  dragStart,
  dragEnd,
  setDragStart: setDragStart,
  setDragEnd: setDragEnd,
  editable,
  inferenceData,
}: CanvasProps) {
  const background = useRef<HTMLImageElement>(new Image()).current;
  const canvasReference = useRef<HTMLCanvasElement | null>(null);
  const contextReference = useRef<CanvasRenderingContext2D | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  function clearCanvas() {
    const canvas: HTMLCanvasElement = canvasReference.current!;
    const context: CanvasRenderingContext2D = canvas.getContext("2d")!;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (imageSrc !== "") {
      context.drawImage(background, 0, 0, canvas.width, canvas.height);
    }
  }

  function drawZone(context: CanvasRenderingContext2D) {
    context.fillRect(
      dragStart.x,
      dragStart.y,
      dragEnd.x - dragStart.x,
      dragEnd.y - dragStart.y,
    );
  }

  function reflashCanvas() {
    const canvas: HTMLCanvasElement = canvasReference.current!;
    const context: CanvasRenderingContext2D = canvas.getContext("2d")!;
    clearCanvas();
    drawZone(context);
  }

  function drawBoundingBoxes(context: CanvasRenderingContext2D) {
    if (inferenceData?.perception?.object_detection_list) {
      inferenceData.perception.object_detection_list.forEach((det: any) => {
        const { left, top, right, bottom } = det.bounding_box;
        context.strokeStyle = det.zone_flag ? "green" : "red";
        context.lineWidth = 2;
        context.strokeRect(left, top, right - left, bottom - top);
      });
    }
  }

  function handleMouseDown(e: MouseEvent) {
    clearCanvas();
    setDragStart({
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    });
    setDragEnd({ x: NaN, y: NaN });
    setIsPressed(true);
  }

  function handleMouseUp(_e: MouseEvent) {
    if (!isPressed) return;
    setIsPressed(false);
    reflashCanvas();
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isPressed) return;
    const context: CanvasRenderingContext2D = contextReference.current!;

    const current: Point = {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    };
    const diff = {
      x: current.x - dragStart.x,
      y: current.y - dragStart.y,
    };

    clearCanvas();

    context.save();
    context.beginPath();
    context.lineWidth = 0.5;
    context.setLineDash([7, 2]);
    context.strokeStyle = "rgb(255, 82, 0)";
    context.strokeRect(dragStart.x, dragStart.y, diff.x, diff.y);
    context.restore();

    setDragEnd({
      x: current.x,
      y: current.y,
    });
  }

  function handleMouseLeave(_e: MouseEvent) {
    if (!isPressed) return;
    setIsPressed(false);
    reflashCanvas();
  }

  function updateCanvas() {
    if (canvasReference == null || canvasReference.current == null) {
      return;
    }

    const canvas: HTMLCanvasElement = canvasReference.current!;
    const context: CanvasRenderingContext2D = canvas.getContext("2d")!;

    clearCanvas();

    if (imageSrc !== "") {
      background.src = imageSrc;
      background.onload = () => {
        context.drawImage(background, 0, 0, canvas.width, canvas.height);
        drawBoundingBoxes(context);
        drawZone(context);
      };
    } else {
      drawBoundingBoxes(context);
      drawZone(context);
    }

    context.fillStyle = "rgba(255, 82, 0, 0.4)";
    contextReference.current = context;
  }

  useEffect(() => {
    updateCanvas();
  }, [imageSrc, inferenceData, dragStart, dragEnd]);

  return (
    <canvas
      height={height}
      width={width}
      ref={canvasReference}
      onMouseDown={editable ? handleMouseDown : undefined}
      onMouseMove={editable ? handleMouseMove : undefined}
      onMouseUp={editable ? handleMouseUp : undefined}
      onMouseLeave={editable ? handleMouseLeave : undefined}
    />
  );
}

export default Canvas;
