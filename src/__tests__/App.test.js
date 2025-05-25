import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import App from '../App';

// Mocks
jest.mock('../config/firebaseConfig', () => ({
  auth: {
    onAuthStateChanged: jest.fn((cb) => {
      // Always return an unsubscribe function
      return () => {};
    }),
  },
  db: {},
}));
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: { ip: '127.0.0.1' } })),
}));
jest.mock('../utils/logEvent', () => ({
  logEvent: jest.fn(() => Promise.resolve()),
}));
jest.mock('../components/NotificationHandler', () => () => <div>NotificationHandler</div>);
jest.mock('react-toastify', () => ({ ToastContainer: () => <div>ToastContainer</div> }));

// Mock all pages/components used in routes
jest.mock('../pages/SignInPage', () => () => <div>SignInPage</div>);
jest.mock('../pages/LandingPage', () => () => <div>LandingPage</div>);
jest.mock('../pages/PrivacyPolicy', () => () => <div>PrivacyPolicy</div>);
jest.mock('../components/About', () => () => <div>About</div>);
jest.mock('../pages/LearnMore', () => () => <div>LearnMore</div>);
jest.mock('../pages/Admin/AdminPage', () => () => <div>AdminPage</div>);
jest.mock('../pages/Admin/ViewLogs', () => () => <div>ViewLogs</div>);
jest.mock('../pages/Reviewer/ReviewerPage', () => () => <div>ReviewerPage</div>);
jest.mock('../pages/Reviewer/ReviewerForm', () => () => <div>ReviewerForm</div>);
jest.mock('../components/ReviewForm', () => () => <div>ReviewForm</div>);
jest.mock('../pages/TermsAndConditions', () => () => <div>TermsAndConditions</div>);
jest.mock('../pages/Reviewer/ReviewerProfile', () => () => <div>ReviewerProfile</div>);
jest.mock('../pages/Reviewer/EditReviewerProfile', () => () => <div>EditReviewerProfile</div>);
jest.mock('../pages/Researcher/ListingDetailPage', () => () => <div>ListingDetailPage</div>);
jest.mock('../pages/Researcher/ResearcherDashboard', () => () => <div>ResearcherDashboard</div>);
jest.mock('../pages/Researcher/ResearcherProfile', () => () => <div>ResearcherProfile</div>);
jest.mock('../pages/Researcher/EditProfile', () => () => <div>EditProfile</div>);
jest.mock('../pages/Researcher/AddListing', () => () => <div>AddListing</div>);
jest.mock('../pages/Researcher/CollaboratePage', () => () => <div>CollaboratePage</div>);
jest.mock('../pages/Researcher/ChatRoom', () => () => <div>ChatRoom</div>);
jest.mock('../components/FriendsSystem', () => () => <div>FriendsSystem</div>);
jest.mock('../pages/Researcher/CollaborationDashboard', () => () => <div>CollaborationDashboard</div>);

// Firestore mocks for login test and any Firestore usage
jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(() => Promise.resolve({ exists: () => true, data: () => ({}) })),
  doc: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
}));

// Helper to set authToken in localStorage
const setAuthToken = (val) => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(() => val),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
};

describe('App routing and coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Always return an unsubscribe function from onAuthStateChanged
    const { auth } = require('../config/firebaseConfig');
    auth.onAuthStateChanged.mockImplementation((cb) => {
      // Optionally call cb(null) to simulate no user
      return () => {};
    });
  });

  it('renders public routes', () => {
    setAuthToken(null);
    render(
      <MemoryRouter initialEntries={['/']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('LandingPage')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/signin']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('SignInPage')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/learn-more']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('LearnMore')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/privacy-policy']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('PrivacyPolicy')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/about']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('About')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/terms']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('TermsAndConditions')).toBeInTheDocument();
  });

  it('redirects unknown routes to home', () => {
    setAuthToken(null);
    render(
      <MemoryRouter initialEntries={['/unknown']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('LandingPage')).toBeInTheDocument();
  });

  it('renders protected admin routes if authenticated', () => {
    setAuthToken('token');
    render(
      <MemoryRouter initialEntries={['/admin']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('AdminPage')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/logs']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('ViewLogs')).toBeInTheDocument();
  });

  it('blocks protected admin routes if not authenticated', () => {
    setAuthToken(null);
    render(
      <MemoryRouter initialEntries={['/admin']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('SignInPage')).toBeInTheDocument();
  });

  it('renders reviewer routes', () => {
    setAuthToken('token');
    render(
      <MemoryRouter initialEntries={['/reviewer']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('ReviewerPage')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/reviewer/edit-profile']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('EditReviewerProfile')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/reviewer-profile']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('ReviewerProfile')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/reviewer-form']}> <App /> </MemoryRouter>
    );
    expect(screen.getAllByText('ReviewerForm').length).toBeGreaterThan(0);
    render(
      <MemoryRouter initialEntries={['/apply']}> <App /> </MemoryRouter>
    );
    expect(screen.getAllByText('ReviewerForm').length).toBeGreaterThan(0);
    render(
      <MemoryRouter initialEntries={['/review/123']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('ReviewForm')).toBeInTheDocument();
  });

  it('renders researcher routes', () => {
    setAuthToken('token');
    render(
      <MemoryRouter initialEntries={['/researcher-dashboard']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('ResearcherDashboard')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/researcher-profile']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('ResearcherProfile')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/researcher-edit-profile']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('EditProfile')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/researcher/add-listing']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('AddListing')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/listing/1']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('ListingDetailPage')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/researcher/collaborate']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('CollaboratePage')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/chat/abc']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('ChatRoom')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/friends']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('FriendsSystem')).toBeInTheDocument();
    render(
      <MemoryRouter initialEntries={['/collaboration/xyz']}> <App /> </MemoryRouter>
    );
    expect(screen.getByText('CollaborationDashboard')).toBeInTheDocument();
  });

  it('calls logEvent on login', async () => {
    const { auth } = require('../config/firebaseConfig');
    const { logEvent } = require('../utils/logEvent');
    setAuthToken('token');
    let callback;
    auth.onAuthStateChanged.mockImplementation(cb => {
      callback = cb;
      return () => {};
    });
    render(<MemoryRouter><App /></MemoryRouter>);
    // Simulate user login
    await waitFor(() => callback({ uid: '123' }));
    expect(logEvent).toHaveBeenCalled();
  });

  it('renders NotificationHandler and ToastContainer', () => {
    setAuthToken(null);
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getAllByText('NotificationHandler').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ToastContainer').length).toBeGreaterThan(0);
  });
});
