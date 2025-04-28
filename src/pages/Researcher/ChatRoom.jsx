import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../config/firebaseConfig';

export default function ChatRoom({ chatId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const chatRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(chatRef, (doc) => {
      setMessages(doc.data()?.messages || []);
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
    <div>
      <div>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.senderId === auth.currentUser?.uid ? 'right' : 'left' }}>
            <p>{msg.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}