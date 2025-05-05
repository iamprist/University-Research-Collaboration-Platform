import { render, screen, fireEvent } from '@testing-library/react';
import ChatRoom from './ChatRoom';
import { waitFor } from 'react-router-dom';

import {  getDoc,  updateDoc } from 'firebase/firestore';

jest.mock('firebase/firestore');
jest.mock('react-router-dom', () => ({
  useParams: () => ({ chatId: 'test-chat' })
}));
jest.mock('../../config/firebaseConfig', () => ({
  auth: { currentUser: { uid: 'user1', displayName: 'Test User' } },
  db: {}
}));

describe('ChatRoom', () => {
  beforeEach(() => {
    getDoc.mockImplementation(() => Promise.resolve({
      exists: () => true,
      data: () => ({
        messages: []
      })
    }));
  });

  it('renders chat room', async () => {
    render(<ChatRoom />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });
  });

  it('sends a message', async () => {
    render(<ChatRoom />);
    const input = screen.getByPlaceholderText('Type your message...');
    const button = screen.getByText('Send');
    
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
    });
  });
});