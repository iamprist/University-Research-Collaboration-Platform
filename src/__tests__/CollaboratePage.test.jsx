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
  
  // New test case to check "no projects" message appears
  test('displays no projects message when no listings are available', async () => {
    // Ensure getDocs returns empty array
    require('firebase/firestore').getDocs.mockResolvedValue({ 
      docs: [],
      empty: true
    });
    
    await act(async () => {
      render(
        <MemoryRouter>
          <CollaboratePage />
        </MemoryRouter>
      );
    });
    
    // First wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/loading available projects/i)).not.toBeInTheDocument();
    });
    
    // Then check for the "no projects" message
    expect(screen.getByText(/no projects available for collaboration at this time/i)).toBeInTheDocument();
  });
  
  // Test that the component handles loading state properly
  test('displays loading state initially', async () => {
    // Make the firebase query take longer to resolve
    require('firebase/firestore').getDocs.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ docs: [] });
        }, 100);
      });
    });
    
    render(
      <MemoryRouter>
        <CollaboratePage />
      </MemoryRouter>
    );
    
    // Check loading message appears
    expect(screen.getByText(/loading available projects/i)).toBeInTheDocument();
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/loading available projects/i)).not.toBeInTheDocument();
    });
  });
});
