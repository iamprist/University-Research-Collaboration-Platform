import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, arrayUnion, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../config/firebaseConfig';

export default function ChatRoom({ chatId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const chatRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(chatRef, (doc) => {
      setMessages(doc.data()?.messages || []);
      // Auto-scroll to newest message
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
    return unsubscribe;
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      messages: arrayUnion({
        senderId: auth.currentUser.uid,
        text: newMessage,
        timestamp: serverTimestamp(),
      }),
      lastUpdated: serverTimestamp(),
    });
    setNewMessage('');
  };

  return (
    <section aria-labelledby="chat-heading" className="chat-container">
      <h2 id="chat-heading" className="visually-hidden">Chat Room</h2>
      
      <article className="message-list" aria-live="polite">
        <ul className="messages">
          {messages.map((msg, i) => (
            <li 
              key={i} 
              className={`message ${msg.senderId === auth.currentUser?.uid ? 'sent' : 'received'}`}
              aria-label={msg.senderId === auth.currentUser?.uid ? 'Message sent by you' : 'Message received'}
            >
              <p className="message-content">{msg.text}</p>
              <time className="message-time" dateTime={new Date(msg.timestamp?.toDate()).toISOString()}>
                {msg.timestamp?.toDate().toLocaleTimeString()}
              </time>
            </li>
          ))}
          <li ref={messagesEndRef} aria-hidden="true"></li>
        </ul>
      </article>

      <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="message-form">
        <label htmlFor="message-input" className="visually-hidden">Type your message</label>
        <input
          id="message-input"
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          aria-required="true"
        />
        <button type="submit" aria-label="Send message">
          Send
        </button>
      </form>
    </section>
  );
}

