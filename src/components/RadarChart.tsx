import { motion } from "framer-motion";

interface RadarChartProps {
  pronunciationAccuracy: number;
  stressMatch: number;
  tempoConsistency: number;
  size?: number;
}

export default function RadarChart({
  pronunciationAccuracy,
  stressMatch,
  tempoConsistency,
  size = 280,
}: RadarChartProps) {
  const center = size / 2;
  const radius = size * 0.38;

  const dimensions = [
    { label: "发音准确度", value: pronunciationAccuracy, color: "#8B5CF6" },
    { label: "重音匹配度", value: stressMatch, color: "#EC4899" },
    { label: "语速一致性", value: tempoConsistency, color: "#06B6D4" },
  ];

  const angleStep = (2 * Math.PI) / dimensions.length;

  const getPoint = (value: number, index: number, r: number = radius) => {
    const angle = -Math.PI / 2 + index * angleStep;
    const scaledValue = Math.max(0, Math.min(100, value)) / 100;
    return {
      x: center + r * scaledValue * Math.cos(angle),
      y: center + r * scaledValue * Math.sin(angle),
    };
  };

  const polygonPoints = dimensions
    .map((d, i) => {
      const p = getPoint(d.value, i);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.1" />
          </radialGradient>
        </defs>

        {gridLevels.map((level, idx) => {
          const gridPoints = dimensions
            .map((_, i) => {
              const p = getPoint(level * 100, i, radius);
              return `${p.x},${p.y}`;
            })
            .join(" ");
          return (
            <polygon
              key={idx}
            points={gridPoints}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          );
        })}

        {dimensions.map((_, i) => {
          const p = getPoint(100, i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          );
        })}

        <motion.polygon
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          points={polygonPoints}
          fill="url(#radarGradient)"
          stroke="#8B5CF6"
          strokeWidth="2"
        />

        {dimensions.map((d, i) => {
          const p = getPoint(d.value, i);
          return (
            <motion.circle
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              cx={p.x}
              cy={p.y}
              r="6"
              fill={d.color}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}

        {dimensions.map((d, i) => {
          const labelRadius = radius + 35;
          const p = getPoint(100, i, labelRadius);
          const textAnchor =
            Math.abs(p.x - center) < 10
              ? "middle"
              : p.x > center
              ? "start"
              : "end";
          return (
            <g key={`label-${i}`}>
              <text
                x={p.x}
                y={p.y - 12}
                textAnchor={textAnchor}
                className="text-xs font-medium fill-gray-600"
              >
                {d.label}
              </text>
              <text
                x={p.x}
                y={p.y + 8}
                textAnchor={textAnchor}
                className="text-lg font-bold"
                fill={d.color}
              >
                {d.value}分
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
