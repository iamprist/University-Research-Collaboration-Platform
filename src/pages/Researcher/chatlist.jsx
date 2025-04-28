import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../config/firebaseConfig';

export default function ChatList() {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', auth.currentUser?.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  return (
    <div>
      <h3>Your Chats</h3>
      {chats.map(chat => (
        <div key={chat.id}>
          <p>Chat with {chat.participants.find(id => id !== auth.currentUser?.uid)}</p>
        </div>
      ))}
    </div>
  );
}