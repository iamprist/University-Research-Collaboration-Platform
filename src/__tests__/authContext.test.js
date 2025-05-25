import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../pages/Reviewer/authContext';
import * as logEventModule from '../utils/logEvent';
import { onAuthStateChanged } from 'firebase/auth';

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('../utils/logEvent', () => ({
  logEvent: jest.fn(() => Promise.resolve()),
}));

const TestComponent = () => {
  const { currentUser } = useAuth();
  return <div>{currentUser ? currentUser.displayName : 'No user'}</div>;
};

describe('AuthProvider', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sets currentUser when user logs in and logs event', async () => {
    const mockUser = { uid: '123', displayName: 'Test User' };
    onAuthStateChanged.mockImplementationOnce((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    const { getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('Test User')).toBeInTheDocument();
    });
    expect(logEventModule.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '123',
        action: 'Login',
      })
    );
  });

  it('sets currentUser to null when user logs out and logs event', async () => {
    onAuthStateChanged.mockImplementationOnce((auth, callback) => {
      callback(null);
      return jest.fn();
    });

    const { getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('No user')).toBeInTheDocument();
    });
    expect(logEventModule.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'Logout',
      })
    );
  });
});
