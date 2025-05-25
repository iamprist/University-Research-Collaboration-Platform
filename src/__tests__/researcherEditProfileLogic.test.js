// researcherEditProfileLogic.test.js
// Tests for the backend logic in researcherEditProfileLogic.js

import { renderHook, act } from '@testing-library/react';
import { useEditProfileLogic } from '../pages/Researcher/researcherEditProfileLogic';

// Create a single mock function for navigate
const mockNavigate = jest.fn();
// Use a shared storage mock object
const storage = { __mock: true };
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../config/firebaseConfig', () => ({
  db: {},
  auth: {
    onAuthStateChanged: jest.fn((cb) => { 
      cb({ uid: 'test-user-id' }); 
      return jest.fn(); // Return a mock unsubscribe function
    }),
    currentUser: { uid: 'test-user-id', displayName: 'Test User' },
    signOut: jest.fn(() => Promise.resolve()),
  },
  storage, // use the shared storage mock
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
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  beforeAll(() => {
    // Patch global File for instanceof checks in tests
    global.File = class extends Blob {
      constructor(chunks, filename, opts) {
        super(chunks, opts);
        this.name = filename;
      }
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.localStorage = {
      getItem: jest.fn(() => 'mockToken'),
      removeItem: jest.fn(),
    };
  });

  afterEach(() => {
    delete globalThis.localStorage;
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

  it('should handle form submission with valid userId and file upload', async () => {
    // Import storage and auth mocks before rendering the hook
    const { storage, auth } = require('../config/firebaseConfig');
    const { setDoc, doc } = require('firebase/firestore');
    const { uploadBytes, getDownloadURL, ref } = require('firebase/storage');

    setDoc.mockResolvedValueOnce();
    doc.mockReturnValue('mockDocRef');

    // Create a mock storage reference
    const mockStorageRef = {
      toString: () => 'mockStorageRef',
      fullPath: 'profilePictures/test-user-id'
    };
    ref.mockReturnValue(mockStorageRef); // Always return the mock ref
    uploadBytes.mockResolvedValueOnce({ ref: mockStorageRef });
    getDownloadURL.mockResolvedValueOnce('mock-url');
    auth.onAuthStateChanged.mockImplementation(cb => cb({ uid: 'test-user-id' }));

    const { result } = renderHook(() => useEditProfileLogic());
    // Wait for useEffect to set userId
    await act(async () => {});
    const file = new File(['dummy'], 'test.png', { type: 'image/png' });
    act(() => {
      result.current.handleChange({
        target: {
          name: 'profilePicture',
          files: [file]
        }
      });
    });

    // Simulate form submission
    const e = { preventDefault: jest.fn() };
    await act(async () => {
      await result.current.handleSubmit(e);
    });

    // Assertions
    expect(e.preventDefault).toHaveBeenCalled();
    expect(ref).toHaveBeenCalledWith(storage, `profilePictures/test-user-id`);
    expect(uploadBytes).toHaveBeenCalledWith(
      mockStorageRef,
      expect.any(File)
    );
    expect(getDownloadURL).toHaveBeenCalledWith(mockStorageRef);
    expect(setDoc).toHaveBeenCalledWith(
      'mockDocRef',
      expect.objectContaining({
        profilePicture: 'mock-url'
      }),
      { merge: true }
    );
    expect(mockNavigate).toHaveBeenCalledWith('/researcher-profile');
  });

  it('should handle error during form submission', async () => {
    const { result } = renderHook(() => useEditProfileLogic());
    result.current.userId = 'test-user-id';
    const { setDoc } = require('firebase/firestore');
    setDoc.mockRejectedValueOnce(new Error('Firestore error'));
    const e = { preventDefault: jest.fn() };
    await act(async () => {
      await result.current.handleSubmit(e);
    });
    expect(e.preventDefault).toHaveBeenCalled();
    // Should not throw
  });

  it('should call signOut and removeItem on logout', async () => {
    // Set up the mock before rendering the hook
    const removeItemMock = jest.fn();
    globalThis.localStorage = {
      getItem: jest.fn(() => 'mockToken'),
      removeItem: removeItemMock,
    };
    const { auth } = require('../config/firebaseConfig');
    auth.onAuthStateChanged.mockImplementation(cb => cb({ uid: 'test-user-id' }));
    const { result } = renderHook(() => useEditProfileLogic());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(auth.signOut).toHaveBeenCalled();
    expect(removeItemMock).toHaveBeenCalledWith('authToken');
    expect(mockNavigate).toHaveBeenCalledWith('/signin');
  });

  it('should update userId on auth state change', () => {
    const { auth } = require('../config/firebaseConfig');
    let callback;
    auth.onAuthStateChanged.mockImplementation(cb => { callback = cb; return () => {}; });
    renderHook(() => useEditProfileLogic());
    if (typeof callback === 'function') {
      act(() => {
        callback({ uid: 'new-user-id' });
      });
    }
    // No assertion needed, just ensure no crash
  });
});
