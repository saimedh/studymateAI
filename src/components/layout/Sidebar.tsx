import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Bot,
  HelpCircle,
  Layers,
  Calendar,
  BarChart3,
  Flame,
  Settings,
  Sparkles,
  Award,
  Home,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Network,
  Timer
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { logoutUser } from '../../lib/firebase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onViewLandingPage?: () => void;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface NavSectionConfig {
  title: string;
  items: NavItemConfig[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onViewLandingPage,
  onOpenAuth,
  isMobileMenuOpen = false,
  onCloseMobileMenu
}) => {
  const { profile, weakTopics, user } = useStudy();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('studymate_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('studymate_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Structured navigation hierarchy
  const navSections: NavSectionConfig[] = [
    {
      title: 'Workspace',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'subjects', label: 'Subjects', icon: BookOpen },
        { id: 'materials', label: 'Study Materials', icon: FileText },
        { id: 'plan', label: 'Study Plan', icon: Calendar }
      ]
    },
    {
      title: 'AI Learning',
      items: [
        { id: 'tutor', label: 'AI Tutor', icon: Bot },
        { id: 'session', label: 'Study Session', icon: Sparkles },
        { id: 'knowledge-graph', label: 'Knowledge Graph', icon: Network },
        { id: 'cheatsheet', label: 'Cheat Sheets', icon: FileText }
      ]
    },
    {
      title: 'Practice & Testing',
      items: [
        { id: 'quiz', label: 'Quizzes & Practice', icon: HelpCircle },
        { id: 'flashcards', label: 'Flashcards', icon: Layers },
        { id: 'mock-exam', label: 'Mock Exams', icon: Timer },
        { id: 'evaluator', label: 'Answer Evaluator', icon: Award }
      ]
    },
    {
      title: 'Analytics & Settings',
      items: [
        {
          id: 'progress',
          label: 'Progress & Stats',
          icon: BarChart3,
          badge: weakTopics.length > 0 ? `${weakTopics.length} weak` : undefined
        },
        { id: 'settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  return (
    <>
      {/* 1. Desktop Collapsible Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 76 : 256 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        className="hidden lg:flex flex-col border-r border-neutral-200/80 bg-white/80 backdrop-blur-xl min-h-screen sticky top-0 h-screen z-20 select-none shadow-[2px_0_16px_-4px_rgba(0,0,0,0.03)] supports-[backdrop-filter]:bg-white/75"
      >
        {/* Brand Header */}
        <div className="px-4 border-b border-neutral-200/70 flex items-center justify-between gap-2 h-16 shrink-0">
          <div
            onClick={onViewLandingPage}
            className="flex items-center gap-3 cursor-pointer overflow-hidden min-w-0"
            title="Go to StudyMate Home"
          >
            <div className="w-8 h-8 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold shadow-xs shrink-0 ring-1 ring-black/10">
              <Sparkles className="w-4 h-4 text-white" />
            </div>

            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-neutral-950 tracking-tight text-sm">
                      StudyMate
                    </span>
                    <span className="bg-neutral-100 text-neutral-900 border border-neutral-200 text-[10px] px-1.5 py-0.5 rounded font-bold">
                      AI
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium block">
                    Workspace
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle Collapse Button */}
          <button
            id="sidebar-toggle-collapse-btn"
            type="button"
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 transition-colors shrink-0 cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Categorized Navigation Hierarchy */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto overflow-x-hidden space-y-4 scrollbar-thin">
          {navSections.map((section, sectionIdx) => (
            <div key={section.title} className="space-y-1">
              {/* Section Header */}
              {!isCollapsed ? (
                <div className="px-2 pt-1 pb-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  {section.title}
                </div>
              ) : (
                sectionIdx > 0 && <div className="h-px bg-neutral-200/80 my-2 mx-2" />
              )}

              {/* Items */}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`relative w-full flex items-center ${
                      isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                    } rounded-xl text-xs font-medium transition-all cursor-pointer group ${
                      isActive
                        ? 'text-white font-semibold'
                        : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/70'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {/* Active Pill Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className="absolute inset-0 bg-neutral-950 rounded-xl shadow-xs -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}

                    <div className="flex items-center gap-2.5 z-10 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                          isActive
                            ? 'text-white'
                            : 'text-neutral-500 group-hover:text-neutral-900'
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="truncate whitespace-nowrap">{item.label}</span>
                      )}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={`z-10 text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ml-1.5 ${
                          isActive
                            ? 'bg-neutral-800 text-neutral-200'
                            : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Return to Home Landing Page Link */}
        {onViewLandingPage && (
          <div className="px-3 pb-2 shrink-0">
            <button
              id="sidebar-btn-view-landing"
              type="button"
              onClick={onViewLandingPage}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
              } rounded-xl text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 transition-colors cursor-pointer`}
              title="Return to Landing Page"
            >
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4 text-neutral-400 shrink-0" />
                {!isCollapsed && <span>Landing Page</span>}
              </div>
              {!isCollapsed && <span className="text-[10px] text-neutral-400">Home</span>}
            </button>
          </div>
        )}

        {/* Minimalist Profile & Account Footer */}
        <div className="p-3 border-t border-neutral-200/80 bg-neutral-50/60 shrink-0">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-black/10"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-900 truncate">
                    {user?.displayName || profile.name}
                  </p>
                  <p className="text-[10px] text-neutral-500 truncate">
                    {user ? 'Cloud Workspace' : 'Local Workspace'}
                  </p>
                </div>
                {user ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await logoutUser();
                    }}
                    className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenAuth?.('signin')}
                    className="p-1 rounded-lg text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer font-semibold text-[11px]"
                    title="Sign In"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-black/10 cursor-pointer"
                  title={`${user.displayName || profile.name} (${user ? 'Cloud' : 'Local'})`}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-xs ring-1 ring-black/10 cursor-pointer"
                  title={`${profile.name} (${user ? 'Cloud' : 'Local'})`}
                >
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.aside>

      {/* 2. Mobile Sliding Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobileMenu}
              className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs cursor-pointer"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-2xl z-10 border-r border-neutral-200 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-neutral-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold shadow-xs">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-950 tracking-tight text-sm">
                      StudyMate AI
                    </span>
                    <span className="block text-[10px] text-neutral-400 font-medium">
                      Study Workspace
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onCloseMobileMenu}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-700 transition-colors cursor-pointer"
                  aria-label="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categorized Drawer Navigation */}
              <div className="flex-1 p-3 space-y-4 overflow-y-auto">
                {navSections.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <div className="px-3 pt-1 pb-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      {section.title}
                    </div>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
                            onCloseMobileMenu?.();
                          }}
                          className={`w-full flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            isActive
                              ? 'bg-neutral-950 text-white font-semibold shadow-xs'
                              : 'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 hover:text-neutral-950'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`}
                            />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                isActive
                                  ? 'bg-neutral-800 text-neutral-200'
                                  : 'bg-neutral-100 text-neutral-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Drawer Footer */}
              <div className="p-3 border-t border-neutral-200 bg-neutral-50 space-y-2">
                <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-neutral-200 shadow-2xs">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-900 truncate">
                      {user?.displayName || profile.name}
                    </p>
                    <p className="text-[10px] text-neutral-500 truncate">
                      {user ? 'Cloud Workspace' : 'Local Workspace'}
                    </p>
                  </div>
                </div>

                {user ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await logoutUser();
                      onCloseMobileMenu?.();
                    }}
                    className="w-full min-h-[44px] py-2.5 px-3 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:text-neutral-950 active:bg-neutral-100 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-neutral-500" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onCloseMobileMenu?.();
                      onOpenAuth?.('signin');
                    }}
                    className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-neutral-950 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs hover:bg-black active:bg-neutral-800 cursor-pointer transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In with Google</span>
                  </button>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Mobile / Tablet Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-neutral-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-md sm:max-w-lg mx-auto px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-around">
          {[
            { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
            { id: 'tutor', label: 'AI Tutor', icon: Bot },
            { id: 'session', label: 'Session', icon: Sparkles },
            { id: 'quiz', label: 'Quiz', icon: HelpCircle },
            { id: 'progress', label: 'Stats', icon: BarChart3 }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1.5 px-2 rounded-xl text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                  isActive ? 'text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-0.5 transition-transform ${
                    isActive ? 'text-neutral-950 scale-110' : 'text-neutral-400'
                  }`}
                />
                <span className="text-[10px] leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
