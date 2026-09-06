import React, { useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Flame, CheckCircle2, Award, Star, X } from 'lucide-react';

export type CelebrationType =
  | 'daily_goal'
  | 'streak_milestone'
  | 'record_broken'
  | 'achievement'
  | 'quick_pop';

export interface ConfettiCelebrationProps {
  /**
   * When this boolean turns true, the celebration fires
   */
  trigger?: boolean;
  /**
   * Celebration theme and particle burst configuration
   */
  type?: CelebrationType;
  /**
   * Headline title displayed on the floating celebration toast
   */
  title?: string;
  /**
   * Secondary description for the achievement
   */
  description?: string;
  /**
   * Icon displayed in the celebratory banner
   */
  icon?: 'flame' | 'trophy' | 'sparkles' | 'check' | 'star' | 'award';
  /**
   * Whether to display the floating celebration notification banner
   */
  showBanner?: boolean;
  /**
   * Duration in ms before the banner automatically closes (defaults to 4500ms)
   */
  autoCloseDuration?: number;
  /**
   * Callback fired when celebration trigger has fired
   */
  onCelebrationTriggered?: () => void;
  /**
   * Callback fired when celebration banner is closed
   */
  onClose?: () => void;
  /**
   * Optional custom particle count
   */
  particleCount?: number;
  /**
   * Optional custom origin coordinates (0-1)
   */
  origin?: { x?: number; y?: number };
  /**
   * Optional children (e.g. custom trigger element or wrapper)
   */
  children?: React.ReactNode;
  /**
   * Custom CSS class for banner container
   */
  className?: string;
}

/**
 * Pure helper function to trigger specific confetti animations
 */
export const fireCelebration = (
  type: CelebrationType = 'daily_goal',
  customOrigin?: { x?: number; y?: number },
  customCount?: number
) => {
  if (typeof window === 'undefined') return;

  switch (type) {
    case 'streak_milestone': {
      // High-energy milestone burst with dual corner cannons + center stars
      confetti({
        particleCount: customCount || 60,
        spread: 80,
        origin: customOrigin || { y: 0.65, x: 0.5 },
        colors: ['#000000', '#262626', '#d4d4d4', '#f59e0b', '#fbbf24', '#ffffff'],
        shapes: ['circle', 'star'],
        ticks: 240,
        gravity: 0.85,
        scalar: 1.1,
        disableForReducedMotion: true,
      });

      // Lateral cannon pops
      setTimeout(() => {
        confetti({
          particleCount: 30,
          angle: 60,
          spread: 55,
          origin: { x: 0.05, y: 0.75 },
          colors: ['#171717', '#f59e0b', '#fbbf24', '#ffffff'],
          disableForReducedMotion: true,
        });
        confetti({
          particleCount: 30,
          angle: 120,
          spread: 55,
          origin: { x: 0.95, y: 0.75 },
          colors: ['#171717', '#f59e0b', '#fbbf24', '#ffffff'],
          disableForReducedMotion: true,
        });
      }, 250);
      break;
    }

    case 'daily_goal': {
      // Refined golden-monochrome celebratory shower for daily targets
      confetti({
        particleCount: customCount || 55,
        spread: 70,
        origin: customOrigin || { y: 0.62, x: 0.5 },
        colors: ['#171717', '#404040', '#737373', '#e5e5e5', '#f59e0b', '#fbbf24'],
        shapes: ['circle'],
        ticks: 200,
        gravity: 0.9,
        scalar: 1.0,
        disableForReducedMotion: true,
      });
      break;
    }

    case 'record_broken': {
      // Grand fountain burst
      confetti({
        particleCount: customCount || 80,
        spread: 100,
        origin: customOrigin || { y: 0.6, x: 0.5 },
        colors: ['#000000', '#262626', '#f59e0b', '#fbbf24', '#ffffff', '#eab308'],
        shapes: ['star', 'circle'],
        ticks: 260,
        gravity: 0.8,
        scalar: 1.15,
        disableForReducedMotion: true,
      });
      break;
    }

    case 'achievement': {
      confetti({
        particleCount: customCount || 45,
        spread: 60,
        origin: customOrigin || { y: 0.7, x: 0.5 },
        colors: ['#171717', '#525252', '#d4d4d4', '#fbbf24'],
        ticks: 180,
        gravity: 0.95,
        scalar: 0.9,
        disableForReducedMotion: true,
      });
      break;
    }

    case 'quick_pop':
    default: {
      confetti({
        particleCount: customCount || 35,
        spread: 50,
        origin: customOrigin || { y: 0.65, x: 0.5 },
        colors: ['#171717', '#737373', '#fbbf24', '#ffffff'],
        ticks: 160,
        gravity: 0.95,
        scalar: 0.85,
        disableForReducedMotion: true,
      });
      break;
    }
  }
};

/**
 * Reusable ConfettiCelebration Component
 */
export const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  trigger = false,
  type = 'daily_goal',
  title,
  description,
  icon = 'sparkles',
  showBanner = true,
  autoCloseDuration = 4500,
  onCelebrationTriggered,
  onClose,
  particleCount,
  origin,
  children,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const runCelebration = useCallback(() => {
    fireCelebration(type as CelebrationType, origin, particleCount);
    setIsVisible(true);
    onCelebrationTriggered?.();

    if (autoCloseDuration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [type, origin, particleCount, autoCloseDuration, onCelebrationTriggered, onClose]);

  // React to prop trigger changes
  useEffect(() => {
    if (trigger) {
      const cleanup = runCelebration();
      return cleanup;
    }
  }, [trigger, runCelebration]);

  const renderIcon = () => {
    switch (icon) {
      case 'flame':
        return <Flame className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />;
      case 'trophy':
        return <Trophy className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'star':
        return <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />;
      case 'award':
        return <Award className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'check':
        return <CheckCircle2 className="w-5 h-5 text-neutral-100 shrink-0" />;
      case 'sparkles':
      default:
        return <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />;
    }
  };

  const defaultTitle =
    title ||
    (type === 'daily_goal'
      ? 'Daily Study Goal Achieved!'
      : type === 'streak_milestone'
      ? 'Streak Milestone Reached!'
      : type === 'record_broken'
      ? 'All-Time Record Broken!'
      : 'Achievement Unlocked!');

  const defaultDescription =
    description ||
    (type === 'daily_goal'
      ? "You've successfully hit your target study minutes for today."
      : type === 'streak_milestone'
      ? 'Incredible dedication! Your learning consistency is accelerating.'
      : 'Outstanding progress on your academic roadmap.');

  return (
    <>
      {/* Optional wrapped children with click listener */}
      {children}

      {/* Floating Celebration Toast Banner */}
      <AnimatePresence>
        {showBanner && isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.94 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md pointer-events-auto ${className}`}
          >
            <div className="relative overflow-hidden rounded-2xl bg-neutral-950 text-white border border-neutral-800 p-4 shadow-2xl flex items-start gap-3.5">
              {/* Luminous celebratory glow strip */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-neutral-200 to-amber-500 animate-pulse" />

              {/* Icon Container with subtle ring */}
              <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 shrink-0 mt-0.5">
                {renderIcon()}
              </div>

              {/* Content text */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white tracking-tight leading-tight">
                    {defaultTitle}
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Celebration
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                  {defaultDescription}
                </p>
              </div>

              {/* Dismiss button */}
              <button
                id="btn-dismiss-celebration-toast"
                onClick={() => {
                  setIsVisible(false);
                  onClose?.();
                }}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors shrink-0"
                aria-label="Dismiss celebration"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
