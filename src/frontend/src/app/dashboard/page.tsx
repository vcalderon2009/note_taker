'use client';

import React from 'react';
import { Dashboard } from '../../components/dashboard/Dashboard';

export default function DashboardPage() {
  const handleNavigateToNotes = () => {
    // TODO: Implement navigation to notes view
    console.log('Navigate to notes');
  };

  const handleNavigateToTasks = () => {
    // TODO: Implement navigation to tasks view
    console.log('Navigate to tasks');
  };

  const handleNavigateToChat = () => {
    // TODO: Implement navigation to chat view
    console.log('Navigate to chat');
  };

  return (
    <Dashboard
      onNavigateToNotes={handleNavigateToNotes}
      onNavigateToTasks={handleNavigateToTasks}
      onNavigateToChat={handleNavigateToChat}
    />
  );
}
