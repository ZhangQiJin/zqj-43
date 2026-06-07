import { create } from "zustand";
import { scenes, Sentence, Scene, Chunk } from "@/data/scenes";
import { Dialogue, DialogueTurn } from "@/data/dialogues";

export type TabType = "rhythm" | "shadow" | "library" | "test" | "wrongWords" | "dailyChallenge" | "dialogue" | "favorites";

export interface ChallengeLevel {
  id: number;
  sentence: Sentence;
  scene: Scene;
  requiredAccuracy: number;
  completed: boolean;
  score: number | null;
  completedAt: number | null;
}

export interface DailyChallenge {
  date: string;
  levels: ChallengeLevel[];
  completed: boolean;
  totalScore: number | null;
  grade: string | null;
  completedAt: number | null;
}

export interface CheckInRecord {
  date: string;
  score: number;
  completedAt: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: number | null;
}

interface ChallengeState {
  currentDailyChallenge: DailyChallenge | null;
  currentLevelIndex: number;
  checkInRecords: CheckInRecord[];
  consecutiveDays: number;
  achievements: Achievement[];
  showAchievementModal: Achievement | null;
  generateDailyChallenge: () => void;
  setCurrentLevelIndex: (index: number) => void;
  completeLevel: (levelId: number, score: number, accuracy: number) => { success: boolean; allCompleted: boolean };
  completeDailyChallenge: () => void;
  checkAndUnlockAchievements: () => void;
  closeAchievementModal: () => void;
}

export interface TapRecord {
  index: number;
  timestamp: number;
  expectedTime: number;
  deviation: number;
}

export interface DialogueTurnRecord {
  turnId: string;
  turnIndex: number;
  clickTimestamp: number;
  expectedDuration: number;
  deviation: number;
  completed: boolean;
}

export interface DialogueResult {
  dialogueId: string;
  completionRate: number;
  averageDeviation: number;
  rhythmStability: number;
  turnRecords: DialogueTurnRecord[];
  totalScore: number;
  grade: string;
}

export interface WrongSlice {
  id: string;
  chunk: Chunk;
  chunkIndex: number;
  sentence: Sentence;
  scene: Scene;
  deviation: number;
  addedAt: number;
}

export interface FavoriteSentence {
  id: string;
  sentence: Sentence;
  sceneId: string;
  sceneName: string;
  addedAt: number;
}

export interface QueueSentence {
  sentence: Sentence;
  sceneId: string;
  sceneName: string;
}

interface AppState extends ChallengeState {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  selectedScene: Scene;
  selectedSentence: Sentence | null;
  setSelectedScene: (sceneId: string) => void;
  setSelectedSentence: (sentence: Sentence | null) => void;

  isPlaying: boolean;
  currentChunkIndex: number;
  setIsPlaying: (playing: boolean) => void;
  setCurrentChunkIndex: (index: number) => void;

  bpm: number;
  setBpm: (bpm: number) => void;

  tapRecords: TapRecord[];
  addTapRecord: (record: TapRecord) => void;
  clearTapRecords: () => void;

  isRecordingMode: boolean;
  isPlayingRecording: boolean;
  recordingPlaybackTime: number;
  setIsRecordingMode: (mode: boolean) => void;
  setIsPlayingRecording: (playing: boolean) => void;
  setRecordingPlaybackTime: (time: number) => void;

  wrongSlices: WrongSlice[];
  addWrongSlice: (slice: Omit<WrongSlice, "id" | "addedAt">) => void;
  removeWrongSlice: (id: string) => void;
  clearWrongSlices: () => void;

  isWrongSlicePractice: boolean;
  highlightedChunkIndex: number | null;
  originalBpm: number | null;
  setIsWrongSlicePractice: (value: boolean) => void;
  setHighlightedChunkIndex: (index: number | null) => void;
  setOriginalBpm: (bpm: number | null) => void;
  startWrongSlicePractice: (highlightedIndex: number, currentBpm: number) => void;
  exitWrongSlicePractice: () => void;

  selectedDialogue: Dialogue | null;
  currentTurnIndex: number;
  dialoguePhase: "idle" | "playing" | "waitingForInput" | "finished";
  dialogueTurnRecords: DialogueTurnRecord[];
  dialogueResult: DialogueResult | null;
  currentChunkIndexInTurn: number;
  setSelectedDialogue: (dialogue: Dialogue | null) => void;
  setCurrentTurnIndex: (index: number) => void;
  setDialoguePhase: (phase: "idle" | "playing" | "waitingForInput" | "finished") => void;
  addDialogueTurnRecord: (record: DialogueTurnRecord) => void;
  clearDialogueTurnRecords: () => void;
  setDialogueResult: (result: DialogueResult | null) => void;
  setCurrentChunkIndexInTurn: (index: number) => void;
  resetDialogueState: () => void;

