export interface TapDeviation {
  deviation: number;
}

export interface RatingStats {
  avgDeviation: number;
  maxDeviation: number;
  minDeviation: number;
  accuracy: number;
  score: number;
  totalTaps: number;
  expectedTaps: number;
}

export interface GradeInfo {
  grade: string;
  color: string;
  bg: string;
}

export function calculateStats(
  deviations: number[],
  expectedTaps: number
): RatingStats | null {
  if (deviations.length === 0) return null;

  const absDeviations = deviations.map((d) => Math.abs(d));
  const avgDeviation = absDeviations.reduce((a, b) => a + b, 0) / absDeviations.length;

  const maxDeviation = Math.max(...absDeviations);
  const minDeviation = Math.min(...absDeviations);

  const goodTaps = absDeviations.filter((d) => d < 200).length;
  const accuracy = (goodTaps / absDeviations.length) * 100;

  const score = Math.max(
    0,
    100 - avgDeviation / 10 - (100 - accuracy) * 0.5
  );

  return {
    avgDeviation: Math.round(avgDeviation),
    maxDeviation: Math.round(maxDeviation),
    minDeviation: Math.round(minDeviation),
    accuracy: Math.round(accuracy),
    score: Math.round(score),
    totalTaps: deviations.length,
    expectedTaps,
  };
}

export function getScoreGrade(score: number): GradeInfo {
  if (score >= 90) return { grade: "S", color: "text-yellow-500", bg: "bg-yellow-100" };
  if (score >= 80) return { grade: "A", color: "text-green-500", bg: "bg-green-100" };
  if (score >= 70) return { grade: "B", color: "text-blue-500", bg: "bg-blue-100" };
  if (score >= 60) return { grade: "C", color: "text-orange-500", bg: "bg-orange-100" };
  return { grade: "D", color: "text-red-500", bg: "bg-red-100" };
}
