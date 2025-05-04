import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ChatRoom from '../pages/Researcher/ChatRoom';
import { db, auth } from '../config/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';

// Mock the necessary modules
jest.mock('firebase/firestore');
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));
jest.mock('../config/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'user-123',
      displayName: 'Test User',
    },
  },
  db: {},
}));

describe('ChatRoom Component', () => {
  const mockChatId = 'chat-123';
  const mockMessages = [
    {
      text: 'Hello there!',
      senderId: 'user-123',
      timestamp: new Date('2023-01-01T12:00:00Z'),
    },
    {
      text: 'Hi back!',
      senderId: 'user-456',
      timestamp: new Date('2023-01-01T12:01:00Z'),
    },
  ];

  beforeEach(() => {
    useParams.mockReturnValue({ chatId: mockChatId });
    getDoc.mockImplementation((docRef) => {
      if (docRef.path === `chats/${mockChatId}`) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            messages: mockMessages,
            participants: ['user-123', 'user-456'],
          }),
        });
      }
      return Promise.reject(new Error('Invalid document path'));
    });
    updateDoc.mockResolvedValue();
    setDoc.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    getDoc.mockImplementationOnce(() => new Promise(() => {})); // Never resolves
    render(<ChatRoom />);
    expect(screen.getByText('Loading chat...')).toBeInTheDocument();
  });

  test('renders error state when chatId is missing', () => {
    useParams.mockReturnValueOnce({ chatId: undefined });
    render(<ChatRoom />);
    expect(screen.getByText('No chat ID provided')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  test('renders error state when chat loading fails', async () => {
    getDoc.mockRejectedValueOnce(new Error('Failed to load'));
    render(<ChatRoom />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load chat')).toBeInTheDocument();
    });
  });

  test('creates new chat when it does not exist', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => false,
    });
    render(<ChatRoom />);
    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          participants: ['user-123'],
          messages: [],
          createdAt: expect.anything(),
          lastUpdated: expect.anything(),
        }
      );
    });
  });

  test('displays existing messages', async () => {
    render(<ChatRoom />);
    await waitFor(() => {
      expect(screen.getByText('Hello there!')).toBeInTheDocument();
      expect(screen.getByText('Hi back!')).toBeInTheDocument();
    });
  });

  test('sends new message successfully', async () => {
    render(<ChatRoom />);
    await waitFor(() => {
      expect(screen.getByText('Hello there!')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');

    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          messages: expect.arrayContaining([
            expect.objectContaining({
              text: 'New message',
              senderId: 'user-123',
            }),
          ]),
          lastUpdated: expect.anything(),
        }
      );
    });
  });

  test('does not send empty message', async () => {
    render(<ChatRoom />);
    await waitFor(() => {
      expect(screen.getByText('Hello there!')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  test('handles message send failure', async () => {
    updateDoc.mockRejectedValueOnce(new Error('Failed to send'));
    render(<ChatRoom />);
    await waitFor(() => {
      expect(screen.getByText('Hello there!')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');

    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to send message. Please try again.')).toBeInTheDocument();
    });
  });

  test('disables send button when loading', async () => {
    render(<ChatRoom />);
    await waitFor(() => {
      expect(screen.getByText('Hello there!')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'New message' } });

    const sendButton = screen.getByText('Send');
    expect(sendButton).not.toBeDisabled();

    // Mock loading state
    updateDoc.mockImplementationOnce(() => new Promise(() => {}));
    fireEvent.click(sendButton);

    expect(sendButton).toBeDisabled();
    expect(sendButton.textContent).toBe('Sending...');
  });

  test('shows correct message styling for sent vs received', async () => {
    render(<ChatRoom />);
    await waitFor(() => {
      const sentMessage = screen.getByText('Hello there!').closest('article');
      const receivedMessage = screen.getByText('Hi back!').closest('article');
      
      expect(sentMessage).toHaveClass('sent');
      expect(receivedMessage).toHaveClass('received');
    });
  });
});