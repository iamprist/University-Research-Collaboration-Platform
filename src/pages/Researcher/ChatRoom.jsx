import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../config/firebaseConfig';
import { useParams, useNavigate } from 'react-router-dom';
import './ChatRoom.css';
import './ResearcherDashboard.css';
import React from 'react';
import jsPDF from 'jspdf';
import { v4 as uuidv4 } from 'uuid';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { Box, Typography, IconButton, Button, CircularProgress, TextField } from '@mui/material';

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
  const navigate = useNavigate();

  const [funding, setFunding] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [showFundingForm, setShowFundingForm] = useState(false);
  const [showExpenditureForm, setShowExpenditureForm] = useState(false);
  const [fundingInput, setFundingInput] = useState({ amount: '', source: '', date: '' });
  const [expenditureInput, setExpenditureInput] = useState({ amount: '', description: '', date: '' });

  // Milestones state
  const [milestones, setMilestones] = useState([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneInput, setMilestoneInput] = useState({ title: '', description: '' });

  // Find project created date (from chat doc)
  const [projectCreated, setProjectCreated] = useState(null);

  // Research completion state
  const [researchComplete, setResearchComplete] = useState(false);

  // Total funding needed state
  const [totalNeededInput, setTotalNeededInput] = useState('');
  const [totalNeeded, setTotalNeeded] = useState(null);

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
        <Box className="attachment-preview">
          <Box className="preview-container">
            <img src={previewUrl} alt="Preview" className="image-preview" />
            <Button onClick={removeAttachment} className="remove-attachment">
              ×
            </Button>
          </Box>
        </Box>
      );
    } else {
      return (
        <Box className="attachment-preview">
          <Box className="document-preview">
            <Box className="document-icon">
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path>
                <path fill="currentColor" d="M14 3v5h5"></path>
              </svg>
            </Box>
            <Box className="document-info">
              <Typography className="document-name" title={attachment.name}>{attachment.name}</Typography>
              <Typography className="document-size">{(attachment.size / 1024).toFixed(1)} KB</Typography>
            </Box>
            <Button onClick={removeAttachment} className="remove-attachment">
              ×
            </Button>
          </Box>
        </Box>
      );
    }
  };

  const renderMessageContent = (msg) => {
    if (msg.fileUrl) {
      if (msg.fileType.startsWith('image/')) {
        return (
          <Box className="media-content" onClick={() => openMediaViewer(msg)}>
            <img src={msg.fileUrl} alt="Shared content" />
            {msg.text && <Typography className="media-caption">{msg.text}</Typography>}
          </Box>
        );
      } else {
        return (
          <Box className="document-content">
            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="document-link">
              <Box className="document-icon">
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path>
                  <path fill="currentColor" d="M14 3v5h5"></path>
                </svg>
              </Box>
              <Box className="document-info">
                <Typography className="document-name" title={msg.fileName}>{msg.fileName}</Typography>
                <Typography className="document-size">{(msg.fileSize / 1024).toFixed(1)} KB</Typography>
              </Box>
            </a>
            {msg.text && <Typography className="document-caption">{msg.text}</Typography>}
          </Box>
        );
      }
    }
    return <Typography>{msg.text}</Typography>;
  };

  // Funding state
  const totalFunding = funding.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalSpent = expenditures.reduce((sum, e) => sum + (e.amount || 0), 0);
  const balance = totalFunding - totalSpent;

  // Fetch funding/expenditure data from Firestore
  useEffect(() => {
    if (!chatId) return;
    const chatRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists()) {
        setFunding(docSnap.data().funding || []);
        setExpenditures(docSnap.data().expenditures || []);
        setMilestones(docSnap.data().milestones || []);
        setProjectCreated(docSnap.data().createdAt?.toDate ? docSnap.data().createdAt.toDate() : null);
        setResearchComplete(!!docSnap.data().researchComplete);
        setTotalNeeded(docSnap.data().totalNeeded || null);
      }
    });
    return () => unsubscribe();
  }, [chatId]);

  // Find project finished date (when all milestones are done)
  const projectFinished = milestones.length > 0 && milestones.every(m => m.done)
    ? Math.max(...milestones.map(m => m.doneAt ? new Date(m.doneAt).getTime() : 0))
    : null;

  // Mark milestone as done/undone and store doneAt
  const toggleMilestoneDone = async (id) => {
    const chatRef = doc(db, 'chats', chatId);
    const updated = milestones.map(m => {
      if (m.id === id) {
        if (!m.done) {
          // Mark as done, set doneAt
          return { ...m, done: true, doneAt: new Date().toISOString() };
        } else {
          // Unmark as done, remove doneAt
          const { doneAt, ...rest } = m;
          return { ...rest, done: false };
        }
      }
      return m;
    });
    await updateDoc(chatRef, { milestones: updated });
  };

  // Export milestones as PDF
  const handleExportMilestonesPDF = () => {
    const doc = new jsPDF();
    let y = 15;

    doc.setFontSize(18);
    doc.text('Research Milestones Report', 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(
      `Project Created: ${
        projectCreated
          ? new Date(projectCreated).toLocaleString()
          : 'N/A'
      }`,
      14,
      y
    );
    y += 7;
    doc.text(
      `Project Finished: ${
        projectFinished
          ? new Date(projectFinished).toLocaleString()
          : milestones.length > 0
            ? 'Not yet finished'
            : 'N/A'
      }`,
      14,
      y
    );
    y += 10;

    doc.setFontSize(14);
    doc.text('Milestones:', 14, y);
    y += 7;
    doc.setFontSize(11);

    if (milestones.length === 0) {
      doc.text('No milestones.', 16, y);
      y += 7;
    } else {
      // Table header
      doc.setFillColor(245, 245, 245);
      doc.rect(14, y - 4, 180, 8, 'F');
      doc.text('Title', 16, y);
      doc.text('Description', 56, y);
      doc.text('Created', 106, y);
      doc.text('Status', 146, y);
      doc.text('Finished', 166, y);
      y += 6;

      milestones.forEach((m) => {
        doc.text(m.title || '', 16, y, { maxWidth: 38 });
        doc.text(m.description || '', 56, y, { maxWidth: 48 });
        doc.text(m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A', 106, y);
        doc.text(m.done ? 'Done' : 'Pending', 146, y);
        doc.text(m.done && m.doneAt ? new Date(m.doneAt).toLocaleDateString() : '-', 166, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 15;
        }
      });
    }

    doc.save('milestones_report.pdf');
  };

  // Add Milestone
  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneInput.title) return;
    const chatRef = doc(db, 'chats', chatId);
    const newMilestone = {
      id: uuidv4(),
      title: milestoneInput.title,
      description: milestoneInput.description,
      done: false,
      createdAt: new Date().toISOString(),
    };
    await updateDoc(chatRef, {
      milestones: [...milestones, newMilestone],
    });
    setMilestoneInput({ title: '', description: '' });
    setShowMilestoneForm(false);
  };

  // Delete Milestone
  const handleDeleteMilestone = async (id) => {
    const chatRef = doc(db, 'chats', chatId);
    const updated = milestones.filter(m => m.id !== id);
    await updateDoc(chatRef, { milestones: updated });
  };

  // All milestones done
  const allMilestonesDone = milestones.length > 0 && milestones.every(m => m.done);

  // Add Funding
  const handleAddFunding = async (e) => {
    e.preventDefault();
    if (!fundingInput.amount || !fundingInput.source) return;
    const chatRef = doc(db, 'chats', chatId);
    const newFunding = {
      amount: parseFloat(fundingInput.amount),
      source: fundingInput.source,
      date: fundingInput.date || new Date().toISOString(),
      addedBy: auth.currentUser?.uid,
    };
    await updateDoc(chatRef, {
      funding: [...funding, newFunding],
    });
    setFundingInput({ amount: '', source: '', date: '' });
    setShowFundingForm(false);
  };

  // Add Expenditure
  const handleAddExpenditure = async (e) => {
    e.preventDefault();
    if (!expenditureInput.amount || !expenditureInput.description) return;
    const chatRef = doc(db, 'chats', chatId);
    const newExpenditure = {
      amount: parseFloat(expenditureInput.amount),
      description: expenditureInput.description,
      date: expenditureInput.date || new Date().toISOString(),
      addedBy: auth.currentUser?.uid,
    };
    await updateDoc(chatRef, {
      expenditures: [...expenditures, newExpenditure],
    });
    setExpenditureInput({ amount: '', description: '', date: '' });
    setShowExpenditureForm(false);
  };

  // Export Funding as PDF
  const handleExportFundingPDF = () => {
    const doc = new jsPDF();
    let y = 15;

    doc.setFontSize(18);
    doc.text('Research Funding Report', 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Total Funding: R${totalFunding.toFixed(2)}`, 14, y);
    y += 7;
    doc.text(`Total Spent: R${totalSpent.toFixed(2)}`, 14, y);
    y += 7;
    doc.text(`Balance: R${balance.toFixed(2)}`, 14, y);
    y += 7;

    // Add Total Needed and Still Needed
    if (totalNeeded !== null && !isNaN(totalNeeded)) {
      doc.text(`Total Needed: R${totalNeeded.toFixed(2)}`, 14, y);
      y += 7;
      doc.text(
        `Still Needed: R${Math.max(0, totalNeeded - totalFunding).toFixed(2)}`,
        14,
        y
      );
      y += 10;
    } else {
      y += 3;
    }

    // Funding Sources Table
    doc.setFontSize(14);
    doc.text('Funding Sources:', 14, y);
    y += 7;
    doc.setFontSize(11);

    if (funding.length === 0) {
      doc.text('No funding sources.', 16, y);
      y += 7;
    } else {
      doc.setFillColor(245, 245, 245);
      doc.rect(14, y - 4, 180, 8, 'F');
      doc.text('Amount (R)', 16, y);
      doc.text('Source', 56, y);
      doc.text('Date', 146, y);
      y += 6;

      funding.forEach(f => {
        doc.text(`R${f.amount?.toFixed(2) || '0.00'}`, 16, y);
        doc.text(f.source || '', 56, y);
        doc.text(f.date ? new Date(f.date).toLocaleDateString() : 'N/A', 146, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 15;
        }
      });
      y += 4;
    }

    // Expenditures Table
    doc.setFontSize(14);
    doc.text('Expenditures:', 14, y);
    y += 7;
    doc.setFontSize(11);

    if (expenditures.length === 0) {
      doc.text('No expenditures.', 16, y);
      y += 7;
    } else {
      doc.setFillColor(245, 245, 245);
      doc.rect(14, y - 4, 180, 8, 'F');
      doc.text('Amount (R)', 16, y);
      doc.text('Description', 56, y);
      doc.text('Date', 146, y);
      y += 6;

      expenditures.forEach(e => {
        doc.text(`R${e.amount?.toFixed(2) || '0.00'}`, 16, y);
        doc.text(e.description || '', 56, y);
        doc.text(e.date ? new Date(e.date).toLocaleDateString() : 'N/A', 146, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 15;
        }
      });
    }

    doc.save('funding_report.pdf');
  };

  // Handler to mark research as complete
  const handleMarkResearchComplete = async () => {
    if (!chatId) return;
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      researchComplete: true,
      researchCompletedAt: new Date().toISOString(),
    });
    setResearchComplete(true);
  };

  // Handler to unmark research as complete
  const handleUnmarkResearchComplete = async () => {
    if (!chatId) return;
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      researchComplete: false,
      researchCompletedAt: null,
    });
    setResearchComplete(false);
  };

  // Handler to save total needed
  const handleSaveTotalNeeded = async (e) => {
    e.preventDefault();
    if (!chatId) return;
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, { totalNeeded: parseFloat(totalNeededInput) });
    setTotalNeeded(parseFloat(totalNeededInput));
    setTotalNeededInput('');
  };

  if (status.loading && messages.length === 0) {
    return (
      <Box className="loading-container">
        <CircularProgress sx={{ color: '#64CCC5', mb: 2 }} />
        <Typography>Loading chat...</Typography>
      </Box>
    );
  }

  if (status.error) {
    return (
      <Box className="error-container">
        <Box className="error-message">
          <Typography>{status.error}</Typography>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="chat-app">
      {/* Header */}
      <Box
        className="chat-header"
        sx={{
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--primary-blue)',
          color: 'var(--white)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            color: 'var(--white)',
            background: 'var(--primary-blue)',
            borderRadius: '4px',
            mr: 2,
            '&:hover': { background: 'var(--dark-blue)' },
          }}
          className="chat-button"
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
          {chatName}
        </Typography>
        <Box className="status-indicator">
          <span className="status-dot"></span>
          <span>Online</span>
        </Box>
      </Box>

      {/* Media Tabs */}
      <Box className="media-tabs">
        <Button
          className={activeTab === 'all' ? 'active' : ''}
          onClick={() => setActiveTab('all')}
          sx={{ textTransform: 'none' }}
        >
          All Messages
        </Button>
        <Button
          className={activeTab === 'images' ? 'active' : ''}
          onClick={() => setActiveTab('images')}
          sx={{ textTransform: 'none' }}
        >
          Photos & Videos
        </Button>
        <Button
          className={activeTab === 'docs' ? 'active' : ''}
          onClick={() => setActiveTab('docs')}
          sx={{ textTransform: 'none' }}
        >
          Documents
        </Button>
        <Button
          className={activeTab === 'milestones' ? 'active' : ''}
          onClick={() => setActiveTab('milestones')}
          sx={{ textTransform: 'none' }}
        >
          Milestones
        </Button>
        <Button
          className={activeTab === 'funding' ? 'active' : ''}
          onClick={() => setActiveTab('funding')}
          sx={{ textTransform: 'none' }}
        >
          Funding
        </Button>
      </Box>

      {/* Milestones Tab */}
      {activeTab === 'milestones' ? (
        <Box className="funding-section">
          <Typography variant="h5">Research Milestones</Typography>
          <Box>
            <strong>Project Created:</strong>{' '}
            {projectCreated ? new Date(projectCreated).toLocaleString() : 'N/A'}
            <br />
            <strong>Project Finished:</strong>{' '}
            {researchComplete
              ? 'Marked complete by researcher'
              : milestones.length > 0
                ? 'Not yet finished'
                : 'N/A'}
          </Box>
          <Box sx={{ mb: 2, mt: 2 }}>
            <Button onClick={() => setShowMilestoneForm(v => !v)}>
              {showMilestoneForm ? 'Cancel' : 'Add Milestone'}
            </Button>
            <Button onClick={handleExportMilestonesPDF} sx={{ ml: 1 }}>
              Export as PDF
            </Button>
          </Box>
          {showMilestoneForm && (
            <Box component="form" onSubmit={handleAddMilestone} className="funding-form">
              <TextField
                size="small"
                placeholder="Milestone Title"
                value={milestoneInput.title}
                onChange={e => setMilestoneInput({ ...milestoneInput, title: e.target.value })}
                required
                sx={{ mr: 1 }}
              />
              <TextField
                size="small"
                placeholder="Description (optional)"
                value={milestoneInput.description}
                onChange={e => setMilestoneInput({ ...milestoneInput, description: e.target.value })}
                sx={{ mr: 1 }}
              />
              <Button type="submit" variant="contained">Add</Button>
            </Box>
          )}
          <Box component="ul" sx={{ pl: 2 }}>
            {milestones.length === 0 && (
              <Typography component="li">No milestones yet.</Typography>
            )}
            {milestones.map(m => (
              <Box
                component="li"
                key={m.id}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <input
                  type="checkbox"
                  checked={m.done}
                  onChange={() => toggleMilestoneDone(m.id)}
                  style={{ marginRight: 8 }}
                />
                <span
                  style={{
                    textDecoration: m.done ? 'line-through' : 'none',
                    color: m.done ? '#38A169' : undefined
                  }}
                >
                  <strong>{m.title}</strong>
                  {m.description && <> – {m.description}</>}
                  <br />
                  <small>
                    Created: {m.createdAt ? new Date(m.createdAt).toLocaleString() : 'N/A'}
                    {m.done && m.doneAt && (
                      <> | Finished: {new Date(m.doneAt).toLocaleString()}</>
                    )}
                  </small>
                </span>
                <Button
                  sx={{
                    ml: 'auto',
                    background: '#FF6B6B',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    minWidth: 0,
                    px: 2,
                    py: 0.5,
                    fontSize: '0.9rem',
                    '&:hover': { background: '#e53e3e' }
                  }}
                  onClick={() => handleDeleteMilestone(m.id)}
                  title="Delete"
                  type="button"
                >
                  Delete
                </Button>
              </Box>
            ))}
          </Box>
          {allMilestonesDone && (
            <Box sx={{
              mt: 2,
              color: '#38A169',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              🎉All milestones complete!
            </Box>
          )}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            {!researchComplete && (
              <Button
                onClick={handleMarkResearchComplete}
                sx={{
                  background: milestones.length === 0 || !allMilestonesDone ? '#ccc' : '#38A169',
                  color: '#fff',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  cursor: milestones.length === 0 || !allMilestonesDone ? 'not-allowed' : 'pointer',
                  opacity: milestones.length === 0 || !allMilestonesDone ? 0.7 : 1,
                  '&:hover': {
                    background: milestones.length === 0 || !allMilestonesDone ? '#ccc' : '#2f855a'
                  }
                }}
                disabled={milestones.length === 0 || !allMilestonesDone}
                title={
                  milestones.length === 0
                    ? 'Add at least one milestone first'
                    : !allMilestonesDone
                      ? 'Mark all milestones as done to complete research'
                      : 'Mark Research as Complete'
                }
              >
                Mark Research as Complete
              </Button>
            )}
            {researchComplete && (
              <Box>
                <span style={{ color: '#38A169', fontWeight: 600 }}>
                  Research marked as complete
                </span>
                <Button
                  onClick={handleUnmarkResearchComplete}
                  sx={{
                    ml: 2,
                    background: '#FF6B6B',
                    color: '#fff',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    '&:hover': { background: '#e53e3e' }
                  }}
                >
                  Unmark as Complete
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      ) : activeTab === 'funding' ? (
        <Box className="funding-section">
          <Typography variant="h5">Research Funding Management</Typography>
          <Box>
            <strong>Total Funding:</strong> R{totalFunding.toFixed(2)}<br />
            <strong>Total Spent:</strong> R{totalSpent.toFixed(2)}<br />
            <strong>Balance:</strong> R{balance.toFixed(2)}
          </Box>
          <Box sx={{ my: 2 }}>
            <Button onClick={() => setShowFundingForm(v => !v)}>
              {showFundingForm ? 'Cancel' : 'Add Funding'}
            </Button>
            <Button onClick={() => setShowExpenditureForm(v => !v)} sx={{ ml: 1 }}>
              {showExpenditureForm ? 'Cancel' : 'Add Expenditure'}
            </Button>
            <Button onClick={handleExportFundingPDF} sx={{ ml: 1 }}>
              Export as PDF
            </Button>
          </Box>
          {showFundingForm && (
            <Box component="form" onSubmit={handleAddFunding} className="funding-form">
              <TextField
                size="small"
                type="number"
                step="0.01"
                placeholder="Amount"
                value={fundingInput.amount}
                onChange={e => setFundingInput({ ...fundingInput, amount: e.target.value })}
                required
                sx={{ mr: 1 }}
              />
              <TextField
                size="small"
                placeholder="Source"
                value={fundingInput.source}
                onChange={e => setFundingInput({ ...fundingInput, source: e.target.value })}
                required
                sx={{ mr: 1 }}
              />
              <TextField
                size="small"
                type="date"
                value={fundingInput.date}
                onChange={e => setFundingInput({ ...fundingInput, date: e.target.value })}
                sx={{ mr: 1 }}
              />
              <Button type="submit" variant="contained">Add Funding</Button>
            </Box>
          )}
          {showExpenditureForm && (
            <Box component="form" onSubmit={handleAddExpenditure} className="expenditure-form">
              <TextField
                size="small"
                type="number"
                step="0.01"
                placeholder="Amount"
                value={expenditureInput.amount}
                onChange={e => setExpenditureInput({ ...expenditureInput, amount: e.target.value })}
                required
                sx={{ mr: 1 }}
              />
              <TextField
                size="small"
                placeholder="Description"
                value={expenditureInput.description}
                onChange={e => setExpenditureInput({ ...expenditureInput, description: e.target.value })}
                required
                sx={{ mr: 1 }}
              />
              <TextField
                size="small"
                type="date"
                value={expenditureInput.date}
                onChange={e => setExpenditureInput({ ...expenditureInput, date: e.target.value })}
                sx={{ mr: 1 }}
              />
              <Button type="submit" variant="contained">Add Expenditure</Button>
            </Box>
          )}

          <Box sx={{
            mb: 2,
            background: '#f7fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            p: 2,
            maxWidth: 420
          }}>
            <Box component="form" onSubmit={handleSaveTotalNeeded} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 600, minWidth: 170 }}>
                Total Funding Needed (R)
              </Typography>
              <TextField
                size="small"
                type="number"
                step="0.01"
                placeholder="e.g. 5000"
                value={totalNeededInput}
                onChange={e => setTotalNeededInput(e.target.value)}
                sx={{ maxWidth: 120 }}
              />
              <Button
                type="submit"
                disabled={!totalNeededInput}
                sx={{
                  background: '#3182ce',
                  color: '#fff',
                  borderRadius: '0.3rem',
                  px: 2,
                  fontWeight: 600,
                  cursor: totalNeededInput ? 'pointer' : 'not-allowed',
                  '&:hover': { background: '#2563eb' }
                }}
              >
                Save
              </Button>
            </Box>
            {totalNeeded !== null && (
              <Box sx={{ mt: 1, display: 'flex', gap: 3 }}>
                <Typography sx={{ fontWeight: 500 }}>
                  Total Needed: <span style={{ color: '#3182ce', fontWeight: 700 }}>R{totalNeeded.toFixed(2)}</span>
                </Typography>
                <Typography sx={{ fontWeight: 500 }}>
                  Still Needed: <span style={{ color: '#e53e3e', fontWeight: 700 }}>
                    R{Math.max(0, totalNeeded - totalFunding).toFixed(2)}
                  </span>
                </Typography>
              </Box>
            )}
          </Box>

          <Typography variant="h6" sx={{ mt: 2 }}>Funding Sources</Typography>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 2 }}>
            <Box component="thead">
              <Box component="tr" sx={{ background: '#f5f5f5' }}>
                <Box component="th" sx={{ border: '1px solid #ddd', p: 1 }}>Amount (R)</Box>
                <Box component="th" sx={{ border: '1px solid #ddd', p: 1 }}>Source</Box>
                <Box component="th" sx={{ border: '1px solid #ddd', p: 1 }}>Date</Box>
              </Box>
            </Box>
            <Box component="tbody">
              {funding.length === 0 ? (
                <Box component="tr">
                  <Box component="td" colSpan={3} sx={{ textAlign: 'center', p: 1 }}>No funding sources.</Box>
                </Box>
              ) : (
                funding.map((f, idx) => (
                  <Box component="tr" key={idx}>
                    <Box component="td" sx={{ border: '1px solid #ddd', p: 1 }}>R{f.amount.toFixed(2)}</Box>
                    <Box component="td" sx={{ border: '1px solid #ddd', p: 1 }}>{f.source}</Box>
                    <Box component="td" sx={{ border: '1px solid #ddd', p: 1 }}>{f.date ? new Date(f.date).toLocaleDateString() : 'N/A'}</Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>

          <Typography variant="h6" sx={{ mt: 2 }}>Expenditures</Typography>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="thead">
              <Box component="tr" sx={{ background: '#f5f5f5' }}>
                <Box component="th" sx={{ border: '1px solid #ddd', p: 1 }}>Amount (R)</Box>
                <Box component="th" sx={{ border: '1px solid #ddd', p: 1 }}>Description</Box>
                <Box component="th" sx={{ border: '1px solid #ddd', p: 1 }}>Date</Box>
              </Box>
            </Box>
            <Box component="tbody">
              {expenditures.length === 0 ? (
                <Box component="tr">
                  <Box component="td" colSpan={3} sx={{ textAlign: 'center', p: 1 }}>No expenditures.</Box>
                </Box>
              ) : (
                expenditures.map((e, idx) => (
                  <Box component="tr" key={idx}>
                    <Box component="td" sx={{ border: '1px solid #ddd', p: 1 }}>R{e.amount.toFixed(2)}</Box>
                    <Box component="td" sx={{ border: '1px solid #ddd', p: 1 }}>{e.description}</Box>
                    <Box component="td" sx={{ border: '1px solid #ddd', p: 1 }}>{e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}</Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Box>
      ) : (
        <>
          <Box className="messages-container">
            {filteredMessages.map((msg, i) => (
              <Box
                key={i}
                className={`message-bubble ${msg.senderId === auth.currentUser?.uid ? 'sent' : 'received'}`}
              >
                <Box className="message-meta">
                  <span className="sender-name">
                    {msg.senderId === auth.currentUser?.uid 
                      ? 'You' 
                      : userData[msg.senderId] || 'Unknown'}
                  </span>
                  <span className="message-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </Box>
                <Box className="message-content">
                  {renderMessageContent(msg)}
                </Box>
              </Box>
            ))}
            <Box ref={messagesEndRef} className="scroll-anchor"></Box>
          </Box>

          {showMediaViewer && (
            <Box className="media-viewer-overlay">
              <Box className="media-viewer-content">
                <Button className="close-viewer" onClick={closeMediaViewer}>
                  ×
                </Button>
                {selectedMedia.fileType.startsWith('image/') ? (
                  <img src={selectedMedia.fileUrl} alt="Full size" />
                ) : (
                  <Box className="document-viewer">
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
                  </Box>
                )}
                {selectedMedia.text && (
                  <Box className="media-caption-viewer">
                    <Typography>{selectedMedia.text}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          <Box component="form" onSubmit={sendMessage} className="message-input-container">
            {renderAttachmentPreview()}
            <Box className="input-row">
              <TextField
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={status.loading}
                fullWidth
                size="small"
                sx={{ bgcolor: '#fff', borderRadius: '0.5rem' }}
              />
              <Box className="action-buttons">
                <IconButton 
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
                </IconButton>
                <IconButton 
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
                </IconButton>
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}