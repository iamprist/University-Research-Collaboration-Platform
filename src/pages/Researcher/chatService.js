
import { 
    doc, 
    getDoc, 
    updateDoc, 
    setDoc, 
    serverTimestamp, 
    onSnapshot 
  } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { db, storage, auth } from '../../config/firebaseConfig';
  
  export const chatService = {
    // Initialize or get chat document
    async initializeChat(chatId) {
      try {
        const chatRef = doc(db, 'chats', chatId);
        const docSnap = await getDoc(chatRef);
  
        if (!docSnap.exists()) {
          await setDoc(chatRef, {
            participants: [auth.currentUser?.uid],
            messages: [],
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            name: 'New Chat'
          });
        }
  
        return {
          chatRef,
          chatData: docSnap.exists() ? docSnap.data() : null
        };
      } catch (error) {
        console.error('Error initializing chat:', error);
        throw error;
      }
    },
  
    // Send a new message
    async sendMessage(chatId, messageData) {
      try {
        const chatRef = doc(db, 'chats', chatId);
        const docSnap = await getDoc(chatRef);
        const currentMessages = docSnap.exists() ? docSnap.data().messages || [] : [];
  
        await updateDoc(chatRef, {
          messages: [...currentMessages, messageData],
          lastUpdated: serverTimestamp()
        });
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
  
    // Upload file attachment
    async uploadAttachment(chatId, file) {
      try {
        const filePath = `chat_attachments/${chatId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
  
        return {
          url: downloadUrl,
          name: file.name,
          type: file.type,
          size: file.size
        };
      } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
    },
  
    // Get user data
    async getUserData(userId) {
      try {
        if (!userId) return 'Unknown User';
        
        const userDoc = await getDoc(doc(db, 'users', userId));
        return userDoc.exists() ? userDoc.data().name || 'Unknown User' : 'Unknown User';
      } catch (error) {
        console.error('Error getting user data:', error);
        return 'Unknown User';
      }
    },
  
    // Subscribe to chat updates
    subscribeToChatUpdates(chatRef, callback) {
      return onSnapshot(chatRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          callback({
            messages: data.messages.map(msg => ({
              ...msg,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
            })),
            participants: data.participants || []
          });
        }
      });
    },
  
    // Get other participant ID in 1:1 chat
    getOtherParticipant(participants, currentUserId) {
      return participants?.find(id => id !== currentUserId);
    }
  };