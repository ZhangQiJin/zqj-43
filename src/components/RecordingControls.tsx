import { motion } from "framer-motion";
import { Mic, Square, Play, Pause, RotateCcw } from "lucide-react";

interface RecordingControlsProps {
  isRecording: boolean;
  isPlaying: boolean;
  hasRecording: boolean;
  duration: number;
  volume: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
}

export default function RecordingControls({
  isRecording,
  isPlaying,
  hasRecording,
  duration,
  volume,
  onStartRecording,
  onStopRecording,
  onPlay,
  onPause,
  onReset,
}: RecordingControlsProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const volumeBars = Array.from({ length: 20 }, (_, i) => {
    const threshold = (i + 1) / 20;
    return volume >= threshold;
  });

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="text-sm font-medium text-gray-500">录音时长</div>
          <motion.div
            key={duration}
            initial={{ scale: 1 }}
            animate={{ scale: isRecording ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 0.3 }}
            className={`text-3xl font-mono font-bold ${
              isRecording ? "text-red-500" : "text-gray-700"
            }`}
          >
            {formatTime(duration)}
          </motion.div>
        </div>

        <div className="relative">
          {isRecording && (
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          <motion.button
            onClick={isRecording ? onStopRecording : onStartRecording}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isPlaying}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
              isRecording
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? (
              <Square size={32} className="text-white" fill="white" />
            ) : (
              <Mic size={32} className="text-white" />
            )}
          </motion.button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="text-sm font-medium text-gray-500">音量</div>
          <div className="flex items-end gap-0.5 h-8">
            {volumeBars.map((active, index) => (
              <motion.div
                key={index}
                className="w-1.5 rounded-full"
                initial={{ height: 4 }}
                animate={{
                  height: active ? 4 + (index / 20) * 28 : 4,
                  backgroundColor: active
                    ? index < 14
                      ? "#10B981"
                      : index < 18
                      ? "#F59E0B"
                      : "#EF4444"
                    : "#E5E7EB",
                }}
                transition={{ duration: 0.1 }}
              />
            ))}
          </div>
        </div>
      </div>

      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full">
            <motion.div
              className="w-2 h-2 rounded-full bg-red-500"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-red-600">
              正在录音... 点击停止按钮结束
            </span>
          </div>
        </motion.div>
      )}

      {hasRecording && !isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3"
        >
          <motion.button
            onClick={isPlaying ? onPause : onPlay}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white shadow-lg transition-all ${
              isPlaying
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-emerald-500 hover:bg-emerald-600"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause size={20} /> 暂停播放
              </>
            ) : (
              <>
                <Play size={20} /> 播放录音
              </>
            )}
          </motion.button>

          <motion.button
            onClick={onReset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
          >
            <RotateCcw size={20} /> 重新录制
          </motion.button>
        </motion.div>
      )}

      {!isRecording && !hasRecording && (
        <div className="text-center">
          <p className="text-sm text-gray-500">
            💡 点击麦克风按钮开始录制你的跟读声音
          </p>
        </div>
      )}
    </div>
  );
}
