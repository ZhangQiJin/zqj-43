import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, AlertTriangle } from "lucide-react";
import type { Chunk } from "@/data/scenes";

interface PronunciationTipProps {
  chunk: Chunk;
  children: React.ReactNode;
}

export default function PronunciationTip({ chunk, children }: PronunciationTipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasTip = !!chunk.pronunciationTip || !!chunk.commonError;

  if (!hasTip) {
    return <>{children}</>;
  }

  return (
    <div className="relative inline-block">
      <div
        className="cursor-pointer"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <div className="relative inline-flex items-center">
          {children}
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full text-white shadow-md">
            <Lightbulb size={10} />
          </span>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-64"
            style={{ top: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-l border-t border-gray-100 rotate-45 z-10" />
              {chunk.pronunciationTip && (
                <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
                  <div className="flex items-start gap-2">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                      <Lightbulb size={14} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-700 mb-1">发音要诀</p>
                      <p className="text-sm text-amber-800">{chunk.pronunciationTip}</p>
                    </div>
                  </div>
                </div>
              )}
              {chunk.commonError && (
                <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50">
                  <div className="flex items-start gap-2">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle size={14} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-red-700 mb-1">常见错误</p>
                      <p className="text-sm text-red-800">{chunk.commonError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
