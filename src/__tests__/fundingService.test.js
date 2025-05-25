import { fundingService } from '../pages/Researcher/fundingService';
import { db, auth } from '../config/firebaseConfig';
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';

jest.mock('../config/firebaseConfig', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user' } }
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
  onSnapshot: jest.fn(),
  getDoc: jest.fn()
}));

describe('fundingService', () => {
  const chatId = 'chat123';
  const chatRef = { id: chatId };

  beforeEach(() => {
    jest.clearAllMocks();
    require('firebase/firestore').doc.mockReturnValue(chatRef);
  });

  describe('subscribeToFunding', () => {
    it('should call onSnapshot and invoke callback with funding data', () => {
      const mockCallback = jest.fn();
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ funding: [1], expenditures: [2], totalNeeded: 100 })
      };
      let handler;
      require('firebase/firestore').onSnapshot.mockImplementation((ref, cb) => {
        handler = cb;
        return 'unsubscribe';
      });
      const unsub = fundingService.subscribeToFunding(chatId, mockCallback);
      handler(mockDocSnap);
      expect(require('firebase/firestore').doc).toHaveBeenCalledWith({}, 'chats', chatId);
      expect(mockCallback).toHaveBeenCalledWith({
        funding: [1],
        expenditures: [2],
        totalNeeded: 100
      });
      expect(unsub).toBe('unsubscribe');
    });
  });

  describe('addFunding', () => {
    it('should add new funding to chat', async () => {
      const fundingData = { amount: 50 };
      require('firebase/firestore').getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ funding: [{ amount: 10 }] })
      });
      await fundingService.addFunding(chatId, fundingData);
      expect(require('firebase/firestore').updateDoc).toHaveBeenCalledWith(chatRef, {
        funding: [
          { amount: 10 },
          { amount: 50, addedBy: 'test-user' }
        ]
      });
    });
    it('should add funding to empty list if no funding exists', async () => {
      require('firebase/firestore').getDoc.mockResolvedValue({
        exists: () => false
      });
      await fundingService.addFunding(chatId, { amount: 20 });
      expect(require('firebase/firestore').updateDoc).toHaveBeenCalledWith(chatRef, {
        funding: [
          { amount: 20, addedBy: 'test-user' }
        ]
      });
    });
  });

  describe('addExpenditure', () => {
    it('should add new expenditure to chat', async () => {
      const expenditureData = { amount: 30 };
      require('firebase/firestore').getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ expenditures: [{ amount: 5 }] })
      });
      await fundingService.addExpenditure(chatId, expenditureData);
      expect(require('firebase/firestore').updateDoc).toHaveBeenCalledWith(chatRef, {
        expenditures: [
          { amount: 5 },
          { amount: 30, addedBy: 'test-user' }
        ]
      });
    });
    it('should add expenditure to empty list if no expenditures exist', async () => {
      require('firebase/firestore').getDoc.mockResolvedValue({
        exists: () => false
      });
      await fundingService.addExpenditure(chatId, { amount: 15 });
      expect(require('firebase/firestore').updateDoc).toHaveBeenCalledWith(chatRef, {
        expenditures: [
          { amount: 15, addedBy: 'test-user' }
        ]
      });
    });
  });

  describe('updateTotalNeeded', () => {
    it('should update totalNeeded with parsed float', async () => {
      await fundingService.updateTotalNeeded(chatId, '123.45');
      expect(require('firebase/firestore').updateDoc).toHaveBeenCalledWith(chatRef, { totalNeeded: 123.45 });
    });
  });
});
