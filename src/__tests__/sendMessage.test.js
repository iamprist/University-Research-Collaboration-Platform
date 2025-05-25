// __tests__/sendMessage.test.js
import { sendMessage, messageTypes } from '../utils/sendMessage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
}));

jest.mock('../config/firebaseConfig', () => ({
  db: {},
}));

describe('sendMessage utility', () => {
  const mockRecipientId = 'user123';
  const mockMessageData = { text: 'Hello' };

  beforeEach(() => {
    jest.clearAllMocks();
    collection.mockReturnValue('mock-collection');
  });

  it('should send a message and return true on success', async () => {
    addDoc.mockResolvedValueOnce({ id: 'msg1' });
    const result = await sendMessage(mockRecipientId, mockMessageData);
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'users', mockRecipientId, 'messages');
    expect(addDoc).toHaveBeenCalledWith('mock-collection', expect.objectContaining({
      ...mockMessageData,
      read: false,
      timestamp: 'mock-timestamp',
    }));
    expect(result).toBe(true);
  });

  it('should return false and log error on failure', async () => {
    const error = new Error('Firestore error');
    addDoc.mockRejectedValueOnce(error);
    console.error = jest.fn();
    const result = await sendMessage(mockRecipientId, mockMessageData);
    expect(console.error).toHaveBeenCalledWith('Error sending message:', error);
    expect(result).toBe(false);
  });

  it('should set read to false even if messageData contains read:true', async () => {
    addDoc.mockResolvedValueOnce({ id: 'msg2' });
    const result = await sendMessage(mockRecipientId, { text: 'Test', read: true });
    expect(addDoc).toHaveBeenCalledWith('mock-collection', expect.objectContaining({
      text: 'Test',
      read: false,
      timestamp: 'mock-timestamp',
    }));
    expect(result).toBe(true);
  });

  it('should handle empty messageData', async () => {
    addDoc.mockResolvedValueOnce({ id: 'msg3' });
    const result = await sendMessage(mockRecipientId, {});
    expect(addDoc).toHaveBeenCalledWith('mock-collection', expect.objectContaining({
      read: false,
      timestamp: 'mock-timestamp',
    }));
    expect(result).toBe(true);
  });

  it('should throw if recipientId is missing', async () => {
    await expect(sendMessage(undefined, { text: 'No recipient' })).rejects.toThrow();
  });

  it('should throw if messageData is missing', async () => {
    await expect(sendMessage(mockRecipientId)).rejects.toThrow();
  });
});

describe('messageTypes', () => {
  it('should contain expected message type constants', () => {
    expect(messageTypes).toEqual({
      COLLABORATION_REQUEST: 'collaboration-request',
      REVIEW_REQUEST: 'review-request',
      UPLOAD_CONFIRMATION: 'upload-confirmation',
      SYSTEM_NOTIFICATION: 'system-notification',
    });
  });
});
