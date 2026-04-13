/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Toaster } from './components/ui/sonner';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import LearningModule from './components/LearningModule';
import VirtualPatientModule from './components/VirtualPatientModule';
import AcademicPanel from './components/AcademicPanel';
import KnowledgeMap from './components/KnowledgeMap';
import Analytics from './components/Analytics';
import ProfessorPanel from './components/ProfessorPanel';
import Library from './components/Library';

export type Page = 'dashboard' | 'learn' | 'vp' | 'library' | 'kg' | 'analytics' | 'cohort' | 'alerts' | 'pulse' | 'professor';
export type Role = 'student' | 'instructor';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [role, setRole] = useState<Role>('student');
  const [learningTopic, setLearningTopic] = useState<string>('');

  const navigateTo = (page: string, topic?: string) => {
    setCurrentPage(page as Page);
    if (topic) {
      setLearningTopic(topic);
    } else {
      setLearningTopic('');
    }
  };

  const handleToggleRole = () => {
    const next = role === 'student' ? 'instructor' : 'student';
    setRole(next);
    if (next === 'instructor') {
      setCurrentPage('professor');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={navigateTo} />;
      case 'learn':
        return <LearningModule initialTopic={learningTopic} />;
      case 'vp':
        return <VirtualPatientModule onNavigate={navigateTo} />;
      case 'library':
        return <Library />;
      case 'kg':
        return <KnowledgeMap onNavigate={navigateTo} />;
      case 'analytics':
        return <Analytics />;
      case 'cohort':
      case 'alerts':
      case 'pulse':
        return <AcademicPanel initialTab={currentPage} />;
      case 'professor':
        return (
          <ProfessorPanel
            onBack={() => {
              setRole('student');
              setCurrentPage('dashboard');
            }}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-text-2">
            Bu sahifa hali tayyor emas.
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-bg-primary text-text-1 overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigateTo}
        role={role}
        onToggleRole={handleToggleRole}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {renderPage()}
        </main>
      </div>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}
