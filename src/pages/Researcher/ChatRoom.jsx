import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../config/firebaseConfig';
import { useParams } from 'react-router-dom';
import './ResearcherDashboard.css';

export default function ChatRoom() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [status, setStatus] = useState({ loading: true, error: null });
  const [userData, setUserData] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chatId) {
      setStatus({ loading: false, error: 'No chat ID provided' });
      return;
    }

    const loadMessages = async () => {
      try {
        const chatRef = doc(db, 'chats', chatId);
        const docSnap = await getDoc(chatRef);

        if (!docSnap.exists()) {
          await setDoc(chatRef, {
            participants: [auth.currentUser?.uid],
            messages: [],
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
          });
          setMessages([]);
        } else {
          const messagesData = docSnap.data().messages || [];
          setMessages(messagesData.map(msg => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
          })));
          
          // Fetch user data for all unique senders
          const uniqueSenderIds = [...new Set(messagesData.map(msg => msg.senderId))];
          await fetchUserData(uniqueSenderIds);
        }

        setStatus({ loading: false, error: null });
      } catch (err) {
        console.error('Failed to load chat:', err);
        setStatus({ loading: false, error: 'Failed to load chat' });
      }
    };

    const fetchUserData = async (userIds) => {
      try {
        const usersData = {};
        for (const uid of userIds) {
          if (uid) {
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

    loadMessages();
  }, [chatId]);

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

      // Optimistic update
      setMessages(prev => [...prev, { ...newMsg, timestamp: new Date(timestamp) }]);

      await updateDoc(chatRef, {
        messages: [...currentMessages, newMsg],
        lastUpdated: serverTimestamp()
      });

      // Add current user to userData if not already present
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

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Message send failed:', err);
      setStatus({ loading: false, error: 'Failed to send message. Please try again.' });
      // Rollback optimistic update
      setMessages(prev => prev.slice(0, -1));
    }
  };

  if (status.loading && messages.length === 0) {
    return <section className="status-message">Loading chat...</section>;
  }

  if (status.error) {
    return (
      <section className="status-message error">
        {status.error}
        <button onClick={() => window.location.reload()}>Retry</button>
      </section>
    );
  }

  return (
    <main className="chat-room-container">
      <section className="messages-container" aria-live="polite">
        {messages.map((msg, i) => (
          <article
            key={i}
            className={`message ${msg.senderId === auth.currentUser?.uid ? 'sent' : 'received'}`}
          >
            <div className="message-header">
              <span className="sender-name">
                {msg.senderId === auth.currentUser?.uid 
                  ? 'You' 
                  : userData[msg.senderId] || 'Loading...'}
              </span>
            </div>
            <p className="message-text">{msg.text}</p>
            <time className="message-time" dateTime={msg.timestamp.toISOString()}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </time>
          </article>
        ))}
        <span ref={messagesEndRef} />
      </section>

      <footer>
        <form onSubmit={sendMessage} className="message-input-form" aria-label="Send a message">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={status.loading}
            aria-label="Message input"
          />
          <button 
            type="submit" 
            disabled={status.loading || !newMessage.trim()}
            className={status.loading ? 'loading' : ''}
          >
            {status.loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </footer>
    </main>
  );
}