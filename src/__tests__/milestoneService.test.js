import { milestoneService } from '../pages/Researcher/milestoneService';
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { v4 as uuidv4 } from 'uuid';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
  onSnapshot: jest.fn(),
  getDoc: jest.fn()
}));
jest.mock('../config/firebaseConfig', () => ({ db: {} }));
jest.mock('uuid', () => ({ v4: jest.fn() }));

describe('milestoneService', () => {
  const chatId = 'testChatId';
  const chatRef = { id: chatId };

  beforeEach(() => {
    jest.clearAllMocks();
    doc.mockReturnValue(chatRef);
  });

  describe('subscribeToMilestones', () => {
    it('should subscribe and call callback with milestones data', () => {
      const callback = jest.fn();
      const docSnap = {
        exists: () => true,
        data: () => ({ milestones: [{ id: 1 }], researchComplete: true, researchCompletedAt: 'date' })
      };
      onSnapshot.mockImplementation((ref, cb) => {
        cb(docSnap);
        return 'unsubscribe';
      });
      const unsub = milestoneService.subscribeToMilestones(chatId, callback);
      expect(onSnapshot).toHaveBeenCalledWith(chatRef, expect.any(Function));
      expect(callback).toHaveBeenCalledWith({
        milestones: [{ id: 1 }],
        researchComplete: true,
        researchCompletedAt: 'date'
      });
      expect(unsub).toBe('unsubscribe');
    });
  });

  describe('addMilestone', () => {
    it('should add a new milestone', async () => {
      const milestoneData = { title: 'Test' };
      const uuid = 'uuid-123';
      uuidv4.mockReturnValue(uuid);
      getDoc.mockResolvedValue({ exists: () => true, data: () => ({ milestones: [] }) });
      await milestoneService.addMilestone(chatId, milestoneData);
      expect(updateDoc).toHaveBeenCalledWith(chatRef, {
        milestones: [
          expect.objectContaining({
            id: uuid,
            ...milestoneData,
            done: false,
            createdAt: expect.any(String)
          })
        ]
      });
    });
  });

  describe('toggleMilestone', () => {
    it('should toggle milestone done to true', async () => {
      const milestones = [{ id: '1', done: false }];
      await milestoneService.toggleMilestone(chatId, '1', milestones);
      expect(updateDoc).toHaveBeenCalledWith(chatRef, {
        milestones: [expect.objectContaining({ id: '1', done: true, doneAt: expect.any(String) })]
      });
    });
    it('should toggle milestone done to false', async () => {
      const milestones = [{ id: '1', done: true, doneAt: 'date' }];
      await milestoneService.toggleMilestone(chatId, '1', milestones);
      expect(updateDoc).toHaveBeenCalledWith(chatRef, {
        milestones: [expect.objectContaining({ id: '1', done: false, doneAt: null })]
      });
    });
  });

  describe('deleteMilestone', () => {
    it('should delete a milestone', async () => {
      const milestones = [{ id: '1' }, { id: '2' }];
      await milestoneService.deleteMilestone(chatId, '1', milestones);
      expect(updateDoc).toHaveBeenCalledWith(chatRef, {
        milestones: [{ id: '2' }]
      });
    });
  });

  describe('markResearchComplete', () => {
    it('should mark research as complete', async () => {
      const now = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => now);
      await milestoneService.markResearchComplete(chatId);
      expect(updateDoc).toHaveBeenCalledWith(chatRef, {
        researchComplete: true,
        researchCompletedAt: now.toISOString()
      });
      global.Date.mockRestore();
    });
  });

  describe('unmarkResearchComplete', () => {
    it('should unmark research as complete', async () => {
      await milestoneService.unmarkResearchComplete(chatId);
      expect(updateDoc).toHaveBeenCalledWith(chatRef, {
        researchComplete: false,
        researchCompletedAt: null
      });
    });
  });
});
