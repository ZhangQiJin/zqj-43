import { motion } from "framer-motion";
import { Chunk } from "@/data/scenes";

interface RhythmBarProps {
  chunks: Chunk[];
  currentIndex: number;
  isPlaying: boolean;
  highlightedIndex?: number | null;
}

export default function RhythmBar({
  chunks,
  currentIndex,
  isPlaying,
  highlightedIndex = null,
}: RhythmBarProps) {
  const totalDuration = chunks.reduce((sum, chunk) => sum + chunk.duration, 0);

  return (
    <div className="w-full space-y-4">
      <div className="relative h-16 bg-gray-100 rounded-xl overflow-hidden">
        <div className="absolute inset-0 flex">
          {chunks.map((chunk, index) => {
            const widthPercent = (chunk.duration / totalDuration) * 100;
            const isActive = index === currentIndex;
            const isPast = index < currentIndex;
            const isHighlighted = index === highlightedIndex;

            let bgColor = "#E5E7EB";
            if (isActive) {
              bgColor = chunk.isStressed ? "#EF4444" : "#3B82F6";
            } else if (isPast) {
              bgColor = chunk.isStressed ? "#FCA5A5" : "#93C5FD";
            } else if (isHighlighted) {
              bgColor = "#A855F7";
            }

            let opacity = isHighlighted ? 0.8 : 0.3;
            if (isActive) opacity = 1;
            else if (isPast) opacity = 0.6;

            return (
              <motion.div
                key={index}
                className="relative h-full flex items-center justify-center"
                style={{ width: `${widthPercent}%` }}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity,
                  y: 0,
                  backgroundColor: bgColor,
                  scale: isActive ? 1.02 : isHighlighted ? 1.01 : 1,
                  boxShadow: isHighlighted && !isActive ? "0 0 0 2px #7C3AED" : "none",
                }}
                transition={{ duration: 0.2 }}
              >
                {chunk.isStressed && (
                  <div className="absolute top-1 w-2 h-2 rounded-full bg-red-500" />
                )}
                {isHighlighted && !isActive && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-600" />
                )}
                <span
                  className={`text-xs font-medium ${
                    isActive || isHighlighted ? "text-white" : "text-gray-500"
                  }`}
                >
                  {chunk.text.trim()}
                </span>
              </motion.div>
            );
          })}
        </div>

        {isPlaying && currentIndex >= 0 && (
          <motion.div
            className="absolute top-0 bottom-0 w-1 bg-yellow-400 shadow-lg z-10"
            initial={{ left: 0 }}
            animate={{
              left: `${(chunks
                .slice(0, currentIndex + 1)
                .reduce((sum, c) => sum + c.duration, 0) /
                totalDuration) *
                100}%`,
            }}
            transition={{ duration: 0.2, ease: "linear" }}
          />
        )}
      </div>

      <div className="flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-gray-600">重音</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-600">当前</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <span className="text-sm text-gray-600">待读</span>
        </div>
        {highlightedIndex !== null && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm text-gray-600">薄弱切片</span>
          </div>
        )}
      </div>
    </div>
  );
}
