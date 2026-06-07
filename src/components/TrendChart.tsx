import { useEffect, useRef, useState } from "react";
import { TestTrendRecord, formatTime } from "@/lib/trendStorage";

interface TrendChartProps {
  records: TestTrendRecord[];
}

export default function TrendChart({ records }: TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    visible: boolean;
    content: { time: string; score: number; accuracy: number; avgDeviation: number };
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 320;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const padding = { top: 30, right: 60, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight);

    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }

    ctx.fillStyle = "#6b7280";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      const value = Math.round(100 - (100 / 5) * i);
      ctx.fillText(String(value), padding.left - 10, y);
    }

    if (records.length === 0) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "暂无测试记录，完成测试后将显示趋势图表",
        width / 2,
        height / 2
      );
      return;
    }

    const sortedRecords = [...records].reverse();
    const pointCount = sortedRecords.length;

    const getX = (index: number) => {
      if (pointCount === 1) return padding.left + chartWidth / 2;
      return padding.left + (chartWidth / (pointCount - 1)) * index;
    };

    const getY = (value: number, min: number, max: number) => {
      const range = max - min || 1;
      return padding.top + chartHeight - ((value - min) / range) * chartHeight;
    };

    const drawLine = (
      data: number[],
      color: string,
      min: number,
      max: number,
      lineWidth = 2
    ) => {
      if (data.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      data.forEach((value, index) => {
        const x = getX(index);
        const y = getY(value, min, max);
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    };

    const drawPoints = (
      data: number[],
      color: string,
      min: number,
      max: number,
      radius = 4
    ) => {
      data.forEach((value, index) => {
        const x = getX(index);
        const y = getY(value, min, max);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    };

    const scoreData = sortedRecords.map((r) => r.score);
    const accuracyData = sortedRecords.map((r) => r.accuracy);
    const deviationData = sortedRecords.map((r) =>
      Math.max(0, 100 - r.avgDeviation / 5)
    );

    const allValues = [...scoreData, ...accuracyData, ...deviationData];
    const minVal = Math.max(0, Math.min(...allValues) - 10);
    const maxVal = Math.min(100, Math.max(...allValues) + 10);

    drawLine(scoreData, "#10b981", minVal, maxVal, 2.5);
    drawLine(accuracyData, "#3b82f6", minVal, maxVal, 2);
    drawLine(deviationData, "#f59e0b", minVal, maxVal, 2);

    drawPoints(scoreData, "#10b981", minVal, maxVal, 5);
    drawPoints(accuracyData, "#3b82f6", minVal, maxVal, 4);
    drawPoints(deviationData, "#f59e0b", minVal, maxVal, 4);

    ctx.fillStyle = "#6b7280";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    sortedRecords.forEach((record, index) => {
      const x = getX(index);
      const label = formatTime(record.timestamp);
      ctx.save();
      ctx.translate(x, padding.top + chartHeight + 10);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });

    const legendY = height - 15;
    const legendItems = [
      { label: "综合得分", color: "#10b981" },
      { label: "准确率", color: "#3b82f6" },
      { label: "稳定性得分", color: "#f59e0b" },
    ];

    let legendX = padding.left;
    legendItems.forEach((item) => {
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, legendY - 8, 12, 12);
      ctx.fillStyle = "#374151";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(item.label, legendX + 18, legendY - 2);
      legendX += 100;
    });

    const handleMouseMove = (e: MouseEvent) => {
      const canvasRect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - canvasRect.left;

      let hoveredIndex = -1;
      let minDist = Infinity;

      sortedRecords.forEach((_, index) => {
        const x = getX(index);
        const dist = Math.abs(mouseX - x);
        if (dist < minDist && dist < 30) {
          minDist = dist;
          hoveredIndex = index;
        }
      });

      if (hoveredIndex >= 0) {
        const record = sortedRecords[hoveredIndex];
        const x = getX(hoveredIndex);
        setTooltip({
          x,
          y: padding.top + chartHeight / 2,
          visible: true,
          content: {
            time: formatTime(record.timestamp),
            score: record.score,
            accuracy: record.accuracy,
            avgDeviation: record.avgDeviation,
          },
        });
      } else {
        setTooltip(null);
      }
    };

    const handleMouseLeave = () => {
      setTooltip(null);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [records]);

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full cursor-crosshair"
        style={{ height: "320px" }}
      />
      {tooltip && tooltip.visible && (
        <div
          className="absolute pointer-events-none bg-gray-800 text-white px-3 py-2 rounded-lg text-xs shadow-lg z-10"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 40,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-medium mb-1">{tooltip.content.time}</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>综合得分: {tooltip.content.score}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>准确率: {tooltip.content.accuracy}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>平均偏差: {tooltip.content.avgDeviation}ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
