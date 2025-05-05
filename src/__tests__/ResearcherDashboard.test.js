import { render, screen, fireEvent } from '@testing-library/react';
import ResearcherDashboard from './ResearcherDashboard';
import { db, auth } from '../../config/firebaseConfig';
import { waitFor} from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc, onSnapshot } from 'firebase/firestore';

jest.mock('firebase/firestore');
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));
jest.mock('../../config/firebaseConfig', () => ({
  auth: { currentUser: { uid: 'user1', displayName: 'Test User' } },
  db: {}
}));

describe('ResearcherDashboard', () => {
  beforeEach(() => {
    getDoc.mockImplementation(() => Promise.resolve({
      exists: () => true,
      data: () => ({ name: 'Test User' })
    }));
    getDocs.mockImplementation(() => Promise.resolve({
      empty: false,
      docs: [{
        id: 'listing1',
        data: () => ({
          title: 'Test Listing',
          summary: 'Test Summary',
          userId: 'user1'
        })
      }]
    }));
  });

  it('renders dashboard', async () => {
    render(<ResearcherDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
    });
  });

  it('shows menu when clicked', async () => {
    render(<ResearcherDashboard />);
    const menuButton = screen.getByText('☰ Menu');
    fireEvent.click(menuButton);
    await waitFor(() => {
      expect(screen.getByText('View Profile')).toBeInTheDocument();
    });
  });
});