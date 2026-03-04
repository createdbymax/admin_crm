// View configuration types

export type ViewType = 'table' | 'board' | 'gallery' | 'calendar' | 'timeline' | 'list';

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'isAnyOf'
  | 'isNoneOf'
  | 'before'
  | 'after'
  | 'onOrBefore'
  | 'onOrAfter'
  | 'isWithin'
  | 'isPast'
  | 'isFuture';

export type FilterCondition = 'and' | 'or';

export interface Filter {
  id: string;
  property: string;
  operator: FilterOperator;
  value: unknown;
  condition: FilterCondition;
}

export interface Sort {
  property: string;
  direction: 'asc' | 'desc';
}

export interface GroupBy {
  property: string;
  direction: 'asc' | 'desc';
}

export interface ViewConfig {
  id: string;
  name: string;
  type: ViewType;
  icon?: string;
  
  // Filtering
  filters: Filter[];
  filterLogic?: 'and' | 'or'; // Global filter logic
  
  // Sorting
  sorts: Sort[];
  
  // Grouping
  groupBy?: GroupBy;
  
  // Properties
  visibleProperties: string[];
  propertyWidths: Record<string, number>;
  propertyOrder: string[];
  
  // View-specific settings
  boardGroupBy?: string; // For board view
  galleryImageProperty?: string; // For gallery view
  calendarDateProperty?: string; // For calendar view
  timelineStartProperty?: string; // For timeline view
  timelineEndProperty?: string; // For timeline view
  
  // Metadata
  userId?: string;
  isDefault?: boolean;
  isShared?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ViewState {
  currentView: ViewConfig;
  availableViews: ViewConfig[];
  isLoading: boolean;
  error: string | null;
}

export interface ViewActions {
  setCurrentView: (viewId: string) => void;
  createView: (view: Omit<ViewConfig, 'id'>) => Promise<ViewConfig>;
  updateView: (viewId: string, updates: Partial<ViewConfig>) => Promise<void>;
  deleteView: (viewId: string) => Promise<void>;
  duplicateView: (viewId: string) => Promise<ViewConfig>;
  addFilter: (filter: Omit<Filter, 'id'>) => void;
  updateFilter: (filterId: string, updates: Partial<Filter>) => void;
  removeFilter: (filterId: string) => void;
  addSort: (sort: Sort) => void;
  updateSort: (property: string, direction: 'asc' | 'desc') => void;
  removeSort: (property: string) => void;
  setGroupBy: (groupBy: GroupBy | undefined) => void;
  togglePropertyVisibility: (propertyId: string) => void;
  setPropertyWidth: (propertyId: string, width: number) => void;
  reorderProperties: (propertyIds: string[]) => void;
}
