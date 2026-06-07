import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { iconOptions } from "@/data/icons";
import { useAppStore } from "@/store/useAppStore";

interface CreateSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (sceneId: string) => void;
}

export default function CreateSceneModal({ isOpen, onClose, onCreated }: CreateSceneModalProps) {
  const { addCustomScene } = useAppStore();
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(iconOptions[0].name);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "请输入场景名称";
    if (!nameEn.trim()) newErrors.nameEn = "请输入英文名称";
    if (!description.trim()) newErrors.description = "请输入场景描述";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const newScene = addCustomScene({
      name: name.trim(),
      nameEn: nameEn.trim(),
      icon: selectedIcon,
      description: description.trim(),
    });

    setName("");
    setNameEn("");
    setDescription("");
    setSelectedIcon(iconOptions[0].name);
    setErrors({});
    onClose();
    onCreated?.(newScene.id);
  };

  const handleClose = () => {
    setName("");
    setNameEn("");
    setDescription("");
    setSelectedIcon(iconOptions[0].name);
    setErrors({});
    onClose();
  };

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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800">创建新场景</h2>
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
                  场景名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：商务会议"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.name ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                  } focus:outline-none focus:ring-2 transition-all`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  英文名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="例如：Business Meeting"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.nameEn ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                  } focus:outline-none focus:ring-2 transition-all`}
                />
                {errors.nameEn && <p className="mt-1 text-sm text-red-500">{errors.nameEn}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择图标
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {iconOptions.map((icon) => {
                    const IconComponent = icon.component;
                    const isSelected = selectedIcon === icon.name;
                    return (
                      <button
                        key={icon.name}
                        onClick={() => setSelectedIcon(icon.name)}
                        className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${icon.color} text-white`}>
                          <IconComponent size={24} />
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  场景描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="描述这个场景的用途，例如：商务会议中常用的英语句型"
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.description ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                  } focus:outline-none focus:ring-2 transition-all resize-none`}
                />
                {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={handleClose}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl"
              >
                创建场景
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
