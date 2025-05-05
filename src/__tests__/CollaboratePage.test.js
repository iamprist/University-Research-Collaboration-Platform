import { render, screen, fireEvent } from '@testing-library/react';
import CollaboratePage from './CollaboratePage';
import { waitFor } from 'react-router-dom';

import {  getDocs } from 'firebase/firestore';

jest.mock('firebase/firestore');
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));
jest.mock('../../config/firebaseConfig', () => ({
  auth: { currentUser: { uid: 'user1' } },
  db: {}
}));

describe('CollaboratePage', () => {
  beforeEach(() => {
    getDocs.mockImplementation(() => Promise.resolve({
      empty: false,
      docs: [{
        id: 'listing1',
        data: () => ({
          title: 'Test Listing',
          summary: 'Test Summary',
          userId: 'user2'
        })
      }]
    }));
  });

  it('renders collaborate page', async () => {
    render(<CollaboratePage />);
    await waitFor(() => {
      expect(screen.getByText('Collaborate with Other Researchers')).toBeInTheDocument();
    });
  });

  it('shows available projects', async () => {
    render(<CollaboratePage />);
    await waitFor(() => {
      expect(screen.getByText('Test Listing')).toBeInTheDocument();
    });
  });
});