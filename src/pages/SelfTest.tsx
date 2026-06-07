import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Award,
} from "lucide-react";
import { useAppStore, TapRecord } from "@/store/useAppStore";

export default function SelfTest() {
  const {
    selectedScene,
    selectedSentence,
    setSelectedScene,
    bpm,
    setBpm,
    addWrongSlice,
    getAllScenes,
  } = useAppStore();

  const scenes = getAllScenes();
  const [isTesting, setIsTesting] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(-1);
  const [tapRecords, setTapRecords] = useState<TapRecord[]>([]);
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expectedTimesRef = useRef<number[]>([]);

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
    if (!selectedSentence) return;

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
  }, [selectedSentence, speedMultiplier, calculateExpectedTimes]);

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
    if (showResults && selectedSentence && tapRecords.length > 0) {
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

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: "S", color: "text-yellow-500", bg: "bg-yellow-100" };
    if (score >= 80) return { grade: "A", color: "text-green-500", bg: "bg-green-100" };
    if (score >= 70) return { grade: "B", color: "text-blue-500", bg: "bg-blue-100" };
    if (score >= 60) return { grade: "C", color: "text-orange-500", bg: "bg-orange-100" };
    return { grade: "D", color: "text-red-500", bg: "bg-red-100" };
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-2">自测回放</h2>
        <p className="text-gray-500">点击节拍检查你的跟读节奏是否稳定</p>
      </motion.div>

      <div className="w-full">
        <div className="flex items-center justify-center gap-2 mb-6">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => {
                stopTest();
                setSelectedScene(scene.id);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedScene.id === scene.id
                  ? "bg-emerald-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {scene.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {selectedSentence && (
            <motion.div
              key={selectedSentence.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 shadow-lg"
            >
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
                      : "bg-emerald-500 text-white scale-110";
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
                        ? "bg-emerald-500 scale-150"
                        : index < tapRecords.length
                        ? "bg-emerald-300"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-4">
              <motion.button
                onClick={isTesting ? handleTap : startTest}
                disabled={!selectedSentence}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className={`w-48 h-48 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all ${
                  isTesting
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white animate-pulse"
                    : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                }`}
              >
                {isTesting ? (
                  <>
                    <Target size={40} />
                    <span className="text-lg font-bold mt-2">点击节拍</span>
                  </>
                ) : (
                  <>
                    <Play size={40} />
                    <span className="text-lg font-bold mt-2">开始测试</span>
                  </>
                )}
              </motion.button>

              {isTesting && (
                <motion.button
                  onClick={stopTest}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl bg-gradient-to-br from-red-500 to-rose-600 text-white self-center"
                >
                  <Pause size={24} />
                </motion.button>
              )}
            </div>

            {isTesting && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg text-emerald-600 font-medium text-center"
              >
                🎯 跟着节奏点击上面的按钮！已点击 {tapRecords.length} /{" "}
                {selectedSentence?.chunks.length || 0}
              </motion.p>
            )}

            <div className="flex items-center gap-4">
              <button
                onClick={stopTest}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                <RotateCcw size={18} /> 重置
              </button>

              <div className="flex items-center gap-3">
                <span className="text-gray-600 text-sm">速度:</span>
                <input
                  type="range"
                  min="40"
                  max="120"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-32 accent-emerald-500"
                />
                <span className="text-emerald-500 font-bold w-12">
                  {bpm}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {showResults && stats ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <Award className="text-emerald-500" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">测试结果</h3>
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
                <p className="text-gray-500 text-sm">综合得分</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />
                    <span className="text-sm text-gray-600">准确率</span>
                  </div>
                  <span className="font-bold text-green-500">
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

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Target size={18} className="text-orange-500" />
                    <span className="text-sm text-gray-600">点击数</span>
                  </div>
                  <span className="font-bold text-orange-500">
                    {stats.totalTaps} / {stats.expectedTaps}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-emerald-50 rounded-xl">
                <p className="text-sm text-emerald-700 text-center">
                  {stats.score >= 90
                    ? "🎉 太棒了！你的节奏非常稳定！"
                    : stats.score >= 80
                    ? "👍 很好！继续保持，你做得很棒！"
                    : stats.score >= 70
                    ? "💪 不错的表现！再多练习一下会更好！"
                    : stats.score >= 60
                    ? "📚 还需要多练习，注意观察节奏变化！"
                    : "🔄 别灰心，多练习几次，节奏会越来越好的！"}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-100 rounded-xl">
                  <Target className="text-gray-500" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">使用说明</h3>
              </div>

              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xs">
                    1
                  </span>
                  <span>选择一个场景和句子</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xs">
                    2
                  </span>
                  <span>点击"开始测试"按钮</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xs">
                    3
                  </span>
                  <span>跟着节奏默念，每读完一块就点击按钮</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xs">
                    4
                  </span>
                  <span>完成后查看你的节奏稳定性评分</span>
                </li>
              </ol>

              <div className="mt-6 p-4 bg-yellow-50 rounded-xl">
                <p className="text-xs text-yellow-700">
                  💡 提示：偏差越小说明节奏越稳定。理想状态是每块的偏差都在 150ms 以内
                </p>
              </div>
            </div>
          )}

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
    </div>
  );
}
