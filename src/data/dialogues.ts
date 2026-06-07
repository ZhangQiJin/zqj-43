import { scenes, Sentence } from "./scenes";

export interface DialogueTurn {
  id: string;
  speaker: "ai" | "user";
  sentence: Sentence;
}

export interface Dialogue {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  sceneId: string;
  turns: DialogueTurn[];
}

const createDialogueFromScene = (
  id: string,
  name: string,
  nameEn: string,
  icon: string,
  description: string,
  sceneId: string,
  sentenceIndices: number[],
  speakerPattern: ("ai" | "user")[]
): Dialogue => {
  const scene = scenes.find((s) => s.id === sceneId);
  if (!scene) throw new Error(`Scene not found: ${sceneId}`);

  const turns: DialogueTurn[] = sentenceIndices.map((idx, i) => ({
    id: `${id}-turn-${i}`,
    speaker: speakerPattern[i % speakerPattern.length],
    sentence: scene.sentences[idx],
  }));

  return { id, name, nameEn, icon, description, sceneId, turns };
};

export const dialogues: Dialogue[] = [
  createDialogueFromScene(
    "interview-basic",
    "面试基础对话",
    "Basic Interview",
    "Briefcase",
    "模拟面试中的自我介绍和基本问答",
    "interview",
    [0, 1, 2, 3],
    ["user", "ai", "user", "ai"]
  ),
  createDialogueFromScene(
    "travel-restaurant",
    "餐厅推荐对话",
    "Restaurant Recommendation",
    "UtensilsCrossed",
    "模拟旅行中询问餐厅推荐的对话",
    "travel",
    [0, 1, 2, 3],
    ["user", "ai", "user", "ai"]
  ),
  createDialogueFromScene(
    "classroom-question",
    "课堂提问对话",
    "Classroom Questions",
    "GraduationCap",
    "模拟课堂上向老师提问的对话",
    "classroom",
    [0, 1, 2, 3],
    ["user", "ai", "user", "ai"]
  ),
  createDialogueFromScene(
    "daily-smalltalk",
    "日常闲聊对话",
    "Daily Small Talk",
    "Coffee",
    "模拟日常生活中的闲聊对话",
    "daily",
    [0, 1, 2, 3],
    ["ai", "user", "ai", "user"]
  ),
];
