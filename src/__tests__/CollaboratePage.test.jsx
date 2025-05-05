import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CollaboratePage from '../pages/Researcher/CollaboratePage';

// Mock Firebase dependencies to avoid actual Firebase calls
jest.mock('../config/firebaseConfig', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-id' },
    onAuthStateChanged: jest.fn()
  }
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn()
}));

// Mock react-toastify to prevent errors
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn()
  }
}));

describe('CollaboratePage', () => {
  test('renders the collaborate header', async () => {
    // Use async act to handle state updates
    await act(async () => {
      render(
        <MemoryRouter>
          <CollaboratePage />
        </MemoryRouter>
      );
    });
    
    // Wait for component to finish rendering
    await waitFor(() => {
      expect(screen.getByText(/Collaborate with Other Researchers/i)).toBeInTheDocument();
    });
  });
});
