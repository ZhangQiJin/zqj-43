import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import MouthAnimation from "@/components/MouthAnimation";
import RhythmBar from "@/components/RhythmBar";
import { useAppStore } from "@/store/useAppStore";
import { scenes } from "@/data/scenes";

export default function RhythmPractice() {
  const {
    selectedScene,
    selectedSentence,
    setSelectedScene,
    setSelectedSentence,
    bpm,
    setBpm,
  } = useAppStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(-1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSentenceIndex = selectedScene.sentences.findIndex(
    (s) => s.id === selectedSentence?.id
  );

  const playAnimation = useCallback(() => {
    if (!selectedSentence) return;

    setIsPlaying(true);
    setCurrentChunkIndex(-1);

    const speedMultiplier = 80 / bpm;
    let delay = 0;

    selectedSentence.chunks.forEach((_, index) => {
      timeoutRef.current = setTimeout(() => {
        setCurrentChunkIndex(index);
      }, delay);

      delay += selectedSentence.chunks[index].duration * speedMultiplier;
    });

    timeoutRef.current = setTimeout(() => {
      setIsPlaying(false);
      setCurrentChunkIndex(-1);
    }, delay);
  }, [selectedSentence, bpm]);

  const stopAnimation = useCallback(() => {
    setIsPlaying(false);
    setCurrentChunkIndex(-1);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handlePrevSentence = () => {
    stopAnimation();
    const newIndex = Math.max(0, currentSentenceIndex - 1);
    setSelectedSentence(selectedScene.sentences[newIndex]);
  };

  const handleNextSentence = () => {
    stopAnimation();
    const newIndex = Math.min(
      selectedScene.sentences.length - 1,
      currentSentenceIndex + 1
    );
    setSelectedSentence(selectedScene.sentences[newIndex]);
  };

  const currentChunk =
    selectedSentence && currentChunkIndex >= 0
      ? selectedSentence.chunks[currentChunkIndex]
      : null;

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="w-full">
        <div className="flex items-center justify-center gap-2 mb-4">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => {
                stopAnimation();
                setSelectedScene(scene.id);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedScene.id === scene.id
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {scene.name}
            </button>
          ))}
        </div>
      </div>

      {selectedSentence && (
        <motion.div
          key={selectedSentence.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <p className="text-2xl font-bold text-gray-800">
            {selectedSentence.text}
          </p>
          <p className="text-gray-500">{selectedSentence.translation}</p>
        </motion.div>
      )}

      <div className="flex items-center justify-center gap-8">
        <button
          onClick={handlePrevSentence}
          disabled={currentSentenceIndex <= 0}
          className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={24} />
        </button>

        <MouthAnimation
          isPlaying={isPlaying}
          isStressed={currentChunk?.isStressed || false}
          size={220}
        />

        <button
          onClick={handleNextSentence}
          disabled={currentSentenceIndex >= selectedScene.sentences.length - 1}
          className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {selectedSentence && (
        <div className="w-full max-w-2xl">
          <RhythmBar
            chunks={selectedSentence.chunks}
            currentIndex={currentChunkIndex}
            isPlaying={isPlaying}
          />
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={isPlaying ? stopAnimation : playAnimation}
            className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white text-lg shadow-lg transition-all hover:scale-105 ${
              isPlaying
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause size={24} /> 暂停
              </>
            ) : (
              <>
                <Play size={24} /> 开始练习
              </>
            )}
          </button>

          <button
            onClick={() => {
              stopAnimation();
            }}
            className="flex items-center gap-2 px-6 py-4 rounded-full font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
          >
            <RotateCcw size={20} /> 重置
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">速度:</span>
          <input
            type="range"
            min="40"
            max="120"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-40 accent-blue-500"
          />
          <span className="text-blue-500 font-bold w-12">{bpm}%</span>
        </div>

        <p className="text-sm text-gray-500 text-center max-w-md">
          💡 提示：观察口型变化，注意红色标记的重音位置，跟着节奏在心里默念
        </p>
      </div>
    </div>
  );
}
