import { chatService } from '../pages/Researcher/chatService';
import { db, storage, auth } from '../config/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

jest.mock('../config/firebaseConfig', () => ({
  db: {},
  storage: {},
  auth: { currentUser: { uid: 'testUser' } },
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mockTimestamp'),
  onSnapshot: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

describe('chatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeChat', () => {
    it('should create a new chat if it does not exist', async () => {
      require('firebase/firestore').getDoc.mockResolvedValueOnce({ exists: () => false });
      require('firebase/firestore').setDoc.mockResolvedValueOnce();
      const result = await chatService.initializeChat('chat1');
      expect(require('firebase/firestore').setDoc).toHaveBeenCalled();
      expect(result).toHaveProperty('chatRef');
    });
    it('should return chat data if chat exists', async () => {
      require('firebase/firestore').getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ foo: 'bar' }) });
      const result = await chatService.initializeChat('chat2');
      expect(result.chatData).toEqual({ foo: 'bar' });
    });
  });

  describe('sendMessage', () => {
    it('should update chat with new message', async () => {
      require('firebase/firestore').getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ messages: [] }) });
      require('firebase/firestore').updateDoc.mockResolvedValueOnce();
      await chatService.sendMessage('chat1', { text: 'Hello' });
      expect(require('firebase/firestore').updateDoc).toHaveBeenCalled();
    });
  });

  describe('uploadAttachment', () => {
    it('should upload file and return metadata', async () => {
      const file = { name: 'file.txt', type: 'text/plain', size: 123 };
      require('firebase/storage').uploadBytes.mockResolvedValueOnce({ ref: 'mockRef' });
      require('firebase/storage').getDownloadURL.mockResolvedValueOnce('http://mock.url/file.txt');
      const result = await chatService.uploadAttachment('chat1', file);
      expect(result).toMatchObject({ url: 'http://mock.url/file.txt', name: 'file.txt', type: 'text/plain', size: 123 });
    });
  });

  describe('getUserData', () => {
    it('should return user name if user exists', async () => {
      require('firebase/firestore').getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ name: 'Alice' }) });
      const name = await chatService.getUserData('user1');
      expect(name).toBe('Alice');
    });
    it('should return "Unknown User" if user does not exist', async () => {
      require('firebase/firestore').getDoc.mockResolvedValueOnce({ exists: () => false });
      const name = await chatService.getUserData('user2');
      expect(name).toBe('Unknown User');
    });
  });

  describe('subscribeToChatUpdates', () => {
    it('should call callback with chat data', () => {
      const mockOnSnapshot = require('firebase/firestore').onSnapshot;
      const chatRef = {};
      const callback = jest.fn();
      const doc = { exists: () => true, data: () => ({ messages: [{ text: 'hi', timestamp: Date.now() }], participants: ['a', 'b'] }) };
      mockOnSnapshot.mockImplementation((ref, cb) => { cb(doc); return 'unsubscribe'; });
      const unsub = chatService.subscribeToChatUpdates(chatRef, callback);
      expect(callback).toHaveBeenCalled();
      expect(unsub).toBe('unsubscribe');
    });
  });

  describe('getOtherParticipant', () => {
    it('should return the other participant id', () => {
      const result = chatService.getOtherParticipant(['a', 'b'], 'a');
      expect(result).toBe('b');
    });
  });
});
