import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame, Trophy } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function CheckInCalendar() {
  const { checkInRecords, consecutiveDays, achievements } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );

  const daysInMonth = lastDayOfMonth.getDate();
  const firstDayWeekday = firstDayOfMonth.getDay();

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const getDateString = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${year}-${month}-${dayStr}`;
  };

  const getRecordForDay = (day: number) => {
    const dateStr = getDateString(day);
    return checkInRecords.find((r) => r.date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [firstDayWeekday, daysInMonth]);

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  const monthNames = [
    "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月",
  ];

  const unlockedAchievements = achievements.filter((a) => a.unlocked);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">打卡日历</h3>
          <div className="flex items-center gap-2 mt-1">
            <Flame size={18} className="text-orange-500" />
            <span className="text-sm text-gray-500">
              已连续打卡 <span className="font-bold text-orange-500">{consecutiveDays}</span> 天
            </span>
          </div>
        </div>

        {unlockedAchievements.length > 0 && (
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-yellow-500" />
            <span className="text-sm text-gray-500">
              {unlockedAchievements.length} 个成就
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>

        <h4 className="text-lg font-semibold text-gray-700">
          {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
        </h4>

        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const record = getRecordForDay(day);
          const today = isToday(day);

          return (
            <motion.div
              key={day}
              whileHover={record ? { scale: 1.1 } : {}}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl relative ${
                record
                  ? "bg-green-50"
                  : today
                  ? "bg-orange-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  record
                    ? "text-green-700"
                    : today
                    ? "text-orange-600"
                    : "text-gray-600"
                }`}
              >
                {day}
              </span>

              {record ? (
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-1" />
                  <span className="text-xs font-bold text-green-600 mt-0.5">
                    {record.score}
                  </span>
                </div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-200 mt-1" />
              )}

              {today && (
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-orange-500 rounded-full border-2 border-white" />
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-200" />
          <span className="text-xs text-gray-500">未完成</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-gray-500">已打卡</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-xs text-gray-500">今天</span>
        </div>
      </div>
    </div>
  );
}
