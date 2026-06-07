export interface ChunkFeature {
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  avgPitch: number;
  avgEnergy: number;
  maxEnergy: number;
  pitchVariance: number;
  isStressed: boolean;
}

export interface AnalysisResult {
  pronunciationAccuracy: number;
  stressMatch: number;
  tempoConsistency: number;
  overallScore: number;
  chunkScores: ChunkScore[];
  userFeatures: ChunkFeature[];
  referenceFeatures: ChunkFeature[];
}

export interface ChunkScore {
  index: number;
  accuracy: number;
  stressMatch: number;
  tempoMatch: number;
  overall: number;
  matchLevel: "good" | "partial" | "poor";
}

export function extractPitch(
  audioBuffer: AudioBuffer,
  sampleRate: number = 44100
): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const pitches: number[] = [];
  const frameSize = 2048;
  const hopSize = 512;

  for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
    const frame = channelData.slice(i, i + frameSize);
    const pitch = autocorrelationPitch(frame, sampleRate);
    if (pitch > 50 && pitch < 800) {
      pitches.push(pitch);
    }
  }

  return pitches;
}

function autocorrelationPitch(frame: Float32Array, sampleRate: number): number {
  const n = frame.length;
  const autocorr = new Float32Array(n);

  for (let lag = 0; lag < n; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += frame[i] * frame[i + lag];
    }
    autocorr[lag] = sum;
  }

  let maxVal = -Infinity;
  let peakLag = 0;
  const minLag = Math.floor(sampleRate / 800);
  const maxLag = Math.floor(sampleRate / 50);

  for (let lag = minLag; lag < maxLag && lag < n; lag++) {
    if (autocorr[lag] > maxVal) {
      maxVal = autocorr[lag];
      peakLag = lag;
    }
  }

  return peakLag > 0 ? sampleRate / peakLag : 0;
}

export function extractEnergy(audioBuffer: AudioBuffer): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const energies: number[] = [];
  const frameSize = 512;
  const hopSize = 256;

  for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
    let sum = 0;
    for (let j = 0; j < frameSize; j++) {
      sum += Math.abs(channelData[i + j]);
    }
    energies.push(sum / frameSize);
  }

  return energies;
}

export function normalizeArray(arr: number[]): number[] {
  if (arr.length === 0) return [];
  const max = Math.max(...arr);
  const min = Math.min(...arr);
  const range = max - min || 1;
  return arr.map((v) => (v - min) / range);
}

export function extractChunkFeatures(
  audioBuffer: AudioBuffer,
  chunkCount: number,
  isStressedArray: boolean[]
): ChunkFeature[] {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const totalSamples = channelData.length;
  const chunkDuration = totalSamples / chunkCount;

  const pitches = extractPitch(audioBuffer, sampleRate);
  const energies = extractEnergy(audioBuffer);

  const features: ChunkFeature[] = [];

  for (let i = 0; i < chunkCount; i++) {
    const startSample = Math.floor(i * chunkDuration);
    const endSample = Math.floor((i + 1) * chunkDuration);
    const startTime = startSample / sampleRate;
    const endTime = endSample / sampleRate;

    const pitchStartIdx = Math.floor(
      (startSample / 512) * (pitches.length / (totalSamples / 512))
    );
    const pitchEndIdx = Math.floor(
      (endSample / 512) * (pitches.length / (totalSamples / 512))
    );
    const chunkPitches = pitches.slice(pitchStartIdx, pitchEndIdx);

    const energyStartIdx = Math.floor(
      (startSample / 256) * (energies.length / (totalSamples / 256))
    );
    const energyEndIdx = Math.floor(
      (endSample / 256) * (energies.length / (totalSamples / 256))
    );
    const chunkEnergies = energies.slice(energyStartIdx, energyEndIdx);

    const avgPitch =
      chunkPitches.length > 0
        ? chunkPitches.reduce((a, b) => a + b, 0) / chunkPitches.length
        : 0;

    const pitchVariance =
      chunkPitches.length > 1
        ? chunkPitches.reduce((sum, p) => sum + Math.pow(p - avgPitch, 2), 0) /
          chunkPitches.length
        : 0;

    const avgEnergy =
      chunkEnergies.length > 0
        ? chunkEnergies.reduce((a, b) => a + b, 0) / chunkEnergies.length
        : 0;

    const maxEnergy =
      chunkEnergies.length > 0 ? Math.max(...chunkEnergies) : 0;

    features.push({
      index: i,
      startTime,
      endTime,
      duration: endTime - startTime,
      avgPitch,
      avgEnergy,
      maxEnergy,
      pitchVariance,
      isStressed: isStressedArray[i] || false,
    });
  }

  return features;
}

