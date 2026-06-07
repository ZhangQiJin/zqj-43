import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Mic, Music, AlertTriangle, ListMusic, X } from "lucide-react";
import MouthAnimation from "@/components/MouthAnimation";
import RhythmBar from "@/components/RhythmBar";
import Waveform from "@/components/Waveform";
import RecordingControls from "@/components/RecordingControls";
import { useAppStore } from "@/store/useAppStore";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

export default function RhythmPractice() {
  const {
    selectedScene,
    selectedSentence,
    setSelectedScene,
    setSelectedSentence,
    bpm,
    setBpm,
    isRecordingMode,
    isPlayingRecording,
    recordingPlaybackTime,
    setIsRecordingMode,
    setIsPlayingRecording,
    setRecordingPlaybackTime,
    setCurrentChunkIndex,
    isWrongSlicePractice,
    highlightedChunkIndex,
    exitWrongSlicePractice,
    practiceQueue,
    practiceQueueIndex,
    isPracticeQueueMode,
    nextInQueue,
    prevInQueue,
    clearPracticeQueue,
    getAllScenes,
  } = useAppStore();

  const scenes = getAllScenes();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChunkIndex, setLocalChunkIndex] = useState(-1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recorder = useAudioRecorder();

  const handlePlaybackEnded = useCallback(() => {
    setIsPlayingRecording(false);
    setRecordingPlaybackTime(0);
    setLocalChunkIndex(-1);
    setCurrentChunkIndex(-1);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, [setIsPlayingRecording, setRecordingPlaybackTime, setCurrentChunkIndex]);

  const player = useAudioPlayer(handlePlaybackEnded);

  const currentSentenceIndex = selectedScene.sentences.findIndex(
    (s) => s.id === selectedSentence?.id
  );

  const totalDuration = selectedSentence
    ? selectedSentence.chunks.reduce((sum, chunk) => sum + chunk.duration, 0)
    : 0;

  const getChunkIndexFromTime = useCallback(
    (timeMs: number): number => {
      if (!selectedSentence) return -1;
      let acc = 0;
      for (let i = 0; i < selectedSentence.chunks.length; i++) {
        acc += selectedSentence.chunks[i].duration;
        if (timeMs < acc) return i;
      }
      return selectedSentence.chunks.length - 1;
    },
    [selectedSentence]
  );

  const playAnimation = useCallback(() => {
    if (!selectedSentence) return;

    setIsPlaying(true);
    setLocalChunkIndex(-1);
    setCurrentChunkIndex(-1);

    const speedMultiplier = 80 / bpm;
    let delay = 0;

    selectedSentence.chunks.forEach((_, index) => {
      timeoutRef.current = setTimeout(() => {
        setLocalChunkIndex(index);
        setCurrentChunkIndex(index);
      }, delay);

      delay += selectedSentence.chunks[index].duration * speedMultiplier;
    });

    timeoutRef.current = setTimeout(() => {
      setIsPlaying(false);
      setLocalChunkIndex(-1);
      setCurrentChunkIndex(-1);
      
      if (isPracticeQueueMode && practiceQueueIndex < practiceQueue.length - 1) {
        setTimeout(() => {
          nextInQueue();
        }, 800);
      }
    }, delay);
  }, [selectedSentence, bpm, setCurrentChunkIndex, isPracticeQueueMode, practiceQueueIndex, practiceQueue.length, nextInQueue]);

  const stopAnimation = useCallback(() => {
    setIsPlaying(false);
    setLocalChunkIndex(-1);
    setCurrentChunkIndex(-1);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [setCurrentChunkIndex]);

  const handleStartRecording = useCallback(() => {
    stopAnimation();
    if (isPlayingRecording) {
      handlePlaybackEnded();
      player.stop();
    }
    recorder.startRecording();
  }, [recorder, stopAnimation, isPlayingRecording, handlePlaybackEnded, player]);

  const handleStopRecording = useCallback(() => {
    recorder.stopRecording();
  }, [recorder]);

  const handleResetRecording = useCallback(() => {
    if (recorder.isRecording) {
      recorder.stopRecording();
    }
    player.stop();
    recorder.resetRecording();
    setIsPlayingRecording(false);
    setRecordingPlaybackTime(0);
    setLocalChunkIndex(-1);
    setCurrentChunkIndex(-1);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, [recorder, player, setIsPlayingRecording, setRecordingPlaybackTime, setCurrentChunkIndex]);

  const handlePlayRecording = useCallback(() => {
    if (!recorder.audioUrl) return;

    if (!player.duration || player.duration === 0) {
      player.loadAudio(recorder.audioUrl);
    }

    player.play();
    setIsPlayingRecording(true);
    setIsPlaying(false);

    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }

    playbackIntervalRef.current = setInterval(() => {
      const currentTime = player.currentTime * 1000;
      setRecordingPlaybackTime(player.currentTime);
      
      const chunkIndex = getChunkIndexFromTime(currentTime);
      if (chunkIndex >= 0) {
        setLocalChunkIndex(chunkIndex);
        setCurrentChunkIndex(chunkIndex);
      }
    }, 50);
  }, [recorder.audioUrl, player, setIsPlayingRecording, setRecordingPlaybackTime, getChunkIndexFromTime, setCurrentChunkIndex]);

  const handlePauseRecording = useCallback(() => {
    player.pause();
    setIsPlayingRecording(false);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, [player, setIsPlayingRecording]);

  const handleSeek = useCallback(
    (time: number) => {
      player.seek(time);
      setRecordingPlaybackTime(time);
      const chunkIndex = getChunkIndexFromTime(time * 1000);
      if (chunkIndex >= 0) {
        setLocalChunkIndex(chunkIndex);
        setCurrentChunkIndex(chunkIndex);
      }
    },
    [player, setRecordingPlaybackTime, getChunkIndexFromTime, setCurrentChunkIndex]
  );

  useEffect(() => {
    if (recorder.audioUrl && !player.duration) {
      player.loadAudio(recorder.audioUrl);
    }
  }, [recorder.audioUrl, player]);

  const handleSwitchMode = useCallback((mode: boolean) => {
    if (recorder.isRecording) {
      recorder.stopRecording();
    }
    if (isPlayingRecording) {
      handlePlaybackEnded();
      player.stop();
    }
    stopAnimation();
    setIsRecordingMode(mode);
  }, [recorder, isPlayingRecording, handlePlaybackEnded, player, stopAnimation, setIsRecordingMode]);

  const handleSwitchScene = useCallback((sceneId: string) => {
    if (recorder.isRecording) {
      recorder.stopRecording();
    }
    if (isPlayingRecording) {
      handlePlaybackEnded();
      player.stop();
    }
    stopAnimation();
    handleResetRecording();
    clearPracticeQueue();
    setSelectedScene(sceneId);
    exitWrongSlicePractice();
  }, [recorder, isPlayingRecording, handlePlaybackEnded, player, stopAnimation, handleResetRecording, clearPracticeQueue, setSelectedScene, exitWrongSlicePractice]);

  const handlePrevSentence = useCallback(() => {
    if (recorder.isRecording) {
      recorder.stopRecording();
    }
    if (isPlayingRecording) {
      handlePlaybackEnded();
      player.stop();
    }
    stopAnimation();
    handleResetRecording();
    
    if (isPracticeQueueMode) {
      prevInQueue();
    } else {
      const newIndex = Math.max(0, currentSentenceIndex - 1);
      setSelectedSentence(selectedScene.sentences[newIndex]);
    }
    
    exitWrongSlicePractice();
  }, [recorder, isPlayingRecording, handlePlaybackEnded, player, stopAnimation, handleResetRecording, isPracticeQueueMode, prevInQueue, currentSentenceIndex, selectedScene, setSelectedSentence, exitWrongSlicePractice]);

  const handleNextSentence = useCallback(() => {
    if (recorder.isRecording) {
      recorder.stopRecording();
    }
    if (isPlayingRecording) {
      handlePlaybackEnded();
      player.stop();
    }
    stopAnimation();
    handleResetRecording();
    
    if (isPracticeQueueMode) {
      nextInQueue();
    } else {
      const newIndex = Math.min(
        selectedScene.sentences.length - 1,
        currentSentenceIndex + 1
      );
      setSelectedSentence(selectedScene.sentences[newIndex]);
    }
    
    exitWrongSlicePractice();
  }, [recorder, isPlayingRecording, handlePlaybackEnded, player, stopAnimation, handleResetRecording, isPracticeQueueMode, nextInQueue, currentSentenceIndex, selectedScene, setSelectedSentence, exitWrongSlicePractice]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  const currentChunk =
    selectedSentence && currentChunkIndex >= 0
      ? selectedSentence.chunks[currentChunkIndex]
      : null;

  const mouthIsPlaying = isPlaying || isPlayingRecording;

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="w-full">
        <div className="flex items-center justify-center gap-2 mb-4">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => handleSwitchScene(scene.id)}
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

      <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
        <button
          onClick={() => handleSwitchMode(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            !isRecordingMode
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Music size={16} />
          节奏练习
        </button>
        <button
          onClick={() => handleSwitchMode(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            isRecordingMode
              ? "bg-white text-emerald-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Mic size={16} />
          录音对比
        </button>
      </div>

      {isWrongSlicePractice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="font-bold">薄弱切片专项练习</p>
                <p className="text-sm opacity-90">
                  播放速度已降低 20%，紫色标记为需要重点练习的切片
                </p>
              </div>
            </div>
            <button
              onClick={exitWrongSlicePractice}
              className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all text-sm font-medium"
            >
              退出练习
            </button>
          </div>
        </motion.div>
      )}

      {isPracticeQueueMode && practiceQueue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
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
          disabled={
            isPracticeQueueMode
              ? practiceQueueIndex <= 0
              : currentSentenceIndex <= 0
          }
          className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={24} />
        </button>

        <MouthAnimation
          isPlaying={mouthIsPlaying}
          isStressed={currentChunk?.isStressed || false}
          size={220}
        />

        <button
          onClick={handleNextSentence}
          disabled={
            isPracticeQueueMode
              ? practiceQueueIndex >= practiceQueue.length - 1
              : currentSentenceIndex >= selectedScene.sentences.length - 1
          }
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
            isPlaying={mouthIsPlaying}
            highlightedIndex={isWrongSlicePractice ? highlightedChunkIndex : null}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {!isRecordingMode ? (
          <motion.div
            key="practice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-4"
          >
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
                className="w-40 accent-blue-500"
              />
              <span className="text-blue-500 font-bold w-12">{bpm}%</span>
            </div>

            <p className="text-sm text-gray-500 text-center max-w-md">
              💡 提示：观察口型变化，注意红色标记的重音位置，跟着节奏在心里默念
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="recording"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl space-y-6"
          >
            {selectedSentence && (
              <Waveform
                userWaveform={recorder.waveformData}
                chunks={selectedSentence.chunks}
                currentTime={isPlayingRecording ? player.currentTime : recordingPlaybackTime}
                duration={player.duration || totalDuration / 1000}
                isPlaying={isPlayingRecording}
                onSeek={handleSeek}
              />
            )}

            <RecordingControls
              isRecording={recorder.isRecording}
              isPlaying={isPlayingRecording}
              hasRecording={!!recorder.audioUrl}
              duration={recorder.duration}
              volume={recorder.volume}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onPlay={handlePlayRecording}
              onPause={handlePauseRecording}
              onReset={handleResetRecording}
            />

            {!recorder.isRecording && !recorder.audioUrl && (
              <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-sm text-emerald-700">
                  🎤 准备好后点击麦克风开始录制。录制时请跟着节奏跟读句子，
                  完成后可以对比你的声音波形与参考节奏的对齐情况。
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
