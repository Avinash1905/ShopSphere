import { create } from 'zustand';
import { SearchSuggestion } from '../services/api/searchService';
import { searchService } from '../services';

interface SearchState {
  query: string;
  suggestions: SearchSuggestion[];
  popularSearches: string[];
  recentSearches: string[];
  isSearchModalOpen: boolean;
  isLoading: boolean;
  setQuery: (query: string) => void;
  fetchSuggestions: (query: string) => Promise<void>;
  fetchPopularAndRecent: () => Promise<void>;
  addRecent: (query: string) => void;
  clearRecent: () => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  suggestions: [],
  popularSearches: [],
  recentSearches: [],
  isSearchModalOpen: false,
  isLoading: false,

  setQuery: (query) => {
    set({ query });
    if (query.trim().length >= 2) {
      get().fetchSuggestions(query);
    } else {
      set({ suggestions: [] });
    }
  },

  fetchSuggestions: async (query) => {
    set({ isLoading: true });
    try {
      const res = await searchService.getSuggestions(query);
      set({ suggestions: res.data, isLoading: false });
    } catch {
      set({ suggestions: [], isLoading: false });
    }
  },

  fetchPopularAndRecent: async () => {
    try {
      const popularRes = await searchService.getPopularSearches();
      const recent = searchService.getRecentSearches();
      set({ popularSearches: popularRes.data, recentSearches: recent });
    } catch (err) {
      console.error('Failed to load popular searches', err);
    }
  },

  addRecent: (q) => {
    searchService.addRecentSearch(q);
    set({ recentSearches: searchService.getRecentSearches() });
  },

  clearRecent: () => {
    searchService.clearRecentSearches();
    set({ recentSearches: [] });
  },

  openSearchModal: () => {
    set({ isSearchModalOpen: true });
    get().fetchPopularAndRecent();
  },

  closeSearchModal: () => set({ isSearchModalOpen: false, query: '', suggestions: [] }),
}));
