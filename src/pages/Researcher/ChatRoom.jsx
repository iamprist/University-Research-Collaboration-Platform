import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../config/firebaseConfig';
import { useParams } from 'react-router-dom';
import './ChatRoom.css';

export default function ChatRoom() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [status, setStatus] = useState({ loading: true, error: null });
  const [userData, setUserData] = useState({});
  const [chatName, setChatName] = useState('Chat Room');
  const [attachment, setAttachment] = useState(null);
  const [attachmentType, setAttachmentType] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const filteredMessages = messages.filter(msg => {
    if (activeTab === 'all') return true;
    if (activeTab === 'images') return msg.fileType?.startsWith('image/');
    if (activeTab === 'docs') return msg.fileType && !msg.fileType.startsWith('image/');
    return true;
  });



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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAttachment(file);
    
    if (file.type.startsWith('image/')) {
      setAttachmentType('image');
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachmentType('document');
      setPreviewUrl(null);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setPreviewUrl(null);
    setAttachmentType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async () => {
    if (!attachment) return null;

    try {
      const storageRef = ref(storage, `chat_attachments/${chatId}/${Date.now()}_${attachment.name}`);
      const snapshot = await uploadBytes(storageRef, attachment);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadUrl,
        name: attachment.name,
        type: attachment.type,
        size: attachment.size
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !auth.currentUser) return;

    try {
      setStatus({ loading: true, error: null });
      const chatRef = doc(db, 'chats', chatId);
      const docSnap = await getDoc(chatRef);

      const currentMessages = Array.isArray(docSnap.data()?.messages)
        ? docSnap.data().messages
        : [];

      const timestamp = new Date().toISOString();
      let fileData = null;

      if (attachment) {
        fileData = await uploadFile();
      }

      const newMsg = {
        text: newMessage,
        senderId: auth.currentUser.uid,
        timestamp: timestamp,
        ...(fileData && {
          fileUrl: fileData.url,
          fileName: fileData.name,
          fileType: fileData.type,
          fileSize: fileData.size
        })
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
      removeAttachment();
      setStatus({ loading: false, error: null });
    } catch (err) {
      console.error('Message send failed:', err);
      setStatus({ loading: false, error: 'Failed to send message. Please try again.' });
      setMessages(prev => prev.slice(0, -1));
    }
  };

  const openMediaViewer = (media) => {
    setSelectedMedia(media);
    setShowMediaViewer(true);
  };

  const closeMediaViewer = () => {
    setShowMediaViewer(false);
    setSelectedMedia(null);
  };

  const renderAttachmentPreview = () => {
    if (!attachment) return null;

    if (attachmentType === 'image') {
      return (
        <div className="attachment-preview">
          <div className="preview-container">
            <img src={previewUrl} alt="Preview" className="image-preview" />
            <button onClick={removeAttachment} className="remove-attachment">
              ×
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="attachment-preview">
          <div className="document-preview">
            <div className="document-icon">
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path>
                <path fill="currentColor" d="M14 3v5h5"></path>
              </svg>
            </div>
            <div className="document-info">
              <p className="document-name" title={attachment.name}>{attachment.name}</p>
              <p className="document-size">{(attachment.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={removeAttachment} className="remove-attachment">
              ×
            </button>
          </div>
        </div>
      );
    }
  };

  const renderMessageContent = (msg) => {
    if (msg.fileUrl) {
      if (msg.fileType.startsWith('image/')) {
        return (
          <div className="media-content" onClick={() => openMediaViewer(msg)}>
            <img src={msg.fileUrl} alt="Shared content" />
            {msg.text && <p className="media-caption">{msg.text}</p>}
          </div>
        );
      } else {
        return (
          <div className="document-content">
            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="document-link">
              <div className="document-icon">
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path>
                  <path fill="currentColor" d="M14 3v5h5"></path>
                </svg>
              </div>
              <div className="document-info">
                <p className="document-name" title={msg.fileName}>{msg.fileName}</p>
                <p className="document-size">{(msg.fileSize / 1024).toFixed(1)} KB</p>
              </div>
            </a>
            {msg.text && <p className="document-caption">{msg.text}</p>}
          </div>
        );
      }
    }
    return <p>{msg.text}</p>;
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
      
      <div className="media-tabs">
        <button 
          className={activeTab === 'all' ? 'active' : ''}
          onClick={() => setActiveTab('all')}
        >
          All Messages
        </button>
        <button 
          className={activeTab === 'images' ? 'active' : ''}
          onClick={() => setActiveTab('images')}
        >
          Photos & Videos
        </button>
        <button 
          className={activeTab === 'docs' ? 'active' : ''}
          onClick={() => setActiveTab('docs')}
        >
          Documents
        </button>
      </div>
      
      <div className="messages-container">
        {filteredMessages.map((msg, i) => (
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
              {renderMessageContent(msg)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="scroll-anchor"></div>
      </div>

      {showMediaViewer && (
        <div className="media-viewer-overlay">
          <div className="media-viewer-content">
            <button className="close-viewer" onClick={closeMediaViewer}>
              ×
            </button>
            {selectedMedia.fileType.startsWith('image/') ? (
              <img src={selectedMedia.fileUrl} alt="Full size" />
            ) : (
              <div className="document-viewer">
                <iframe 
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedMedia.fileUrl)}&embedded=true`} 
                  title={selectedMedia.fileName}
                ></iframe>
                <a 
                  href={selectedMedia.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="download-button"
                >
                  Download File
                </a>
              </div>
            )}
            {selectedMedia.text && (
              <div className="media-caption-viewer">
                <p>{selectedMedia.text}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={sendMessage} className="message-input-container">
        {renderAttachmentPreview()}
        <div className="input-row">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={status.loading}
          />
         <div className="action-buttons">
  <button 
    type="button" 
    className="attach-button"
    onClick={() => fileInputRef.current.click()}
  >
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path fill="currentColor" d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"></path>
    </svg>
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileChange}
      style={{ display: 'none' }}
      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
    />
  </button>
  <button 
    type="submit" 
    disabled={status.loading || (!newMessage.trim() && !attachment)}
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
</div>
        </div>
      </form>
    </div>
  );
}