// src/__tests__/ResearcherProfile.test.jsx

// --- Firebase & Navigation Mocks ---
jest.mock('firebase/firestore', () => {
  const mockData = {
    profilePicture: 'mockProfilePicUrl',
    name: 'John Doe',
    title: 'Dr.',
    email: 'john.doe@example.com',
    researchArea: 'Machine Learning',
    biography: 'Experienced researcher in ML and AI.',
  };
  return {
    getDoc: jest.fn().mockImplementation(() =>
      Promise.resolve({
        exists: () => true,
        data: () => mockData,
      })
    ),
    doc: jest.fn().mockReturnValue({}),
    collection: jest.fn(),
    getFirestore: jest.fn().mockReturnValue({}),
  };
});

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn().mockReturnValue({}),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn().mockReturnValue({
    onAuthStateChanged: jest.fn(),
    currentUser: { uid: 'test-user-id' },
  }),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn().mockReturnValue({}),
}));

// --- Imports ---
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import ResearcherProfile from '../pages/Researcher/ResearcherProfile';
import { auth } from '../config/firebaseConfig';

// --- Mock useNavigate from react-router-dom ---
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// --- Setup localStorage and URL mocks ---
beforeEach(() => {
  jest.spyOn(auth, 'onAuthStateChanged').mockImplementation((cb) => {
    cb({ uid: 'mockUserId' });
    return () => {};
  });

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn().mockReturnValue('mockToken'),
      removeItem: jest.fn(),
    },
    writable: true,
  });

  global.URL.createObjectURL = jest.fn().mockReturnValue('mock-image-url');
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ResearcherProfile Component', () => {
  test('should render the profile information correctly', async () => {
    // Ensure Firestore getDoc mock returns valid profile data
    const { getDoc } = require('firebase/firestore');
    getDoc.mockImplementationOnce(() =>
      Promise.resolve({
        exists: () => true,
        data: () => ({
          profilePicture: 'mockProfilePicUrl',
          name: 'John Doe',
          title: 'Dr.',
          email: 'john.doe@example.com',
          researchArea: 'Machine Learning',
          biography: 'Experienced researcher in ML and AI.',
        }),
      })
    );

    render(
      <Router>
        <ResearcherProfile />
      </Router>
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    // Check for the name and title in the Typography (not h2 anymore)
    expect(screen.getByText(/Dr\. John Doe/i)).toBeInTheDocument();

    expect(screen.getByText(/john.doe@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/machine learning/i)).toBeInTheDocument();
    expect(screen.getByText(/experienced researcher in ml and ai./i)).toBeInTheDocument();
  });

  test('should redirect to the sign-in page if the user is not authenticated', async () => {
    window.localStorage.getItem.mockReturnValueOnce(null);

    render(
      <Router>
        <ResearcherProfile />
      </Router>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/signin');
    });
  });

  test('should allow user to navigate to the edit profile page', async () => {
    // Ensure Firestore getDoc mock returns valid profile data
    const { getDoc } = require('firebase/firestore');
    getDoc.mockImplementationOnce(() =>
      Promise.resolve({
        exists: () => true,
        data: () => ({
          profilePicture: 'mockProfilePicUrl',
          name: 'John Doe',
          title: 'Dr.',
          email: 'john.doe@example.com',
          researchArea: 'Machine Learning',
          biography: 'Experienced researcher in ML and AI.',
        }),
      })
    );

    render(
      <Router>
        <ResearcherProfile />
      </Router>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });

    // Check if the edit button is present
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editButton);

    expect(mockNavigate).toHaveBeenCalledWith('/researcher-edit-profile');
  });
});