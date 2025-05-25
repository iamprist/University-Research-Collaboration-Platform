import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebaseConfig';

export const fundingService = {
  // Subscribe to funding data changes
  subscribeToFunding(chatId, callback) {
    const chatRef = doc(db, 'chats', chatId);
    return onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({
          funding: docSnap.data().funding || [],
          expenditures: docSnap.data().expenditures || [],
          totalNeeded: docSnap.data().totalNeeded || null
        });
      }
    });
  },

  // Add new funding source
  async addFunding(chatId, fundingData) {
    const chatRef = doc(db, 'chats', chatId);
    const docSnap = await getDoc(chatRef);
    const currentFunding = docSnap.exists() ? docSnap.data().funding || [] : [];
    
    await updateDoc(chatRef, {
      funding: [...currentFunding, {
        ...fundingData,
        addedBy: auth.currentUser?.uid
      }]
    });
  },

  // Add new expenditure
  async addExpenditure(chatId, expenditureData) {
    const chatRef = doc(db, 'chats', chatId);
    const docSnap = await getDoc(chatRef);
    const currentExpenditures = docSnap.exists() ? docSnap.data().expenditures || [] : [];
    
    await updateDoc(chatRef, {
      expenditures: [...currentExpenditures, {
        ...expenditureData,
        addedBy: auth.currentUser?.uid
      }]
    });
  },

  // Update total needed amount
  async updateTotalNeeded(chatId, amount) {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, { totalNeeded: parseFloat(amount) });
  }
};