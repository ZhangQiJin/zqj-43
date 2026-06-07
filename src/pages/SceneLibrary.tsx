import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Play,
  BookOpen,
  Star,
  Plus,
  Edit3,
  Trash2,
  Tag,
} from "lucide-react";
import { scenes, Sentence } from "@/data/scenes";
import { useAppStore } from "@/store/useAppStore";
import { getIconComponent, getIconColor } from "@/data/icons";
import CreateSceneModal from "@/components/CreateSceneModal";
import SentenceEditor from "@/components/SentenceEditor";

export default function SceneLibrary() {
  const {
    setSelectedScene,
    setSelectedSentence,
    setActiveTab,
    toggleFavorite,
    isFavorite,
    getAllScenes,
    addSentenceToScene,
    updateSentenceInScene,
    deleteSentenceFromScene,
    deleteCustomScene,
  } = useAppStore();

  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [showCreateSceneModal, setShowCreateSceneModal] = useState(false);
  const [showSentenceEditor, setShowSentenceEditor] = useState(false);
  const [editingSentence, setEditingSentence] = useState<Sentence | null>(null);

  const allScenes = getAllScenes();
  const selectedScene = allScenes.find((s) => s.id === selectedSceneId);

  const toggleCardFlip = (sentenceId: string) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sentenceId)) {
        newSet.delete(sentenceId);
      } else {
        newSet.add(sentenceId);
      }
      return newSet;
    });
  };

  const goToPractice = (sentence: Sentence) => {
    setSelectedScene(selectedSceneId!);
    setSelectedSentence(sentence);
    setActiveTab("rhythm");
  };

  const goToShadow = (sentence: Sentence) => {
    setSelectedScene(selectedSceneId!);
    setSelectedSentence(sentence);
    setActiveTab("shadow");
  };

  const handleSceneCreated = (sceneId: string) => {
    setSelectedSceneId(sceneId);
  };

  const handleAddSentence = () => {
    setEditingSentence(null);
    setShowSentenceEditor(true);
  };

  const handleEditSentence = (sentence: Sentence) => {
    setEditingSentence(sentence);
    setShowSentenceEditor(true);
  };

  const handleSaveSentence = (sentenceData: Omit<Sentence, "id">) => {
    if (!selectedSceneId) return;

    if (editingSentence) {
      updateSentenceInScene(selectedSceneId, editingSentence.id, sentenceData);
    } else {
      addSentenceToScene(selectedSceneId, sentenceData);
    }
  };

  const handleDeleteSentence = (sentenceId: string) => {
    if (!selectedSceneId || !confirm("确定要删除这个句子吗？")) return;
    deleteSentenceFromScene(selectedSceneId, sentenceId);
  };

  const handleDeleteScene = () => {
    if (!selectedSceneId || !confirm("确定要删除这个场景吗？该场景下的所有句子都将被删除。")) return;
    deleteCustomScene(selectedSceneId);
    setSelectedSceneId(null);
  };

  const renderIcon = (iconName: string, size = 32) => {
    const IconComponent = getIconComponent(iconName);
    return <IconComponent size={size} />;
  };

  const getSceneColor = (scene: typeof scenes[0]) => {
    if (scene.isCustom) {
      return getIconColor(scene.icon);
    }
    const colorMap: Record<string, string> = {
      interview: "from-blue-500 to-cyan-500",
      travel: "from-green-500 to-emerald-500",
      classroom: "from-purple-500 to-violet-500",
      daily: "from-orange-500 to-amber-500",
    };
    return colorMap[scene.id] || getIconColor(scene.icon);
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-2">场景表达库</h2>
        <p className="text-gray-500">选择一个场景，浏览常用句型卡片</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!selectedSceneId ? (
          <motion.div
            key="scenes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {allScenes.map((scene, index) => (
              <motion.div
                key={scene.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedSceneId(scene.id)}
                className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer group shadow-lg hover:shadow-2xl transition-all hover:scale-105 ${
                  scene.isCustom
                    ? `border-2 border-dashed border-gray-300 bg-white hover:border-gray-400`
                    : `bg-gradient-to-br ${getSceneColor(scene)} text-white`
                }`}
              >
                {scene.isCustom ? (
                  <>
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getIconColor(scene.icon)} rounded-full -translate-y-1/2 translate-x-1/2 opacity-10`}
                    />
                    <div
                      className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br ${getIconColor(scene.icon)} rounded-full translate-y-1/2 -translate-x-1/2 opacity-10`}
                    />
                  </>
                ) : (
                  <>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                  </>
                )}

                {scene.isCustom && (
                  <div className="absolute top-3 right-3 z-20">
                    <span className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                      <Tag size={12} />
                      自定义
                    </span>
                  </div>
                )}

                <div className="relative z-10">
                  <div className={`mb-4 ${scene.isCustom ? "" : "text-white"}`}>
                    <div className={scene.isCustom ? `p-2 rounded-lg bg-gradient-to-br ${getIconColor(scene.icon)} inline-block text-white` : ""}>
                      {renderIcon(scene.icon, scene.isCustom ? 24 : 32)}
                    </div>
                  </div>
                  <h3 className={`text-2xl font-bold mb-1 ${scene.isCustom ? "text-gray-800" : "text-white"}`}>
                    {scene.name}
                  </h3>
                  <p className={`text-sm mb-1 ${scene.isCustom ? "text-gray-600" : "text-white/80"}`}>
                    {scene.nameEn}
                  </p>
                  <p className={`text-xs mb-4 ${scene.isCustom ? "text-gray-500" : "text-white/70"}`}>
                    {scene.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm px-3 py-1 rounded-full ${
                        scene.isCustom
                          ? "bg-gray-100 text-gray-700"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {scene.sentences.length} 个句型
                    </span>
                    <ChevronRight
                      size={20}
                      className={`group-hover:translate-x-1 transition-transform ${
                        scene.isCustom ? "text-gray-400" : "text-white"
                      }`}
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: allScenes.length * 0.1 }}
              onClick={() => setShowCreateSceneModal(true)}
              className="relative overflow-hidden rounded-2xl p-6 cursor-pointer group border-2 border-dashed border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 transition-all hover:scale-105 flex flex-col items-center justify-center min-h-[220px]"
            >
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Plus size={32} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-1">创建新场景</h3>
              <p className="text-sm text-gray-500 text-center">
                自定义你的专属学习场景
              </p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="sentences"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedSceneId(null)}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-gray-800">
                      {selectedScene?.name}
                    </h3>
                    {selectedScene?.isCustom && (
                      <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                        <Tag size={12} />
                        自定义
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">
                    {selectedScene?.description}
                  </p>
                </div>
              </div>

              {selectedScene?.isCustom && (
                <div className="flex gap-2">
                  <button
                    onClick={handleAddSentence}
                    className="flex items-center gap-2 py-2 px-4 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-all"
                  >
                    <Plus size={16} /> 添加句子
                  </button>
                  <button
                    onClick={handleDeleteScene}
                    className="flex items-center gap-2 py-2 px-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-all"
                  >
                    <Trash2 size={16} /> 删除场景
                  </button>
                </div>
              )}
            </div>

            {selectedScene?.sentences.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">
                  暂无句子
                </h3>
                <p className="text-gray-500 mb-6">
                  点击上方"添加句子"按钮开始创建你的第一个句子
                </p>
                <button
                  onClick={handleAddSentence}
                  className="inline-flex items-center gap-2 py-3 px-6 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-all"
                >
                  <Plus size={18} /> 添加第一个句子
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedScene?.sentences.map((sentence, index) => (
                  <motion.div
                    key={sentence.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <div
                      className="relative h-48 cursor-pointer perspective-1000"
                      onClick={() => toggleCardFlip(sentence.id)}
                    >
                      <motion.div
                        className="absolute inset-0 w-full h-full"
                        animate={{
                          rotateY: flippedCards.has(sentence.id) ? 180 : 0,
                        }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        style={{
                          transformStyle: "preserve-3d",
                        }}
                      >
                        <div
                          className="absolute inset-0 w-full h-full bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex flex-col"
                          style={{ backfaceVisibility: "hidden" }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                              句型 {index + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              {selectedScene?.isCustom && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditSentence(sentence);
                                    }}
                                    className="p-1 rounded-full hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Edit3 size={16} className="text-gray-400 hover:text-blue-500" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSentence(sentence.id);
                                    }}
                                    className="p-1 rounded-full hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(sentence, selectedScene!);
                                }}
                                className="p-1 rounded-full hover:bg-gray-100 transition-all"
                              >
                                <motion.div
                                  key={isFavorite(sentence.id) ? "filled" : "empty"}
                                  initial={{ scale: 0.8, rotate: -30 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                  <Star
                                    size={18}
                                    className={
                                      isFavorite(sentence.id)
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                    }
                                  />
                                </motion.div>
                              </button>
                            </div>
                          </div>
                          <p className="text-lg font-bold text-gray-800 leading-relaxed mb-2">
                            {sentence.text}
                          </p>
                          <div className="flex items-center gap-1 mt-auto">
                            {sentence.chunks.map((chunk, i) => (
                              <div
                                key={i}
                                className={`h-1 rounded-full flex-1 ${
                                  chunk.isStressed
                                    ? "bg-red-400"
                                    : "bg-blue-300"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-2 text-center">
                            点击卡片翻面查看翻译
                          </p>
                        </div>

                        <div
                          className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-100 flex flex-col"
                          style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                          }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                              中文翻译
                            </span>
                            <BookOpen size={16} className="text-green-500" />
                          </div>
                          <p className="text-xl font-bold text-gray-700 leading-relaxed mb-2">
                            {sentence.translation}
                          </p>
                          <p className="text-sm text-gray-500 mt-auto">
                            原句: {sentence.text}
                          </p>
                        </div>
                      </motion.div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goToPractice(sentence);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-all"
                      >
                        <Play size={14} /> 口型练习
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goToShadow(sentence);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-purple-500 text-white rounded-xl text-sm font-medium hover:bg-purple-600 transition-all"
                      >
                        <BookOpen size={14} /> 影子跟读
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <CreateSceneModal
        isOpen={showCreateSceneModal}
        onClose={() => setShowCreateSceneModal(false)}
        onCreated={handleSceneCreated}
      />

      <SentenceEditor
        isOpen={showSentenceEditor}
        onClose={() => {
          setShowSentenceEditor(false);
          setEditingSentence(null);
        }}
        onSave={handleSaveSentence}
        initialSentence={editingSentence || undefined}
        sceneId={selectedSceneId || ""}
      />
    </div>
  );
}
