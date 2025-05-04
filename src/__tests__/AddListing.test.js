import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddListing from '../pages/Researcher/AddListing';

// Simple mocks to avoid configuration issues
jest.mock('axios', () => ({
  get: jest.fn((url) => {
    if (url.includes('ipify')) {
      return Promise.resolve({ data: { ip: '123.45.67.89' } });
    }
    return Promise.resolve({
      data: [
        { name: 'Test University', country: 'South Africa' }
      ]
    });
  })
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock('../config/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'test-uid',
      displayName: 'Test User',
    },
  },
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'test-id' })),
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ 
    exists: () => false,
    data: () => ({})
  })),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock('../utils/logEvent', () => ({
  logEvent: jest.fn(() => Promise.resolve()),
}));

describe('AddListing Component', () => {
  test('renders basic form elements', () => {
    render(<AddListing />);
    
    expect(screen.getByText('Add New Research Listing')).toBeInTheDocument();
    expect(screen.getByLabelText('Research Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Abstract/Summary')).toBeInTheDocument();
  });

  test('allows text input in fields', () => {
    render(<AddListing />);
    
    const titleInput = screen.getByLabelText('Research Title');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    expect(titleInput.value).toBe('Test Title');

    const summaryInput = screen.getByLabelText('Abstract/Summary');
    fireEvent.change(summaryInput, { target: { value: 'Test summary' } });
    expect(summaryInput.value).toBe('Test summary');
  });

  test('submits form with required fields', async () => {
    render(<AddListing />);
    
    fireEvent.change(screen.getByLabelText('Research Title'), {
      target: { value: 'Test Research' }
    });
    fireEvent.change(screen.getByLabelText('Abstract/Summary'), {
      target: { value: 'Test summary' }
    });

    fireEvent.click(screen.getByText('Create Listing'));

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });
});