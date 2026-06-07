import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, CheckCircle, Target } from "lucide-react";
import { TestTrendRecord, formatFullTime } from "@/lib/trendStorage";

interface TrendRecordDetailModalProps {
  record: TestTrendRecord | null;
  onClose: () => void;
}

export default function TrendRecordDetailModal({
  record,
  onClose,
}: TrendRecordDetailModalProps) {
  if (!record) return null;

  const getDeviationColor = (deviation: number) => {
    const absDev = Math.abs(deviation);
    if (absDev < 150) return "bg-green-400 text-white";
    if (absDev < 300) return "bg-yellow-400 text-white";
    return "bg-red-400 text-white";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90)
      return { grade: "S", color: "text-yellow-500", bg: "bg-yellow-100" };
    if (score >= 80)
      return { grade: "A", color: "text-green-500", bg: "bg-green-100" };
    if (score >= 70)
      return { grade: "B", color: "text-blue-500", bg: "bg-blue-100" };
    if (score >= 60)
      return { grade: "C", color: "text-orange-500", bg: "bg-orange-100" };
    return { grade: "D", color: "text-red-500", bg: "bg-red-100" };
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-800">测试详情</h3>
              <p className="text-sm text-gray-500 mt-1">
                {formatFullTime(record.timestamp)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
            <div className="mb-6 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
              <p className="text-lg font-bold text-gray-800 mb-1">
                {record.sentenceText}
              </p>
              <p className="text-sm text-gray-500">
                场景: {record.sceneName}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                <div
                  className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    getScoreGrade(record.score).bg
                  }`}
                >
                  <span
                    className={`text-xl font-black ${
                      getScoreGrade(record.score).color
                    }`}
                  >
                    {getScoreGrade(record.score).grade}
                  </span>
                </div>
                <p className="text-2xl font-black text-gray-800">
                  {record.score}
                </p>
                <p className="text-xs text-gray-500">综合得分</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center bg-green-100">
                  <CheckCircle size={24} className="text-green-500" />
                </div>
                <p className="text-2xl font-black text-green-500">
                  {record.accuracy}%
                </p>
                <p className="text-xs text-gray-500">准确率</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center bg-blue-100">
                  <Clock size={24} className="text-blue-500" />
                </div>
                <p className="text-2xl font-black text-blue-500">
                  {record.avgDeviation}ms
                </p>
                <p className="text-xs text-gray-500">平均偏差</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center bg-orange-100">
                  <Target size={24} className="text-orange-500" />
                </div>
                <p className="text-2xl font-black text-orange-500">
                  {record.tapRecords.length}
                </p>
                <p className="text-xs text-gray-500">点击数</p>
              </div>
            </div>

            <h4 className="text-sm font-bold text-gray-700 mb-3">逐块偏差明细</h4>
            <div className="space-y-2">
              {record.chunks.map((chunk, index) => {
                const tapRecord = record.tapRecords[index];
                const deviation = tapRecord
                  ? tapRecord.deviation
                  : undefined;

                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        deviation !== undefined
                          ? getDeviationColor(deviation)
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {chunk.text}
                        {chunk.isStressed && (
                          <span className="ml-2 text-xs text-red-500 font-medium">
                            重音
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        预期时长: {chunk.duration}ms
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {deviation !== undefined ? (
                        <>
                          <p
                            className={`text-sm font-bold ${
                              Math.abs(deviation) < 150
                                ? "text-green-500"
                                : Math.abs(deviation) < 300
                                ? "text-yellow-500"
                                : "text-red-500"
                            }`}
                          >
                            {deviation > 0 ? "+" : ""}
                            {deviation}ms
                          </p>
                          <p className="text-xs text-gray-500">
                            实际: {tapRecord.timestamp}ms
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-gray-400">
                          未点击
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
