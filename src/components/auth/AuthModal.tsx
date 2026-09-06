import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  ShieldCheck,
  Cloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  Lock
} from 'lucide-react';
import { loginWithGoogle } from '../../lib/firebase';
import { useStudy } from '../../context/StudyContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  onSuccess
}) => {
  const { user } = useStudy();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync mode when initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode, isOpen]);

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await loginWithGoogle();
      if (loggedUser) {
        setLoading(false);
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      setLoading(false);
      // If user closed popup intentionally, don't show scary error
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('closed-by-user')) {
        return;
      }
      console.error('Authentication error:', err);
      setError(err?.message || 'Failed to sign in with Google. Please try again.');
    }
  };

  const handleContinueAsGuest = () => {
    onClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-10 my-8"
          >
            {/* Top Accent Ribbon */}
            <div className="h-1.5 w-full bg-neutral-950" />

            {/* Close Button */}
            <button
              id="auth-modal-close-btn"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-neutral-950 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-950 tracking-tight">
                  {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 max-w-xs mx-auto">
                  {mode === 'signup'
                    ? 'Start personalizing your adaptive college study sessions in seconds.'
                    : 'Sign in to access your cloud-synced course materials, flashcards, and quizzes.'}
                </p>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex rounded-xl bg-neutral-100 p-1 mb-6 border border-neutral-200">
                <button
                  type="button"
                  id="tab-auth-signup"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-white text-neutral-950 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  id="tab-auth-signin"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'signin'
                      ? 'bg-white text-neutral-950 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Sign In
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Authentication Error</p>
                    <p className="mt-0.5 text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* Google Authentication Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  id="btn-google-auth-submit"
                  disabled={loading}
                  onClick={handleGoogleAuth}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-sm font-semibold shadow-xs hover:shadow-sm active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-950 rounded-full animate-spin" />
                  ) : (
                    /* Official Google Multicolor G Logo */
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  )}
                  <span>
                    {loading
                      ? 'Connecting with Google...'
                      : mode === 'signup'
                      ? 'Sign Up with Google'
                      : 'Sign In with Google'}
                  </span>
                </button>

                <p className="text-[11px] text-center text-neutral-400">
                  Use your personal Google account or college Google Workspace (.edu)
                </p>
              </div>

              {/* Value Proposition Highlights */}
              <div className="mt-6 pt-6 border-t border-neutral-100 space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automatic Firestore cloud sync across all your devices</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Adaptive learning algorithm that tracks your weak topics</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant access to Socratic AI tutoring and custom flashcards</span>
                </div>
              </div>

              {/* Guest / Local Option */}
              <div className="mt-6 pt-4 border-t border-neutral-100 text-center">
                <button
                  type="button"
                  id="btn-auth-guest-local"
                  onClick={handleContinueAsGuest}
                  className="text-xs font-semibold text-neutral-700 hover:text-neutral-950 inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Or continue without signing in (Saved Locally in Real-Time)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Modal Footer Security Guarantee */}
            <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-100 flex items-center justify-center gap-2 text-[11px] text-neutral-500">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              <span>Secure Google OAuth • Zero password vulnerability</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
