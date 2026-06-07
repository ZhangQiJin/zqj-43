import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trash2, BookOpen, Mic, Check, ChevronLeft } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { scenes } from "@/data/scenes";

export default function Favorites() {
  const {
    favorites,
    removeFavorites,
    setSelectedScene,
    setSelectedSentence,
    setActiveTab,
    setBpm,
    setIsPlaying,
  } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(favorites.map((f) => f.id)));
      setSelectAll(true);
    }
  };

  const handleRemoveSelected = () => {
    if (selectedIds.size === 0) return;
    removeFavorites(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSelectAll(false);
  };

  const handleQuickPractice = (mode: "rhythm" | "shadow") => {
    if (favorites.length === 0) return;

    const firstFavorite = favorites[0];
    const scene = scenes.find((s) => s.id === firstFavorite.sceneId);
    if (!scene) return;

    setSelectedScene(scene.id);
    setSelectedSentence(firstFavorite.sentence);
    setBpm(firstFavorite.sentence.bpm || 80);
    setIsPlaying(false);
    setActiveTab(mode);
  };

  const hasFavorites = favorites.length > 0;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-2">我的收藏</h2>
        <p className="text-gray-500">
          收藏的句型都在这里，随时可以复习和练习
        </p>
      </motion.div>

      {hasFavorites ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSelectAll}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  selectAll
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {selectAll ? <Check size={16} /> : <ChevronLeft size={16} className="opacity-0" />}
                <span className="text-sm font-medium">全选</span>
              </button>
              {selectedIds.size > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm text-gray-500"
                >
                  已选择 {selectedIds.size} 项
                </motion.span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleRemoveSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-all"
                >
                  <Trash2 size={16} />
                  取消收藏
                </motion.button>
              )}
              <button
                onClick={() => handleQuickPractice("rhythm")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-all"
              >
                <Mic size={16} />
                口型练习
              </button>
              <button
                onClick={() => handleQuickPractice("shadow")}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-medium hover:bg-purple-600 transition-all"
              >
                <BookOpen size={16} />
                影子跟读
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {favorites.map((fav, index) => (
                <motion.div
                  key={fav.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50, height: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`relative overflow-hidden bg-white rounded-2xl p-5 shadow-sm border-2 transition-all cursor-pointer group ${
                    selectedIds.has(fav.id)
                      ? "border-amber-400 bg-amber-50/50"
                      : "border-gray-100 hover:border-amber-200"
                  }`}
                  onClick={() => toggleSelect(fav.id)}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-yellow-500" />

                  <div className="flex items-start gap-4 pl-2">
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 mt-1 ${
                        selectedIds.has(fav.id)
                          ? "bg-amber-500 border-amber-500"
                          : "border-gray-300 group-hover:border-amber-400"
                      }`}
                    >
                      {selectedIds.has(fav.id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <Check size={14} className="text-white" />
                        </motion.div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-lg font-bold text-gray-800 leading-relaxed mb-2">
                            {fav.sentence.text}
                          </p>
                          <p className="text-gray-600 mb-3">
                            {fav.sentence.translation}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 rounded-full text-xs font-medium">
                              <Star size={12} className="fill-amber-400 text-amber-400" />
                              {fav.sceneName}
                            </span>
                            <div className="flex items-center gap-1">
                              {fav.sentence.chunks.map((chunk, i) => (
                                <div
                                  key={i}
                                  className={`h-1 rounded-full w-3 ${
                                    chunk.isStressed ? "bg-red-400" : "bg-blue-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const scene = scenes.find((s) => s.id === fav.sceneId);
                              if (scene) {
                                setSelectedScene(scene.id);
                                setSelectedSentence(fav.sentence);
                                setBpm(fav.sentence.bpm || 80);
                                setIsPlaying(false);
                                setActiveTab("rhythm");
                              }
                            }}
                            className="p-2 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 transition-all"
                            title="口型练习"
                          >
                            <Mic size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const scene = scenes.find((s) => s.id === fav.sceneId);
                              if (scene) {
                                setSelectedScene(scene.id);
                                setSelectedSentence(fav.sentence);
                                setBpm(fav.sentence.bpm || 80);
                                setIsPlaying(false);
                                setActiveTab("shadow");
                              }
                            }}
                            className="p-2 rounded-xl bg-purple-50 text-purple-500 hover:bg-purple-100 transition-all"
                            title="影子跟读"
                          >
                            <BookOpen size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
            <Star size={48} className="text-amber-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">还没有收藏</h3>
          <p className="text-gray-500 mb-6">
            去场景库或影子跟读中收藏你喜欢的句型吧
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setActiveTab("library")}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-all"
            >
              <Star size={18} />
              去场景库
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
