import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Eye, EyeOff, Volume2, Mic, MicOff, Award, RefreshCw, Star, ListMusic, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { scenes } from "@/data/scenes";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { analyzeRecording, type AnalysisResult, type ChunkScore } from "@/lib/audioAnalysis";
import RadarChart from "@/components/RadarChart";
import RecordingControls from "@/components/RecordingControls";

type Phase = "idle" | "playing" | "readyToRecord" | "recording" | "analyzing" | "result";

export default function ShadowReading() {
  const {
    selectedScene,
    selectedSentence,
    setSelectedScene,
    setSelectedSentence,
    bpm,
    setBpm,
    toggleFavorite,
    isFavorite,
    practiceQueue,
    practiceQueueIndex,
    isPracticeQueueMode,
    nextInQueue,
    prevInQueue,
    clearPracticeQueue,
    setPracticeQueueIndex,
  } = useAppStore();

  const [phase, setPhase] = useState<Phase>("idle");
  const [currentChunkIndex, setCurrentChunkIndex] = useState(-1);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showText, setShowText] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [pressStartTime, setPressStartTime] = useState<number | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingQueueJumpRef = useRef<boolean>(false);
  const phaseRef = useRef<Phase>("idle");
  const isRecordingRef = useRef<boolean>(false);

  const recorder = useAudioRecorder();

  const currentSentenceIndex = selectedScene.sentences.findIndex(
    (s) => s.id === selectedSentence?.id
  );

  const playAnimation = useCallback(() => {
    if (!selectedSentence) return;

    setPhase("playing");
    setCurrentChunkIndex(-1);
    setAnalysisResult(null);
    pendingQueueJumpRef.current = false;

    const speedMultiplier = 80 / bpm;
    let delay = 0;

    selectedSentence.chunks.forEach((_, index) => {
      timeoutRef.current = setTimeout(() => {
        setCurrentChunkIndex(index);
      }, delay);

      delay += selectedSentence.chunks[index].duration * speedMultiplier;
    });

    timeoutRef.current = setTimeout(() => {
      setCurrentChunkIndex(-1);
      setPhase("readyToRecord");
      
      if (isPracticeQueueMode && practiceQueueIndex < practiceQueue.length - 1) {
        setTimeout(() => {
          if (phaseRef.current === "recording" || isRecordingRef.current) {
            pendingQueueJumpRef.current = true;
          } else {
            nextInQueue();
            setPhase("idle");
          }
        }, 1200);
      }
    }, delay);
  }, [selectedSentence, bpm, isPracticeQueueMode, practiceQueueIndex, practiceQueue.length, nextInQueue]);

  const stopAnimation = useCallback(() => {
    setPhase("idle");
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
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const selectSentence = (index: number) => {
    stopAnimation();
    setAnalysisResult(null);
    recorder.resetRecording();
    setSelectedSentence(selectedScene.sentences[index]);
    pendingQueueJumpRef.current = false;
  };

  const handleStartRecording = useCallback(() => {
    if (phase === "readyToRecord" || phase === "result") {
      recorder.startRecording();
      setPhase("recording");
    }
  }, [phase, recorder]);

  const handleStopRecording = useCallback(async () => {
    if (phase === "recording") {
      recorder.stopRecording();
      setPhase("analyzing");
    }
  }, [phase, recorder]);

  const handlePressStart = useCallback(() => {
    setPressStartTime(Date.now());
    longPressTimerRef.current = setTimeout(() => {
      handleStartRecording();
    }, 300);
  }, [handleStartRecording]);

  const handlePressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    const pressDuration = pressStartTime ? Date.now() - pressStartTime : 0;
    setPressStartTime(null);
    
    if (pressDuration >= 300 && phase === "recording") {
      handleStopRecording();
    }
  }, [pressStartTime, phase, handleStopRecording]);

  useEffect(() => {
    if (recorder.audioBuffer && selectedSentence && phase === "analyzing") {
      const referenceChunks = selectedSentence.chunks.map((c) => ({
        duration: c.duration,
        isStressed: c.isStressed,
      }));
      
      const result = analyzeRecording(recorder.audioBuffer, referenceChunks);
      setAnalysisResult(result);
      setPhase("result");
    }
  }, [recorder.audioBuffer, selectedSentence, phase]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    isRecordingRef.current = recorder.isRecording;
  }, [recorder.isRecording]);

  useEffect(() => {
    if (phase === "result" && pendingQueueJumpRef.current) {
      pendingQueueJumpRef.current = false;
      setTimeout(() => {
        nextInQueue();
        setPhase("idle");
      }, 1500);
    }
  }, [phase, nextInQueue]);

  const handlePlayRecording = useCallback(() => {
    if (recorder.audioUrl && audioRef.current) {
      audioRef.current.src = recorder.audioUrl;
      audioRef.current.play();
      setIsPlayingRecording(true);
    }
  }, [recorder.audioUrl]);

  const handlePauseRecording = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingRecording(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    stopAnimation();
    recorder.resetRecording();
    setAnalysisResult(null);
    setIsPlayingRecording(false);
    setPhase("idle");
    pendingQueueJumpRef.current = false;
  }, [stopAnimation, recorder]);

  const getChunkBackgroundColor = (index: number, chunkScore?: ChunkScore) => {
    if (!chunkScore || phase !== "result") {
      if (index === currentChunkIndex) {
        return selectedSentence?.chunks[index]?.isStressed
          ? "bg-red-500 text-white"
          : "bg-purple-500 text-white";
      }
      if (index < currentChunkIndex) {
        return selectedSentence?.chunks[index]?.isStressed
          ? "bg-red-200 text-red-800"
          : "bg-purple-200 text-purple-800";
      }
      return "bg-white text-gray-600 border border-gray-200";
    }

    switch (chunkScore.matchLevel) {
      case "good":
        return "bg-green-100 text-green-800 border-2 border-green-400";
      case "partial":
        return "bg-yellow-100 text-yellow-800 border-2 border-yellow-400";
      case "poor":
        return "bg-red-100 text-red-800 border-2 border-red-400";
      default:
        return "bg-white text-gray-600 border border-gray-200";
    }
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { text: "S", color: "text-yellow-500" };
    if (score >= 80) return { text: "A", color: "text-purple-500" };
    if (score >= 70) return { text: "B", color: "text-blue-500" };
    if (score >= 60) return { text: "C", color: "text-green-500" };
    return { text: "D", color: "text-red-500" };
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
                setAnalysisResult(null);
                recorder.resetRecording();
                clearPracticeQueue();
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

      {isPracticeQueueMode && practiceQueue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl mx-auto mb-4"
        >
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 px-6 py-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                <ListMusic size={16} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-amber-800">收藏练习队列</p>
                <p className="text-sm text-amber-600">
                  第 {practiceQueueIndex + 1} / {practiceQueue.length} 句 · 
                  当前场景: {practiceQueue[practiceQueueIndex]?.sceneName}
                </p>
              </div>
            </div>
            <button
              onClick={clearPracticeQueue}
              className="p-2 rounded-lg hover:bg-amber-100 transition-all text-amber-600"
              title="退出队列模式"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}

      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-bold text-gray-700 mb-2">
            {isPracticeQueueMode ? "练习队列" : "句型列表"}
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {(isPracticeQueueMode ? practiceQueue.map(q => q.sentence) : selectedScene.sentences).map((sentence, index) => {
              const queueItem = isPracticeQueueMode ? practiceQueue[index] : null;
              return (
                <motion.div
                  key={sentence.id + "-" + index}
                  onClick={() => {
                    if (isPracticeQueueMode) {
                      stopAnimation();
                      setAnalysisResult(null);
                      recorder.resetRecording();
                      const item = practiceQueue[index];
                      const scene = scenes.find(s => s.id === item.sceneId);
                      if (scene) {
                        setSelectedScene(scene.id);
                        setSelectedSentence(sentence);
                        setBpm(sentence.bpm || 80);
                        setPracticeQueueIndex(index);
                      }
                    } else {
                      selectSentence(index);
                    }
                  }}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedSentence?.id === sentence.id
                      ? "bg-purple-100 border-2 border-purple-400 shadow-md"
                      : "bg-white border border-gray-200 hover:border-purple-300"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
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
                      {isPracticeQueueMode && queueItem && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <ListMusic size={10} />
                          {queueItem.sceneName}
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
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const scene = isPracticeQueueMode && queueItem
                          ? scenes.find(s => s.id === queueItem.sceneId)
                          : selectedScene;
                        if (scene) {
                          toggleFavorite(sentence, scene);
                        }
                      }}
                      className="p-1 rounded-full hover:bg-purple-50 transition-all shrink-0"
                    >
                      <motion.div
                        key={isFavorite(sentence.id) ? "filled" : "empty"}
                        initial={{ scale: 0.8, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Star
                          size={16}
                          className={
                            isFavorite(sentence.id)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }
                        />
                      </motion.div>
                    </button>
                  </div>
                </motion.div>
              );
            })}
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
                          className={`inline-block px-3 py-2 rounded-lg text-xl font-medium transition-all ${getChunkBackgroundColor(
                            index,
                            analysisResult?.chunkScores[index]
                          )}`}
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
                          {analysisResult?.chunkScores[index] && (
                            <span className="block text-xs text-center mt-1 font-bold">
                              {analysisResult.chunkScores[index].overall}分
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
                        analysisResult?.chunkScores[index]
                          ? analysisResult.chunkScores[index].matchLevel === "good"
                            ? "bg-green-500"
                            : analysisResult.chunkScores[index].matchLevel === "partial"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                          : index === currentChunkIndex
                          ? "bg-purple-500 scale-150"
                          : index < currentChunkIndex
                          ? "bg-purple-300"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>

                {phase === "readyToRecord" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 text-center"
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
                      <Mic size={16} className="text-blue-500" />
                      <span className="text-sm font-medium text-blue-700">
                        播放完成！长按下方麦克风按钮开始跟读
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          <AnimatePresence mode="wait">
            {analysisResult && phase === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Award size={28} className="text-yellow-500" />
                  <h3 className="text-xl font-bold text-gray-800">评分结果</h3>
                </div>

                <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                  <RadarChart
                    pronunciationAccuracy={analysisResult.pronunciationAccuracy}
                    stressMatch={analysisResult.stressMatch}
                    tempoConsistency={analysisResult.tempoConsistency}
                    size={240}
                  />

                  <div className="flex flex-col items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-1">综合评分</p>
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`text-6xl font-bold ${
                            getScoreGrade(analysisResult.overallScore).color
                          }`}
                        >
                          {analysisResult.overallScore}
                        </span>
                        <span
                          className={`text-3xl font-bold ${
                            getScoreGrade(analysisResult.overallScore).color
                          }`}
                        >
                          {getScoreGrade(analysisResult.overallScore).text}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
                      <div className="text-center p-3 bg-purple-50 rounded-xl">
                        <p className="text-xs text-purple-600 mb-1">发音</p>
                        <p className="text-lg font-bold text-purple-700">
                          {analysisResult.pronunciationAccuracy}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-pink-50 rounded-xl">
                        <p className="text-xs text-pink-600 mb-1">重音</p>
                        <p className="text-lg font-bold text-pink-700">
                          {analysisResult.stressMatch}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-cyan-50 rounded-xl">
                        <p className="text-xs text-cyan-600 mb-1">语速</p>
                        <p className="text-lg font-bold text-cyan-700">
                          {analysisResult.tempoConsistency}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-400" />
                    <span className="text-gray-600">匹配良好 (≥70分)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-400" />
                    <span className="text-gray-600">部分匹配 (40-69分)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-400" />
                    <span className="text-gray-600">偏差较大 (＜40分)</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={phase === "playing" ? stopAnimation : playAnimation}
                disabled={phase === "recording" || phase === "analyzing"}
                className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white text-lg shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  phase === "playing"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-purple-500 hover:bg-purple-600"
                }`}
              >
                {phase === "playing" ? (
                  <>
                    <Pause size={24} /> 暂停
                  </>
                ) : (
                  <>
                    <Play size={24} /> 影子跟读
                  </>
                )}
              </button>

              {(phase === "readyToRecord" || phase === "recording" || phase === "result" || phase === "analyzing") && (
                <motion.button
                  onMouseDown={handlePressStart}
                  onMouseUp={handlePressEnd}
                  onMouseLeave={handlePressEnd}
                  onTouchStart={handlePressStart}
                  onTouchEnd={handlePressEnd}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={phase === "analyzing"}
                  className={`relative flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    phase === "recording"
                      ? "bg-red-500 hover:bg-red-600"
                      : phase === "analyzing"
                      ? "bg-gray-400"
                      : "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  }`}
                >
                  {phase === "recording" && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-red-500"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    {phase === "recording" ? (
                      <>
                        <MicOff size={24} /> 松开结束
                      </>
                    ) : (
                      <>
                        <Mic size={24} /> 长按录音
                      </>
                    )}
                  </span>
                </motion.button>
              )}

              {(phase !== "idle" || recorder.audioUrl) && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-4 rounded-full font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  <RefreshCw size={20} /> 重置
                </button>
              )}
            </div>

            {recorder.audioUrl && (
              <div className="w-full max-w-md">
                <RecordingControls
                  isRecording={recorder.isRecording}
                  isPlaying={isPlayingRecording}
                  hasRecording={!!recorder.audioUrl}
                  duration={recorder.duration}
                  volume={recorder.volume}
                  onStartRecording={() => {}}
                  onStopRecording={() => {}}
                  onPlay={handlePlayRecording}
                  onPause={handlePauseRecording}
                  onReset={handleReset}
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              <span className="text-gray-600 text-sm">速度:</span>
              <input
                type="range"
                min="40"
                max="120"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-40 accent-purple-500"
                disabled={phase === "playing" || phase === "recording"}
              />
              <span className="text-purple-500 font-bold w-12">{bpm}%</span>
            </div>

            <p className="text-sm text-gray-500 text-center max-w-lg">
              💡 提示：先点击"影子跟读"听一遍，播放完成后长按"长按录音"按钮跟读，松开结束录音，系统将自动评分
            </p>
          </div>
        </div>
      </div>

      <audio ref={audioRef} onEnded={() => setIsPlayingRecording(false)} />
    </div>
  );
}
