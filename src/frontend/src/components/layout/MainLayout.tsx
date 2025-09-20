'use client';

import React from 'react';
import { Navigation } from './Navigation';
import { AppLayout } from './AppLayout';
import { Dashboard } from '../dashboard/Dashboard';
import { StartupScreen } from '../system/StartupScreen';
import { cn } from '@/lib/utils';

type ViewType = 'dashboard' | 'chat' | 'notes' | 'tasks';

interface MainLayoutProps {
  className?: string;
}

export function MainLayout({ className }: MainLayoutProps) {
  const [currentView, setCurrentView] = React.useState<ViewType>('chat');

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleNavigateToNotes = () => {
    setCurrentView('notes');
  };

  const handleNavigateToTasks = () => {
    setCurrentView('tasks');
  };

  const handleNavigateToChat = () => {
    setCurrentView('chat');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigateToNotes={handleNavigateToNotes}
            onNavigateToTasks={handleNavigateToTasks}
            onNavigateToChat={handleNavigateToChat}
          />
        );
      case 'chat':
        return <AppLayout className="h-full" />;
      case 'notes':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Notes</h1>
            <p className="text-muted-foreground">Notes view coming soon...</p>
          </div>
        );
      case 'tasks':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Tasks</h1>
            <p className="text-muted-foreground">Tasks view coming soon...</p>
          </div>
        );
      default:
        return <Dashboard onNavigateToNotes={handleNavigateToNotes} onNavigateToTasks={handleNavigateToTasks} onNavigateToChat={handleNavigateToChat} />;
    }
  };

  return (
    <div className={cn("h-screen flex flex-col bg-background", className)}>
      <Navigation currentView={currentView} onViewChange={handleViewChange} />
      <div className="flex-1 overflow-hidden">
        {renderCurrentView()}
      </div>
      <StartupScreen />
    </div>
  );
}
