import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const iconMap: Record<string, React.ReactNode> = {
  Trophy: <Trophy size={80} />,
  Crown: <Crown size={80} />,
};

export default function AchievementModal() {
  const { showAchievementModal, closeAchievementModal } = useAppStore();

  return (
    <AnimatePresence>
      {showAchievementModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={closeAchievementModal}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
            transition={{ type: "spring", damping: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 rounded-full blur-2xl" />
              <div className="absolute bottom-10 right-10 w-32 h-32 bg-orange-400 rounded-full blur-3xl" />
            </div>

            <button
              onClick={closeAchievementModal}
              className="absolute top-4 right-4 p-2 hover:bg-white/50 rounded-full transition-colors z-10"
            >
              <X size={20} className="text-gray-500" />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 12 }}
              className="relative z-10"
            >
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white shadow-2xl mb-6">
                {iconMap[showAchievementModal.icon] || <Trophy size={80} />}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative z-10"
            >
              <p className="text-orange-600 font-medium mb-2">🎉 成就解锁！</p>
              <h3 className="text-3xl font-black text-gray-800 mb-2">
                {showAchievementModal.name}
              </h3>
              <p className="text-gray-500 mb-8">
                {showAchievementModal.description}
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={closeAchievementModal}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg"
              >
                太棒了！
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 0,
                  }}
                  animate={{
                    x: Math.cos((i * 30 * Math.PI) / 180) * 150,
                    y: Math.sin((i * 30 * Math.PI) / 180) * 150,
                    scale: 1,
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    delay: 0.3 + i * 0.05,
                    duration: 1,
                    ease: "easeOut",
                  }}
                  className="absolute top-1/2 left-1/2 w-3 h-3 bg-yellow-400 rounded-full -translate-x-1/2 -translate-y-1/2"
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
