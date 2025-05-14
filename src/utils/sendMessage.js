import { db } from '../config/firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export const sendMessage = async (recipientId, messageData) => {
  try {
    await addDoc(collection(db, 'users', recipientId, 'messages'), {
      ...messageData,
      read: false,
      timestamp: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    return false;
  }
};

export const messageTypes = {
  COLLABORATION_REQUEST: 'collaboration-request',
  REVIEW_REQUEST: 'review-request',
  UPLOAD_CONFIRMATION: 'upload-confirmation',
  SYSTEM_NOTIFICATION: 'system-notification'
};