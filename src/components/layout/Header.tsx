import React, { useState, useEffect, useRef } from 'react';
import { useStudy } from '../../context/StudyContext';
import {
  BookOpen,
  Sparkles,
  Bot,
  HelpCircle,
  ChevronDown,
  Bell,
  User as UserIcon,
  Flame,
  LogOut,
  LogIn,
  Menu,
  X,
  Search,
  Plus,
  FileText,
  Layers,
  CheckCircle2,
  Settings,
  ArrowRight,
  Target
} from 'lucide-react';
import { loginWithGoogle, logoutUser } from '../../lib/firebase';
import { CommandPaletteModal } from '../common/CommandPaletteModal';

interface HeaderProps {
  onOpenOnboarding: () => void;
  onViewLandingPage?: () => void;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenOnboarding,
  onViewLandingPage,
  onOpenAuth,
  onToggleMobileMenu,
  isMobileMenuOpen = false
}) => {
  const {
    subjects,
    selectedSubjectId,
    setSelectedSubjectId,
    setActiveTab,
    recommendations,
    user,
    profile
  } = useStudy();

  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStreakDetails, setShowStreakDetails] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');

  const subjectMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const streakMenuRef = useRef<HTMLDivElement>(null);
  const quickCreateRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (subjectMenuRef.current && !subjectMenuRef.current.contains(target)) {
        setShowSubjectMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (streakMenuRef.current && !streakMenuRef.current.contains(target)) {
        setShowStreakDetails(false);
      }
      if (quickCreateRef.current && !quickCreateRef.current.contains(target)) {
        setShowQuickCreate(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global shortcut for Command Palette (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const activeRecs = recommendations.filter((r) => !r.dismissed);

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(subjectSearchQuery.toLowerCase()))
  );

  // Calculate days remaining to target exam
  const getExamCountdown = () => {
    if (!profile.examDate) return null;
    const examDate = new Date(profile.examDate);
    const now = new Date();
    const diffTime = examDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Exam passed';
    if (diffDays === 0) return 'Exam today';
    return `${diffDays}d to exam`;
  };

  const examCountdown = getExamCountdown();

  return (
    <>
      <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/85 backdrop-blur-xl border-b border-neutral-200/80 px-2.5 sm:px-4 lg:px-6 flex items-center justify-between gap-1.5 sm:gap-3 transition-all supports-[backdrop-filter]:bg-white/75">
        
        {/* ================= ZONE 1: LEFT (Context & Workspace Switcher) ================= */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          {/* Mobile Menu Trigger */}
          {onToggleMobileMenu && (
            <button
              id="header-mobile-menu-btn"
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 active:bg-neutral-200 transition-colors cursor-pointer shrink-0"
              aria-label={isMobileMenuOpen ? 'Close Navigation' : 'Open Navigation'}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          {/* App Brand Mark */}
          <div
            onClick={() => {
              if (onViewLandingPage) onViewLandingPage();
              else setActiveTab('dashboard');
            }}
            className="flex items-center gap-2 cursor-pointer group shrink-0 min-h-[44px] py-1"
            title="StudyMate Home"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="font-bold text-neutral-950 text-sm tracking-tight">StudyMate</span>
              <span className="bg-neutral-100 text-neutral-800 border border-neutral-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md hidden md:inline-block">
                AI
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-neutral-200 hidden sm:block mx-0.5 shrink-0" />

          {/* Workspace Subject Switcher */}
          <div className="relative shrink min-w-0" ref={subjectMenuRef}>
            <button
              id="subject-dropdown-btn"
              type="button"
              onClick={() => {
                setShowSubjectMenu(!showSubjectMenu);
                setSubjectSearchQuery('');
              }}
              className="flex items-center gap-1.5 sm:gap-2 min-h-[44px] px-2.5 sm:px-3 py-2 rounded-xl border border-neutral-200/90 bg-neutral-50 hover:bg-white active:bg-neutral-100 hover:border-neutral-300 text-xs font-medium text-neutral-900 transition-all cursor-pointer shadow-2xs max-w-[110px] xs:max-w-[135px] sm:max-w-[170px] md:max-w-[210px]"
              title="Switch Current Subject"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/10"
                style={{ backgroundColor: currentSubject?.color || '#171717' }}
              />
              <span className="truncate text-left font-semibold text-xs">
                {currentSubject ? currentSubject.name : 'Subjects'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-auto" />
            </button>

            {/* Subject Selector Dropdown */}
            {showSubjectMenu && (
              <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-neutral-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 pb-2 border-b border-neutral-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      Subjects
                    </span>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      {subjects.length} active
                    </span>
                  </div>
                  {/* Filter input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={subjectSearchQuery}
                      onChange={(e) => setSubjectSearchQuery(e.target.value)}
                      placeholder="Filter subjects..."
                      className="w-full pl-8 pr-2.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto py-1">
                  {filteredSubjects.length === 0 ? (
                    <p className="px-3.5 py-3 text-xs text-neutral-400 text-center">No subjects found</p>
                  ) : (
                    filteredSubjects.map((sub) => {
                      const isSelected = sub.id === selectedSubjectId;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            setSelectedSubjectId(sub.id);
                            setShowSubjectMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 min-h-[44px] text-xs flex items-center justify-between hover:bg-neutral-100/70 active:bg-neutral-100 transition-colors cursor-pointer ${
                            isSelected ? 'bg-neutral-100 font-bold text-neutral-950' : 'text-neutral-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: sub.color || '#171717' }}
                            />
                            <span className="truncate">{sub.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {sub.code && (
                              <span className="text-[10px] text-neutral-400 font-mono">
                                {sub.code}
                              </span>
                            )}
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-neutral-100 mt-1 pt-1.5 px-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubjectMenu(false);
                      setActiveTab('subjects');
                    }}
                    className="w-full text-left px-3 py-2.5 min-h-[44px] text-xs font-medium text-neutral-800 hover:bg-neutral-100 active:bg-neutral-200 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
                      Manage All Subjects
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= ZONE 2: CENTER (Omni-Search Launcher) ================= */}
        {/* Shown on tablet and desktop (sm+) */}
        <div className="hidden sm:flex flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-2 justify-center">
          <button
            id="navbar-omni-search-btn"
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between min-h-[40px] px-3 py-2 rounded-xl border border-neutral-200/90 bg-neutral-50/80 hover:bg-white hover:border-neutral-300 transition-all text-xs text-neutral-400 shadow-2xs group cursor-pointer"
            title="Press ⌘K to search"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 transition-colors shrink-0" />
              <span className="text-neutral-500 group-hover:text-neutral-800 transition-colors truncate">
                Search topics, notes, tutor...
              </span>
            </div>
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-400 bg-white rounded border border-neutral-200 shadow-2xs shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* ================= ZONE 3: RIGHT (Productivity Hub & Account) ================= */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          
          {/* Mobile Search Button (sm:hidden) */}
          <button
            id="header-mobile-search-btn"
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="sm:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 active:bg-neutral-200 transition-colors cursor-pointer"
            title="Search (⌘K)"
            aria-label="Open search palette"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Target Exam Countdown (Only large screens to avoid cluttering tablets) */}
          {examCountdown && (
            <div
              className="hidden xl:flex items-center gap-1.5 min-h-[40px] px-2.5 py-2 bg-neutral-100/80 hover:bg-neutral-200/80 border border-neutral-200 text-neutral-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              onClick={() => setActiveTab('plan')}
              title="Target Exam Date • View Study Plan"
            >
              <Target className="w-3.5 h-3.5 text-neutral-500" />
              <span>{examCountdown}</span>
            </div>
          )}

          {/* Streak Counter Badge */}
          <div className="relative" ref={streakMenuRef}>
            <button
              id="header-streak-btn"
              type="button"
              onClick={() => setShowStreakDetails(!showStreakDetails)}
              className="flex items-center gap-1 min-h-[44px] px-2.5 sm:px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              title="Study Streak & Daily Target"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span>{profile.streakDays}d</span>
            </button>

            {/* Streak Popover */}
            {showStreakDetails && (
              <div className="absolute right-0 mt-2 w-68 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-neutral-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold text-neutral-900">Study Streak</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStreakDetails(false)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-neutral-400 hover:text-neutral-700 active:bg-neutral-100 rounded-xl cursor-pointer"
                    aria-label="Close Streak Details"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200/80">
                    <p className="text-base font-bold text-neutral-950">
                      {profile.streakDays} Days Active
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {profile.dailyGoalCompleted
                        ? "Today's daily study goal completed!"
                        : `Target: ${profile.dailyStudyMinutes} min/day to keep streak burning.`}
                    </p>
                  </div>

                  <div className="flex justify-between py-1 text-neutral-600">
                    <span>Total Study Time:</span>
                    <span className="font-semibold text-neutral-900">
                      {Math.floor(profile.totalStudyMinutes / 60)}h {profile.totalStudyMinutes % 60}m
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStreakDetails(false);
                      setActiveTab('session');
                    }}
                    className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-black active:bg-neutral-800 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Start Study Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action (+ New) Button */}
          <div className="relative" ref={quickCreateRef}>
            <button
              id="header-quick-create-btn"
              type="button"
              onClick={() => setShowQuickCreate(!showQuickCreate)}
              className="flex items-center gap-1 min-h-[44px] px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-xl bg-neutral-950 text-white hover:bg-black active:bg-neutral-800 transition-all cursor-pointer shadow-2xs"
              title="Quick Actions"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">New</span>
            </button>

            {/* Quick Action Menu */}
            {showQuickCreate && (
              <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-neutral-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Quick Actions
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickCreate(false);
                    setActiveTab('session');
                  }}
                  className="w-full text-left px-3.5 py-2.5 min-h-[44px] text-xs font-medium text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-neutral-700" />
                  <span>Start AI Study Session</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickCreate(false);
                    setActiveTab('tutor');
                  }}
                  className="w-full text-left px-3.5 py-2.5 min-h-[44px] text-xs font-medium text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <Bot className="w-4 h-4 text-neutral-700" />
                  <span>Ask AI Tutor</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickCreate(false);
                    setActiveTab('materials');
                  }}
                  className="w-full text-left px-3.5 py-2.5 min-h-[44px] text-xs font-medium text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4 text-neutral-700" />
                  <span>Upload Study Material</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickCreate(false);
                    setActiveTab('quiz');
                  }}
                  className="w-full text-left px-3.5 py-2.5 min-h-[44px] text-xs font-medium text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-neutral-700" />
                  <span>Take Practice Quiz</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickCreate(false);
                    setActiveTab('flashcards');
                  }}
                  className="w-full text-left px-3.5 py-2.5 min-h-[44px] text-xs font-medium text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <Layers className="w-4 h-4 text-neutral-700" />
                  <span>Practice Flashcards</span>
                </button>
              </div>
            )}
          </div>

          {/* AI Recommendations Bell */}
          <div className="relative" ref={notifMenuRef}>
            <button
              id="notifications-bell-btn"
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 active:bg-neutral-200 transition-all cursor-pointer"
              title="AI Recommendations"
            >
              <Bell className="w-4 h-4" />
              {activeRecs.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-neutral-950 rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Recommendations Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-neutral-200 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-neutral-950" />
                    <span className="text-xs font-bold text-neutral-900">
                      Recommendations
                    </span>
                  </div>
                  <span className="text-[10px] bg-neutral-100 text-neutral-700 font-semibold px-2 py-0.5 rounded-full">
                    {activeRecs.length} Active
                  </span>
                </div>

                {activeRecs.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-6 text-center">
                    All caught up! No pending recommendations.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {activeRecs.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs"
                      >
                        <p className="font-semibold text-neutral-950">{rec.title}</p>
                        <p className="text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                          {rec.description}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNotifications(false);
                            if (rec.suggestedAction === 'study_session') setActiveTab('session');
                            else if (rec.suggestedAction === 'quiz') setActiveTab('quiz');
                            else setActiveTab('tutor');
                          }}
                          className="mt-2 min-h-[36px] px-2 py-1 text-xs text-neutral-950 font-semibold hover:underline active:opacity-75 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Account / Sign-In Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              id="user-menu-btn"
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-all cursor-pointer"
              title="Account"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-black/10"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-xs">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
            </button>

            {/* Account Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 sm:w-60 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-neutral-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-neutral-100">
                  <p className="text-xs font-bold text-neutral-950 truncate">
                    {user?.displayName || profile.name}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {user?.email || profile.email}
                  </p>
                </div>

                <div className="py-1">
                  {onViewLandingPage && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onViewLandingPage();
                      }}
                      className="w-full text-left px-4 py-2.5 min-h-[44px] text-xs font-medium text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 flex items-center gap-2.5 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-neutral-400" />
                      <span>View Landing Page</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenOnboarding();
                    }}
                    className="w-full text-left px-4 py-2.5 min-h-[44px] text-xs font-medium text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 flex items-center gap-2.5 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-neutral-400" />
                    <span>Profile &amp; Goals</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      setActiveTab('settings');
                    }}
                    className="w-full text-left px-4 py-2.5 min-h-[44px] text-xs font-medium text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-neutral-400" />
                    <span>Preferences &amp; Settings</span>
                  </button>
                </div>

                <div className="border-t border-neutral-100 pt-1">
                  {user ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await logoutUser();
                        } catch (e) {
                          console.error('Sign out error:', e);
                        }
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 min-h-[44px] text-xs font-medium text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-neutral-500" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        if (onOpenAuth) {
                          onOpenAuth('signin');
                        } else {
                          loginWithGoogle();
                        }
                      }}
                      className="w-full text-left px-4 py-2.5 min-h-[44px] text-xs font-bold text-neutral-950 hover:bg-neutral-50 active:bg-neutral-100 flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4 text-neutral-900" />
                      <span>Sign In with Google</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Omni-Search Command Palette Modal */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
};