  favorites: FavoriteSentence[];
  toggleFavorite: (sentence: Sentence, scene: Scene) => void;
  removeFavorite: (sentenceId: string) => void;
  removeFavorites: (sentenceIds: string[]) => void;
  clearFavorites: () => void;
  isFavorite: (sentenceId: string) => boolean;

  practiceQueue: QueueSentence[];
  practiceQueueIndex: number;
  isPracticeQueueMode: boolean;
  setPracticeQueue: (queue: QueueSentence[]) => void;
  setPracticeQueueIndex: (index: number) => void;
  setIsPracticeQueueMode: (mode: boolean) => void;
  startPracticeQueue: (queue: QueueSentence[], mode: TabType, startIndex?: number) => void;
  nextInQueue: () => void;
  prevInQueue: () => void;
  clearPracticeQueue: () => void;
}

const FAVORITES_STORAGE_KEY = "silent-speaking-favorites";

const loadFavoritesFromStorage = (): FavoriteSentence[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load favorites from localStorage:", e);
  }
  return [];
};

const saveFavoritesToStorage = (favorites: FavoriteSentence[]) => {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.error("Failed to save favorites to localStorage:", e);
  }
};

const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const getGrade = (score: number) => {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
};

const calculateConsecutiveDays = (records: CheckInRecord[]) => {
  if (records.length === 0) return 0;

  const sortedDates = [...new Set(records.map((r) => r.date))].sort().reverse();
  let consecutive = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedDates.length; i++) {
    const recordDate = new Date(sortedDates[i]);
    recordDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (recordDate.getTime() === expectedDate.getTime()) {
      consecutive++;
    } else {
      break;
    }
  }

  return consecutive;
};

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: "rhythm",
  setActiveTab: (tab) => set({ activeTab: tab }),

  favorites: loadFavoritesFromStorage(),

  practiceQueue: [],
  practiceQueueIndex: 0,
  isPracticeQueueMode: false,

  currentDailyChallenge: null,
  currentLevelIndex: 0,
  checkInRecords: [],
  consecutiveDays: 0,
  achievements: [
    {
      id: "streak_7",
      name: "坚持一周",
      description: "连续打卡 7 天",
      icon: "Trophy",
      unlocked: false,
      unlockedAt: null,
    },
    {
      id: "streak_30",
      name: "月度达人",
      description: "连续打卡 30 天",
      icon: "Crown",
      unlocked: false,
      unlockedAt: null,
    },
  ],
  showAchievementModal: null,

  generateDailyChallenge: () => {
    const today = getTodayString();
    const existingChallenge = get().currentDailyChallenge;

    if (existingChallenge && existingChallenge.date === today) {
      return;
    }

    const allSentences: { sentence: Sentence; scene: Scene }[] = [];
    scenes.forEach((scene) => {
      scene.sentences.forEach((sentence) => {
        allSentences.push({ sentence, scene });
      });
    });

    const shuffled = [...allSentences].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);

    const levels: ChallengeLevel[] = selected.map((item, index) => ({
      id: index,
      sentence: item.sentence,
      scene: item.scene,
      requiredAccuracy: 80,
      completed: false,
      score: null,
      completedAt: null,
    }));

    set({
      currentDailyChallenge: {
        date: today,
        levels,
        completed: false,
        totalScore: null,
        grade: null,
        completedAt: null,
      },
      currentLevelIndex: 0,
    });
  },

  setCurrentLevelIndex: (index) => set({ currentLevelIndex: index }),

  completeLevel: (levelId, score, accuracy) => {
    const state = get();
    const challenge = state.currentDailyChallenge;
    if (!challenge) return { success: false, allCompleted: false };

    const level = challenge.levels.find((l) => l.id === levelId);
    if (!level || level.completed) return { success: false, allCompleted: false };

    if (accuracy < level.requiredAccuracy) {
      return { success: false, allCompleted: false };
    }

    const updatedLevels = challenge.levels.map((l) =>
      l.id === levelId
        ? { ...l, completed: true, score, completedAt: Date.now() }
        : l
    );

    const nextIndex = updatedLevels.findIndex((l) => !l.completed);
    const allCompleted = nextIndex === -1;

    set({
      currentDailyChallenge: {
        ...challenge,
        levels: updatedLevels,
      },
      currentLevelIndex: allCompleted ? state.currentLevelIndex : nextIndex,
    });

    return { success: true, allCompleted };
  },

  completeDailyChallenge: () => {
    const state = get();
    const challenge = state.currentDailyChallenge;
    if (!challenge || challenge.completed) return;

    const allCompleted = challenge.levels.every((l) => l.completed);
    if (!allCompleted) return;

    const totalScore = Math.round(
      challenge.levels.reduce((sum, l) => sum + (l.score || 0), 0) /
        challenge.levels.length
    );

    const today = getTodayString();
    const newRecord: CheckInRecord = {
      date: today,
      score: totalScore,
      completedAt: Date.now(),
    };

    const existingRecords = state.checkInRecords.filter(
      (r) => r.date !== today
    );
    const updatedRecords = [...existingRecords, newRecord];
    const consecutive = calculateConsecutiveDays(updatedRecords);

    set({
      currentDailyChallenge: {
        ...challenge,
        completed: true,
        totalScore,
        grade: getGrade(totalScore),
        completedAt: Date.now(),
      },
      checkInRecords: updatedRecords,
      consecutiveDays: consecutive,
    });

    get().checkAndUnlockAchievements();
  },

  checkAndUnlockAchievements: () => {
    const state = get();
    const { consecutiveDays, achievements } = state;
    let unlockedAchievement: Achievement | null = null;

    const updatedAchievements = achievements.map((achievement) => {
      if (achievement.unlocked) return achievement;

      let shouldUnlock = false;
      if (achievement.id === "streak_7" && consecutiveDays >= 7) {
        shouldUnlock = true;
      } else if (achievement.id === "streak_30" && consecutiveDays >= 30) {
        shouldUnlock = true;
      }

      if (shouldUnlock) {
        unlockedAchievement = { ...achievement, unlocked: true, unlockedAt: Date.now() };
        return unlockedAchievement;
      }

      return achievement;
    });

    if (unlockedAchievement) {
      set({
        achievements: updatedAchievements,
        showAchievementModal: unlockedAchievement,
      });
    } else {
      set({ achievements: updatedAchievements });
    }
  },

  closeAchievementModal: () => set({ showAchievementModal: null }),

  selectedScene: scenes[0],
  selectedSentence: scenes[0].sentences[0],
  setSelectedScene: (sceneId) => {
    const scene = scenes.find((s) => s.id === sceneId) || scenes[0];
    set({ selectedScene: scene, selectedSentence: scene.sentences[0] });
  },
  setSelectedSentence: (sentence) => set({ selectedSentence: sentence }),

  isPlaying: false,
  currentChunkIndex: -1,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentChunkIndex: (index) => set({ currentChunkIndex: index }),

  bpm: 80,
  setBpm: (bpm) => set({ bpm }),

  tapRecords: [],
  addTapRecord: (record) =>
    set((state) => ({ tapRecords: [...state.tapRecords, record] })),
  clearTapRecords: () => set({ tapRecords: [] }),

  isRecordingMode: false,
  isPlayingRecording: false,
  recordingPlaybackTime: 0,
  setIsRecordingMode: (mode) => set({ isRecordingMode: mode }),
  setIsPlayingRecording: (playing) => set({ isPlayingRecording: playing }),
  setRecordingPlaybackTime: (time) => set({ recordingPlaybackTime: time }),

  wrongSlices: [],
  addWrongSlice: (slice) =>
    set((state) => {
      const exists = state.wrongSlices.some(
        (s) =>
          s.sentence.id === slice.sentence.id &&
          s.chunkIndex === slice.chunkIndex
      );
      if (exists) return state;
      const newSlice: WrongSlice = {
        ...slice,
        id: `${slice.sentence.id}-${slice.chunkIndex}-${Date.now()}`,
        addedAt: Date.now(),
      };
      return { wrongSlices: [...state.wrongSlices, newSlice] };
    }),
  removeWrongSlice: (id) =>
    set((state) => ({
      wrongSlices: state.wrongSlices.filter((s) => s.id !== id),
    })),
  clearWrongSlices: () => set({ wrongSlices: [] }),

  isWrongSlicePractice: false,
  highlightedChunkIndex: null,
  originalBpm: null,
  setIsWrongSlicePractice: (value) => set({ isWrongSlicePractice: value }),
  setHighlightedChunkIndex: (index) =>
    set({ highlightedChunkIndex: index }),
  setOriginalBpm: (bpm) => set({ originalBpm: bpm }),
  startWrongSlicePractice: (highlightedIndex, currentBpm) =>
    set(() => {
      const newBpm = Math.max(40, Math.round(currentBpm * 0.8));
      return {
        isWrongSlicePractice: true,
        highlightedChunkIndex: highlightedIndex,
        originalBpm: currentBpm,
        bpm: newBpm,
      };
    }),
  exitWrongSlicePractice: () =>
    set((state) => ({
      isWrongSlicePractice: false,
      highlightedChunkIndex: null,
      bpm: state.originalBpm ?? state.bpm,
      originalBpm: null,
    })),

  selectedDialogue: null,
  currentTurnIndex: 0,
  dialoguePhase: "idle",
  dialogueTurnRecords: [],
  dialogueResult: null,
  currentChunkIndexInTurn: -1,
  setSelectedDialogue: (dialogue) => set({ selectedDialogue: dialogue }),
  setCurrentTurnIndex: (index) => set({ currentTurnIndex: index }),
  setDialoguePhase: (phase) => set({ dialoguePhase: phase }),
  addDialogueTurnRecord: (record) =>
    set((state) => ({ dialogueTurnRecords: [...state.dialogueTurnRecords, record] })),
  clearDialogueTurnRecords: () => set({ dialogueTurnRecords: [] }),
  setDialogueResult: (result) => set({ dialogueResult: result }),
  setCurrentChunkIndexInTurn: (index) => set({ currentChunkIndexInTurn: index }),
  resetDialogueState: () =>
    set({
      currentTurnIndex: 0,
      dialoguePhase: "idle",
      dialogueTurnRecords: [],
      dialogueResult: null,
      currentChunkIndexInTurn: -1,
    }),

  toggleFavorite: (sentence, scene) =>
    set((state) => {
      const exists = state.favorites.some((f) => f.id === sentence.id);
      let newFavorites: FavoriteSentence[];
      if (exists) {
        newFavorites = state.favorites.filter((f) => f.id !== sentence.id);
      } else {
        const newFavorite: FavoriteSentence = {
          id: sentence.id,
          sentence,
          sceneId: scene.id,
          sceneName: scene.name,
          addedAt: Date.now(),
        };
        newFavorites = [...state.favorites, newFavorite];
      }
      saveFavoritesToStorage(newFavorites);
      return { favorites: newFavorites };
    }),

  removeFavorite: (sentenceId) =>
    set((state) => {
      const newFavorites = state.favorites.filter((f) => f.id !== sentenceId);
      saveFavoritesToStorage(newFavorites);
      return { favorites: newFavorites };
    }),

  removeFavorites: (sentenceIds) =>
    set((state) => {
      const newFavorites = state.favorites.filter((f) => !sentenceIds.includes(f.id));
      saveFavoritesToStorage(newFavorites);
      return { favorites: newFavorites };
    }),

  clearFavorites: () => {
    saveFavoritesToStorage([]);
    set({ favorites: [] });
  },

  isFavorite: (sentenceId) => {
    return get().favorites.some((f) => f.id === sentenceId);
  },

  setPracticeQueue: (queue) => set({ practiceQueue: queue }),
  setPracticeQueueIndex: (index) => set({ practiceQueueIndex: index }),
  setIsPracticeQueueMode: (mode) => set({ isPracticeQueueMode: mode }),

  startPracticeQueue: (queue, mode, startIndex = 0) => {
    if (queue.length === 0) return;
    const safeIndex = Math.max(0, Math.min(startIndex, queue.length - 1));
    const startItem = queue[safeIndex];
    const scene = scenes.find((s) => s.id === startItem.sceneId);
    if (!scene) return;

    set({
      practiceQueue: queue,
      practiceQueueIndex: safeIndex,
      isPracticeQueueMode: true,
      selectedScene: scene,
      selectedSentence: startItem.sentence,
      bpm: startItem.sentence.bpm || 80,
      isPlaying: false,
      currentChunkIndex: -1,
    });

    get().setActiveTab(mode);
  },

  nextInQueue: () => {
    const state = get();
    if (!state.isPracticeQueueMode || state.practiceQueue.length === 0) return;

    const nextIndex = state.practiceQueueIndex + 1;
    if (nextIndex >= state.practiceQueue.length) {
      return;
    }

    const nextItem = state.practiceQueue[nextIndex];
    const scene = scenes.find((s) => s.id === nextItem.sceneId);
    if (!scene) return;

    set({
      practiceQueueIndex: nextIndex,
      selectedScene: scene,
      selectedSentence: nextItem.sentence,
      bpm: nextItem.sentence.bpm || 80,
      isPlaying: false,
      currentChunkIndex: -1,
    });
  },

  prevInQueue: () => {
    const state = get();
    if (!state.isPracticeQueueMode || state.practiceQueue.length === 0) return;

    const prevIndex = state.practiceQueueIndex - 1;
    if (prevIndex < 0) return;

    const prevItem = state.practiceQueue[prevIndex];
    const scene = scenes.find((s) => s.id === prevItem.sceneId);
    if (!scene) return;

    set({
      practiceQueueIndex: prevIndex,
      selectedScene: scene,
      selectedSentence: prevItem.sentence,
      bpm: prevItem.sentence.bpm || 80,
      isPlaying: false,
      currentChunkIndex: -1,
    });
  },

  clearPracticeQueue: () => {
    set({
      practiceQueue: [],
      practiceQueueIndex: 0,
      isPracticeQueueMode: false,
    });
  },
}));
