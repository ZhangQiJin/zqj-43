import { useState, useRef, useCallback, useEffect } from "react";

export interface Chunk {
  duration: number;
  [key: string]: any;
}

export interface UseChunkPlayerOptions<T extends Chunk = Chunk> {
  chunks: T[] | undefined;
  bpm: number;
  onChunkChange?: (index: number) => void;
  onStart?: () => void;
  onComplete?: () => void;
  onStop?: () => void;
  endDelay?: number;
}

export function useChunkPlayer<T extends Chunk = Chunk>({
  chunks,
  bpm,
  onChunkChange,
  onStart,
  onComplete,
  onStop,
  endDelay = 0,
}: UseChunkPlayerOptions<T>) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(-1);

  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onChunkChangeRef = useRef(onChunkChange);
  const onStartRef = useRef(onStart);
  const onCompleteRef = useRef(onComplete);
  const onStopRef = useRef(onStop);

  useEffect(() => {
    onChunkChangeRef.current = onChunkChange;
  }, [onChunkChange]);

  useEffect(() => {
    onStartRef.current = onStart;
  }, [onStart]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onStopRef.current = onStop;
  }, [onStop]);

  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach((id) => clearTimeout(id));
    timeoutRefs.current = [];
  }, []);

  const start = useCallback(() => {
    if (!chunks || chunks.length === 0) return;

    clearAllTimeouts();
    setIsPlaying(true);
    setCurrentChunkIndex(-1);
    onStartRef.current?.();

    const speedMultiplier = 80 / bpm;
    let delay = 0;

    chunks.forEach((_, index) => {
      const timeoutId = setTimeout(() => {
        setCurrentChunkIndex(index);
        onChunkChangeRef.current?.(index);
      }, delay);
      timeoutRefs.current.push(timeoutId);

      delay += chunks[index].duration * speedMultiplier;
    });

    const endTimeoutId = setTimeout(() => {
      setIsPlaying(false);
      setCurrentChunkIndex(-1);
      onCompleteRef.current?.();
    }, delay + endDelay);
    timeoutRefs.current.push(endTimeoutId);
  }, [chunks, bpm, endDelay, clearAllTimeouts]);

  const stop = useCallback(() => {
    clearAllTimeouts();
    setIsPlaying(false);
    setCurrentChunkIndex(-1);
    onStopRef.current?.();
  }, [clearAllTimeouts]);

  const reset = useCallback(() => {
    stop();
  }, [stop]);

  const jumpTo = useCallback((index: number) => {
    if (!chunks || index < -1 || index >= chunks.length) return;
    setCurrentChunkIndex(index);
    onChunkChangeRef.current?.(index);
  }, [chunks]);

  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  return {
    isPlaying,
    currentChunkIndex,
    start,
    stop,
    reset,
    jumpTo,
  };
}
