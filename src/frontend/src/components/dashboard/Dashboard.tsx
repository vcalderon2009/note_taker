import React from 'react';
import { Card } from '../ui/card/Card';
import { Button } from '../ui/button/Button';
import { useNotes, useTasks, useCategories } from '../../hooks/useApi';
import { CategoryDisplay } from '../ui/category/CategoryDisplay';
import type { Note, Task, Category } from '../../types/api';

interface DashboardProps {
  onNavigateToNotes?: () => void;
  onNavigateToTasks?: () => void;
  onNavigateToChat?: () => void;
}

export function Dashboard({ 
  onNavigateToNotes, 
  onNavigateToTasks, 
  onNavigateToChat 
}: DashboardProps) {
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: notes, isLoading: notesLoading } = useNotes();
  const { data: categories } = useCategories();

  // Get upcoming tasks (due within next 7 days or high priority)
  const upcomingTasks = React.useMemo(() => {
    if (!tasks) return [];
    
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return tasks
      .filter(task => {
        // Include high priority tasks or tasks due soon
        const isHighPriority = task.priority === 'high' || task.priority === 'medium';
        const isDueSoon = task.due_at && new Date(task.due_at) <= nextWeek;
        const isNotCompleted = task.status !== 'completed';
        
        return (isHighPriority || isDueSoon) && isNotCompleted;
      })
      .sort((a, b) => {
        // Sort by priority first, then by due date
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        const aPriority = a.priority ? priorityOrder[a.priority] : 4;
        const bPriority = b.priority ? priorityOrder[b.priority] : 4;
        
        if (aPriority !== bPriority) return aPriority - bPriority;
        if (a.due_at && b.due_at) {
          return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        }
        return 0;
      })
      .slice(0, 5); // Show top 5
  }, [tasks]);

  // Get recent notes (last 5)
  const recentNotes = React.useMemo(() => {
    if (!notes) return [];
    
    return notes
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [notes]);

  // Get category for a note
  const getCategoryForNote = (note: Note): Category | null => {
    if (!categories || !note.category_id) return null;
    return categories.find(cat => cat.id === note.category_id) || null;
  };

  // Get category for a task
  const getCategoryForTask = (task: Task): Category | null => {
    if (!categories || !task.category_id) return null;
    return categories.find(cat => cat.id === task.category_id) || null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Your personal AI assistant workspace
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onNavigateToChat}
            className="flex items-center gap-2"
          >
            💬 Start Chat
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              📝
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Notes</p>
              <p className="text-2xl font-bold">{notes?.length || 0}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              ✅
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Tasks</p>
              <p className="text-2xl font-bold">
                {tasks?.filter(t => t.status !== 'completed').length || 0}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              🎯
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold">{upcomingTasks.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              🏷️
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold">{categories?.length || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Upcoming Tasks</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onNavigateToTasks}
              className="text-sm"
            >
              View All →
            </Button>
          </div>
          
          {tasksLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : upcomingTasks.length > 0 ? (
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{task.title}</h3>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {task.priority && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            task.priority === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                          </span>
                        )}
                        {task.due_at && (
                          <span className="text-xs text-muted-foreground">
                            Due {new Date(task.due_at).toLocaleDateString()}
                          </span>
                        )}
                        {getCategoryForTask(task) && (
                          <CategoryDisplay category={getCategoryForTask(task)} />
                        )}
                      </div>
                    </div>
                    <div className="ml-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">🎯</div>
              <p>No upcoming tasks</p>
              <p className="text-sm">You&apos;re all caught up!</p>
            </div>
          )}
        </Card>

        {/* Recent Notes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Notes</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onNavigateToNotes}
              className="text-sm"
            >
              View All →
            </Button>
          </div>
          
          {notesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : recentNotes.length > 0 ? (
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <div key={note.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{note.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {note.body}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex gap-1">
                            {note.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                            {note.tags.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{note.tags.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                        {getCategoryForNote(note) && (
                          <CategoryDisplay category={getCategoryForNote(note)} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">📝</div>
              <p>No notes yet</p>
              <p className="text-sm">Start by sending a message!</p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center gap-2"
            onClick={onNavigateToChat}
          >
            <div className="text-2xl">💬</div>
            <span className="text-sm">Start New Chat</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center gap-2"
            onClick={onNavigateToNotes}
          >
            <div className="text-2xl">📝</div>
            <span className="text-sm">Browse Notes</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center gap-2"
            onClick={onNavigateToTasks}
          >
            <div className="text-2xl">✅</div>
            <span className="text-sm">Manage Tasks</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
