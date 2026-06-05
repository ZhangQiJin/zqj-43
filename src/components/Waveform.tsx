import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ZoomIn, ZoomOut, Move, Maximize2 } from "lucide-react";
import { Chunk } from "@/data/scenes";

interface WaveformProps {
  userWaveform: number[];
  chunks: Chunk[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
}

export default function Waveform({
  userWaveform,
  chunks,
  currentTime,
  duration,
  isPlaying,
  onSeek,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartOffset, setDragStartOffset] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(200);

  const totalDuration = chunks.reduce((sum, chunk) => sum + chunk.duration, 0);

  const referenceWaveform = chunks.flatMap((chunk) => {
    const points = Math.max(3, Math.floor((chunk.duration / totalDuration) * 200));
    const baseAmplitude = chunk.isStressed ? 0.8 : 0.4;
    return Array.from({ length: points }, (_, i) => {
      const t = i / points;
      const envelope = Math.sin(t * Math.PI);
      return baseAmplitude * envelope * (0.8 + Math.random() * 0.4);
    });
  });

  const normalizeWaveform = (data: number[], targetLength: number) => {
    if (data.length === 0) return Array(targetLength).fill(0);
    const result: number[] = [];
    const step = data.length / targetLength;
    for (let i = 0; i < targetLength; i++) {
      const start = Math.floor(i * step);
      const end = Math.floor((i + 1) * step);
      let sum = 0;
      for (let j = start; j < Math.min(end, data.length); j++) {
        sum += data[j];
      }
      result.push(sum / (end - start));
    }
    return result;
  };

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const visibleStart = offset / zoom;
    const visibleEnd = (offset + width) / zoom;
    const visibleRange = visibleEnd - visibleStart;

    const drawWave = (
      data: number[],
      color: string,
      lineWidth: number,
      alpha = 1
    ) => {
      if (data.length === 0) return;

      const normalized = normalizeWaveform(data, Math.floor(width * zoom));
      const startIdx = Math.floor(visibleStart * normalized.length / (width * zoom));
      const endIdx = Math.ceil(visibleEnd * normalized.length / (width * zoom));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      for (let i = startIdx; i <= endIdx && i < normalized.length; i++) {
        const x = ((i / normalized.length) * width * zoom - offset);
        const y = centerY - normalized[i] * (height / 2 - 10);
        if (i === startIdx) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      ctx.beginPath();
      for (let i = startIdx; i <= endIdx && i < normalized.length; i++) {
        const x = ((i / normalized.length) * width * zoom - offset);
        const y = centerY + normalized[i] * (height / 2 - 10);
        if (i === startIdx) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      ctx.restore();
    };

    drawWave(referenceWaveform, "#93C5FD", 2, 0.6);

    if (userWaveform.length > 0) {
      drawWave(userWaveform, "#10B981", 2.5, 1);
    }

    const chunkStartTimes: number[] = [];
    let acc = 0;
    chunks.forEach((chunk) => {
      chunkStartTimes.push(acc);
      acc += chunk.duration;
    });

    chunkStartTimes.forEach((time, index) => {
      const x = (time / totalDuration) * width * zoom - offset;
      if (x >= 0 && x <= width) {
        ctx.strokeStyle = chunks[index]?.isStressed ? "#EF4444" : "#D1D5DB";
        ctx.lineWidth = chunks[index]?.isStressed ? 2 : 1;
        ctx.setLineDash(chunks[index]?.isStressed ? [] : [4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    if (duration > 0) {
      const playheadX = (currentTime / duration) * width * zoom - offset;
      if (playheadX >= 0 && playheadX <= width) {
        const gradient = ctx.createLinearGradient(playheadX - 30, 0, playheadX + 30, 0);
        gradient.addColorStop(0, "rgba(251, 191, 36, 0)");
        gradient.addColorStop(0.5, "rgba(251, 191, 36, 0.3)");
        gradient.addColorStop(1, "rgba(251, 191, 36, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(playheadX - 30, 0, 60, height);

        ctx.strokeStyle = "#F59E0B";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, height);
        ctx.stroke();

        ctx.fillStyle = "#F59E0B";
        ctx.beginPath();
        ctx.arc(playheadX, 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(playheadX, 10, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [userWaveform, chunks, currentTime, duration, zoom, offset, referenceWaveform, totalDuration]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setCanvasWidth(containerRef.current.clientWidth);
        setCanvasHeight(200);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvasWidth * window.devicePixelRatio;
      canvas.height = canvasHeight * window.devicePixelRatio;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    }
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(1, Math.min(5, zoom * delta));
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const zoomRatio = mouseX / rect.width;
      const newOffset = Math.max(0, offset + (mouseX * (newZoom - zoom)) / newZoom - zoomRatio * (newZoom - zoom) * rect.width / newZoom);
      setZoom(newZoom);
      setOffset(Math.max(0, Math.min(newOffset, (canvasWidth * newZoom) - canvasWidth)));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartOffset(offset);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = dragStartX - e.clientX;
      const newOffset = Math.max(0, Math.min(dragStartOffset + deltaX, (canvasWidth * zoom) - canvasWidth));
      setOffset(newOffset);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isDragging || !onSeek || duration <= 0) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const clickX = e.clientX - rect.left;
      const time = ((clickX + offset) / (canvasWidth * zoom)) * duration;
      onSeek(Math.max(0, Math.min(time, duration)));
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(5, zoom * 1.3);
    setZoom(newZoom);
    setOffset(Math.min(offset, (canvasWidth * newZoom) - canvasWidth));
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(1, zoom / 1.3);
    setZoom(newZoom);
    setOffset(Math.min(offset, (canvasWidth * newZoom) - canvasWidth));
  };

  const handleReset = () => {
    setZoom(1);
    setOffset(0);
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-2 rounded-md hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="缩小"
            >
              <ZoomOut size={16} />
            </button>
            <span className="px-2 text-xs font-medium text-gray-600 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 5}
              className="p-2 rounded-md hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="放大"
            >
              <ZoomIn size={16} />
            </button>
          </div>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
            title="重置视图"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-400 rounded-full" />
            <span className="text-gray-500">参考节奏</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-emerald-500 rounded-full" />
            <span className="text-gray-500">你的录音</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-500">重音标记</span>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
        style={{ cursor: isDragging ? "grabbing" : zoom > 1 ? "grab" : "pointer" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleCanvasClick}
          className="block"
          style={{ width: canvasWidth, height: canvasHeight }}
        />

        {zoom > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 bg-black/60 rounded-full text-white text-xs">
            <Move size={12} />
            <span>拖拽平移 · 滚轮缩放</span>
          </div>
        )}
      </div>

      {duration > 0 && (
        <div className="flex justify-between text-xs text-gray-400 px-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
