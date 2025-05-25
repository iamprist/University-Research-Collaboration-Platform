import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { auth } from '../../config/firebaseConfig';
import { chatService } from './chatService';
import './ChatRoom.css';

export default function ChatRoom({ chatId: chatIdProp }) {
  const params = useParams();
  const chatId = chatIdProp || params.chatId
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [status, setStatus] = useState({ loading: true, error: null });
  const [userData, setUserData] = useState({});
  const [attachment, setAttachment] = useState(null);
  const [attachmentType, setAttachmentType] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Filter messages based on active tab
  const filteredMessages = useCallback(() => {
    return messages.filter(msg => {
      if (activeTab === 'all') return true;
      if (activeTab === 'images') return msg.fileType?.startsWith('image/');
      if (activeTab === 'docs') return msg.fileType && !msg.fileType.startsWith('image/');
      return true;
    });
  }, [messages, activeTab]);

  // Handle chat initialization and subscription
  useEffect(() => {
    if (!chatId) {
      setStatus({ loading: false, error: 'No chat ID provided' });
      return;
    }

    let unsubscribe = null;

    const initializeChat = async () => {
      try {
        setStatus({ loading: true, error: null });
        
        const { chatRef } = await chatService.initializeChat(chatId);
        
        unsubscribe = chatService.subscribeToChatUpdates(chatRef, ({ messages: newMessages, participants }) => {
          setMessages(newMessages);
          updateUserData(newMessages);
        });

        setStatus({ loading: false, error: null });
      } catch (error) {
        console.error('Chat initialization error:', error);
        setStatus({ loading: false, error: 'Failed to load chat' });
      }
    };

    const updateUserData = async (messagesData) => {
      const uniqueSenderIds = [...new Set(messagesData.map(msg => msg.senderId))];
      const newSenderIds = uniqueSenderIds.filter(id => !userData[id] && id !== auth.currentUser?.uid);
      
      if (newSenderIds.length > 0) {
        const usersData = {};
        for (const uid of newSenderIds) {
          usersData[uid] = await chatService.getUserData(uid);
        }
        setUserData(prev => ({ ...prev, ...usersData }));
      }
    };

    initializeChat();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatId, userData]);


  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isUserAtBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Check if user is near bottom of chat
  const isUserAtBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 100;
    const position = container.scrollTop + container.clientHeight;
    const height = container.scrollHeight;
    return height - position <= threshold;
  };

  // Handle file attachment
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAttachment(file);
    setAttachmentType(file.type.startsWith('image/') ? 'image' : 'document');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => setPreviewUrl(event.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  // Remove attachment
  const removeAttachment = () => {
    setAttachment(null);
    setPreviewUrl(null);
    setAttachmentType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send message handler
  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !auth.currentUser) return;

    try {
      setStatus({ loading: true, error: null });
      
      const timestamp = new Date().toISOString();
      let fileData = null;

      if (attachment) {
        fileData = await chatService.uploadAttachment(chatId, attachment);
      }

      const messageData = {
        text: newMessage,
        senderId: auth.currentUser.uid,
        timestamp,
        ...(fileData && {
          fileUrl: fileData.url,
          fileName: fileData.name,
          fileType: fileData.type,
          fileSize: fileData.size
        })
      };

      // Optimistic update
      setMessages(prev => [...prev, { ...messageData, timestamp: new Date(timestamp) }]);
      await chatService.sendMessage(chatId, messageData);

      // Update sender info if needed
      if (!userData[auth.currentUser.uid]) {
        const userName = await chatService.getUserData(auth.currentUser.uid);
        setUserData(prev => ({ ...prev, [auth.currentUser.uid]: userName }));
      }

      setNewMessage('');
      removeAttachment();
      setStatus({ loading: false, error: null });
    } catch (error) {
      console.error('Message send error:', error);
      setStatus({ loading: false, error: 'Failed to send message' });
      // Revert optimistic update
      setMessages(prev => prev.slice(0, -1));
    }
  };

  // Media viewer controls
  const renderMessageContent = (msg) => {
    if (msg.fileUrl) {
      return msg.fileType.startsWith('image/') ? (
        <section className="media-content" onClick={() => openMediaViewer(msg)}>
          <img src={msg.fileUrl} alt="Shared content" />
          {msg.text && <p className="media-caption">{msg.text}</p>}
        </section>
      ) : (
        <section className="document-content">
          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="document-link">
            <svg viewBox="0 0 24 24" className="document-icon">
              <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
              <path fill="currentColor" d="M14 3v5h5" />
            </svg>
            <section className="document-info">
              <p className="document-name" title={msg.fileName}>{msg.fileName}</p>
              <p className="document-size">{(msg.fileSize / 1024).toFixed(1)} KB</p>
            </section>
          </a>
          {msg.text && <p className="document-caption">{msg.text}</p>}
        </section>
      );
    }
    return <p>{msg.text}</p>;
  };

  // Define openMediaViewer function (was unused warning)
  const openMediaViewer = (media) => {
    setSelectedMedia(media);
    setShowMediaViewer(true);
  };

  const closeMediaViewer = () => {
    setShowMediaViewer(false);
    setSelectedMedia(null);
  };

  // Render attachment preview
  const renderAttachmentPreview = () => {
    if (!attachment) return null;

    return (
      <figure className="attachment-preview">
        {attachmentType === 'image' ? (
          <section className="preview-container">
            <img src={previewUrl} alt="Preview" className="image-preview" />
            <button onClick={removeAttachment} className="remove-attachment" aria-label="Remove attachment">×</button>
          </section>
        ) : (
          <section className="document-preview">
            <svg viewBox="0 0 24 24" className="document-icon">
              <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
              <path fill="currentColor" d="M14 3v5h5" />
            </svg>
            <section className="document-info">
              <p className="document-name" title={attachment.name}>{attachment.name}</p>
              <p className="document-size">{(attachment.size / 1024).toFixed(1)} KB</p>
            </section>
            <button onClick={removeAttachment} className="remove-attachment" aria-label="Remove attachment">×</button>
          </section>
        )}
      </figure>
    );
  };

  // Loading and error states using semantic elements
  if (status.loading && messages.length === 0) {
    return (
      <article className="loading-container">
        <progress aria-label="Loading chat messages"></progress>
        <p>Loading chat...</p>
      </article>
    );
  }

  if (status.error) {
    return (
      <article className="error-container">
        <section className="error-message">
          <p>{status.error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </section>
      </article>
    );
  }

  return (
    <article className="chat-app">
      {/* Chat header */}
       <header className="chat-header" style={{
      padding: '1rem',
      backgroundColor: 'var(--primary-blue)',
      color: 'var(--white)',
      flexShrink: 0
    }}>
      <h1 style={{
        fontSize: '1.1rem',
        fontWeight: 600,
        margin: 0
      }}>inChat</h1>
      <p className="status-indicator">
        <span className="status-dot" aria-hidden="true"></span>
        <span>Online</span>
      </p>
    </header>

      {/* Media tabs */}
      <nav className="media-tabs" aria-label="Message filters">
        <menu>
          <li>
            <button 
              className={activeTab === 'all' ? 'active' : ''} 
              onClick={() => setActiveTab('all')}
              aria-current={activeTab === 'all' ? 'page' : undefined}
            >
              All Messages
            </button>
          </li>
          <li>
            <button 
              className={activeTab === 'images' ? 'active' : ''} 
              onClick={() => setActiveTab('images')}
              aria-current={activeTab === 'images' ? 'page' : undefined}
            >
              Photos & Videos
            </button>
          </li>
          <li>
            <button 
              className={activeTab === 'docs' ? 'active' : ''} 
              onClick={() => setActiveTab('docs')}
              aria-current={activeTab === 'docs' ? 'page' : undefined}
            >
              Documents
            </button>
          </li>
        </menu>
      </nav>

      {/* Messages container */}
      <section 
        className="messages-container" 
        ref={messagesContainerRef}
        aria-live="polite"
        aria-atomic="false"
      >
        <ol className="messages-list">
          {filteredMessages().map((msg, i) => (
            <li 
              key={i} 
              className={`message-bubble ${msg.senderId === auth.currentUser?.uid ? 'sent' : 'received'}`}
            >
              <header className="message-meta">
                <span className="sender-name">
                  {msg.senderId === auth.currentUser?.uid ? 'You' : userData[msg.senderId] || 'Unknown'}
                </span>
                <time 
                  className="message-time" 
                  dateTime={msg.timestamp.toISOString()}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </time>
              </header>
              <article className="message-content">
                {renderMessageContent(msg)}
              </article>
            </li>
          ))}
        </ol>
        <span ref={messagesEndRef} className="scroll-anchor" aria-hidden="true"></span>
      </section>

      {/* Media viewer modal */}
      {showMediaViewer && (
        <dialog 
          className="media-viewer-overlay"
          open
          aria-labelledby="media-viewer-heading"
        >
          <article className="media-viewer-content">
            <header>
              <h2 id="media-viewer-heading" className="visually-hidden">Media Viewer</h2>
              <button 
                className="close-viewer" 
                onClick={closeMediaViewer}
                aria-label="Close media viewer"
              >
                ×
              </button>
            </header>
            
            {selectedMedia.fileType.startsWith('image/') ? (
              <figure>
                <img src={selectedMedia.fileUrl} alt="" />
                {selectedMedia.text && (
                  <figcaption className="media-caption-viewer">
                    {selectedMedia.text}
                  </figcaption>
                )}
              </figure>
            ) : (
              <section className="document-viewer">
                <iframe 
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedMedia.fileUrl)}&embedded=true`} 
                  title={`Preview of ${selectedMedia.fileName}`}
                ></iframe>
                <a 
                  href={selectedMedia.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="download-button"
                >
                  Download File
                </a>
              </section>
            )}
          </article>
        </dialog>
      )}

      {/* Message input form */}
      <form onSubmit={sendMessage} className="message-input-container">
        {renderAttachmentPreview()}
        <section className="input-row">
          <label htmlFor="message-input" className="visually-hidden">Type your message</label>
          <input
            id="message-input"
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={status.loading}
          />
          <menu className="action-buttons">
            <li>
              <button 
                type="button" 
                className="attach-button" 
                onClick={() => fileInputRef.current.click()}
                aria-label="Attach file"
              >
                📎
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="visually-hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  aria-label="File attachment"
                />
              </button>
            </li>
            <li>
              <button 
                type="submit" 
                disabled={status.loading || (!newMessage.trim() && !attachment)} 
                className={status.loading ? 'loading' : ''}
                aria-label="Send message"
              >
                {status.loading ? '...' : '➤'}
              </button>
            </li>
          </menu>
        </section>
      </form>
    </article>
  );
}