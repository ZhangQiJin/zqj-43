import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Plane,
  GraduationCap,
  Coffee,
  ChevronRight,
  Play,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { scenes, Sentence } from "@/data/scenes";
import { useAppStore } from "@/store/useAppStore";

const iconMap: Record<string, React.ReactNode> = {
  Briefcase: <Briefcase size={32} />,
  Plane: <Plane size={32} />,
  GraduationCap: <GraduationCap size={32} />,
  Coffee: <Coffee size={32} />,
};

const colorMap: Record<string, string> = {
  interview: "from-blue-500 to-cyan-500",
  travel: "from-green-500 to-emerald-500",
  classroom: "from-purple-500 to-violet-500",
  daily: "from-orange-500 to-amber-500",
};

export default function SceneLibrary() {
  const { setSelectedScene, setSelectedSentence, setActiveTab } = useAppStore();
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const selectedScene = scenes.find((s) => s.id === selectedSceneId);

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
            {scenes.map((scene, index) => (
              <motion.div
                key={scene.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedSceneId(scene.id)}
                className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer group bg-gradient-to-br ${colorMap[scene.id]} text-white shadow-lg hover:shadow-2xl transition-all hover:scale-105`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                  <div className="mb-4">{iconMap[scene.icon]}</div>
                  <h3 className="text-2xl font-bold mb-1">{scene.name}</h3>
                  <p className="text-white/80 text-sm mb-1">{scene.nameEn}</p>
                  <p className="text-white/70 text-xs mb-4">
                    {scene.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                      {scene.sentences.length} 个句型
                    </span>
                    <ChevronRight
                      size={20}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="sentences"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedSceneId(null)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all"
              >
                <ChevronRight
                  size={20}
                  className="rotate-180"
                />
              </button>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {selectedScene?.name}
                </h3>
                <p className="text-gray-500 text-sm">
                  {selectedScene?.description}
                </p>
              </div>
            </div>

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
                          <Sparkles
                            size={16}
                            className="text-yellow-400"
                          />
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
