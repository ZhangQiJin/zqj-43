import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, CheckCircle, Volume2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function FocusModeTimer() {
  const {
    isFocusMode,
    focusModeTimeLeft,
    setFocusModeTimeLeft,
    stopFocusMode,
    focusModeDuration,
  } = useAppStore();

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitProgress, setExitProgress] = useState(0);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isFocusMode) return;

    const timer = setInterval(() => {
      setFocusModeTimeLeft(Math.max(0, focusModeTimeLeft - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isFocusMode, focusModeTimeLeft, setFocusModeTimeLeft]);

  useEffect(() => {
    if (isFocusMode && focusModeTimeLeft === 0) {
      setShowCompleteModal(true);
      playNotificationSound();
    }
  }, [focusModeTimeLeft, isFocusMode]);

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.3);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.6);
    } catch (e) {
      console.log("Audio not supported");
    }
  }, []);

  const handleExitPressStart = useCallback(() => {
    setExitProgress(0);
    const startTime = Date.now();
    const duration = 2000;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setExitProgress(progress);

      if (progress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        stopFocusMode();
        setShowExitConfirm(false);
        setExitProgress(0);
      }
    }, 16);
  }, [stopFocusMode]);

  const handleExitPressEnd = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (exitProgress < 100) {
      setExitProgress(0);
    }
  }, [exitProgress]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((focusModeDuration * 60 - focusModeTimeLeft) / (focusModeDuration * 60)) * 100;

  if (!isFocusMode) return null;

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-4 flex items-center gap-4 border border-gray-200"
        >
          <div className="relative">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#e5e7eb"
                strokeWidth="4"
                fill="none"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                stroke="#10b981"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - progress / 100)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">{formatTime(focusModeTimeLeft)}</p>
                <p className="text-xs text-gray-500">专注中</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowExitConfirm(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            title="退出专注模式"
          >
            <X size={20} />
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="text-amber-600" size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">退出专注模式？</h3>
                <p className="text-gray-500 text-sm">
                  长按下方按钮 2 秒确认退出。短暂的休息有助于保持专注力哦！
                </p>
              </div>

              <div className="relative">
                <button
                  onMouseDown={handleExitPressStart}
                  onMouseUp={handleExitPressEnd}
                  onMouseLeave={handleExitPressEnd}
                  onTouchStart={handleExitPressStart}
                  onTouchEnd={handleExitPressEnd}
                  className="relative w-full py-4 rounded-xl font-bold text-white overflow-hidden transition-all bg-gradient-to-r from-gray-400 to-gray-500"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600"
                    style={{ width: `${exitProgress}%` }}
                    transition={{ duration: 0 }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <X size={20} />
                    {exitProgress > 0 ? `${Math.round(exitProgress)}%` : "长按退出 (2秒)"}
                  </span>
                </button>
              </div>

              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  setExitProgress(0);
                }}
                className="w-full mt-3 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                继续专注
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center"
              >
                <CheckCircle className="text-white" size={40} />
              </motion.div>

              <h3 className="text-2xl font-bold text-gray-800 mb-2">专注完成！🎉</h3>
              <p className="text-gray-500 mb-6">
                太棒了！你已经专注了 {focusModeDuration} 分钟，休息一下吧！
              </p>

              <div className="flex items-center justify-center gap-2 mb-6 p-4 bg-green-50 rounded-xl">
                <Volume2 size={18} className="text-green-600" />
                <span className="text-sm text-green-700">提示音已播放</span>
              </div>

              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  stopFocusMode();
                }}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
              >
                完成，休息一下
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={audioRef} />
    </>
  );
}
