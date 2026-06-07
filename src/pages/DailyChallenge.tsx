import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Award,
  Lock,
  Unlock,
  ChevronRight,
  Sparkles,
  Calendar,
  Flame,
} from "lucide-react";
import { useAppStore, TapRecord } from "@/store/useAppStore";

export default function DailyChallenge() {
  const {
    currentDailyChallenge,
    currentLevelIndex,
    consecutiveDays,
    generateDailyChallenge,
    setCurrentLevelIndex,
    completeLevel,
    completeDailyChallenge,
    addWrongSlice,
  } = useAppStore();

  const [isTesting, setIsTesting] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(-1);
  const [tapRecords, setTapRecords] = useState<TapRecord[]>([]);
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [bpm, setBpm] = useState(80);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expectedTimesRef = useRef<number[]>([]);

  useEffect(() => {
    generateDailyChallenge();
  }, [generateDailyChallenge]);

  const currentLevel = currentDailyChallenge?.levels[currentLevelIndex];
  const selectedSentence = currentLevel?.sentence;
  const selectedScene = currentLevel?.scene;

  const speedMultiplier = 80 / bpm;

  const calculateExpectedTimes = useCallback(() => {
    if (!selectedSentence) return [];
    const times: number[] = [];
    let cumulative = 0;
    selectedSentence.chunks.forEach((chunk) => {
      cumulative += chunk.duration * speedMultiplier;
      times.push(cumulative);
    });
    return times;
  }, [selectedSentence, speedMultiplier]);

  const startTest = useCallback(() => {
    if (!selectedSentence || currentLevel?.completed) return;

    setIsTesting(true);
    setCurrentChunkIndex(-1);
    setTapRecords([]);
    setShowResults(false);
    setTestStartTime(Date.now());
    expectedTimesRef.current = calculateExpectedTimes();

    let delay = 0;

    selectedSentence.chunks.forEach((_, index) => {
      timeoutRef.current = setTimeout(() => {
        setCurrentChunkIndex(index);
      }, delay);

      delay += selectedSentence.chunks[index].duration * speedMultiplier;
    });

    timeoutRef.current = setTimeout(() => {
      setIsTesting(false);
      setCurrentChunkIndex(-1);
      setShowResults(true);
    }, delay + 500);
  }, [selectedSentence, speedMultiplier, calculateExpectedTimes, currentLevel?.completed]);

  const stopTest = useCallback(() => {
    setIsTesting(false);
    setCurrentChunkIndex(-1);
    setShowResults(false);
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

  const handleTap = () => {
    if (!isTesting || !testStartTime || !selectedSentence) return;

    const currentTime = Date.now() - testStartTime;
    const nextIndex = tapRecords.length;

    if (nextIndex >= selectedSentence.chunks.length) return;

    const expectedTime = expectedTimesRef.current[nextIndex];
    const deviation = currentTime - expectedTime;

    const newRecord: TapRecord = {
      index: nextIndex,
      timestamp: currentTime,
      expectedTime,
      deviation,
    };

    setTapRecords((prev) => [...prev, newRecord]);
  };

  const calculateStats = () => {
    if (tapRecords.length === 0 || !selectedSentence) return null;

    const deviations = tapRecords.map((r) => Math.abs(r.deviation));
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    const maxDeviation = Math.max(...deviations);
    const minDeviation = Math.min(...deviations);

    const goodTaps = deviations.filter((d) => d < 200).length;
    const accuracy = (goodTaps / tapRecords.length) * 100;

    const score = Math.max(
      0,
      100 - avgDeviation / 10 - (100 - accuracy) * 0.5
    );

    return {
      avgDeviation: Math.round(avgDeviation),
      maxDeviation: Math.round(maxDeviation),
      minDeviation: Math.round(minDeviation),
      accuracy: Math.round(accuracy),
      score: Math.round(score),
      totalTaps: tapRecords.length,
      expectedTaps: selectedSentence.chunks.length,
    };
  };

  const stats = calculateStats();

  useEffect(() => {
    if (showResults && selectedSentence && tapRecords.length > 0 && selectedScene) {
      tapRecords.forEach((record) => {
        if (Math.abs(record.deviation) > 300 && record.index < selectedSentence.chunks.length) {
          addWrongSlice({
            chunk: selectedSentence.chunks[record.index],
            chunkIndex: record.index,
            sentence: selectedSentence,
            scene: selectedScene,
            deviation: Math.abs(record.deviation),
          });
        }
      });
    }
  }, [showResults, tapRecords, selectedSentence, selectedScene, addWrongSlice]);

  const handleSubmitLevel = () => {
    if (!currentLevel || !stats) return;

    const result = completeLevel(currentLevel.id, stats.score, stats.accuracy);
    if (result.success) {
      setShowResults(false);
      if (result.allCompleted) {
        completeDailyChallenge();
        setShowCompletion(true);
      }
    }
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: "S", color: "text-yellow-500", bg: "bg-yellow-100" };
    if (score >= 80) return { grade: "A", color: "text-green-500", bg: "bg-green-100" };
    if (score >= 70) return { grade: "B", color: "text-blue-500", bg: "bg-blue-100" };
    if (score >= 60) return { grade: "C", color: "text-orange-500", bg: "bg-orange-100" };
    return { grade: "D", color: "text-red-500", bg: "bg-red-100" };
  };

  if (!currentDailyChallenge) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  const completedLevels = currentDailyChallenge.levels.filter((l) => l.completed).length;
  const totalLevels = currentDailyChallenge.levels.length;
  const progress = (completedLevels / totalLevels) * 100;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-2">每日挑战</h2>
        <p className="text-gray-500">完成所有关卡，赢取今日评分！</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center gap-3 mb-2">
            <Flame size={28} />
            <span className="text-3xl font-bold">{consecutiveDays}</span>
          </div>
          <p className="text-white/80 text-sm">连续打卡天数</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={28} />
            <span className="text-3xl font-bold">
              {completedLevels}/{totalLevels}
            </span>
          </div>
          <p className="text-white/80 text-sm">今日关卡进度</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-2xl p-6 text-white shadow-lg ${
            currentDailyChallenge.completed
              ? "bg-gradient-to-br from-emerald-500 to-teal-500"
              : "bg-gradient-to-br from-gray-400 to-gray-500"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <Award size={28} />
            <span className="text-3xl font-bold">
              {currentDailyChallenge.grade || "-"}
            </span>
          </div>
          <p className="text-white/80 text-sm">
            {currentDailyChallenge.completed ? "今日评分" : "未完成"}
          </p>
        </motion.div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">关卡进度</h3>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {currentDailyChallenge.levels.map((level, index) => {
            const isActive = index === currentLevelIndex;
            const isLocked = !level.completed && index > currentLevelIndex;

            return (
              <motion.button
                key={level.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!isLocked) {
                    setCurrentLevelIndex(index);
                    stopTest();
                  }
                }}
                disabled={isLocked}
                className={`flex-shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                  level.completed
                    ? "bg-emerald-100 border-2 border-emerald-500 text-emerald-600"
                    : isActive
                    ? "bg-orange-100 border-2 border-orange-500 text-orange-600"
                    : isLocked
                    ? "bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-50 border-2 border-gray-200 text-gray-600 hover:border-orange-300"
                }`}
              >
                {level.completed ? (
                  <CheckCircle size={24} />
                ) : isLocked ? (
                  <Lock size={24} />
                ) : (
                  <Unlock size={24} />
                )}
                <span className="text-xs font-bold">第{index + 1}关</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {currentDailyChallenge.completed ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 text-center"
        >
          <Sparkles size={64} className="mx-auto text-yellow-500 mb-4" />
          <h3 className="text-2xl font-bold text-gray-800 mb-2">🎉 恭喜完成今日挑战！</h3>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto my-6 ${getScoreGrade(currentDailyChallenge.totalScore || 0).bg}`}>
            <span className={`text-5xl font-black ${getScoreGrade(currentDailyChallenge.totalScore || 0).color}`}>
              {currentDailyChallenge.grade}
            </span>
          </div>
          <p className="text-4xl font-black text-gray-800 mb-2">
            {currentDailyChallenge.totalScore}
          </p>
          <p className="text-gray-500">今日综合得分</p>
          <p className="text-sm text-emerald-600 mt-4">
            已记录打卡，继续保持哦！
          </p>
        </motion.div>
      ) : currentLevel && selectedSentence ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              key={currentLevel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-orange-50 to-rose-50 rounded-2xl p-8 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-medium">
                  第 {currentLevelIndex + 1} 关
                  <ChevronRight size={16} />
                  {currentLevel.scene.name}
                </span>
                <span className="text-sm text-gray-500">
                  需达准确率: {currentLevel.requiredAccuracy}%
                </span>
              </div>

              <p className="text-2xl font-bold text-gray-800 text-center mb-2">
                {selectedSentence.text}
              </p>
              <p className="text-gray-500 text-center mb-6">
                {selectedSentence.translation}
              </p>

              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {selectedSentence.chunks.map((chunk, index) => {
                  const tapRecord = tapRecords[index];
                  const isActive = index === currentChunkIndex;
                  const isTapped = tapRecord !== undefined;

                  let statusColor = "bg-gray-200 text-gray-500";
                  if (isActive) {
                    statusColor = chunk.isStressed
                      ? "bg-red-500 text-white scale-110"
                      : "bg-orange-500 text-white scale-110";
                  } else if (isTapped) {
                    const deviation = Math.abs(tapRecord.deviation);
                    if (deviation < 150) {
                      statusColor = "bg-green-400 text-white";
                    } else if (deviation < 300) {
                      statusColor = "bg-yellow-400 text-white";
                    } else {
                      statusColor = "bg-red-400 text-white";
                    }
                  } else if (index < currentChunkIndex) {
                    statusColor = "bg-gray-300 text-gray-600";
                  }

                  return (
                    <motion.span
                      key={index}
                      className={`inline-block px-3 py-2 rounded-lg text-sm font-medium transition-all ${statusColor}`}
                      animate={{ scale: isActive ? 1.1 : 1 }}
                    >
                      {chunk.text}
                      {chunk.isStressed && (
                        <span className="block text-xs opacity-70">重音</span>
                      )}
                      {isTapped && (
                        <span className="block text-xs mt-1">
                          {tapRecord.deviation > 0 ? "+" : ""}
                          {tapRecord.deviation}ms
                        </span>
                      )}
                    </motion.span>
                  );
                })}
              </div>

              <div className="flex justify-center gap-2">
                {selectedSentence.chunks.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentChunkIndex
                        ? "bg-orange-500 scale-150"
                        : index < tapRecords.length
                        ? "bg-orange-300"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </motion.div>

            <div className="flex flex-col items-center gap-6">
              <div className="flex gap-4">
                <motion.button
                  onClick={isTesting ? handleTap : startTest}
                  disabled={currentLevel.completed}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: currentLevel.completed ? 1 : 1.05 }}
                  className={`w-48 h-48 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all ${
                    currentLevel.completed
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : isTesting
                      ? "bg-gradient-to-br from-orange-500 to-rose-600 text-white animate-pulse"
                      : "bg-gradient-to-br from-orange-500 to-rose-600 text-white"
                  }`}
                >
                  {currentLevel.completed ? (
                    <>
                      <CheckCircle size={40} />
                      <span className="text-lg font-bold mt-2">已完成</span>
                    </>
                  ) : isTesting ? (
                    <>
                      <Target size={40} />
                      <span className="text-lg font-bold mt-2">点击节拍</span>
                    </>
                  ) : (
                    <>
                      <Play size={40} />
                      <span className="text-lg font-bold mt-2">开始挑战</span>
                    </>
                  )}
                </motion.button>
              </div>

              {isTesting && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg text-orange-600 font-medium text-center"
                >
                  🎯 跟着节奏点击上面的按钮！已点击 {tapRecords.length} /{" "}
                  {selectedSentence?.chunks.length || 0}
                </motion.p>
              )}

              {!currentLevel.completed && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 text-sm">速度:</span>
                    <input
                      type="range"
                      min="40"
                      max="120"
                      value={bpm}
                      onChange={(e) => setBpm(Number(e.target.value))}
                      className="w-32 accent-orange-500"
                    />
                    <span className="text-orange-500 font-bold w-12">
                      {bpm}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {showResults && stats ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 rounded-xl">
                      <Award className="text-orange-500" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">挑战结果</h3>
                  </div>

                  <div className="flex justify-center mb-6">
                    <div
                      className={`w-24 h-24 rounded-full flex items-center justify-center ${
                        getScoreGrade(stats.score).bg
                      }`}
                    >
                      <span
                        className={`text-4xl font-black ${
                          getScoreGrade(stats.score).color
                        }`}
                      >
                        {getScoreGrade(stats.score).grade}
                      </span>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <p className="text-4xl font-black text-gray-800">
                      {stats.score}
                    </p>
                    <p className="text-gray-500 text-sm">本关得分</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-500" />
                        <span className="text-sm text-gray-600">准确率</span>
                      </div>
                      <span
                        className={`font-bold ${
                          stats.accuracy >= currentLevel.requiredAccuracy
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {stats.accuracy}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-blue-500" />
                        <span className="text-sm text-gray-600">平均偏差</span>
                      </div>
                      <span className="font-bold text-blue-500">
                        {stats.avgDeviation}ms
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={18} className="text-purple-500" />
                        <span className="text-sm text-gray-600">最小偏差</span>
                      </div>
                      <span className="font-bold text-purple-500">
                        {stats.minDeviation}ms
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <XCircle size={18} className="text-red-500" />
                        <span className="text-sm text-gray-600">最大偏差</span>
                      </div>
                      <span className="font-bold text-red-500">
                        {stats.maxDeviation}ms
                      </span>
                    </div>
                  </div>

                  <div
                    className={`mt-6 p-4 rounded-xl ${
                      stats.accuracy >= currentLevel.requiredAccuracy
                        ? "bg-green-50"
                        : "bg-red-50"
                    }`}
                  >
                    <p
                      className={`text-sm text-center ${
                        stats.accuracy >= currentLevel.requiredAccuracy
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {stats.accuracy >= currentLevel.requiredAccuracy
                        ? "🎉 太棒了！准确率达标，可以解锁下一关！"
                        : `💪 准确率未达标（需要 ${currentLevel.requiredAccuracy}%），再试一次吧！`}
                    </p>
                  </div>

                  <div className="mt-6 space-y-2">
                    {stats.accuracy >= currentLevel.requiredAccuracy && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmitLevel}
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold shadow-lg"
                      >
                        确认并进入下一关
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={stopTest}
                      className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                      重新挑战
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="instructions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gray-100 rounded-xl">
                      <Target className="text-gray-500" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">挑战说明</h3>
                  </div>

                  <ol className="space-y-3 text-sm text-gray-600">
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-xs">
                        1
                      </span>
                      <span>每关需要达到指定准确率才能解锁下一关</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-xs">
                        2
                      </span>
                      <span>点击"开始挑战"按钮开始测试</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-xs">
                        3
                      </span>
                      <span>跟着节奏默念，每读完一块就点击按钮</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-xs">
                        4
                      </span>
                      <span>完成所有关卡后获得今日评分</span>
                    </li>
                  </ol>

                  <div className="mt-6 p-4 bg-yellow-50 rounded-xl">
                    <p className="text-xs text-yellow-700">
                      💡 提示：偏差越小说明节奏越稳定。理想状态是每块的偏差都在 150ms 以内
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-3">颜色说明</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-400" />
                  <span className="text-xs text-gray-600">优秀 (＜150ms)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-400" />
                  <span className="text-xs text-gray-600">良好 (150-300ms)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-400" />
                  <span className="text-xs text-gray-600">需改进 (＞300ms)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {showCompletion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCompletion(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full text-center"
            >
              <Sparkles size={80} className="mx-auto text-yellow-500 mb-4" />
              <h3 className="text-3xl font-bold text-gray-800 mb-2">🎊 挑战完成！</h3>
              <p className="text-gray-500 mb-6">恭喜你完成了今日的所有挑战关卡</p>

              <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto my-6 ${getScoreGrade(currentDailyChallenge.totalScore || 0).bg}`}>
                <span className={`text-6xl font-black ${getScoreGrade(currentDailyChallenge.totalScore || 0).color}`}>
                  {currentDailyChallenge.grade}
                </span>
              </div>

              <p className="text-5xl font-black text-gray-800 mb-2">
                {currentDailyChallenge.totalScore}
              </p>
              <p className="text-gray-500 mb-8">今日综合得分</p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCompletion(false)}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-2xl font-bold text-lg shadow-lg"
              >
                太棒了！
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
