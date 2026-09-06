import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  BookOpen,
  FileText,
  Bot,
  HelpCircle,
  Layers,
  Calendar,
  BarChart3,
  Settings,
  Sparkles,
  Award,
  Network,
  Timer,
  Cloud,
  ArrowRight,
  X,
  LayoutDashboard,
  CornerDownLeft
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Subjects' | 'Study Materials' | 'Actions';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  badge?: string;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    subjects,
    setSelectedSubjectId,
    materials,
    setActiveTab,
    syncToFirestore,
    isSyncing
  } = useStudy();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keydown handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const items: CommandItem[] = useMemo(() => {
    const allItems: CommandItem[] = [
      // Primary Navigation
      {
        id: 'nav-dashboard',
        title: 'Dashboard',
        subtitle: 'Overview of progress, daily goals, and upcoming reviews',
        category: 'Navigation',
        icon: LayoutDashboard,
        action: () => {
          setActiveTab('dashboard');
          onClose();
        }
      },
      {
        id: 'nav-tutor',
        title: 'AI Tutor',
        subtitle: 'Voice, diagram vision & multimodal Socratic tutor',
        category: 'Navigation',
        icon: Bot,
        badge: 'Vision/Voice',
        action: () => {
          setActiveTab('tutor');
          onClose();
        }
      },
      {
        id: 'nav-session',
        title: 'AI Study Session',
        subtitle: 'Focused Pomodoro loop with adaptive check-ins',
        category: 'Navigation',
        icon: Sparkles,
        badge: 'Recommended',
        action: () => {
          setActiveTab('session');
          onClose();
        }
      },
      {
        id: 'nav-cheatsheet',
        title: 'AI Cheat Sheet',
        subtitle: 'Generate high-yield formula & concept summaries',
        category: 'Navigation',
        icon: FileText,
        action: () => {
          setActiveTab('cheatsheet');
          onClose();
        }
      },
      {
        id: 'nav-quiz',
        title: 'Quizzes & Practice Tests',
        subtitle: 'Adaptive multiple-choice and conceptual practice',
        category: 'Navigation',
        icon: HelpCircle,
        action: () => {
          setActiveTab('quiz');
          onClose();
        }
      },
      {
        id: 'nav-mock-exam',
        title: 'Mock Exam & Timer',
        subtitle: 'Timed full exam simulation with score benchmarking',
        category: 'Navigation',
        icon: Timer,
        action: () => {
          setActiveTab('mock-exam');
          onClose();
        }
      },
      {
        id: 'nav-evaluator',
        title: 'Answer Evaluator',
        subtitle: 'Upload or write answers for rubric-based scoring',
        category: 'Navigation',
        icon: Award,
        action: () => {
          setActiveTab('evaluator');
          onClose();
        }
      },
      {
        id: 'nav-flashcards',
        title: 'Flashcards',
        subtitle: 'Spaced repetition review deck',
        category: 'Navigation',
        icon: Layers,
        action: () => {
          setActiveTab('flashcards');
          onClose();
        }
      },
      {
        id: 'nav-knowledge-graph',
        title: 'Knowledge Graph',
        subtitle: 'Visual interactive concept hierarchy and mastery links',
        category: 'Navigation',
        icon: Network,
        action: () => {
          setActiveTab('knowledge-graph');
          onClose();
        }
      },
      {
        id: 'nav-plan',
        title: 'Study Plan',
        subtitle: 'Personalized multi-day timetable and exam milestones',
        category: 'Navigation',
        icon: Calendar,
        action: () => {
          setActiveTab('plan');
          onClose();
        }
      },
      {
        id: 'nav-progress',
        title: 'Progress & Weak Areas',
        subtitle: 'Mastery analytics and accuracy breakdown',
        category: 'Navigation',
        icon: BarChart3,
        action: () => {
          setActiveTab('progress');
          onClose();
        }
      },
      {
        id: 'nav-settings',
        title: 'Settings & Preferences',
        subtitle: 'Target scores, exam date, daily goal, AI tone',
        category: 'Navigation',
        icon: Settings,
        action: () => {
          setActiveTab('settings');
          onClose();
        }
      },

      // Actions
      {
        id: 'action-sync',
        title: 'Sync to Cloud Firestore',
        subtitle: 'Force immediate real-time synchronization with cloud',
        category: 'Actions',
        icon: Cloud,
        badge: isSyncing ? 'Syncing...' : 'Real-Time',
        action: () => {
          syncToFirestore();
          onClose();
        }
      }
    ];

    // Subjects
    subjects.forEach((sub) => {
      allItems.push({
        id: `subject-${sub.id}`,
        title: sub.name,
        subtitle: `${sub.code ? `${sub.code} • ` : ''}${sub.topics.length} topics • ${sub.description}`,
        category: 'Subjects',
        icon: BookOpen,
        action: () => {
          setSelectedSubjectId(sub.id);
          setActiveTab('subjects');
          onClose();
        }
      });
    });

    // Study Materials
    materials.forEach((mat) => {
      allItems.push({
        id: `mat-${mat.id}`,
        title: mat.title,
        subtitle: `${mat.fileType.toUpperCase()} • ${mat.keyTopics?.length || 0} extracted concepts`,
        category: 'Study Materials',
        icon: FileText,
        action: () => {
          setSelectedSubjectId(mat.subjectId);
          setActiveTab('materials');
          onClose();
        }
      });
    });

    return allItems;
  }, [subjects, materials, isSyncing, setActiveTab, setSelectedSubjectId, syncToFirestore, onClose]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle?.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      return matchTitle || matchSub || matchCat;
    });
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle arrow key navigation inside search results
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-98 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-3.5 border-b border-neutral-200 bg-neutral-50/50">
          <Search className="w-5 h-5 text-neutral-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command, subject, quiz, or material name..."
            className="flex-1 bg-transparent py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none min-h-[44px]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-neutral-400 hover:text-neutral-700 active:bg-neutral-200/60 rounded-xl cursor-pointer"
              aria-label="Clear Search Input"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-mono text-neutral-400 bg-neutral-200/60 rounded border border-neutral-300/80">
              ESC
            </kbd>
          )}

          {/* Mobile Explicit Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-neutral-500 hover:text-neutral-950 active:bg-neutral-200/60 rounded-xl cursor-pointer"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-1 divide-y divide-neutral-100 flex-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-neutral-600">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-neutral-400 mt-1">Try searching for subjects, quiz, tutor, or flashcards</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-3 min-h-[48px] rounded-xl cursor-pointer transition-colors active:bg-neutral-200/70 ${
                    isSelected ? 'bg-neutral-100 text-neutral-950' : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-neutral-950 text-white border-neutral-950'
                          : 'bg-white text-neutral-600 border-neutral-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 truncate">{item.title}</span>
                        {item.badge && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-neutral-200 text-neutral-800">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-neutral-500 truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-neutral-400 font-medium">{item.category}</span>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-neutral-500 hidden sm:block" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-4 py-2 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white border border-neutral-200 rounded font-mono text-[10px]">↑</kbd>
              <kbd className="px-1 py-0.5 bg-white border border-neutral-200 rounded font-mono text-[10px]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white border border-neutral-200 rounded font-mono text-[10px]">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="text-neutral-400">StudyMate Quick Launcher</span>
        </div>
      </div>
    </div>
  );
};
