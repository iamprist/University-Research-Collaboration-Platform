import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
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

// Mock useNavigate globally for all tests
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('CollaboratePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

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

  test('navigates back when back button is clicked', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <CollaboratePage />
        </MemoryRouter>
      );
    });
    // Find the back button (IconButton with ArrowBackIosIcon)
    const backButton = screen.getAllByRole('button')[0];
    backButton.click();
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test('navigates to dashboard when Back to Dashboard button is clicked', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <CollaboratePage />
        </MemoryRouter>
      );
    });
    const dashboardButton = screen.getByRole('button', { name: /back to dashboard/i });
    dashboardButton.click();
    expect(mockNavigate).toHaveBeenCalledWith('/researcher-dashboard');
  });

  test('toggles show friends only checkbox', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <CollaboratePage />
        </MemoryRouter>
      );
    });
    const checkbox = screen.getByRole('checkbox', { name: /show friends only/i });
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  test('renders a project card with details and handles request button', async () => {
    // Mock a listing
    require('firebase/firestore').getDocs.mockResolvedValueOnce({
      docs: [],
    }) // friends
    .mockResolvedValueOnce({
      docs: [],
    }) // collaborations
    .mockResolvedValueOnce({
      docs: [
        { id: 'listing1', data: () => ({
          title: 'Test Project',
          summary: 'A summary',
          userId: 'researcher1',
        }) }
      ]
    }); // research-listings
    require('firebase/firestore').getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ name: 'Researcher Name' }) });
    require('firebase/firestore').getDocs.mockResolvedValueOnce({ empty: true }); // pending requests
    require('firebase/firestore').getDocs.mockResolvedValueOnce({ empty: true }); // collaborations
    require('firebase/firestore').getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ title: 'Test Project' }) });
    require('firebase/firestore').addDoc.mockResolvedValueOnce({});
    const sendMessage = jest.fn();
    jest.doMock('../utils/sendMessage', () => ({ sendMessage, messageTypes: { COLLABORATION_REQUEST: 'collaboration-request' } }));
    await act(async () => {
      render(
        <MemoryRouter>
          <CollaboratePage />
        </MemoryRouter>
      );
    });
    expect(screen.getByText(/test project/i)).toBeInTheDocument();
    const requestButton = screen.getByRole('button', { name: /request collaboration/i });
    fireEvent.click(requestButton);
    // Should show 'Sending...' or 'Request Pending' after click
    expect(requestButton).toBeDisabled();
  });
});
