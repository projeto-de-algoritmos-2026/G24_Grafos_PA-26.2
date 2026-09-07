import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AlgorithmStep } from '@/graph/models/pathfinding.types';

export type PlaybackSpeed = 0.5 | 1 | 2;

const BASE_INTERVAL_MS = 750;

export interface StepPlayback {
  index: number;
  total: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  current: AlgorithmStep | null;
  atEnd: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  restart: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
}

/**
 * Drives step-by-step playback over the AlgorithmStep[] a run already
 * produced. It never re-runs (or re-implements) the algorithm — it only
 * advances an index over the recorded steps, so the animation is guaranteed
 * to match the real execution (spec section 5).
 */
export const useStepPlayback = (steps: AlgorithmStep[]): StepPlayback => {
  const total = steps.length;
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset whenever the underlying run changes (different algorithm / new simulation).
  useEffect(() => {
    setIndex(0);
    setIsPlaying(false);
  }, [steps]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (!isPlaying || total === 0) return;
    timerRef.current = setInterval(() => {
      setIndex((current) => {
        if (current >= total - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, BASE_INTERVAL_MS / speed);
    return clearTimer;
  }, [isPlaying, speed, total]);

  const play = useCallback(() => {
    if (total === 0) return;
    setIndex((current) => (current >= total - 1 ? 0 : current));
    setIsPlaying(true);
  }, [total]);

  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => (isPlaying ? pause() : play()), [isPlaying, pause, play]);
  const next = useCallback(() => {
    setIsPlaying(false);
    setIndex((current) => Math.min(total - 1, current + 1));
  }, [total]);
  const prev = useCallback(() => {
    setIsPlaying(false);
    setIndex((current) => Math.max(0, current - 1));
  }, []);
  const restart = useCallback(() => {
    setIsPlaying(false);
    setIndex(0);
  }, []);

  return useMemo(
    () => ({
      index,
      total,
      isPlaying,
      speed,
      current: total > 0 ? steps[Math.min(index, total - 1)] : null,
      atEnd: index >= total - 1,
      play,
      pause,
      toggle,
      next,
      prev,
      restart,
      setSpeed,
    }),
    [index, total, isPlaying, speed, steps, play, pause, toggle, next, prev, restart],
  );
};
