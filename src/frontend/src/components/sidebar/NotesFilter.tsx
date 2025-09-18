import React from 'react';
import { Search, Filter, X, Calendar, Hash, SortAsc, SortDesc, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input/Input';
import { Button } from '@/components/ui/button/Button';
import { Note } from '@/types/api';
import { useCategories } from '@/hooks/useApi';
import { CategoryDisplay } from '../ui/category/CategoryDisplay';

export interface NotesFilterState {
  searchQuery: string;
  selectedTags: string[];
  selectedCategories: number[];
  sortBy: 'created' | 'updated' | 'title';
  sortOrder: 'asc' | 'desc';
  dateRange: 'all' | 'today' | 'week' | 'month';
}

interface NotesFilterProps {
  notes: Note[];
  filterState: NotesFilterState;
  onFilterChange: (filterState: NotesFilterState) => void;
  className?: string;
}

export function NotesFilter({ 
  notes, 
  filterState, 
  onFilterChange, 
  className 
}: NotesFilterProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const { data: categories = [] } = useCategories();

  // Get all unique tags from notes
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      note.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  const handleSearchChange = (searchQuery: string) => {
    onFilterChange({ ...filterState, searchQuery });
  };

  const handleTagToggle = (tag: string) => {
    const selectedTags = filterState.selectedTags.includes(tag)
      ? filterState.selectedTags.filter(t => t !== tag)
      : [...filterState.selectedTags, tag];
    onFilterChange({ ...filterState, selectedTags });
  };

  const handleCategoryToggle = (categoryId: number) => {
    const selectedCategories = filterState.selectedCategories.includes(categoryId)
      ? filterState.selectedCategories.filter(id => id !== categoryId)
      : [...filterState.selectedCategories, categoryId];
    onFilterChange({ ...filterState, selectedCategories });
  };

  const handleSortChange = (sortBy: NotesFilterState['sortBy']) => {
    const sortOrder = filterState.sortBy === sortBy && filterState.sortOrder === 'desc' 
      ? 'asc' 
      : 'desc';
    onFilterChange({ ...filterState, sortBy, sortOrder });
  };

  const handleDateRangeChange = (dateRange: NotesFilterState['dateRange']) => {
    onFilterChange({ ...filterState, dateRange });
  };

  const clearFilters = () => {
    onFilterChange({
      searchQuery: '',
      selectedTags: [],
      selectedCategories: [],
      sortBy: 'created',
      sortOrder: 'desc',
      dateRange: 'all'
    });
  };

  const hasActiveFilters = filterState.searchQuery || 
    filterState.selectedTags.length > 0 || 
    filterState.selectedCategories.length > 0 ||
    filterState.dateRange !== 'all' ||
    filterState.sortBy !== 'created' ||
    filterState.sortOrder !== 'desc';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={filterState.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10 h-10 rounded-lg border-border/50 bg-card/30 backdrop-blur-sm focus:bg-card/50 transition-all"
        />
        {filterState.searchQuery && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-muted/50 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "text-xs rounded-lg transition-all border-border/50 hover:bg-card/50",
            showAdvanced && "bg-card/80 shadow-sm"
          )}
        >
          <Filter className="h-3 w-3 mr-1" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
              !
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50">
          {/* Categories Filter */}
          {categories.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Tag className="h-3 w-3" />
                Filter by Categories
              </h4>
              <div className="flex flex-wrap gap-1">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors',
                      filterState.selectedCategories.includes(category.id)
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card/50 text-muted-foreground border-border/50 hover:bg-card/80 hover:text-foreground'
                    )}
                  >
                    <span className="text-sm">{category.icon}</span>
                    {category.name}
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: category.color || '#6b7280' }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Hash className="h-3 w-3" />
                Filter by Tags
              </h4>
              <div className="flex flex-wrap gap-1">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors',
                      filterState.selectedTags.includes(tag)
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card/50 text-muted-foreground border-border/50 hover:bg-card/80 hover:text-foreground'
                    )}
                  >
                    <Hash className="h-2.5 w-2.5" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date Range Filter */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              Date Range
            </h4>
            <div className="flex gap-1">
              {[
                { value: 'all', label: 'All' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleDateRangeChange(option.value as NotesFilterState['dateRange'])}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs border transition-colors',
                    filterState.dateRange === option.value
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card/50 text-muted-foreground border-border/50 hover:bg-card/80 hover:text-foreground'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <h4 className="text-sm font-medium mb-2">Sort By</h4>
            <div className="flex gap-1">
              {[
                { value: 'created', label: 'Created' },
                { value: 'updated', label: 'Updated' },
                { value: 'title', label: 'Title' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value as NotesFilterState['sortBy'])}
                  className={cn(
                    'inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs border transition-colors',
                    filterState.sortBy === option.value
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card/50 text-muted-foreground border-border/50 hover:bg-card/80 hover:text-foreground'
                  )}
                >
                  {option.label}
                  {filterState.sortBy === option.value && (
                    filterState.sortOrder === 'desc' 
                      ? <SortDesc className="h-3 w-3" />
                      : <SortAsc className="h-3 w-3" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          {filterState.searchQuery && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
              <Search className="h-2.5 w-2.5" />
              &quot;{filterState.searchQuery}&quot;
              <button
                onClick={() => handleSearchChange('')}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          )}
          {filterState.selectedTags.map(tag => (
            <div key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent-foreground rounded-full text-xs">
              <Hash className="h-2.5 w-2.5" />
              {tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className="ml-1 hover:bg-accent/20 rounded-full p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Utility function to apply filters
export function applyNotesFilter(notes: Note[], filterState: NotesFilterState): Note[] {
  let filtered = notes;

  // Apply search filter
  if (filterState.searchQuery) {
    const query = filterState.searchQuery.toLowerCase();
    filtered = filtered.filter(note =>
      note.title.toLowerCase().includes(query) ||
      note.body.toLowerCase().includes(query) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }

  // Apply categories filter
  if (filterState.selectedCategories.length > 0) {
    filtered = filtered.filter(note =>
      note.category_id && filterState.selectedCategories.includes(note.category_id)
    );
  }

  // Apply tags filter
  if (filterState.selectedTags.length > 0) {
    filtered = filtered.filter(note =>
      note.tags && filterState.selectedTags.every(selectedTag =>
        note.tags!.includes(selectedTag)
      )
    );
  }

  // Apply date range filter
  if (filterState.dateRange !== 'all') {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    filtered = filtered.filter(note => {
      const noteDate = new Date(note.created_at);
      switch (filterState.dateRange) {
        case 'today':
          return noteDate >= startOfDay;
        case 'week':
          return noteDate >= startOfWeek;
        case 'month':
          return noteDate >= startOfMonth;
        default:
          return true;
      }
    });
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let aValue: string | Date;
    let bValue: string | Date;

    switch (filterState.sortBy) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'updated':
        aValue = new Date(a.updated_at);
        bValue = new Date(b.updated_at);
        break;
      case 'created':
      default:
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
    }

    if (aValue < bValue) return filterState.sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return filterState.sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return filtered;
}
