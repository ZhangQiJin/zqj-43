import { create } from "zustand";
import { scenes, Sentence, Scene } from "@/data/scenes";

export type TabType = "rhythm" | "shadow" | "library" | "test";

export interface TapRecord {
  index: number;
  timestamp: number;
  expectedTime: number;
  deviation: number;
}

interface AppState {
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
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: "rhythm",
  setActiveTab: (tab) => set({ activeTab: tab }),

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
}));
