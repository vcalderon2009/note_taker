'use client';

import * as React from 'react';
import { Check, ChevronDown, Plus, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button/Button';
import { Input } from '@/components/ui/input/Input';
import { useCategories, useCreateCategory } from '@/hooks/useApi';
import type { Category } from '@/types/api';

interface CategoryPickerProps {
  selectedCategoryId: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  placeholder?: string;
  className?: string;
}

export function CategoryPicker({ 
  selectedCategoryId, 
  onCategoryChange, 
  placeholder = "Select category...",
  className 
}: CategoryPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [newCategoryColor, setNewCategoryColor] = React.useState('#3b82f6');
  const [newCategoryIcon, setNewCategoryIcon] = React.useState('📝');

  const { data: categories = [], isLoading } = useCategories();
  const createCategoryMutation = useCreateCategory();

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategorySelect = (categoryId: number | null) => {
    onCategoryChange(categoryId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await createCategoryMutation.mutateAsync({
        name: newCategoryName.trim(),
        color: newCategoryColor,
        icon: newCategoryIcon,
      });
      
      onCategoryChange(newCategory.id);
      setShowCreateForm(false);
      setNewCategoryName('');
      setNewCategoryColor('#3b82f6');
      setNewCategoryIcon('📝');
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const predefinedColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
  ];

  const predefinedIcons = [
    '📝', '💼', '🏠', '📚', '🎯', '⚡', '🔥', '⭐', '💡', '🎨'
  ];

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-border/50 rounded-lg',
          'bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary/20'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedCategory ? (
            <>
              <span className="text-lg">{selectedCategory.icon}</span>
              <span className="truncate">{selectedCategory.name}</span>
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: selectedCategory.color || '#6b7280' }}
              />
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
          {!showCreateForm ? (
            <>
              {/* Search */}
              <div className="p-3 border-b border-border/50">
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8"
                />
              </div>

              {/* Categories List */}
              <div className="max-h-48 overflow-y-auto">
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50 transition-colors',
                    !selectedCategoryId && 'bg-muted/50'
                  )}
                >
                  <div className="w-5 h-5 rounded border border-border/50 flex items-center justify-center">
                    {!selectedCategoryId && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-muted-foreground">No category</span>
                </button>

                {isLoading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
                ) : filteredCategories.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {searchQuery ? 'No categories found' : 'No categories yet'}
                  </div>
                ) : (
                  filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50 transition-colors',
                        selectedCategoryId === category.id && 'bg-muted/50'
                      )}
                    >
                      <div className="w-5 h-5 rounded border border-border/50 flex items-center justify-center">
                        {selectedCategoryId === category.id && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-lg">{category.icon}</span>
                      <span className="flex-1 truncate">{category.name}</span>
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color || '#6b7280' }}
                      />
                    </button>
                  ))
                )}
              </div>

              {/* Create New Button */}
              <div className="p-3 border-t border-border/50">
                <Button
                  onClick={() => setShowCreateForm(true)}
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Category
                </Button>
              </div>
            </>
          ) : (
            /* Create Form */
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span className="text-sm font-medium">Create New Category</span>
              </div>

              <Input
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-8"
              />

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Color</label>
                <div className="flex gap-1 flex-wrap">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCategoryColor(color)}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-all',
                        newCategoryColor === color ? 'border-foreground' : 'border-border/50'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Icon</label>
                <div className="flex gap-1 flex-wrap">
                  {predefinedIcons.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewCategoryIcon(icon)}
                      className={cn(
                        'w-8 h-8 rounded border-2 flex items-center justify-center text-lg transition-all',
                        newCategoryIcon === icon ? 'border-foreground' : 'border-border/50'
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateCategory}
                  size="sm"
                  disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                  className="flex-1"
                >
                  {createCategoryMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
