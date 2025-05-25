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

  describe('Error handling', () => {
    it('should throw and log error in initializeChat', async () => {
      const error = new Error('init error');
      require('firebase/firestore').getDoc.mockRejectedValueOnce(error);
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(chatService.initializeChat('fail')).rejects.toThrow('init error');
      expect(spy).toHaveBeenCalledWith('Error initializing chat:', error);
      spy.mockRestore();
    });
    it('should throw and log error in sendMessage', async () => {
      const error = new Error('send error');
      require('firebase/firestore').getDoc.mockRejectedValueOnce(error);
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(chatService.sendMessage('fail', { text: 'fail' })).rejects.toThrow('send error');
      expect(spy).toHaveBeenCalledWith('Error sending message:', error);
      spy.mockRestore();
    });
    it('should throw and log error in uploadAttachment', async () => {
      const error = new Error('upload error');
      require('firebase/storage').uploadBytes.mockRejectedValueOnce(error);
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(chatService.uploadAttachment('fail', { name: 'f' })).rejects.toThrow('upload error');
      expect(spy).toHaveBeenCalledWith('Error uploading file:', error);
      spy.mockRestore();
    });
    it('should log and return Unknown User on getUserData error', async () => {
      const error = new Error('user error');
      require('firebase/firestore').getDoc.mockRejectedValueOnce(error);
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const name = await chatService.getUserData('fail');
      expect(name).toBe('Unknown User');
      expect(spy).toHaveBeenCalledWith('Error getting user data:', error);
      spy.mockRestore();
    });
    it('should return Unknown User if userId is falsy', async () => {
      const name = await chatService.getUserData();
      expect(name).toBe('Unknown User');
    });
    it('should handle subscribeToChatUpdates when doc does not exist', () => {
      const mockOnSnapshot = require('firebase/firestore').onSnapshot;
      const chatRef = {};
      const callback = jest.fn();
      const doc = { exists: () => false, data: () => ({}) };
      mockOnSnapshot.mockImplementation((ref, cb) => { cb(doc); return 'unsub'; });
      const unsub = chatService.subscribeToChatUpdates(chatRef, callback);
      expect(callback).not.toHaveBeenCalled();
      expect(unsub).toBe('unsub');
    });
    it('should handle subscribeToChatUpdates with missing timestamp and participants', () => {
      const mockOnSnapshot = require('firebase/firestore').onSnapshot;
      const chatRef = {};
      const callback = jest.fn();
      const doc = { exists: () => true, data: () => ({ messages: [{}] }) };
      mockOnSnapshot.mockImplementation((ref, cb) => { cb(doc); return 'unsub'; });
      chatService.subscribeToChatUpdates(chatRef, callback);
      expect(callback).toHaveBeenCalledWith({
        messages: [{ timestamp: expect.any(Date) }],
        participants: []
      });
    });
  });
});
