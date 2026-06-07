import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Bold, Clock, Scissors, Merge, RefreshCw } from "lucide-react";
import { Chunk, Sentence } from "@/data/scenes";

interface SentenceEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sentence: Omit<Sentence, "id">) => void;
  initialSentence?: Sentence;
  sceneId: string;
}

const DEFAULT_DURATION = 300;
const STRESSED_DURATION = 400;

const createInitialChunks = (text: string): Chunk[] => {
  if (!text.trim()) return [];
  const words = text.split(/(\s+)/);
  return words.map((word) => ({
    text: word,
    isStressed: false,
    duration: word.trim() ? DEFAULT_DURATION : 150,
  }));
};

const calculateBpm = (chunks: Chunk[]): number => {
  const totalDuration = chunks.reduce((sum, chunk) => sum + chunk.duration, 0);
  if (totalDuration === 0) return 80;
  const beats = chunks.filter((c) => c.isStressed).length || chunks.length;
  return Math.round((beats * 60 * 1000) / totalDuration);
};

export default function SentenceEditor({
  isOpen,
  onClose,
  onSave,
  initialSentence,
}: SentenceEditorProps) {
  const [text, setText] = useState("");
  const [translation, setTranslation] = useState("");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedChunkIndex, setSelectedChunkIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialSentence) {
      setText(initialSentence.text);
      setTranslation(initialSentence.translation);
      setChunks(initialSentence.chunks);
    } else {
      setText("");
      setTranslation("");
      setChunks([]);
      setSelectedChunkIndex(null);
    }
    setErrors({});
  }, [initialSentence, isOpen]);

  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    if (newText.trim()) {
      setChunks(createInitialChunks(newText));
    } else {
      setChunks([]);
    }
    setSelectedChunkIndex(null);
  }, []);

  const toggleStress = useCallback((index: number) => {
    setChunks((prev) =>
      prev.map((chunk, i) =>
        i === index
          ? {
              ...chunk,
              isStressed: !chunk.isStressed,
              duration: !chunk.isStressed ? STRESSED_DURATION : DEFAULT_DURATION,
            }
          : chunk
      )
    );
  }, []);

  const adjustDuration = useCallback((index: number, delta: number) => {
    setChunks((prev) =>
      prev.map((chunk, i) =>
        i === index
          ? { ...chunk, duration: Math.max(50, Math.min(2000, chunk.duration + delta)) }
          : chunk
      )
    );
  }, []);

  const splitChunk = useCallback((index: number) => {
    setChunks((prev) => {
      const chunk = prev[index];
      if (!chunk || chunk.text.length <= 1) return prev;
      const mid = Math.floor(chunk.text.length / 2);
      const firstHalf = chunk.text.slice(0, mid);
      const secondHalf = chunk.text.slice(mid);
      const newChunks = [...prev];
      newChunks.splice(index, 1, { ...chunk, text: firstHalf }, { ...chunk, text: secondHalf });
      return newChunks;
    });
  }, []);

  const mergeWithNext = useCallback((index: number) => {
    setChunks((prev) => {
      if (index >= prev.length - 1) return prev;
      const newChunks = [...prev];
      const merged = {
        text: newChunks[index].text + newChunks[index + 1].text,
        isStressed: newChunks[index].isStressed || newChunks[index + 1].isStressed,
        duration: newChunks[index].duration + newChunks[index + 1].duration,
      };
      newChunks.splice(index, 2, merged);
      return newChunks;
    });
  }, []);

  const resetChunks = useCallback(() => {
    setChunks(createInitialChunks(text));
    setSelectedChunkIndex(null);
  }, [text]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!text.trim()) newErrors.text = "请输入英文原文";
    if (!translation.trim()) newErrors.translation = "请输入中文翻译";
    if (chunks.length === 0) newErrors.chunks = "请确保句子有内容";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [text, translation, chunks]);

  const handleSave = useCallback(() => {
    if (!validate()) return;

    const bpm = calculateBpm(chunks);
    onSave({
      text: text.trim(),
      translation: translation.trim(),
      chunks,
      bpm,
    });
    onClose();
  }, [text, translation, chunks, validate, onSave, onClose]);

  const handleClose = useCallback(() => {
    setText("");
    setTranslation("");
    setChunks([]);
    setSelectedChunkIndex(null);
    setErrors({});
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800">
                {initialSentence ? "编辑句子" : "添加新句子"}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-all"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  英文原文 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="输入英文句子，系统将自动按空格切分切片"
                  rows={2}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.text ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                  } focus:outline-none focus:ring-2 transition-all resize-none`}
                />
                {errors.text && <p className="mt-1 text-sm text-red-500">{errors.text}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  中文翻译 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  placeholder="输入中文翻译"
                  rows={2}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.translation ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                  } focus:outline-none focus:ring-2 transition-all resize-none`}
                />
                {errors.translation && <p className="mt-1 text-sm text-red-500">{errors.translation}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    切片编辑
                  </label>
                  <button
                    onClick={resetChunks}
                    className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <RefreshCw size={14} /> 重置切片
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  点击切片选中后可进行编辑：标记重音、调整时长、拆分/合并切片
                </p>

                {chunks.length > 0 ? (
                  <div className="flex flex-wrap gap-1 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    {chunks.map((chunk, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          setSelectedChunkIndex(selectedChunkIndex === index ? null : index)
                        }
                        className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedChunkIndex === index
                            ? "ring-2 ring-blue-500 ring-offset-2"
                            : ""
                        } ${
                          chunk.isStressed
                            ? "bg-red-100 text-red-700 border-2 border-red-300"
                            : "bg-white text-gray-700 border border-gray-200"
                        }`}
                      >
                        {chunk.text || " "}
                        {chunk.isStressed && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-gray-50 rounded-xl border border-gray-200 text-center text-gray-400">
                    输入英文原文后将自动生成切片
                  </div>
                )}
                {errors.chunks && <p className="mt-1 text-sm text-red-500">{errors.chunks}</p>}
              </div>

              {selectedChunkIndex !== null && chunks[selectedChunkIndex] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-blue-50 rounded-xl border border-blue-100"
                >
                  <h4 className="font-medium text-gray-800 mb-3">
                    编辑切片："{chunks[selectedChunkIndex].text}"
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => toggleStress(selectedChunkIndex)}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all ${
                        chunks[selectedChunkIndex].isStressed
                          ? "bg-red-100 border-red-300 text-red-700"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Bold size={16} />
                      <span className="text-sm">
                        {chunks[selectedChunkIndex].isStressed ? "取消重音" : "标记重音"}
                      </span>
                    </button>

                    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3">
                      <Clock size={16} className="text-gray-400" />
                      <button
                        onClick={() => adjustDuration(selectedChunkIndex, -50)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-medium w-16 text-center">
                        {chunks[selectedChunkIndex].duration}ms
                      </span>
                      <button
                        onClick={() => adjustDuration(selectedChunkIndex, 50)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() => splitChunk(selectedChunkIndex)}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <Scissors size={16} />
                      <span className="text-sm">拆分</span>
                    </button>

                    <button
                      onClick={() => mergeWithNext(selectedChunkIndex)}
                      disabled={selectedChunkIndex >= chunks.length - 1}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Merge size={16} />
                      <span className="text-sm">合并</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {chunks.length > 0 && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-400 rounded-full" />
                    <span className="text-sm text-gray-600">重音 ({chunks.filter((c) => c.isStressed).length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-300 rounded-full" />
                    <span className="text-sm text-gray-600">普通 ({chunks.filter((c) => !c.isStressed).length})</span>
                  </div>
                  <div className="ml-auto text-sm text-gray-500">
                    预估 BPM: {calculateBpm(chunks)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={handleClose}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl"
              >
                {initialSentence ? "保存修改" : "添加句子"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
