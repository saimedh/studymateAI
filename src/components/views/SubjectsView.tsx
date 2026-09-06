import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import {
  BookOpen,
  Plus,
  Trash2,
  FileText,
  HelpCircle,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  BrainCircuit,
  Network,
  Database,
  X,
  Sparkles
} from 'lucide-react';

export const SubjectsView: React.FC = () => {
  const {
    subjects,
    selectedSubjectId,
    setSelectedSubjectId,
    addSubject,
    deleteSubject,
    materials,
    quizResults,
    flashcards,
    weakTopics,
    setActiveTab
  } = useStudy();

  const [isAdding, setIsAdding] = useState(false);
  const [newSubj, setNewSubj] = useState({
    name: '',
    code: '',
    description: '',
    color: 'indigo',
    iconName: 'BookOpen',
    topicsInput: ''
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubj.name.trim()) return;

    const topics = newSubj.topicsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    addSubject({
      name: newSubj.name.trim(),
      code: newSubj.code.trim() || undefined,
      description: newSubj.description.trim() || 'Custom academic course',
      color: newSubj.color,
      iconName: newSubj.iconName,
      topics: topics.length > 0 ? topics : ['Foundations', 'Key Principles', 'Core Problems'],
    });

    setIsAdding(false);
    setNewSubj({ name: '', code: '', description: '', color: 'indigo', iconName: 'BookOpen', topicsInput: '' });
  };

  const getSubjectIcon = (name: string) => {
    if (name.includes('Artificial') || name.includes('AI')) return <Cpu className="w-5 h-5 text-neutral-950" />;
    if (name.includes('Machine')) return <BrainCircuit className="w-5 h-5 text-neutral-950" />;
    if (name.includes('Network')) return <Network className="w-5 h-5 text-neutral-950" />;
    if (name.includes('Data')) return <Database className="w-5 h-5 text-neutral-950" />;
    return <BookOpen className="w-5 h-5 text-neutral-950" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-950 tracking-tight">Academic Subjects</h1>
          <p className="text-sm text-neutral-500">Organize your courses, lecture materials, and AI study loops</p>
        </div>

        <button
          id="btn-add-subject"
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-black text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Add Subject Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-950">Add New Subject</h3>
              <button onClick={() => setIsAdding(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubj.name}
                  onChange={e => setNewSubj({ ...newSubj, name: e.target.value })}
                  placeholder="e.g. Operating Systems"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Course Code (Optional)</label>
                <input
                  type="text"
                  value={newSubj.code}
                  onChange={e => setNewSubj({ ...newSubj, code: e.target.value })}
                  placeholder="e.g. CS 350"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newSubj.description}
                  onChange={e => setNewSubj({ ...newSubj, description: e.target.value })}
                  placeholder="Brief syllabus overview or goals"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Initial Topics (comma-separated)</label>
                <input
                  type="text"
                  value={newSubj.topicsInput}
                  onChange={e => setNewSubj({ ...newSubj, topicsInput: e.target.value })}
                  placeholder="e.g. Concurrency, Virtual Memory, Scheduling"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-neutral-950 hover:bg-black rounded-lg"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.length === 0 ? (
          <div className="col-span-full py-16 px-6 text-center rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 mx-auto flex items-center justify-center text-neutral-800">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-neutral-950">No subjects added yet</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Add your courses (e.g., Data Structures, Economics, Biology) to organize lecture notes, generate quizzes, and start AI tutoring.
              </p>
            </div>
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2.5 rounded-xl bg-neutral-950 text-white font-semibold text-xs hover:bg-black transition-colors inline-flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Subject</span>
            </button>
          </div>
        ) : (
          subjects.map((subj) => {
          const subjMaterials = materials.filter(m => m.subjectId === subj.id);
          const subjQuizzes = quizResults.filter(q => q.subjectId === subj.id);
          const subjCards = flashcards.filter(f => f.subjectId === subj.id);
          const isSelected = selectedSubjectId === subj.id;

          // Compute average progress
          const subjWeak = weakTopics.filter(w => w.subjectId === subj.id);
          const avgMastery = subjWeak.length > 0
            ? Math.round(subjWeak.reduce((acc, w) => acc + w.masteryPercentage, 0) / subjWeak.length)
            : 70;

          return (
            <div
              key={subj.id}
              className={`rounded-xl bg-white border p-6 shadow-2xs transition-all ${
                isSelected ? 'border-neutral-950 ring-1 ring-neutral-950' : 'border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-200">
                    {getSubjectIcon(subj.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-neutral-950">{subj.name}</h3>
                      {subj.code && (
                        <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-semibold border border-neutral-200">
                          {subj.code}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{subj.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Delete subject "${subj.name}" and its materials?`)) {
                      deleteSubject(subj.id);
                    }
                  }}
                  className="p-1.5 text-neutral-300 hover:text-neutral-900 transition-colors"
                  title="Delete Subject"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Topics Pills */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {subj.topics.slice(0, 5).map((topic) => (
                  <span
                    key={topic}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200"
                  >
                    {topic}
                  </span>
                ))}
                {subj.topics.length > 5 && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-50 text-neutral-400 border border-neutral-200">
                    +{subj.topics.length - 5} more
                  </span>
                )}
              </div>

              {/* Stats Bar */}
              <div className="mt-5 grid grid-cols-3 gap-2 py-3 border-y border-neutral-100 text-center">
                <div>
                  <span className="text-xs text-neutral-400 block">Materials</span>
                  <span className="text-sm font-bold text-neutral-950">{subjMaterials.length}</span>
                </div>
                <div>
                  <span className="text-xs text-neutral-400 block">Quizzes</span>
                  <span className="text-sm font-bold text-neutral-950">{subjQuizzes.length}</span>
                </div>
                <div>
                  <span className="text-xs text-neutral-400 block">Flashcards</span>
                  <span className="text-sm font-bold text-neutral-950">{subjCards.length}</span>
                </div>
              </div>

              {/* Progress & Actions */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-neutral-500">Progress</span>
                    <span className="text-neutral-950">{avgMastery}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full bg-neutral-950 rounded-full"
                      style={{ width: `${avgMastery}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedSubjectId(subj.id);
                    setActiveTab('dashboard');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-black text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <span>Open Subject</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};
