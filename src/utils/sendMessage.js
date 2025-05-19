// sendMessage.js - Utility for sending notifications/messages to users in Firestore
import { db } from '../config/firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Sends a message to a user's messages subcollection
export const sendMessage = async (recipientId, messageData) => {
  try {
    await addDoc(collection(db, 'users', recipientId, 'messages'), {
      ...messageData,
      read: false, // Mark as unread by default
      timestamp: serverTimestamp() // Add server timestamp
    });
    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    return false;
  }
};

// Message type constants for different notification scenarios
export const messageTypes = {
  COLLABORATION_REQUEST: 'collaboration-request',
  REVIEW_REQUEST: 'review-request',
  UPLOAD_CONFIRMATION: 'upload-confirmation',
  SYSTEM_NOTIFICATION: 'system-notification'
};