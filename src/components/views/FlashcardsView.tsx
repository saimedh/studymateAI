import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { Flashcard } from '../../types';
import {
  Layers,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  Loader2,
  Trash2,
  BookOpen,
  Download
} from 'lucide-react';

export const FlashcardsView: React.FC = () => {
  const {
    flashcards,
    selectedSubjectId,
    subjects,
    materials,
    updateFlashcardStatus,
    deleteFlashcard,
    addFlashcards
  } = useStudy();

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const subjectCards = flashcards.filter(f => !selectedSubjectId || f.subjectId === selectedSubjectId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(currentSubject?.topics?.[0] || '');

  const handleExportAnki = () => {
    if (subjectCards.length === 0) return;
    const header = "#separator:tab\n#html:true\n#tags column:3\n";
    const rows = subjectCards.map(c => {
      const cleanFront = c.front.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      const cleanBack = c.back.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      const tag = (c.topic || 'StudyMate').replace(/\s+/g, '_');
      return `${cleanFront}\t${cleanBack}\t${tag}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${(currentSubject?.name || 'Flashcards').replace(/\s+/g, '_')}_anki_deck.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  React.useEffect(() => {
    if (currentSubject?.topics && currentSubject.topics.length > 0) {
      setSelectedTopic(currentSubject.topics[0]);
    }
  }, [currentSubject]);

  const currentCard = subjectCards[currentIndex];

  // Stats
  const totalReviewed = subjectCards.filter(c => c.reviewCount > 0).length;
  const masteredCount = subjectCards.filter(c => c.status === 'mastered').length;
  const needingRevisionCount = subjectCards.filter(c => c.status === 'learning').length;

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % (subjectCards.length || 1));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + subjectCards.length) % (subjectCards.length || 1));
  };

  const handleMarkKnown = () => {
    if (!currentCard) return;
    updateFlashcardStatus(currentCard.id, 'mastered');
    handleNext();
  };

  const handleMarkReviewAgain = () => {
    if (!currentCard) return;
    updateFlashcardStatus(currentCard.id, 'learning');
    handleNext();
  };

  const handleGenerateCards = async () => {
    setIsGenerating(true);
    try {
      const resp = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          count: 5
        })
      });

      if (!resp.ok) throw new Error('Flashcard generation failed');
      const data = await resp.json();

      if (data.cards && data.cards.length > 0) {
        addFlashcards(data.cards.map((c: any) => ({
          subjectId: selectedSubjectId || currentSubject?.id || '',
          topic: selectedTopic || 'General',
          front: c.front,
          back: c.back,
          difficulty: c.difficulty || 'medium',
          status: 'new',
          reviewCount: 0
        })));
      }
    } catch (e: any) {
      alert(e.message || 'Could not generate cards');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-950 tracking-tight">Active Recall Flashcards</h1>
          <p className="text-sm text-neutral-500">Spaced repetition deck powered by generative memory prompts</p>
        </div>

        {/* AI Generate Quick Cards */}
        <div className="flex items-center gap-2">
          {currentSubject?.topics && currentSubject.topics.length > 0 ? (
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white font-medium text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
            >
              {currentSubject.topics.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              placeholder="Enter card topic..."
              className="px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white font-medium text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
            />
          )}

          <button
            id="btn-generate-flashcards"
            disabled={isGenerating}
            onClick={handleGenerateCards}
            className="px-3.5 py-2 rounded-xl bg-neutral-950 hover:bg-black disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>+ AI Generate 5</span>
          </button>

          {subjectCards.length > 0 && (
            <button
              type="button"
              onClick={handleExportAnki}
              className="px-3 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Export flashcards for Anki import (.txt)"
            >
              <Download className="w-3.5 h-3.5 text-neutral-600" />
              <span className="hidden sm:inline">Export Anki</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-neutral-200 text-center shadow-2xs">
          <span className="text-xs text-neutral-500 block">Reviewed</span>
          <span className="text-xl font-bold text-neutral-950">{totalReviewed}/{subjectCards.length}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-neutral-200 text-center shadow-2xs">
          <span className="text-xs text-neutral-500 block">Mastered</span>
          <span className="text-xl font-bold text-neutral-950">{masteredCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-neutral-200 text-center shadow-2xs">
          <span className="text-xs text-neutral-500 block">Needs Revision</span>
          <span className="text-xl font-bold text-neutral-950">{needingRevisionCount}</span>
        </div>
      </div>

      {/* Main Flashcard Arena */}
      {subjectCards.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white border border-neutral-200">
          <Layers className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-neutral-800">No flashcards in this subject yet</p>
          <p className="text-xs text-neutral-500 mt-1">Use the "+ AI Generate 5" button above to auto-create cards.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card counter */}
          <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold px-2">
            <span>Card {currentIndex + 1} of {subjectCards.length}</span>
            <span className="capitalize px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 font-medium border border-neutral-200">
              Topic: {currentCard?.topic}
            </span>
          </div>

          {/* Flashcard with 3D Flip */}
          <div
            id="flashcard-active-card"
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer select-none perspective-1000 min-h-[260px] sm:min-h-[300px] flex"
          >
            <div
              className={`w-full rounded-xl border p-8 flex flex-col justify-between transition-all duration-300 shadow-2xs ${
                isFlipped
                  ? 'bg-neutral-950 border-neutral-900 text-white'
                  : 'bg-white border-neutral-200 text-neutral-950 hover:border-neutral-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isFlipped ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  {isFlipped ? 'Answer / Concept Intuition' : 'Prompt / Question'}
                </span>
                <span className={`text-xs flex items-center gap-1 font-medium ${isFlipped ? 'text-neutral-400' : 'text-neutral-400'}`}>
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Click anywhere to flip</span>
                </span>
              </div>

              <div className="my-auto py-6">
                <p className={`text-base sm:text-lg leading-relaxed font-semibold ${isFlipped ? 'text-neutral-100' : 'text-neutral-950'}`}>
                  {isFlipped ? currentCard?.back : currentCard?.front}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-4 border-t border-neutral-200/20 text-neutral-400">
                <span className="capitalize">Difficulty: {currentCard?.difficulty}</span>
                <span>Reviewed: {currentCard?.reviewCount} times</span>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={handlePrev}
              className="p-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 transition-colors"
              title="Previous Card"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <button
                id="btn-card-review-again"
                onClick={handleMarkReviewAgain}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Review Again</span>
              </button>

              <button
                id="btn-card-known"
                onClick={handleMarkKnown}
                className="px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-black text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Known / Mastered</span>
              </button>
            </div>

            <button
              onClick={handleNext}
              className="p-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 transition-colors"
              title="Next Card"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
