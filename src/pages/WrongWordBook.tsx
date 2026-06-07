import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookX,
  Trash2,
  Play,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Clock,
  MapPin,
  Volume2,
} from "lucide-react";
import { useAppStore, WrongSlice } from "@/store/useAppStore";
import { scenes } from "@/data/scenes";

type SortOption = "deviation-desc" | "deviation-asc" | "date-desc" | "date-asc";

export default function WrongWordBook() {
  const {
    wrongSlices,
    removeWrongSlice,
    clearWrongSlices,
    setSelectedScene,
    setSelectedSentence,
    setIsWrongSlicePractice,
    setHighlightedChunkIndex,
    setBpm,
    setActiveTab,
    bpm,
  } = useAppStore();

  const [selectedSceneFilter, setSelectedSceneFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("deviation-desc");

  const filteredAndSortedSlices = useMemo(() => {
    let result = [...wrongSlices];

    if (selectedSceneFilter !== "all") {
      result = result.filter((s) => s.scene.id === selectedSceneFilter);
    }

    switch (sortBy) {
      case "deviation-desc":
        result.sort((a, b) => b.deviation - a.deviation);
        break;
      case "deviation-asc":
        result.sort((a, b) => a.deviation - b.deviation);
        break;
      case "date-desc":
        result.sort((a, b) => b.addedAt - a.addedAt);
        break;
      case "date-asc":
        result.sort((a, b) => a.addedAt - b.addedAt);
        break;
    }

    return result;
  }, [wrongSlices, selectedSceneFilter, sortBy]);

  const handlePractice = (slice: WrongSlice) => {
    setSelectedScene(slice.scene.id);
    setSelectedSentence(slice.sentence);
    setIsWrongSlicePractice(true);
    setHighlightedChunkIndex(slice.chunkIndex);
    const reducedBpm = Math.max(40, Math.round(bpm * 0.8));
    setBpm(reducedBpm);
    setActiveTab("rhythm");
  };

  const getDeviationColor = (deviation: number) => {
    if (deviation >= 500) return "text-red-600 bg-red-100";
    if (deviation >= 400) return "text-orange-600 bg-orange-100";
    return "text-yellow-600 bg-yellow-100";
  };

  const sceneOptions = [
    { id: "all", name: "全部场景" },
    ...scenes.map((s) => ({ id: s.id, name: s.name })),
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "deviation-desc", label: "偏差从大到小" },
    { value: "deviation-asc", label: "偏差从小到大" },
    { value: "date-desc", label: "最新添加" },
    { value: "date-asc", label: "最早添加" },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-2">错词本</h2>
        <p className="text-gray-500">追踪你的薄弱环节，针对性练习提升节奏</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" />
              <span className="text-sm font-medium text-gray-700">
                共 <span className="text-orange-500 font-bold">{wrongSlices.length}</span> 个薄弱切片
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={selectedSceneFilter}
                onChange={(e) => setSelectedSceneFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
              >
                {sceneOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {wrongSlices.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("确定要清空错词本吗？")) {
                    clearWrongSlices();
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-all"
              >
                清空全部
              </button>
            )}
          </div>
        </div>

        {filteredAndSortedSlices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <BookX size={40} className="text-gray-300" />
            </div>
            <p className="text-gray-500 text-lg font-medium mb-2">
              {wrongSlices.length === 0 ? "错词本是空的" : "该场景下没有薄弱切片"}
            </p>
            <p className="text-gray-400 text-sm">
              {wrongSlices.length === 0
                ? "完成自测后，偏差超过 300ms 的切片会自动收录到这里"
                : "试试切换其他场景查看"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedSlices.map((slice, index) => (
              <motion.div
                key={slice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-5 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100 hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${getDeviationColor(
                          slice.deviation
                        )}`}
                      >
                        <Clock size={14} className="inline mr-1" />
                        偏差 {slice.deviation}ms
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium text-gray-600 bg-gray-100 flex items-center gap-1">
                        <MapPin size={14} />
                        {slice.scene.name}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium text-blue-600 bg-blue-50">
                        第 {slice.chunkIndex + 1} 个切片
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-lg font-bold text-gray-800">
                        <span className="bg-yellow-200 px-2 py-0.5 rounded">
                          {slice.chunk.text.trim()}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">
                        所属句子：{slice.sentence.text}
                      </p>
                      <p className="text-sm text-gray-400">
                        {slice.sentence.translation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePractice(slice)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md hover:shadow-lg transition-all"
                    >
                      <Play size={16} />
                      练习
                    </button>
                    <button
                      onClick={() => removeWrongSlice(slice.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="移除"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {wrongSlices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-xl">
              <Volume2 className="text-orange-500" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">练习提示</h3>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• 点击「练习」按钮会跳转到节奏练习页面，并自动选择对应的句子</p>
            <p>• 系统会自动将播放速度降低 20%，让你有更多时间准备</p>
            <p>• 节拍条上会以紫色高亮标记你需要重点练习的切片位置</p>
            <p>• 熟练掌握后，可以点击删除按钮将其从错词本中移除</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
