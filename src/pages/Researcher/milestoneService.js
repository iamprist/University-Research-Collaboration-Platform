import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db} from '../../config/firebaseConfig';
import { v4 as uuidv4 } from 'uuid';

export const milestoneService = {
  // Subscribe to milestone data changes
  subscribeToMilestones(chatId, callback) {
    const chatRef = doc(db, 'chats', chatId);
    return onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({
          milestones: docSnap.data().milestones || [],
          researchComplete: docSnap.data().researchComplete || false,
          researchCompletedAt: docSnap.data().researchCompletedAt || null
        });
      }
    });
  },

  // Add new milestone
  async addMilestone(chatId, milestoneData) {
    const chatRef = doc(db, 'chats', chatId);
    const docSnap = await getDoc(chatRef);
    const currentMilestones = docSnap.exists() ? docSnap.data().milestones || [] : [];
    
    await updateDoc(chatRef, {
      milestones: [...currentMilestones, {
        id: uuidv4(),
        ...milestoneData,
        done: false,
        createdAt: new Date().toISOString()
      }]
    });
  },

  // Toggle milestone completion
  async toggleMilestone(chatId, milestoneId, currentMilestones) {
    const chatRef = doc(db, 'chats', chatId);
    const updated = currentMilestones.map(m => {
      if (m.id === milestoneId) {
        return m.done 
          ? { ...m, done: false, doneAt: null }
          : { ...m, done: true, doneAt: new Date().toISOString() };
      }
      return m;
    });
    await updateDoc(chatRef, { milestones: updated });
  },

  // Delete milestone
  async deleteMilestone(chatId, milestoneId, currentMilestones) {
    const chatRef = doc(db, 'chats', chatId);
    const updated = currentMilestones.filter(m => m.id !== milestoneId);
    await updateDoc(chatRef, { milestones: updated });
  },

  // Mark research as complete
  async markResearchComplete(chatId) {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      researchComplete: true,
      researchCompletedAt: new Date().toISOString()
    });
  },

  // Unmark research as complete
  async unmarkResearchComplete(chatId) {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      researchComplete: false,
      researchCompletedAt: null
    });
  }
};