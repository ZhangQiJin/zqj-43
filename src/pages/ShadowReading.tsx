import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Eye, EyeOff, Volume2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { scenes } from "@/data/scenes";

export default function ShadowReading() {
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
  const [showTranslation, setShowTranslation] = useState(true);
  const [showText, setShowText] = useState(true);
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

  const selectSentence = (index: number) => {
    stopAnimation();
    setSelectedSentence(selectedScene.sentences[index]);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="w-full">
        <div className="flex items-center justify-center gap-2 mb-6">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => {
                stopAnimation();
                setSelectedScene(scene.id);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedScene.id === scene.id
                  ? "bg-purple-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {scene.name}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-bold text-gray-700 mb-2">句型列表</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {selectedScene.sentences.map((sentence, index) => (
              <motion.div
                key={sentence.id}
                onClick={() => selectSentence(index)}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  selectedSentence?.id === sentence.id
                    ? "bg-purple-100 border-2 border-purple-400 shadow-md"
                    : "bg-white border border-gray-200 hover:border-purple-300"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <p
                  className={`text-sm font-medium ${
                    selectedSentence?.id === sentence.id
                      ? "text-purple-700"
                      : "text-gray-700"
                  }`}
                >
                  {sentence.text}
                </p>
                {showTranslation && (
                  <p className="text-xs text-gray-500 mt-1">
                    {sentence.translation}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  {sentence.chunks.map((chunk, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full flex-1 ${
                        chunk.isStressed ? "bg-red-400" : "bg-purple-300"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedSentence && (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSentence.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-lg"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-purple-500 font-medium">
                    句子 {currentSentenceIndex + 1} / {selectedScene.sentences.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowText(!showText)}
                      className={`p-2 rounded-lg transition-all ${
                        showText
                          ? "bg-purple-200 text-purple-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                      title={showText ? "隐藏原文" : "显示原文"}
                    >
                      {showText ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                      onClick={() => setShowTranslation(!showTranslation)}
                      className={`p-2 rounded-lg transition-all ${
                        showTranslation
                          ? "bg-purple-200 text-purple-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                      title={showTranslation ? "隐藏翻译" : "显示翻译"}
                    >
                      <Volume2 size={18} />
                    </button>
                  </div>
                </div>

                {showText && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {selectedSentence.chunks.map((chunk, index) => (
                        <motion.span
                          key={index}
                          className={`inline-block px-3 py-2 rounded-lg text-xl font-medium transition-all ${
                            index === currentChunkIndex
                              ? chunk.isStressed
                                ? "bg-red-500 text-white scale-110 shadow-lg"
                                : "bg-purple-500 text-white scale-110 shadow-lg"
                              : index < currentChunkIndex
                              ? chunk.isStressed
                                ? "bg-red-200 text-red-800"
                                : "bg-purple-200 text-purple-800"
                              : "bg-white text-gray-600 border border-gray-200"
                          }`}
                          animate={{
                            scale: index === currentChunkIndex ? 1.1 : 1,
                          }}
                        >
                          {chunk.text}
                          {chunk.isStressed && (
                            <span className="block text-xs text-center mt-1 opacity-70">
                              重音
                            </span>
                          )}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}

                {showTranslation && (
                  <motion.p
                    className="text-center text-lg text-gray-600"
                    animate={{ opacity: showTranslation ? 1 : 0 }}
                  >
                    {selectedSentence.translation}
                  </motion.p>
                )}

                <div className="mt-8 flex justify-center gap-2">
                  {selectedSentence.chunks.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentChunkIndex
                          ? "bg-purple-500 scale-150"
                          : index < currentChunkIndex
                          ? "bg-purple-300"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={isPlaying ? stopAnimation : playAnimation}
                className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white text-lg shadow-lg transition-all hover:scale-105 ${
                  isPlaying
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-purple-500 hover:bg-purple-600"
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause size={24} /> 暂停
                  </>
                ) : (
                  <>
                    <Play size={24} /> 影子跟读
                  </>
                )}
              </button>

              <button
                onClick={stopAnimation}
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
                className="w-40 accent-purple-500"
              />
              <span className="text-purple-500 font-bold w-12">{bpm}%</span>
            </div>

            <p className="text-sm text-gray-500 text-center max-w-lg">
              💡 提示：看着分块的单词，跟着节奏在心中默读，注意红色标记的重音音节需要更用力
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
