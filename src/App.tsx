import React, { useState, useEffect } from 'react';
import { StudyProvider, useStudy } from './context/StudyContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OnboardingModal } from './components/common/OnboardingModal';
import { LandingPage } from './components/landing/LandingPage';
import { AuthModal } from './components/auth/AuthModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { SubjectsView } from './components/views/SubjectsView';
import { MaterialsView } from './components/views/MaterialsView';
import { AITutorView } from './components/views/AITutorView';
import { QuizView } from './components/views/QuizView';
import { AnswerEvaluatorView } from './components/views/AnswerEvaluatorView';
import { FlashcardsView } from './components/views/FlashcardsView';
import { StudyPlanView } from './components/views/StudyPlanView';
import { StudySessionView } from './components/views/StudySessionView';
import { ProgressView } from './components/views/ProgressView';
import { SettingsView } from './components/views/SettingsView';
import { CheatSheetView } from './components/views/CheatSheetView';
import { KnowledgeGraphView } from './components/views/KnowledgeGraphView';
import { MockExamView } from './components/views/MockExamView';

interface MainLayoutProps {
  onViewLandingPage: () => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  onViewLandingPage,
  onOpenAuth
}) => {
  const { activeTab, setActiveTab } = useStudy();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'subjects':
        return <SubjectsView />;
      case 'materials':
        return <MaterialsView />;
      case 'tutor':
        return <AITutorView />;
      case 'cheatsheet':
        return <CheatSheetView />;
      case 'knowledge-graph':
        return <KnowledgeGraphView />;
      case 'mock-exam':
        return <MockExamView />;
      case 'quiz':
        return <QuizView />;
      case 'evaluator':
        return <AnswerEvaluatorView />;
      case 'flashcards':
        return <FlashcardsView />;
      case 'plan':
        return <StudyPlanView />;
      case 'session':
        return <StudySessionView />;
      case 'progress':
        return <ProgressView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-neutral-50 font-sans text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onViewLandingPage={onViewLandingPage}
        onOpenAuth={onOpenAuth}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-50">
        {/* Top Header */}
        <Header
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onViewLandingPage={onViewLandingPage}
          onOpenAuth={onOpenAuth}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 pb-24 lg:pb-8">
          {renderActiveView()}
        </main>
      </div>

      {/* Personalization Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user } = useStudy();
  // Show working application instantly per Architectural Rules
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('app');

  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode: 'signin' | 'signup';
  }>({
    isOpen: false,
    mode: 'signup'
  });

  // If user is authenticated, ensure they can access the app
  useEffect(() => {
    if (user && viewMode === 'landing') {
      setViewMode('app');
      sessionStorage.setItem('studymate_entered_app', 'true');
    }
  }, [user]);

  const handleEnterApp = () => {
    setViewMode('app');
    sessionStorage.setItem('studymate_entered_app', 'true');
  };

  const handleViewLanding = () => {
    setViewMode('landing');
  };

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthModal({
      isOpen: true,
      mode
    });
  };

  const handleCloseAuth = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleAuthSuccess = () => {
    handleEnterApp();
  };

  return (
    <>
      {viewMode === 'landing' ? (
        <LandingPage
          onOpenAuth={handleOpenAuth}
          onEnterApp={handleEnterApp}
        />
      ) : (
        <MainLayout
          onViewLandingPage={handleViewLanding}
          onOpenAuth={handleOpenAuth}
        />
      )}

      {/* Global Google Authentication Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onClose={handleCloseAuth}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default function App() {
  return (
    <StudyProvider>
      <AppContent />
    </StudyProvider>
  );
}
