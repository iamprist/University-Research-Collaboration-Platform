// researcherDashboardLogic.test.js
// Tests for the backend logic in researcherDashboardLogic.js

import { renderHook, act } from '@testing-library/react';
import { useResearcherDashboard } from '../pages/Researcher/researcherDashboardLogic';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(() => jest.fn()),
}));

jest.mock('../config/firebaseConfig', () => ({
  db: {},
  auth: {
    onAuthStateChanged: jest.fn(),
    currentUser: { uid: 'test-user-id', displayName: 'Test User' },
    signOut: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  arrayUnion: jest.fn(),
}));

jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: { ip: '127.0.0.1' } })),
}));

describe('useResearcherDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(() => 'mockToken'),
      removeItem: jest.fn(),
    };
  });

  it('should initialize state and expose handlers', async () => {
    const { result } = renderHook(() => useResearcherDashboard());
    // Check that state and handlers are defined
    expect(result.current).toHaveProperty('allListings');
    expect(result.current).toHaveProperty('myListings');
    expect(result.current).toHaveProperty('handleSearch');
    expect(result.current).toHaveProperty('handleLogout');
  });

  it('should handle search with empty term', () => {
    const { result } = renderHook(() => useResearcherDashboard());
    act(() => {
      result.current.setSearchTerm('');
      result.current.handleSearch();
    });
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.dropdownVisible).toBe(false);
  });

  it('should clear search', () => {
    const { result } = renderHook(() => useResearcherDashboard());
    act(() => {
      result.current.setSearchTerm('test');
      result.current.handleClear();
    });
    expect(result.current.searchTerm).toBe('');
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.dropdownVisible).toBe(false);
  });

  it('should handle logout', async () => {
    const { result } = renderHook(() => useResearcherDashboard());
    await act(async () => {
      await result.current.handleLogout();
    });
    // signOut should be called
    const { auth } = require('../config/firebaseConfig');
    expect(auth.signOut).toHaveBeenCalled();
  });
});
