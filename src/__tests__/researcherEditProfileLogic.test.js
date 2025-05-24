// researcherEditProfileLogic.test.js
// Tests for the backend logic in researcherEditProfileLogic.js

import { renderHook, act } from '@testing-library/react';
import { useEditProfileLogic } from '../pages/Researcher/researcherEditProfileLogic';

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
  storage: {},
}));

jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve('mock-url')),
}));

describe('useEditProfileLogic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.localStorage = {
      getItem: jest.fn(() => 'mockToken'),
      removeItem: jest.fn(),
    };
  });

  it('should initialize state and expose handlers', async () => {
    const { result } = renderHook(() => useEditProfileLogic());
    expect(result.current).toHaveProperty('profile');
    expect(result.current).toHaveProperty('setProfile');
    expect(result.current).toHaveProperty('userId');
    expect(result.current).toHaveProperty('handleChange');
    expect(result.current).toHaveProperty('handleSubmit');
  });

  it('should update profile on handleChange', () => {
    const { result } = renderHook(() => useEditProfileLogic());
    act(() => {
      result.current.handleChange({ target: { name: 'name', value: 'Jane Doe' } });
    });
    expect(result.current.profile.name).toBe('Jane Doe');
  });

  it('should handle form submission with no userId', async () => {
    const { result } = renderHook(() => useEditProfileLogic());
    const e = { preventDefault: jest.fn() };
    await act(async () => {
      await result.current.handleSubmit(e);
    });
    // Should log error but not throw
    expect(e.preventDefault).toHaveBeenCalled();
  });
});
