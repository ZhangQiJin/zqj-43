import { motion } from "framer-motion";
import { Chunk } from "@/data/scenes";

interface RhythmBarProps {
  chunks: Chunk[];
  currentIndex: number;
  isPlaying: boolean;
}

export default function RhythmBar({
  chunks,
  currentIndex,
  isPlaying,
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

            return (
              <motion.div
                key={index}
                className="relative h-full flex items-center justify-center"
                style={{ width: `${widthPercent}%` }}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: isActive ? 1 : isPast ? 0.6 : 0.3,
                  y: 0,
                  backgroundColor: isActive
                    ? chunk.isStressed
                      ? "#EF4444"
                      : "#3B82F6"
                    : isPast
                    ? chunk.isStressed
                      ? "#FCA5A5"
                      : "#93C5FD"
                    : "#E5E7EB",
                  scale: isActive ? 1.02 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {chunk.isStressed && (
                  <div className="absolute top-1 w-2 h-2 rounded-full bg-red-500" />
                )}
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-white" : "text-gray-500"
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

      <div className="flex items-center justify-center gap-4">
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
      </div>
    </div>
  );
}
