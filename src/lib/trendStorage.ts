import { TapRecord } from "@/store/useAppStore";
import { Scene, Sentence } from "@/data/scenes";

export interface TestTrendRecord {
  id: string;
  timestamp: number;
  sceneId: string;
  sceneName: string;
  sentenceId: string;
  sentenceText: string;
  score: number;
  accuracy: number;
  avgDeviation: number;
  grade: string;
  tapRecords: TapRecord[];
  chunks: { text: string; duration: number; isStressed?: boolean }[];
}

const STORAGE_KEY = "self-test-trend-records";
const MAX_RECORDS = 30;

export const loadTrendRecords = (): TestTrendRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load trend records from localStorage:", e);
  }
  return [];
};

export const saveTrendRecord = (
  scene: Scene,
  sentence: Sentence,
  score: number,
  accuracy: number,
  avgDeviation: number,
  grade: string,
  tapRecords: TapRecord[]
): TestTrendRecord[] => {
  const newRecord: TestTrendRecord = {
    id: `test-${Date.now()}`,
    timestamp: Date.now(),
    sceneId: scene.id,
    sceneName: scene.name,
    sentenceId: sentence.id,
    sentenceText: sentence.text,
    score,
    accuracy,
    avgDeviation,
    grade,
    tapRecords: [...tapRecords],
    chunks: sentence.chunks.map((c) => ({
      text: c.text,
      duration: c.duration,
      isStressed: c.isStressed,
    })),
  };

  const existingRecords = loadTrendRecords();
  const updatedRecords = [newRecord, ...existingRecords].slice(0, MAX_RECORDS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
  } catch (e) {
    console.error("Failed to save trend record to localStorage:", e);
  }

  return updatedRecords;
};

export const clearTrendRecords = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear trend records:", e);
  }
};

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
};

export const formatFullTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
