import { describe, it, expect } from "vitest";
import { calculateStats, getScoreGrade } from "../rating";

describe("rating", () => {
  describe("calculateStats", () => {
    it("所有点击偏差均为 0ms 的完美节奏", () => {
      const deviations = [0, 0, 0, 0, 0];
      const result = calculateStats(deviations, 5);

      expect(result).not.toBeNull();
      expect(result?.avgDeviation).toBe(0);
      expect(result?.maxDeviation).toBe(0);
      expect(result?.minDeviation).toBe(0);
      expect(result?.accuracy).toBe(100);
      expect(result?.score).toBe(100);
      expect(result?.totalTaps).toBe(5);
      expect(result?.expectedTaps).toBe(5);
    });

    it("偏差全部在 100ms 以内的优秀节奏", () => {
      const deviations = [50, 80, 30, 90, 60];
      const result = calculateStats(deviations, 5);

      expect(result).not.toBeNull();
      expect(result?.avgDeviation).toBe(62);
      expect(result?.maxDeviation).toBe(90);
      expect(result?.minDeviation).toBe(30);
      expect(result?.accuracy).toBe(100);
      expect(result?.score).toBe(94);
      expect(result?.totalTaps).toBe(5);
      expect(result?.expectedTaps).toBe(5);
    });

    it("偏差全部在 200-300ms 之间的中等节奏", () => {
      const deviations = [220, 250, 280, 210, 270];
      const result = calculateStats(deviations, 5);

      expect(result).not.toBeNull();
      expect(result?.avgDeviation).toBe(246);
      expect(result?.maxDeviation).toBe(280);
      expect(result?.minDeviation).toBe(210);
      expect(result?.accuracy).toBe(0);
      expect(result?.score).toBe(25);
      expect(result?.totalTaps).toBe(5);
      expect(result?.expectedTaps).toBe(5);
    });

    it("偏差全部超过 500ms 的较差节奏", () => {
      const deviations = [550, 600, 520, 580, 620];
      const result = calculateStats(deviations, 5);

      expect(result).not.toBeNull();
      expect(result?.avgDeviation).toBe(574);
      expect(result?.maxDeviation).toBe(620);
      expect(result?.minDeviation).toBe(520);
      expect(result?.accuracy).toBe(0);
      expect(result?.score).toBe(0);
      expect(result?.totalTaps).toBe(5);
      expect(result?.expectedTaps).toBe(5);
    });

    it("部分点击缺失（点击次数少于预期切片数）", () => {
      const deviations = [50, 100, 150];
      const result = calculateStats(deviations, 5);

      expect(result).not.toBeNull();
      expect(result?.avgDeviation).toBe(100);
      expect(result?.maxDeviation).toBe(150);
      expect(result?.minDeviation).toBe(50);
      expect(result?.accuracy).toBe(100);
      expect(result?.score).toBe(90);
      expect(result?.totalTaps).toBe(3);
      expect(result?.expectedTaps).toBe(5);
    });

    it("空数组返回 null", () => {
      const result = calculateStats([], 5);
      expect(result).toBeNull();
    });

    it("负值偏差（取绝对值计算）", () => {
      const deviations = [-50, -100, 50, -30, 100];
      const result = calculateStats(deviations, 5);

      expect(result).not.toBeNull();
      expect(result?.avgDeviation).toBe(66);
      expect(result?.maxDeviation).toBe(100);
      expect(result?.minDeviation).toBe(30);
      expect(result?.accuracy).toBe(100);
      expect(result?.score).toBe(93);
    });

    it("正负偏差混合场景", () => {
      const deviations = [-150, 180, -50, 250, -300];
      const result = calculateStats(deviations, 5);

      expect(result).not.toBeNull();
      expect(result?.avgDeviation).toBe(186);
      expect(result?.maxDeviation).toBe(300);
      expect(result?.minDeviation).toBe(50);
      expect(result?.accuracy).toBe(60);
      expect(result?.score).toBe(61);
    });

    it("单个点击数据", () => {
      const deviations = [150];
      const result = calculateStats(deviations, 1);

      expect(result).not.toBeNull();
      expect(result?.avgDeviation).toBe(150);
      expect(result?.maxDeviation).toBe(150);
      expect(result?.minDeviation).toBe(150);
      expect(result?.accuracy).toBe(100);
      expect(result?.score).toBe(85);
      expect(result?.totalTaps).toBe(1);
      expect(result?.expectedTaps).toBe(1);
    });

    it("边界值 199ms 应计入准确", () => {
      const deviations = [199, 199, 199];
      const result = calculateStats(deviations, 3);

      expect(result).not.toBeNull();
      expect(result?.accuracy).toBe(100);
    });

    it("边界值 200ms 不应计入准确", () => {
      const deviations = [200, 200, 200];
      const result = calculateStats(deviations, 3);

      expect(result).not.toBeNull();
      expect(result?.accuracy).toBe(0);
    });

    it("极大偏差值得分不低于 0", () => {
      const deviations = [10000, 20000, 30000];
      const result = calculateStats(deviations, 3);

      expect(result).not.toBeNull();
      expect(result?.score).toBe(0);
    });
  });

  describe("getScoreGrade", () => {
    it("S 等级：得分 >= 90", () => {
      expect(getScoreGrade(100).grade).toBe("S");
      expect(getScoreGrade(95).grade).toBe("S");
      expect(getScoreGrade(90).grade).toBe("S");
    });

    it("A 等级：80 <= 得分 < 90", () => {
      expect(getScoreGrade(89).grade).toBe("A");
      expect(getScoreGrade(85).grade).toBe("A");
      expect(getScoreGrade(80).grade).toBe("A");
    });

    it("B 等级：70 <= 得分 < 80", () => {
      expect(getScoreGrade(79).grade).toBe("B");
      expect(getScoreGrade(75).grade).toBe("B");
      expect(getScoreGrade(70).grade).toBe("B");
    });

    it("C 等级：60 <= 得分 < 70", () => {
      expect(getScoreGrade(69).grade).toBe("C");
      expect(getScoreGrade(65).grade).toBe("C");
      expect(getScoreGrade(60).grade).toBe("C");
    });

    it("D 等级：得分 < 60", () => {
      expect(getScoreGrade(59).grade).toBe("D");
      expect(getScoreGrade(50).grade).toBe("D");
      expect(getScoreGrade(0).grade).toBe("D");
    });

    it("等级包含正确的颜色配置", () => {
      const sGrade = getScoreGrade(95);
      expect(sGrade.color).toBe("text-yellow-500");
      expect(sGrade.bg).toBe("bg-yellow-100");

      const aGrade = getScoreGrade(85);
      expect(aGrade.color).toBe("text-green-500");
      expect(aGrade.bg).toBe("bg-green-100");

      const bGrade = getScoreGrade(75);
      expect(bGrade.color).toBe("text-blue-500");
      expect(bGrade.bg).toBe("bg-blue-100");

      const cGrade = getScoreGrade(65);
      expect(cGrade.color).toBe("text-orange-500");
      expect(cGrade.bg).toBe("bg-orange-100");

      const dGrade = getScoreGrade(50);
      expect(dGrade.color).toBe("text-red-500");
      expect(dGrade.bg).toBe("bg-red-100");
    });
  });
});
