import { motion } from "framer-motion";
import { Mic, BookOpen, Library, BarChart3, VolumeX } from "lucide-react";
import { useAppStore, TabType } from "@/store/useAppStore";
import RhythmPractice from "./RhythmPractice";
import ShadowReading from "./ShadowReading";
import SceneLibrary from "./SceneLibrary";
import SelfTest from "./SelfTest";

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
};

export default function Home() {
  const { activeTab, setActiveTab } = useAppStore();

  const renderContent = () => {
    switch (activeTab) {
      case "rhythm":
        return <RhythmPractice />;
      case "shadow":
        return <ShadowReading />;
      case "library":
        return <SceneLibrary />;
      case "test":
        return <SelfTest />;
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