export function generateReferenceFeatures(
  chunks: { duration: number; isStressed: boolean }[]
): ChunkFeature[] {
  let currentTime = 0;
  return chunks.map((chunk, index) => {
    const duration = chunk.duration / 1000;
    const feature: ChunkFeature = {
      index,
      startTime: currentTime,
      endTime: currentTime + duration,
      duration,
      avgPitch: chunk.isStressed ? 220 : 180,
      avgEnergy: chunk.isStressed ? 0.7 : 0.35,
      maxEnergy: chunk.isStressed ? 0.9 : 0.5,
      pitchVariance: chunk.isStressed ? 300 : 100,
      isStressed: chunk.isStressed,
    };
    currentTime += duration;
    return feature;
  });
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

function dynamicTimeWarping(
  seq1: number[],
  seq2: number[]
): { distance: number; path: [number, number][] } {
  const n = seq1.length;
  const m = seq2.length;

  const dtw: number[][] = Array(n + 1)
    .fill(null)
    .map(() => Array(m + 1).fill(Infinity));
  dtw[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = Math.abs(seq1[i - 1] - seq2[j - 1]);
      dtw[i][j] =
        cost + Math.min(dtw[i - 1][j], dtw[i][j - 1], dtw[i - 1][j - 1]);
    }
  }

  const path: [number, number][] = [];
  let i = n;
  let j = m;

  while (i > 0 && j > 0) {
    path.unshift([i - 1, j - 1]);
    const minPrev = Math.min(dtw[i - 1][j], dtw[i][j - 1], dtw[i - 1][j - 1]);
    if (minPrev === dtw[i - 1][j - 1]) {
      i--;
      j--;
    } else if (minPrev === dtw[i - 1][j]) {
      i--;
    } else {
      j--;
    }
  }

  return { distance: dtw[n][m], path };
}

