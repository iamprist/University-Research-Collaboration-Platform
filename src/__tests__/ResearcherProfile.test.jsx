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

 
test('should display default avatar letter if name is missing', async () => {
  const { getDoc } = require('firebase/firestore');
  getDoc.mockImplementationOnce(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({
        profilePicture: null,
        name: '',
        title: 'Dr.',
        email: 'no.name@example.com',
        researchArea: 'Biology',
        biography: 'Bio.',
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

  // Should show default avatar letter (A for anonymous/no name)
  expect(screen.getByText('A')).toBeInTheDocument();
});

test('should handle missing biography gracefully', async () => {
  const { getDoc } = require('firebase/firestore');
  getDoc.mockImplementationOnce(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({
        profilePicture: null,
        name: 'Jane Doe',
        title: 'Ms.',
        email: 'jane.doe@example.com',
        researchArea: 'Physics',
        biography: '',
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

  // Should still render the profile without crashing
  expect(screen.getByText(/ms\. jane doe/i)).toBeInTheDocument();
  expect(screen.getByText(/jane.doe@example.com/i)).toBeInTheDocument();
  expect(screen.getByText(/physics/i)).toBeInTheDocument();
});

test('should handle missing researchArea gracefully', async () => {
  const { getDoc } = require('firebase/firestore');
  getDoc.mockImplementationOnce(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({
        profilePicture: null,
        name: 'Jane Doe',
        title: 'Ms.',
        email: 'jane.doe@example.com',
        researchArea: '',
        biography: 'Physics researcher.',
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

  expect(screen.getByText(/ms\. jane doe/i)).toBeInTheDocument();
  expect(screen.getByText(/jane.doe@example.com/i)).toBeInTheDocument();
  expect(screen.getByText(/physics researcher\./i)).toBeInTheDocument();
});

test('should handle missing title gracefully', async () => {
  const { getDoc } = require('firebase/firestore');
  getDoc.mockImplementationOnce(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({
        profilePicture: null,
        name: 'Jane Doe',
        title: '',
        email: 'jane.doe@example.com',
        researchArea: 'Physics',
        biography: 'Physics researcher.',
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

  // Should show name without title
  expect(screen.getByText(/jane doe/i)).toBeInTheDocument();
});
test('should show loading state', () => {
  // Render and check loading
  render(
    <Router>
      <ResearcherProfile />
    </Router>
  );
  expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
});

test('should show error state if Firestore fails', async () => {
  const { getDoc } = require('firebase/firestore');
  getDoc.mockImplementationOnce(() =>
    Promise.reject(new Error('Firestore error'))
  );

  render(
    <Router>
      <ResearcherProfile />
    </Router>
  );

  await waitFor(() => {
    expect(screen.getByText(/failed to load profile/i)).toBeInTheDocument();
  });
});

test('should show "Profile not found" if user doc does not exist', async () => {
  const { getDoc } = require('firebase/firestore');
  getDoc.mockImplementationOnce(() =>
    Promise.resolve({
      exists: () => false,
      data: () => ({}),
    })
  );

  render(
    <Router>
      <ResearcherProfile />
    </Router>
  );

  await waitFor(() => {
    expect(screen.getByText(/profile not found/i)).toBeInTheDocument();
  });
});

test('should show profile image placeholder if no profilePicture', async () => {
  const { getDoc } = require('firebase/firestore');
  getDoc.mockImplementationOnce(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({
        profilePicture: null,
        name: 'Jane Doe',
        title: 'Ms.',
        email: 'jane.doe@example.com',
        researchArea: 'Physics',
        biography: 'Physics researcher.',
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

  // Should show the first letter of the name as placeholder
  expect(screen.getByText('J')).toBeInTheDocument();
  expect(screen.getByText(/ms\. jane doe/i)).toBeInTheDocument();
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