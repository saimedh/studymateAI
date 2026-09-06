import confetti from 'canvas-confetti';

/**
 * Celebration animations for StudyMate AI
 * Features refined physics and monochromatic + warm-gold metallic accents
 * that respect the minimalist design aesthetic.
 */

interface CelebrationOptions {
  origin?: { x?: number; y?: number };
  particleCount?: number;
  spread?: number;
}

export const triggerSubtleConfetti = (options: CelebrationOptions = {}) => {
  if (typeof window === 'undefined') return;

  confetti({
    particleCount: options.particleCount || 45,
    spread: options.spread || 60,
    origin: options.origin || { y: 0.65 },
    colors: ['#171717', '#404040', '#737373', '#d4d4d4', '#fbbf24', '#ffffff'],
    ticks: 180,
    gravity: 0.9,
    scalar: 0.9,
    disableForReducedMotion: true,
  });
};

export const triggerStreakRecordCelebration = () => {
  if (typeof window === 'undefined') return;

  // Multi-stage celebratory pop for breaking the streak record
  // Phase 1: Center fountain pop
  confetti({
    particleCount: 65,
    spread: 75,
    origin: { y: 0.6 },
    colors: ['#000000', '#262626', '#d4d4d4', '#f59e0b', '#fbbf24', '#ffffff'],
    shapes: ['circle', 'star'],
    ticks: 220,
    scalar: 1.05,
    disableForReducedMotion: true,
  });

  // Phase 2: Dual subtle corner cannon bursts
  setTimeout(() => {
    confetti({
      particleCount: 35,
      angle: 60,
      spread: 50,
      origin: { x: 0.1, y: 0.7 },
      colors: ['#171717', '#f59e0b', '#ffffff'],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 35,
      angle: 120,
      spread: 50,
      origin: { x: 0.9, y: 0.7 },
      colors: ['#171717', '#f59e0b', '#ffffff'],
      disableForReducedMotion: true,
    });
  }, 220);
};

export const triggerDailyStudyCelebration = () => {
  if (typeof window === 'undefined') return;

  // Gentle, celebratory burst when a daily study session is completed
  confetti({
    particleCount: 50,
    spread: 70,
    origin: { y: 0.62 },
    colors: ['#171717', '#525252', '#a3a3a3', '#e5e5e5', '#fbbf24'],
    shapes: ['circle'],
    ticks: 200,
    gravity: 0.92,
    scalar: 0.95,
    disableForReducedMotion: true,
  });
};
