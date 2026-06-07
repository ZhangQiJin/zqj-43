import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  User,
  Bot,
  ChevronRight,
  Award,
  BarChart3,
  Clock,
  Target,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { useAppStore, DialogueTurnRecord, DialogueResult } from "@/store/useAppStore";
import { dialogues, Dialogue } from "@/data/dialogues";
import RhythmBar from "@/components/RhythmBar";

export default function DialogueSimulation() {
  const {
    selectedDialogue,
    currentTurnIndex,
    dialoguePhase,
    dialogueTurnRecords,
    dialogueResult,
    currentChunkIndexInTurn,
    bpm,
    setSelectedDialogue,
    setCurrentTurnIndex,
    setDialoguePhase,
    addDialogueTurnRecord,
    clearDialogueTurnRecords,
    setDialogueResult,
    setCurrentChunkIndexInTurn,
    resetDialogueState,
  } = useAppStore();

  const [turnStartTime, setTurnStartTime] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentTurn = selectedDialogue?.turns[currentTurnIndex];
  const isUserTurn = currentTurn?.speaker === "user";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const calculateTurnDuration = (turn: { sentence: { chunks: { duration: number }[] } }) => {
    const speedMultiplier = 80 / bpm;
    return turn.sentence.chunks.reduce((sum, chunk) => sum + chunk.duration * speedMultiplier, 0);
  };

  const playTurnAnimation = useCallback(() => {
    if (!currentTurn) return;

    setDialoguePhase("playing");
    setCurrentChunkIndexInTurn(-1);
    setTurnStartTime(Date.now());

    const speedMultiplier = 80 / bpm;
    let delay = 0;

    currentTurn.sentence.chunks.forEach((_, index) => {
      timeoutRef.current = setTimeout(() => {
        setCurrentChunkIndexInTurn(index);
      }, delay);
      delay += currentTurn.sentence.chunks[index].duration * speedMultiplier;
    });

    timeoutRef.current = setTimeout(() => {
      setCurrentChunkIndexInTurn(-1);
      if (isUserTurn) {
        setDialoguePhase("waitingForInput");
      } else {
        proceedToNextTurn();
      }
    }, delay);
  }, [currentTurn, isUserTurn, bpm, setDialoguePhase, setCurrentChunkIndexInTurn]);

  useEffect(() => {
    scrollToBottom();
  }, [currentTurnIndex]);

  useEffect(() => {
    if (selectedDialogue && currentTurnIndex > 0 && dialoguePhase !== "finished" && dialoguePhase !== "idle") {
      playTurnAnimation();
    }
  }, [currentTurnIndex, selectedDialogue, dialoguePhase, playTurnAnimation]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const stopAnimation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setCurrentChunkIndexInTurn(-1);
  }, [setCurrentChunkIndexInTurn]);

  const proceedToNextTurn = useCallback(() => {
    if (!selectedDialogue) return;

    const nextIndex = currentTurnIndex + 1;

    if (nextIndex >= selectedDialogue.turns.length) {
      setDialoguePhase("finished");
      generateDialogueResult();
    } else {
      setCurrentTurnIndex(nextIndex);
    }
  }, [selectedDialogue, currentTurnIndex, setCurrentTurnIndex, setDialoguePhase]);

  const handleUserClick = useCallback(() => {
    if (!currentTurn || !isUserTurn || dialoguePhase !== "waitingForInput") return;

    const clickTime = Date.now();
    const expectedDuration = calculateTurnDuration(currentTurn);
    const actualDuration = turnStartTime ? clickTime - turnStartTime : 0;
    const deviation = actualDuration - expectedDuration;

    const record: DialogueTurnRecord = {
      turnId: currentTurn.id,
      turnIndex: currentTurnIndex,
      clickTimestamp: clickTime,
      expectedDuration,
      deviation,
      completed: true,
    };

    addDialogueTurnRecord(record);
    proceedToNextTurn();
  }, [
    currentTurn,
    isUserTurn,
    dialoguePhase,
    turnStartTime,
    currentTurnIndex,
    addDialogueTurnRecord,
    proceedToNextTurn,
  ]);

  const generateDialogueResult = useCallback(() => {
    if (!selectedDialogue) return;

    const userTurns = selectedDialogue.turns.filter((t) => t.speaker === "user");
    const completedTurns = dialogueTurnRecords.filter((r) => r.completed);
    const completionRate = (completedTurns.length / userTurns.length) * 100;

    const deviations = completedTurns.map((r) => Math.abs(r.deviation));
    const averageDeviation = deviations.length > 0 ? deviations.reduce((a, b) => a + b, 0) / deviations.length : 0;

    const variance = deviations.length > 0
      ? deviations.reduce((sum, d) => sum + Math.pow(d - averageDeviation, 2), 0) / deviations.length
      : 0;
    const stdDev = Math.sqrt(variance);
    const rhythmStability = Math.max(0, 100 - stdDev / 10);

    const deviationScore = Math.max(0, 100 - averageDeviation / 50);
    const totalScore = Math.round((completionRate * 0.3 + deviationScore * 0.4 + rhythmStability * 0.3));

    const getGrade = (score: number) => {
      if (score >= 90) return "S";
      if (score >= 80) return "A";
      if (score >= 70) return "B";
      if (score >= 60) return "C";
      return "D";
    };

    const result: DialogueResult = {
      dialogueId: selectedDialogue.id,
      completionRate: Math.round(completionRate),
      averageDeviation: Math.round(averageDeviation),
      rhythmStability: Math.round(rhythmStability),
      turnRecords: dialogueTurnRecords,
      totalScore,
      grade: getGrade(totalScore),
    };

    setDialogueResult(result);
  }, [selectedDialogue, dialogueTurnRecords, setDialogueResult]);

  const startDialogue = (dialogue: Dialogue) => {
    stopAnimation();
    resetDialogueState();
    setSelectedDialogue(dialogue);
    setCurrentTurnIndex(0);
    setDialoguePhase("idle");
  };

  const handleStart = () => {
    if (!selectedDialogue) return;
    clearDialogueTurnRecords();
    setCurrentTurnIndex(0);
    setDialogueResult(null);
    setTimeout(() => playTurnAnimation(), 100);
  };

  const handleReset = () => {
    stopAnimation();
    resetDialogueState();
  };

  const getDeviationColor = (deviation: number) => {
    const absDev = Math.abs(deviation);
    if (absDev < 200) return "text-green-600";
    if (absDev < 500) return "text-yellow-600";
    return "text-red-600";
  };

  const getDeviationLabel = (deviation: number) => {
    const absDev = Math.abs(deviation);
    if (absDev < 200) return "优秀";
    if (absDev < 500) return "良好";
    return "偏差较大";
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "S": return "text-yellow-500";
      case "A": return "text-purple-500";
      case "B": return "text-blue-500";
      case "C": return "text-green-500";
      default: return "text-red-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-bold text-gray-700 mb-2">对话剧本</h3>
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
            {dialogues.map((dialogue) => (
              <motion.div
                key={dialogue.id}
                onClick={() => startDialogue(dialogue)}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  selectedDialogue?.id === dialogue.id
                    ? "bg-indigo-100 border-2 border-indigo-400 shadow-md"
                    : "bg-white border border-gray-200 hover:border-indigo-300"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedDialogue?.id === dialogue.id ? "bg-indigo-500" : "bg-gray-100"
                  }`}>
                    <Bot size={16} className={selectedDialogue?.id === dialogue.id ? "text-white" : "text-gray-600"} />
                  </div>
                  <p className={`font-medium ${
                    selectedDialogue?.id === dialogue.id ? "text-indigo-700" : "text-gray-700"
                  }`}>
                    {dialogue.name}
                  </p>
                </div>
                <p className="text-xs text-gray-500">{dialogue.description}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-gray-400">
                    {dialogue.turns.length} 轮对话
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {selectedDialogue ? (
            <>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selectedDialogue.name}</h3>
                    <p className="text-sm text-gray-500">{selectedDialogue.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      进度: {Math.min(currentTurnIndex + 1, selectedDialogue.turns.length)} / {selectedDialogue.turns.length}
                    </span>
                  </div>
                </div>

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(Math.min(currentTurnIndex + 1, selectedDialogue.turns.length) / selectedDialogue.turns.length) * 100}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <div className="space-y-4 max-h-80 overflow-y-auto pr-2 mb-6">
                  {selectedDialogue.turns.slice(0, currentTurnIndex + 1).map((turn, index) => (
                    <motion.div
                      key={turn.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${turn.speaker === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex items-start gap-2 max-w-[80%] ${
                        turn.speaker === "user" ? "flex-row-reverse" : ""
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          turn.speaker === "user" ? "bg-blue-500" : "bg-purple-500"
                        }`}>
                          {turn.speaker === "user" ? (
                            <User size={16} className="text-white" />
                          ) : (
                            <Bot size={16} className="text-white" />
                          )}
                        </div>
                        <div className={`p-3 rounded-2xl ${
                          turn.speaker === "user"
                            ? "bg-blue-500 text-white rounded-tr-sm"
                            : "bg-gray-100 text-gray-800 rounded-tl-sm"
                        }`}>
                          <p className="text-sm font-medium">{turn.sentence.text}</p>
                          <p className={`text-xs mt-1 ${
                            turn.speaker === "user" ? "text-blue-100" : "text-gray-500"
                          }`}>
                            {turn.sentence.translation}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {currentTurn && dialoguePhase !== "idle" && dialoguePhase !== "finished" && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTurnIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        {isUserTurn ? (
                          <User size={18} className="text-blue-500" />
                        ) : (
                          <Bot size={18} className="text-purple-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          isUserTurn ? "text-blue-700" : "text-purple-700"
                        }`}>
                          {isUserTurn ? "轮到你了" : "AI 正在说"}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-lg font-medium text-gray-800 mb-1">
                          {currentTurn.sentence.text}
                        </p>
                        <p className="text-sm text-gray-500">
                          {currentTurn.sentence.translation}
                        </p>
                      </div>

                      <RhythmBar
                        chunks={currentTurn.sentence.chunks}
                        currentIndex={currentChunkIndexInTurn}
                        isPlaying={dialoguePhase === "playing"}
                      />

                      {isUserTurn && dialoguePhase === "waitingForInput" && (
                        <motion.button
                          onClick={handleUserClick}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="mt-4 w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                          读完了，继续
                          <ChevronRight size={20} />
                        </motion.button>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}

                {dialoguePhase === "idle" && (
                  <div className="text-center py-8">
                    <Bot size={48} className="mx-auto text-purple-400 mb-4" />
                    <p className="text-gray-600 mb-6">准备好开始对话练习了吗？</p>
                    <button
                      onClick={handleStart}
                      className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
                    >
                      <Play size={24} />
                      开始对话
                    </button>
                  </div>
                )}

                {dialoguePhase === "finished" && dialogueResult && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <Award size={28} className="text-yellow-500" />
                        <h3 className="text-xl font-bold text-gray-800">对话完成报告</h3>
                      </div>

                      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">综合评分</p>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-6xl font-bold ${getGradeColor(dialogueResult.grade)}`}>
                              {dialogueResult.totalScore}
                            </span>
                            <span className={`text-3xl font-bold ${getGradeColor(dialogueResult.grade)}`}>
                              {dialogueResult.grade}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                          <div className="text-center p-3 bg-blue-50 rounded-xl">
                            <Target size={20} className="mx-auto text-blue-500 mb-1" />
                            <p className="text-xs text-blue-600 mb-1">完成度</p>
                            <p className="text-lg font-bold text-blue-700">
                              {dialogueResult.completionRate}%
                            </p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-xl">
                            <Clock size={20} className="mx-auto text-purple-500 mb-1" />
                            <p className="text-xs text-purple-600 mb-1">平均偏差</p>
                            <p className="text-lg font-bold text-purple-700">
                              {dialogueResult.averageDeviation}ms
                            </p>
                          </div>
                          <div className="text-center p-3 bg-emerald-50 rounded-xl">
                            <TrendingUp size={20} className="mx-auto text-emerald-500 mb-1" />
                            <p className="text-xs text-emerald-600 mb-1">节奏稳定</p>
                            <p className="text-lg font-bold text-emerald-700">
                              {dialogueResult.rhythmStability}%
                            </p>
                          </div>
                        </div>
                      </div>

                      {dialogueResult.turnRecords.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <BarChart3 size={18} />
                            每轮详情
                          </h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {dialogueResult.turnRecords.map((record) => {
                              const turn = selectedDialogue.turns.find(
                                (t) => t.id === record.turnId
                              );
                              return (
                                <div
                                  key={record.turnId}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-2">
                                    <User size={16} className="text-blue-500" />
                                    <span className="text-sm text-gray-700 truncate max-w-[200px]">
                                      {turn?.sentence.text}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${getDeviationColor(record.deviation)}`}>
                                      {record.deviation > 0 ? "+" : ""}{record.deviation}ms
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      Math.abs(record.deviation) < 200
                                        ? "bg-green-100 text-green-700"
                                        : Math.abs(record.deviation) < 500
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-red-100 text-red-700"
                                    }`}>
                                      {getDeviationLabel(record.deviation)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleReset}
                        className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={20} />
                        再来一次
                      </button>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              <div className="flex justify-center gap-4">
                {(dialoguePhase !== "idle" || dialogueTurnRecords.length > 0) && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                  >
                    <RotateCcw size={20} />
                    重置对话
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <Bot size={32} className="text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">选择一个对话剧本开始练习</h3>
              <p className="text-gray-500">从左侧选择对话剧本，体验沉浸式对话模拟练习</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