export function analyzeRecording(
  audioBuffer: AudioBuffer,
  referenceChunks: { duration: number; isStressed: boolean }[]
): AnalysisResult {
  const isStressedArray = referenceChunks.map((c) => c.isStressed);
  const userFeatures = extractChunkFeatures(
    audioBuffer,
    referenceChunks.length,
    isStressedArray
  );
  const referenceFeatures = generateReferenceFeatures(referenceChunks);

  const userEnergies = userFeatures.map((f) => f.avgEnergy);
  const refEnergies = referenceFeatures.map((f) => f.avgEnergy);
  const userPitches = userFeatures.map((f) => f.avgPitch);
  const refPitches = referenceFeatures.map((f) => f.avgPitch);
  const userDurations = userFeatures.map((f) => f.duration);
  const refDurations = referenceFeatures.map((f) => f.duration);

  const normUserEnergies = normalizeArray(userEnergies);
  const normRefEnergies = normalizeArray(refEnergies);
  const normUserPitches = normalizeArray(userPitches);
  const normRefPitches = normalizeArray(refPitches);
  const normUserDurations = normalizeArray(userDurations);
  const normRefDurations = normalizeArray(refDurations);

  const energySim = cosineSimilarity(normUserEnergies, normRefEnergies);
  const pitchSim = cosineSimilarity(normUserPitches, normRefPitches);

  const pronunciationAccuracy = Math.round(
    Math.max(0, Math.min(100, (energySim * 0.6 + pitchSim * 0.4) * 100))
  );

  const refStressedIndices = referenceFeatures
    .map((f, i) => (f.isStressed ? i : -1))
    .filter((i) => i >= 0);
  const refUnstressedIndices = referenceFeatures
    .map((f, i) => (!f.isStressed ? i : -1))
    .filter((i) => i >= 0);

  let stressMatchCount = 0;
  let stressTotal = 0;

  const stressThreshold = 0.5;

  refStressedIndices.forEach((idx) => {
    if (userFeatures[idx]) {
      const userEnergy = normUserEnergies[idx];
      if (userEnergy >= stressThreshold) {
        stressMatchCount++;
      }
      stressTotal++;
    }
  });

  refUnstressedIndices.forEach((idx) => {
    if (userFeatures[idx]) {
      const userEnergy = normUserEnergies[idx];
      if (userEnergy < stressThreshold) {
        stressMatchCount++;
      }
      stressTotal++;
    }
  });

  const stressMatch =
    stressTotal > 0
      ? Math.round((stressMatchCount / stressTotal) * 100)
      : 50;

  const userTotalDuration = userFeatures.reduce(
    (sum, f) => sum + f.duration,
    0
  );
  const refTotalDuration = referenceFeatures.reduce(
    (sum, f) => sum + f.duration,
    0
  );

  const durationRatio =
    Math.min(userTotalDuration, refTotalDuration) /
    Math.max(userTotalDuration, refTotalDuration);

  const { distance: dtwDistance } = dynamicTimeWarping(
    normUserDurations,
    normRefDurations
  );
  const dtwScore = Math.max(0, 100 - dtwDistance * 50);

  const tempoConsistency = Math.round(
    Math.max(0, Math.min(100, durationRatio * 50 + dtwScore * 0.5))
  );

  const chunkScores: ChunkScore[] = userFeatures.map((user, index) => {
    const ref = referenceFeatures[index];
    if (!ref) {
      return {
        index,
        accuracy: 0,
        stressMatch: 0,
        tempoMatch: 0,
        overall: 0,
        matchLevel: "poor",
      };
    }

    const energyDiff = Math.abs(
      normUserEnergies[index] - normRefEnergies[index]
    );
    const pitchDiff = Math.abs(
      normUserPitches[index] - normRefPitches[index]
    );
    const durationDiff = Math.abs(
      normUserDurations[index] - normRefDurations[index]
    );

    const accuracy = Math.round(
      Math.max(0, 100 - (energyDiff * 60 + pitchDiff * 40))
    );

    const expectedStress = ref.isStressed;
    const actualStress = normUserEnergies[index] >= stressThreshold;
    const stressMatchScore = expectedStress === actualStress ? 100 : 30;

    const tempoMatch = Math.round(Math.max(0, 100 - durationDiff * 100));

    const overall = Math.round(accuracy * 0.5 + stressMatchScore * 0.3 + tempoMatch * 0.2);

    let matchLevel: "good" | "partial" | "poor";
    if (overall >= 70) {
      matchLevel = "good";
    } else if (overall >= 40) {
      matchLevel = "partial";
    } else {
      matchLevel = "poor";
    }

    return {
      index,
      accuracy,
      stressMatch: stressMatchScore,
      tempoMatch,
      overall,
      matchLevel,
    };
  });

  const overallScore = Math.round(
    pronunciationAccuracy * 0.5 + stressMatch * 0.3 + tempoConsistency * 0.2
  );

  return {
    pronunciationAccuracy,
    stressMatch,
    tempoConsistency,
    overallScore,
    chunkScores,
    userFeatures,
    referenceFeatures,
  };
}
