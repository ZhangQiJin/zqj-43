import { create } from "zustand";
import { scenes, Sentence, Scene, Chunk } from "@/data/scenes";

export type TabType = "rhythm" | "shadow" | "library" | "test" | "wrongWords";

export interface TapRecord {
  index: number;
  timestamp: number;
  expectedTime: number;
  deviation: number;
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
  setIsWrongSlicePractice: (value: boolean) => void;
  setHighlightedChunkIndex: (index: number | null) => void;
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
  setIsWrongSlicePractice: (value) => set({ isWrongSlicePractice: value }),
  setHighlightedChunkIndex: (index) =>
    set({ highlightedChunkIndex: index }),
}));
