import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../config/firebaseConfig';
import { useParams } from 'react-router-dom';
import './ChatRoom.css';

export default function ChatRoom() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [status, setStatus] = useState({ loading: true, error: null });
  const [userData, setUserData] = useState({});
  const [chatName, setChatName] = useState('Chat Room');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chatId) {
      setStatus({ loading: false, error: 'No chat ID provided' });
      return;
    }

    const chatRef = doc(db, 'chats', chatId);
    let unsubscribe = null;

    const setupChat = async () => {
      try {
        const docSnap = await getDoc(chatRef);
        
        if (!docSnap.exists()) {
          await setDoc(chatRef, {
            participants: [auth.currentUser?.uid],
            messages: [],
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            name: 'New Chat'
          });
        } else {
          // Set chat name from document if it exists
          if (docSnap.data().name) {
            setChatName(docSnap.data().name);
          }
        }

        unsubscribe = onSnapshot(chatRef, async (doc) => {
          if (doc.exists()) {
            const messagesData = doc.data().messages || [];
            setMessages(messagesData.map(msg => ({
              ...msg,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
            })));

            const uniqueSenderIds = [...new Set(messagesData.map(msg => msg.senderId))];
            const newSenderIds = uniqueSenderIds.filter(id => !userData[id]);
            if (newSenderIds.length > 0) {
              await fetchUserData(newSenderIds);
            }

            // Update chat name if it's a 1:1 chat
            if (doc.data().participants?.length === 2) {
              const otherUserId = doc.data().participants.find(id => id !== auth.currentUser?.uid);
              if (otherUserId && userData[otherUserId]) {
                setChatName(userData[otherUserId]);
              }
            }

            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        });

        setStatus({ loading: false, error: null });
      } catch (err) {
        console.error('Failed to setup chat:', err);
        setStatus({ loading: false, error: 'Failed to load chat' });
      }
    };

    const fetchUserData = async (userIds) => {
      try {
        const usersData = {};
        for (const uid of userIds) {
          if (uid && uid !== auth.currentUser?.uid) {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              usersData[uid] = userDoc.data().name || 'Unknown User';
            } else {
              usersData[uid] = 'Unknown User';
            }
          }
        }
        setUserData(prev => ({ ...prev, ...usersData }));
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    setupChat();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatId, userData]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    try {
      setStatus({ loading: true, error: null });
      const chatRef = doc(db, 'chats', chatId);
      const docSnap = await getDoc(chatRef);

      const currentMessages = Array.isArray(docSnap.data()?.messages)
        ? docSnap.data().messages
        : [];

      const timestamp = new Date().toISOString();
      const newMsg = {
        text: newMessage,
        senderId: auth.currentUser.uid,
        timestamp: timestamp
      };

      setMessages(prev => [...prev, { ...newMsg, timestamp: new Date(timestamp) }]);

      await updateDoc(chatRef, {
        messages: [...currentMessages, newMsg],
        lastUpdated: serverTimestamp()
      });

      if (!userData[auth.currentUser.uid]) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userName = userDoc.exists() ? userDoc.data().name : 'You';
        setUserData(prev => ({
          ...prev,
          [auth.currentUser.uid]: userName
        }));
      }
      
      setNewMessage('');
      setStatus({ loading: false, error: null });
    } catch (err) {
      console.error('Message send failed:', err);
      setStatus({ loading: false, error: 'Failed to send message. Please try again.' });
      setMessages(prev => prev.slice(0, -1));
    }
  };

  if (status.loading && messages.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading chat...</p>
      </div>
    );
  }

  if (status.error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <p>{status.error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-app">
      <div className="chat-header">
        <h2>{chatName}</h2>
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>Online</span>
        </div>
      </div>
      
      <div className="messages-container">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message-bubble ${msg.senderId === auth.currentUser?.uid ? 'sent' : 'received'}`}
          >
            <div className="message-meta">
              <span className="sender-name">
                {msg.senderId === auth.currentUser?.uid 
                  ? 'You' 
                  : userData[msg.senderId] || 'Unknown'}
              </span>
              <span className="message-time">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="message-content">
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="scroll-anchor"></div>
      </div>

      <form onSubmit={sendMessage} className="message-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={status.loading}
        />
        <button 
          type="submit" 
          disabled={status.loading || !newMessage.trim()}
          className={status.loading ? 'loading' : ''}
        >
          {status.loading ? (
            <span className="send-spinner"></span>
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}