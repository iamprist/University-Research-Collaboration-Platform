import { render, screen, waitFor } from '@testing-library/react';
import ListingDetailPage from './ListingDetailPage';
import { db } from '../../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

jest.mock('firebase/firestore');
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'test-id' })
}));

describe('ListingDetailPage', () => {
  beforeEach(() => {
    getDoc.mockImplementation(() => Promise.resolve({
      exists: () => true,
      data: () => ({
        title: 'Test Title',
        summary: 'Test Summary',
        userId: 'user123'
      }),
      id: 'test-id'
    }));
  });

  it('renders loading state initially', () => {
    render(<ListingDetailPage />);
    expect(screen.getByText('Loading listing details...')).toBeInTheDocument();
  });

  it('renders listing data after loading', async () => {
    render(<ListingDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();

    });
  });

  it('shows not found when listing does not exist', async () => {
    getDoc.mockImplementation(() => Promise.resolve({
      exists: () => false
    }));
    render(<ListingDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Listing not found')).toBeInTheDocument();
    });
  });
});