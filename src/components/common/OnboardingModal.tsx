import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { Sparkles, X, BookOpen, GraduationCap, Calendar, Clock, Target, CheckCircle2 } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile, subjects } = useStudy();

  const [formData, setFormData] = useState({
    name: profile.name || '',
    course: profile.course || '',
    academicLevel: profile.academicLevel || 'Junior',
    learningGoal: profile.learningGoal || '',
    dailyStudyMinutes: profile.dailyStudyMinutes || 45,
    examDate: profile.examDate || '',
    targetScore: profile.targetScore || '90%',
  });

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    updateProfile(formData);
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-neutral-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-800 rounded-xl">
              <Sparkles className="w-5 h-5 text-neutral-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Personalize StudyMate AI</h2>
              <p className="text-xs text-neutral-400">Tailoring your adaptive learning engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Your Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Alex Chen"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Academic Degree / Major</label>
              <input
                type="text"
                required
                value={formData.course}
                onChange={e => setFormData({ ...formData, course: e.target.value })}
                placeholder="e.g. B.S. Computer Science"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Academic Year</label>
              <select
                value={formData.academicLevel}
                onChange={e => setFormData({ ...formData, academicLevel: e.target.value as any })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 bg-white text-neutral-900"
              >
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Graduate">Graduate</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Daily Study Target (mins)</label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-400" />
                <input
                  type="number"
                  min={15}
                  max={300}
                  step={15}
                  value={formData.dailyStudyMinutes}
                  onChange={e => setFormData({ ...formData, dailyStudyMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Primary Learning Goal</label>
            <input
              type="text"
              value={formData.learningGoal}
              onChange={e => setFormData({ ...formData, learningGoal: e.target.value })}
              placeholder="e.g. Score 90%+ on finals and master neural network calculus"
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Target Exam Date</label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <input
                  type="date"
                  value={formData.examDate}
                  onChange={e => setFormData({ ...formData, examDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 bg-white text-neutral-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Target Exam Score</label>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={formData.targetScore}
                  onChange={e => setFormData({ ...formData, targetScore: e.target.value })}
                  placeholder="e.g. 95% or A"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-semibold text-white bg-neutral-950 hover:bg-black rounded-lg shadow-xs transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSaving ? 'Saving Profile...' : 'Save & Optimize AI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
