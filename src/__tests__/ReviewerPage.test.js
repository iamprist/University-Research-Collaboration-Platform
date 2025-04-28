import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReviewerPage from '../pages/Reviewer/ReviewerPage';
import { logEvent } from '../utils/logEvent';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock authContext
jest.mock('../pages/Reviewer/authContext', () => ({
  useAuth: () => ({
    currentUser: {
      uid: 'test-user-id',
      displayName: 'Test User',
      getIdToken: jest.fn().mockResolvedValue('fake-token'),
    },
  }),
}));

// Mock firebaseConfig
jest.mock('../config/firebaseConfig', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-user-id',
      displayName: 'Test User',
    },
  },
}));

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => true, data: () => ({ status: 'approved', rejectionReason: '' }) })),
  deleteDoc: jest.fn(),
}));

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
  signOut: jest.fn(),
}));

// Mock logEvent
jest.mock('../utils/logEvent', () => ({
  logEvent: jest.fn(),
}));

// Mock ReviewerRecommendations
jest.mock('../components/ReviewerRecommendations', () => () => (
  <div>Mocked ReviewerRecommendations Component</div>
));

describe('ReviewerPage', () => {
  it('renders Reviewer Dashboard correctly', async () => {
    render(
      <MemoryRouter>
        <ReviewerPage />
      </MemoryRouter>
    );
    
    expect(await screen.findByText('Reviewer Dashboard')).toBeInTheDocument();
    expect(await screen.findByText('✅ You are an approved reviewer.')).toBeInTheDocument();
    expect(await screen.findByText('Mocked ReviewerRecommendations Component')).toBeInTheDocument();
  });
});
