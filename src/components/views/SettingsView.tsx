import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import {
  User,
  GraduationCap,
  Calendar,
  Clock,
  Target,
  RotateCcw,
  CheckCircle2,
  Save,
  Shield,
  Cloud,
  LogOut,
  LogIn,
  Sparkles
} from 'lucide-react';
import { loginWithGoogle, logoutUser } from '../../lib/firebase';

export const SettingsView: React.FC = () => {
  const { profile, updateProfile, resetToDemoData, user, isSyncing } = useStudy();

  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    college: profile.college || 'Stanford University',
    major: profile.major || 'Computer Science & Engineering',
    dailyStudyMinutes: profile.dailyStudyMinutes,
    targetScore: profile.targetScore,
    examDate: profile.examDate
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetData = () => {
    if (confirm('Reset all course materials, quizzes, and progress back to fresh initial state?')) {
      resetToDemoData();
      alert('Workspace reset to initial state. Syncing in real-time.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950 tracking-tight">Student Profile & Settings</h1>
        <p className="text-sm text-neutral-500">
          Manage your academic targets, daily goals, and Google cloud synchronization
        </p>
      </div>

      {/* Google Authentication & Cloud Sync Card */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-950 text-white flex items-center justify-center font-bold">
              <Cloud className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-950">Google Account & Cloud Sync</h3>
              <p className="text-xs text-neutral-500">
                {user ? 'Authenticated with Google Cloud Firestore' : 'Running in Guest Mode (Local Storage)'}
              </p>
            </div>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
              user
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-neutral-100 text-neutral-700 border-neutral-200'
            }`}
          >
            {user ? 'Cloud Synced' : 'Local Only'}
          </span>
        </div>

        {user ? (
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google Profile'}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border border-neutral-200 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-sm">
                  {(user.displayName || user.email || 'U').charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-950 truncate">
                  {user.displayName || 'Google Student'}
                </p>
                <p className="text-xs text-neutral-600 truncate">{user.email}</p>
                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">UID: {user.uid.slice(0, 14)}...</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-200 text-xs">
              <span className="text-neutral-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Auto-sync enabled for study materials & quizzes</span>
              </span>
              <button
                onClick={async () => {
                  await logoutUser();
                }}
                className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
            <p className="text-xs text-neutral-600 leading-relaxed">
              Sign in with your personal or college Google account to securely sync your course materials,
              adaptive flashcards, quiz scores, and Socratic tutoring conversations across all devices.
            </p>
            <button
              onClick={async () => {
                try {
                  await loginWithGoogle();
                } catch (e: any) {
                  if (e?.code !== 'auth/popup-closed-by-user') {
                    console.error('Google sign in error:', e);
                  }
                }
              }}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs flex items-center gap-2.5 shadow-2xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Sign In with Google</span>
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 shadow-2xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
          <div className="w-12 h-12 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-lg">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-950">{profile.name}</h3>
            <p className="text-xs text-neutral-500">{formData.major} • {formData.college}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              University / College
            </label>
            <input
              type="text"
              value={formData.college}
              onChange={e => setFormData({ ...formData, college: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Academic Major
            </label>
            <input
              type="text"
              value={formData.major}
              onChange={e => setFormData({ ...formData, major: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Daily Study Goal
            </label>
            <select
              value={formData.dailyStudyMinutes}
              onChange={e => setFormData({ ...formData, dailyStudyMinutes: Number(e.target.value) })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden bg-white text-neutral-900"
            >
              <option value={30}>30 Minutes / Day</option>
              <option value={45}>45 Minutes / Day</option>
              <option value={60}>1 Hour / Day</option>
              <option value={90}>1.5 Hours / Day</option>
              <option value={120}>2 Hours / Day</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Target Grade
            </label>
            <input
              type="text"
              value={formData.targetScore}
              onChange={e => setFormData({ ...formData, targetScore: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Exam Target Date
            </label>
            <input
              type="date"
              value={formData.examDate}
              onChange={e => setFormData({ ...formData, examDate: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
          {savedSuccess && (
            <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-neutral-900" /> Profile settings saved!
            </span>
          )}
          {!savedSuccess && <div />}

          <button
            id="btn-save-settings"
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-black text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </form>

      {/* Real-Time Data Management Box */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-2xs space-y-3">
        <h4 className="text-sm font-bold text-neutral-950">Real-Time Data & Workspace Management</h4>
        <p className="text-xs text-neutral-500">
          Reset course state, quizzes, and adaptive learning recommendations. Changes sync with your Firestore database in real-time.
        </p>
        <button
          onClick={handleResetData}
          className="px-4 py-2 rounded-xl border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Workspace Data</span>
        </button>
      </div>
    </div>
  );
};
