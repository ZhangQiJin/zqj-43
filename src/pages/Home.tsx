import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, BookOpen, Library, BarChart3, VolumeX, BookX, Flame, MessageSquare, Star, Settings, X, Clock } from "lucide-react";
import { useAppStore, TabType, FocusModeDuration } from "@/store/useAppStore";
import RhythmPractice from "./RhythmPractice";
import ShadowReading from "./ShadowReading";
import SceneLibrary from "./SceneLibrary";
import SelfTest from "./SelfTest";
import WrongWordBook from "./WrongWordBook";
import DailyChallenge from "./DailyChallenge";
import DialogueSimulation from "./DialogueSimulation";
import Favorites from "./Favorites";
import CheckInCalendar from "@/components/CheckInCalendar";
import AchievementModal from "@/components/AchievementModal";
import FocusModeTimer from "@/components/FocusModeTimer";

const tabs: { id: TabType; label: string; icon: React.ReactNode; color: string }[] = [
  {
    id: "rhythm",
    label: "口型节拍",
    icon: <Mic size={20} />,
    color: "blue",
  },
  {
    id: "shadow",
    label: "影子跟读",
    icon: <BookOpen size={20} />,
    color: "purple",
  },
  {
    id: "dialogue",
    label: "对话模拟",
    icon: <MessageSquare size={20} />,
    color: "indigo",
  },
  {
    id: "library",
    label: "场景库",
    icon: <Library size={20} />,
    color: "orange",
  },
  {
    id: "test",
    label: "自测",
    icon: <BarChart3 size={20} />,
    color: "emerald",
  },
  {
    id: "wrongWords",
    label: "错词本",
    icon: <BookX size={20} />,
    color: "rose",
  },
  {
    id: "dailyChallenge",
    label: "每日挑战",
    icon: <Flame size={20} />,
    color: "orange",
  },
  {
    id: "favorites",
    label: "收藏集",
    icon: <Star size={20} />,
    color: "amber",
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  blue: {
    bg: "bg-blue-500",
    text: "text-blue-500",
    border: "border-blue-500",
  },
  purple: {
    bg: "bg-purple-500",
    text: "text-purple-500",
    border: "border-purple-500",
  },
  indigo: {
    bg: "bg-indigo-500",
    text: "text-indigo-500",
    border: "border-indigo-500",
  },
  orange: {
    bg: "bg-orange-500",
    text: "text-orange-500",
    border: "border-orange-500",
  },
  emerald: {
    bg: "bg-emerald-500",
    text: "text-emerald-500",
    border: "border-emerald-500",
  },
  rose: {
    bg: "bg-rose-500",
    text: "text-rose-500",
    border: "border-rose-500",
  },
  amber: {
    bg: "bg-amber-500",
    text: "text-amber-500",
    border: "border-amber-500",
  },
};

export default function Home() {
  const { activeTab, setActiveTab, currentDailyChallenge, consecutiveDays, focusModeDuration, setFocusModeDuration, isFocusMode } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);

  const durationOptions: { value: FocusModeDuration; label: string; description: string }[] = [
    { value: 15, label: "15 分钟", description: "快速专注，适合碎片时间" },
    { value: 25, label: "25 分钟", description: "标准番茄工作法时长" },
    { value: 45, label: "45 分钟", description: "深度专注，适合长时间学习" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "rhythm":
        return <RhythmPractice />;
      case "shadow":
        return <ShadowReading />;
      case "dialogue":
        return <DialogueSimulation />;
      case "library":
        return <SceneLibrary />;
      case "test":
        return <SelfTest />;
      case "wrongWords":
        return <WrongWordBook />;
      case "dailyChallenge":
        return <DailyChallenge />;
      case "favorites":
        return <Favorites />;
      default:
        return <RhythmPractice />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <VolumeX size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">静音口语教练</h1>
                <p className="text-xs text-gray-500">Silent Speaking Coach</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex items-center gap-1 bg-gray-100 rounded-full p-1"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const colors = colorClasses[tab.color];
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? `${colors.bg} text-white shadow-md`
                        : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </motion.div>

            {!isFocusMode && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setShowSettings(true)}
                className="ml-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-800"
                title="设置"
              >
                <Settings size={20} />
              </motion.button>
            )}
          </div>

          <div className="md:hidden mt-4 flex items-center gap-1 bg-gray-100 rounded-full p-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const colors = colorClasses[tab.color];
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? `${colors.bg} text-white shadow-md`
                      : "text-gray-600"
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab !== "dailyChallenge" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveTab("dailyChallenge")}
                className="lg:col-span-2 bg-gradient-to-r from-orange-500 to-rose-500 rounded-2xl p-6 text-white shadow-lg cursor-pointer relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute right-20 bottom-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Flame size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">每日挑战</h3>
                      <p className="text-white/80 text-sm">完成挑战，赢取今日评分</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-4">
                    <div>
                      <p className="text-3xl font-bold">{consecutiveDays}</p>
                      <p className="text-white/70 text-xs">连续打卡</p>
                    </div>
                    {currentDailyChallenge && (
                      <>
                        <div>
                          <p className="text-3xl font-bold">
                            {currentDailyChallenge.levels.filter((l) => l.completed).length}/
                            {currentDailyChallenge.levels.length}
                          </p>
                          <p className="text-white/70 text-xs">今日进度</p>
                        </div>
                        <div>
                          <p className="text-3xl font-bold">
                            {currentDailyChallenge.grade || "-"}
                          </p>
                          <p className="text-white/70 text-xs">今日评级</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-white/90 text-sm">
                    <span>立即挑战</span>
                    <span>→</span>
                  </div>
                </div>
              </motion.div>

              <div className="lg:col-span-1">
                <CheckInCalendar />
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </main>

      <AchievementModal />
      <FocusModeTimer />

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Clock className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">专注模式设置</h3>
                    <p className="text-xs text-gray-500">自定义你的专注时长</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {durationOptions.map((option) => {
                  const isSelected = focusModeDuration === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => setFocusModeDuration(option.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                        isSelected
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-bold ${isSelected ? "text-green-700" : "text-gray-800"}`}>
                            {option.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <Star size={14} className="text-white fill-white" />
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm text-amber-700">
                  💡 <strong>小提示：</strong>专注模式开启后，将隐藏所有干扰元素，
                  帮助你更高效地练习。需长按退出按钮 2 秒方可退出。
                </p>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full mt-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
              >
                完成
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-16 py-8 border-t border-gray-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            🤫 静音练习，大声成长 | 适合在图书馆、地铁等公共环境使用
          </p>
        </div>
      </footer>
    </div>
  );
}
