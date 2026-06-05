import { motion } from "framer-motion";

interface MouthAnimationProps {
  isPlaying: boolean;
  isStressed: boolean;
  size?: number;
}

export default function MouthAnimation({
  isPlaying,
  isStressed,
  size = 200,
}: MouthAnimationProps) {
  const mouthOpenHeight = isStressed ? 60 : 40;
  const mouthWidth = isStressed ? 120 : 100;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 200 200">
        <ellipse
          cx="100"
          cy="100"
          rx="90"
          ry="85"
          fill="#FFE4C4"
          stroke="#DEB887"
          strokeWidth="2"
        />

        <ellipse cx="70" cy="80" rx="15" ry="10" fill="#FFF0E0" />
        <ellipse cx="130" cy="80" rx="15" ry="10" fill="#FFF0E0" />

        <g>
          <motion.path
            d={`M 60 130 Q 100 130 140 130`}
            animate={
              isPlaying
                ? {
                    d: [
                      `M 60 130 Q 100 130 140 130`,
                      `M 60 130 Q 100 ${130 + mouthOpenHeight} 140 130`,
                      `M 60 130 Q 100 130 140 130`,
                    ],
                  }
                : {}
            }
            transition={{
              duration: 0.4,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut",
            }}
            fill="#8B4513"
            stroke="#8B4513"
            strokeWidth="2"
          />

          <motion.ellipse
            cx="100"
            cy="130"
            rx={mouthWidth / 2}
            ry={5}
            fill="#CD5C5C"
            animate={
              isPlaying
                ? {
                    ry: [5, mouthOpenHeight / 2, 5],
                    rx: [mouthWidth / 2 - 10, mouthWidth / 2, mouthWidth / 2 - 10],
                  }
                : {}
            }
            transition={{
              duration: 0.4,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut",
            }}
          />

          <motion.path
            d={`M 65 125 Q 100 125 135 125`}
            animate={
              isPlaying
                ? {
                    d: [
                      `M 65 125 Q 100 125 135 125`,
                      `M 65 125 Q 100 ${125 - 10} 135 125`,
                      `M 65 125 Q 100 125 135 125`,
                    ],
                  }
                : {}
            }
            transition={{
              duration: 0.4,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut",
            }}
            fill="none"
            stroke="#FFB6C1"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </g>

        {isPlaying && isStressed && (
          <motion.circle
            cx="100"
            cy="100"
            r="5"
            fill="#FF6B6B"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </svg>

      {isStressed && isPlaying && (
        <motion.div
          className="absolute top-2 right-2 w-3 h-3 rounded-full bg-red-500"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
      )}
    </div>
  );
}
