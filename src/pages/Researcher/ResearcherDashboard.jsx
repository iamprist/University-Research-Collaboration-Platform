import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../config/firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc, onSnapshot, orderBy, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import './ResearcherDashboard.css';
import axios from "axios";
import Footer from '../../components/Footer';
import ContactForm from '../../components/ContactForm';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { useResearcherDashboard } from './researcherDashboardLogic';
// MUI Components
import { 
  Button,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Box,
  DialogActions,
  Stack
} from '@mui/material';
import { Notifications, Menu as MenuIcon, Close } from '@mui/icons-material';
import CollaborationRequestsPanel from '../../components/CollaborationRequestsPanel';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const MessageNotification = ({ messages, unreadCount, onMessageClick, selectedMessage, onAccept, onReject, onCloseSelected }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <Badge 
      color="error" 
      badgeContent={unreadCount}
      sx={{ 
        '& .MuiBadge-badge': {
          right: 8,
          top: 8
        }
      }}
    >
      <IconButton
        color="inherit"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          color: '#B1EDE8',
          '&:hover': { transform: 'scale(1.1)' }
        }}
      >
        <Notifications />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => { setAnchorEl(null); onCloseSelected && onCloseSelected(); }}
        PaperProps={{
          sx: {
            bgcolor: '#132238',
            border: '1px solid #B1EDE8',
            width: 350,
            maxHeight: 500
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            color: '#B1EDE8',
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid #2a3a57',
            pb: 1,
            mb: 2
          }}>
            <Typography variant="h6">Notifications</Typography>
            <IconButton onClick={() => { setAnchorEl(null); onCloseSelected && onCloseSelected(); }} size="small">
              <Close sx={{ color: '#B1EDE8' }} />
            </IconButton>
          </Box>
          {/* If a collaboration-request message is selected, show accept/reject UI */}
          {selectedMessage && selectedMessage.type === 'collaboration-request' ? (
            <Paper sx={{ p: 2, mb: 1, bgcolor: 'rgba(177, 237, 232, 0.05)' }}>
              <Typography variant="subtitle1">{selectedMessage.title}</Typography>
              <Typography variant="body2">{selectedMessage.content}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button variant="contained" color="success" onClick={() => { onAccept(selectedMessage); onCloseSelected && onCloseSelected(); }}>
                  Accept
                </Button>
                <Button variant="contained" color="error" onClick={() => { onReject(selectedMessage); onCloseSelected && onCloseSelected(); }}>
                  Reject
                </Button>
                <Button variant="outlined" onClick={() => { onCloseSelected && onCloseSelected(); }}>
                  Close
                </Button>
              </Box>
            </Paper>
          ) : messages.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              No new messages
            </Typography>
          ) : (
            messages.map(message => (
              <Paper
                key={message.id}
                sx={{
                  p: 2,
                  mb: 1,
                  cursor: 'pointer',
                  color: '#B1EDE8',
                  bgcolor: message.read ? 'inherit' : 'rgba(177, 237, 232, 0.05)',
                  '&:hover': { bgcolor: 'rgba(177, 237, 232, 0.1)' }
                }}
                onClick={() => {
                  onMessageClick(message);
                }}
              >
                <Typography variant="subtitle1">{message.title}</Typography>
                <Typography variant="body2">{message.content}</Typography>
                <Typography variant="caption" sx={{ color: '#7a8fb1' }}>
                  {message.timestamp.toLocaleString()}
                </Typography>
              </Paper>
            ))
          )}
        </Box>
      </Menu>
    </Badge>
  );
};

const ResearcherDashboard = () => {
  const [allListings, setAllListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [userId, setUserId] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [collabListings, setCollabListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const dropdownTimeout = useRef(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [filteredListings, setFilteredListings] = useState([]);
  const [userName, setUserName] = useState('');
  const [messages, setMessages] = useState([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [ipAddress, setIpAddress] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [cardMenuAnchor, setCardMenuAnchor] = useState(null);
  const [cardMenuId, setCardMenuId] = useState(null);
  const [showReviewersDialog, setShowReviewersDialog] = useState(false);
  const [reviewersForProject, setReviewersForProject] = useState([]);
  const navigate = useNavigate();const [reviewRequests, setReviewRequests] = useState([]);
const { 

  deleteDialogOpen,
  setDeleteDialogOpen,
  listingToDelete,
  setListingToDelete,
  handleDeleteListing
} = useResearcherDashboard();
useEffect(() => {
  if (!userId) return;
  const q = query(
    collection(db, "reviewRequests"),
    where("researcherId", "==", userId),
    where("status", "==", "pending")
  );
  const unsub = onSnapshot(q, async (snapshot) => {
    const requests = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      // Fetch reviewer info
      let reviewerName = "Unknown Reviewer";
      let reviewerEmail = "";
      try {
        const reviewerDoc = await getDoc(doc(db, "users", data.reviewerId));
        if (reviewerDoc.exists()) {
          reviewerName = reviewerDoc.data().name || reviewerName;
          reviewerEmail = reviewerDoc.data().email || "";
        }
      } catch {}
      // Fetch project info
      let projectTitle = "Unknown Project";
      let projectSummary = "";
      try {
        const projectDoc = await getDoc(doc(db, "research-listings", data.listingId));
        if (projectDoc.exists()) {
          projectTitle = projectDoc.data().title || projectTitle;
          projectSummary = projectDoc.data().summary || "";
        }
      } catch {}
      return {
        id: docSnap.id,
        ...data,
        reviewerName,
        reviewerEmail,
        projectTitle,
        projectSummary,
      };
    }));
    setReviewRequests(requests);
  });
  return () => unsub();
}, [userId]);

  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await axios.get("https://api.ipify.org?format=json");
        setIpAddress(response.data.ip);
      } catch (error) {
        console.error("Error fetching IP address:", error);
      }
    };
    fetchIpAddress();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/signin');
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
      else {
        localStorage.removeItem('authToken');
        navigate('/signin');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    
    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setHasProfile(true);
          setUserName(userDoc.data().name || 'Researcher');
        } else {
          navigate('/researcher-edit-profile');
        }
      } catch (err) {
        setShowErrorModal(true);
      }
    };
    fetchUserProfile();
  }, [userId, navigate]);

  useEffect(() => {
    if (!userId) return;
    
    const messagesRef = collection(db, 'users', userId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));
    
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      setMessages(messagesData);
    });

    const collabQuery = query(
      collection(db, "collaborations"),
      where("collaboratorId", "==", userId)
    );
    
    const unsubscribeCollabs = onSnapshot(collabQuery, async (snapshot) => {
      const collabs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const listings = await Promise.all(
        collabs.map(async collab => {
          const listingDoc = await getDoc(doc(db, "research-listings", collab.listingId));
          return listingDoc.exists() ? { id: listingDoc.id, ...listingDoc.data() } : null;
        })
      );
      setCollabListings(listings.filter(Boolean));
    });

    return () => {
      unsubscribeMessages();
      unsubscribeCollabs();
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !hasProfile) return;
    
    const fetchListings = async () => {
      try {
        const q = query(collection(db, 'research-listings'));
        const querySnapshot = await getDocs(q);
        const data = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const listing = { id: docSnap.id, ...docSnap.data() };
            try {
              const researcherDoc = await getDoc(doc(db, 'users', listing.userId));
              return {
                ...listing,
                researcherName: researcherDoc.exists() ? researcherDoc.data().name : 'Unknown Researcher'
              };
            } catch {
              return { ...listing, researcherName: 'Unknown Researcher' };
            }
          })
        );
        setAllListings(data);
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    };
    fetchListings();
  }, [userId, hasProfile]);

  useEffect(() => {
    if (!userId || !hasProfile) return;
    
    const fetchMyListings = async () => {
      try {
        const q = query(collection(db, 'research-listings'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyListings(data);
      } catch (error) {
        console.error("Error fetching user listings:", error);
      }
    };
    fetchMyListings();
  }, [userId, hasProfile]);

  useEffect(() => {
    setFilteredListings(myListings);
  }, [myListings]);

const handleAcceptReviewRequest = async (requestId) => {
  await updateDoc(doc(db, "reviewRequests", requestId), {
    status: "accepted",
    respondedAt: serverTimestamp(),
  });
};

const handleDeclineReviewRequest = async (requestId) => {
  await updateDoc(doc(db, "reviewRequests", requestId), {
    status: "declined",
    respondedAt: serverTimestamp(),
  });
};
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setDropdownVisible(false);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = allListings.filter(item => {
      const title = item.title?.toLowerCase() || '';
      const researcherName = item.researcherName?.toLowerCase() || '';
      return title.includes(searchTermLower) || researcherName.includes(searchTermLower);
    });
    
    setSearchResults(filtered);
    setDropdownVisible(true);
    clearTimeout(dropdownTimeout.current);
    dropdownTimeout.current = setTimeout(() => {
      setDropdownVisible(false);
    }, 5000);
    setShowNoResults(filtered.length === 0);
  };

  const markMessageAsRead = async (messageId) => {
    try {
      await updateDoc(doc(db, 'users', userId, 'messages', messageId), {
        read: true
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleMessageClick = (message) => {
    if (message.type === 'review-request') {
      if (pendingReviewRef.current) {
        pendingReviewRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      setSelectedMessage(null);
      return;
    }
    markMessageAsRead(message.id);
    if (message.type === 'collaboration-request') {
      setSelectedMessage(message); // Show Accept/Reject in menu
      return;
    }
    setSelectedMessage(null);
    switch(message.type) {
      case 'review-request':
        navigate(`/review-requests/${message.relatedId}`);
        break;
      case 'upload-confirmation':
        navigate(`/listing/${message.relatedId}`);
        break;
      default: break;
    }
  };

  const handleAddListing = () => navigate('/researcher/add-listing');
  const handleCollaborate = () => navigate('/researcher/collaborate');
  const handleInputFocus = () => {
    setDropdownVisible(false);
    clearTimeout(dropdownTimeout.current);
  };
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setDropdownVisible(false);
    clearTimeout(dropdownTimeout.current);
  };
  const handleClear = () => {
    setSearchTerm('');
    setSearchResults([]);
    setDropdownVisible(false);
  };

  const logEvent = async ({ userId, role, userName, action, details, ip, target }) => {
    try {
      await addDoc(collection(db, "logs"), {
        userId,
        role,
        userName,
        action,
        details,
        ip,
        target,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error logging event:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await logEvent({
          userId: user.uid,
          role: "Researcher",
          userName: user.displayName || "N/A",
          action: "Logout",
          details: "User logged out",
          ip: ipAddress,
          target: "Researcher Dashboard", 
        });
        await auth.signOut();
        navigate("/signin");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Accept/reject handlers for collaboration-request messages
  const handleAcceptCollab = async (message) => {
    try {
      // Use message.id as the document ID for the collaboration request
      await updateDoc(doc(db, 'collaboration-requests', message.id), {
        status: 'accepted',
        respondedAt: new Date()
      });
      // Add to collaborations collection
      await addDoc(collection(db, 'collaborations'), {
        listingId: message.relatedId,
        researcherId: userId,
        collaboratorId: message.senderId || message.requesterId,
        joinedAt: new Date(),
        status: 'active'
      });
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error accepting collaboration:', error);
    }
  };
  const handleRejectCollab = async (message) => {
    try {
      await updateDoc(doc(db, 'collaboration-requests', message.id), {
        status: 'rejected',
        respondedAt: new Date()
      });
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error rejecting collaboration:', error);
    }
  };

  // Combine messages and pending review requests for the notification bell
  const combinedNotifications = [
    ...messages,
    ...reviewRequests.map(req => ({
      id: req.id,
      type: 'review-request',
      title: 'Pending Review Request',
      content: `Reviewer ${req.reviewerName} requested to review your project "${req.projectTitle}".`,
      timestamp: req.requestedAt?.toDate?.() || new Date(),
      read: false, // or true if you want to track read status
      // You can add more fields if needed
    }))
  ];

  // Fetch reviewers for a project
  const handleShowReviewers = async (listingId) => {
    // Fetch reviewRequests for this listing
    const q = query(collection(db, "reviewRequests"), where("listingId", "==", listingId));
    const snap = await getDocs(q);
    const reviewers = await Promise.all(snap.docs.map(async (docSnap) => {
      const data = docSnap.data();
      let reviewerName = "Unknown Reviewer";
      let reviewerEmail = "";
      try {
        const reviewerDoc = await getDoc(doc(db, "users", data.reviewerId));
        if (reviewerDoc.exists()) {
          reviewerName = reviewerDoc.data().name || reviewerName;
          reviewerEmail = reviewerDoc.data().email || "";
        }
      } catch {}
      return {
        id: docSnap.id,
        reviewerName,
        reviewerEmail,
        status: data.status,
      };
    }));
    setReviewersForProject(reviewers);
    setShowReviewersDialog(true);
    setCardMenuAnchor(null);
  };

  const pendingReviewRef = useRef(null);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
<header
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--dark-blue)',
    color: 'var(--white)',
    borderBottom: '2px solid var(--light-blue)',
    padding: '1.5rem 2rem'
  }}
>
  <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    {/* Favicon as a circle */}
    <img
      src="/favicon.ico"
      alt="Favicon"
      style={{
        width: 44,           // Increased from 28 to 44 for better visibility
        height: 44,
        marginRight: 12,
        borderRadius: '50%',
        border: '2px solid #B1EDE8',
        objectFit: 'cover'
      }}
    />
    <IconButton onClick={() => navigate(-1)} sx={{ color: 'var(--white)' }}>
      <ArrowBackIosIcon />
    </IconButton>
    <section>
      <h1 style={{ fontWeight: 600, fontSize: '1.7rem', margin: 0 }}>
        Welcome, {userName}
      </h1>
      <p style={{ color: 'var(--accent-teal)', margin: 0 }}>
        Manage your research and collaborate
      </p>
    </section>
  </nav>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageNotification 
            messages={combinedNotifications}
            unreadCount={combinedNotifications.filter(msg => !msg.read).length}
            onMessageClick={handleMessageClick}
            selectedMessage={selectedMessage}
            onAccept={handleAcceptCollab}
            onReject={handleRejectCollab}
            onCloseSelected={() => setSelectedMessage(null)}
          />

          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              bgcolor: 'var(--light-blue)',
              color: 'var(--dark-blue)',
              '&:hover': { bgcolor: '#5AA9A3' }
            }}
          >
            <MenuIcon />
          </IconButton>

         <Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={() => setAnchorEl(null)}
  PaperProps={{
    sx: {
      bgcolor: 'var(--dark-blue)',
      minWidth: 200,
      color: 'var(--light-blue)',
      borderRadius: '0.8rem'
    }
  }}
>
  <MenuItem onClick={() => {
    if (hasProfile) {
      navigate('/researcher-profile');
    } else {
      navigate('/researcher-edit-profile');
    }
  }}>
    View Profile
  </MenuItem>
  <MenuItem onClick={handleAddListing}>New Research</MenuItem>
  <MenuItem onClick={() => navigate('/friends')}>Friends</MenuItem>
  <MenuItem onClick={handleCollaborate}>Collaborate</MenuItem>
  <MenuItem onClick={() => setShowContactForm(true)}>Chat with Us</MenuItem>
  <MenuItem onClick={handleLogout}>Logout</MenuItem>
</Menu>
        </nav>
      </header>

      {/* Main Content */}
      <section style={{ flex: 1, padding: 24 }}>
        {/* Search Section */}
        <section style={{ maxWidth: 800, margin: '0 auto', marginBottom: 32 }}>
          <form
            onSubmit={(e) => { 
              e.preventDefault();
              handleSearch();
            }}
            style={{ 
              padding: 8,
              display: 'flex',
              gap: 8,
              background: 'var(--background-paper, #fff)',
              position: 'relative'
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search research by title or researcher name..."
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '1.2rem',
                  borderColor: 'var(--dark-blue)'
                }
              }}
            />
            {/* Error Modal */}

            <Dialog
  open={deleteDialogOpen}
  onClose={() => setDeleteDialogOpen(false)}
  PaperProps={{
    sx: {
      bgcolor: '#1a2a42',
      color: '#B1EDE8',
      borderRadius: 2,
      p: 2
    }
  }}
>
  <DialogTitle>Confirm Deletion</DialogTitle>
  <DialogContent>
    <Typography variant="body1" sx={{ mb: 2 }}>
      Are you sure you want to delete this listing? This action cannot be undone.
    </Typography>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
      <Button
        variant="outlined"
        onClick={() => setDeleteDialogOpen(false)}
        sx={{
          color: '#B1EDE8',
          borderColor: '#B1EDE8',
          '&:hover': {
            borderColor: '#9dd8d3'
          }
        }}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={async () => {
          const success = await handleDeleteListing();
          if (success) {
            setMyListings(prev => prev.filter(listing => listing.id !== listingToDelete));
          }
        }}
        sx={{
          bgcolor: '#d32f2f',
          '&:hover': { bgcolor: '#b71c1c' }
        }}
      >
        Delete
      </Button>
    </Box>
  </DialogContent>
</Dialog>
            {showErrorModal && (
              <Dialog
                open={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                PaperProps={{
                  sx: {
                    bgcolor: 'var(--dark-blue)',
                    color: 'var(--white)',
                    padding: '1.5rem'
                  }
                }}
              >
                <DialogTitle>Profile Error</DialogTitle>
                <DialogContent>
                  <Typography variant="body1">
                    Error loading profile. Please try again.
                  </Typography>
                  <Button 
                    onClick={() => setShowErrorModal(false)}
                    variant="contained"
                    sx={{ 
                      mt: 2,
                      bgcolor: 'var(--light-blue)',
                      color: 'var(--dark-blue)'
                    }}
                  >
                    Close
                  </Button>
                </DialogContent>
              </Dialog>
            )}
            <Button 
              type="button"
              variant="contained"
              onClick={handleClear}
              sx={{
                bgcolor: 'var(--light-blue)',
                color: 'var(--dark-blue)',
                borderRadius: '1.5rem',
                minWidth: '100px',
                px: 3,
                '&:hover': { 
                  bgcolor: '#5AA9A3',
                  color: 'var(--white)'
                }
              }}
            >
              Clear
            </Button>
            <Button 
              type="button"
              variant="contained"
              onClick={handleSearch}
              sx={{
                bgcolor: 'var(--light-blue)',
                color: 'var(--dark-blue)',
                borderRadius: '1.5rem',
                minWidth: '100px',
                px: 3,
                '&:hover': { 
                  bgcolor: '#5AA9A3',
                  color: 'var(--white)'
                }
              }}
            >
              Search
            </Button>
            {/* Search Dropdown */}
            {dropdownVisible && (
              <section style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                right: 0,
                zIndex: 999,
                background: 'var(--background-paper, #fff)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                maxHeight: 300,
                overflowY: 'auto'
              }}>
                {searchResults.length === 0 ? (
                  <Typography sx={{ p: 2 }}>
                    {showNoResults ? "No research listings found." : "Start typing to search"}
                  </Typography>
                ) : 
                  searchResults.map(item => (
                    <article 
                      key={item.id}
                      style={{
                        padding: 16,
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee'
                      }}
                      onClick={() => navigate(`/listing/${item.id}`)}
                    >
                      <h2 style={{ margin: 0 }}>{item.title}</h2>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        By: {item.researcherName}
                      </p>
                      <p style={{ marginTop: 8 }}>{item.summary}</p>
                    </article>
                  ))}
              </section>
            )}
          </form>
        </section>

        {/* Listings Grid - Now horizontal scroll and reviewer card style */}
        <section style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 24, fontSize: '1.7rem' }}>Your Research</h2>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
            '&::-webkit-scrollbar': { height: 8 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#e3e8ee', borderRadius: 4 },
          }}>
            {filteredListings.map((item, idx) => (
              <Box
                key={`my-${item.id}-${idx}`}
                sx={{
                  maxWidth: 350,
                  minWidth: 280,
                  bgcolor: "#fff",
                  color: "#222",
                  borderRadius: "1.2rem",
                  boxShadow: "0 6px 24px rgba(30, 60, 90, 0.12), 0 1.5px 4px rgba(30, 60, 90, 0.10)",
                  border: "1px solid #e3e8ee",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  m: 0,
                  transition: "box-shadow 0.2s, transform 0.2s",
                  '&:hover': {
                    boxShadow: "0 12px 32px rgba(30, 60, 90, 0.18), 0 2px 8px rgba(30, 60, 90, 0.12)",
                    transform: "translateY(-4px) scale(1.03)",
                    borderColor: "#B1EDE8",
                  },
                  position: 'relative'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 1, pt: 2, pb: 0 }}>
                  <IconButton
                    size="small"
                    onClick={e => {
                      setCardMenuAnchor(e.currentTarget);
                      setCardMenuId(item.id);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                <Box sx={{ flex: 1, pt: 0, px: 2, pb: 2 }}>
                  <Typography variant="h6" sx={{ color: "var(--dark-blue)", fontWeight: 700, fontSize: "1.2rem", mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ color: "#222", mb: 1 }}>
                    {item.summary}
                  </Typography>
                </Box>
                <Box sx={{ pt: 0, px: 2, pb: 2 }}>
                  <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        bgcolor: 'var(--light-blue)',
                        color: 'var(--dark-blue)',
                        borderRadius: '1.5rem',
                        fontWeight: 600,
                        px: 2,
                        py: 0.5,
                        minWidth: 0,
                        boxShadow: '0 2px 10px rgba(100,204,197,0.08)',
                        textTransform: "none",
                        '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' },
                        flex: 1
                      }}
                      onClick={() => navigate(`/listing/${item.id}`)}
                    >
                      View Listing
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        bgcolor: 'var(--light-blue)',
                        color: 'var(--dark-blue)',
                        borderRadius: '1.5rem',
                        fontWeight: 600,
                        px: 2,
                        py: 0.5,
                        minWidth: 0,
                        boxShadow: '0 2px 10px rgba(100,204,197,0.08)',
                        textTransform: "none",
                        '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' },
                        flex: 1
                      }}
                      onClick={() => navigate(`/collaboration/${item.id}`)}
                    >
                      Collaboration Room
                    </Button>
                  </Stack>
                </Box>
              </Box>
            ))}
          </Box>
          {/* 3-dot menu for research cards */}
          <Menu
            anchorEl={cardMenuAnchor}
            open={Boolean(cardMenuAnchor)}
            onClose={() => setCardMenuAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                setListingToDelete(cardMenuId);
                setDeleteDialogOpen(true);
                setCardMenuAnchor(null);
              }}
            >
              Delete Project
            </MenuItem>
            <MenuItem
              onClick={async () => {
                await handleShowReviewers(cardMenuId);
              }}
            >
              See Reviewers
            </MenuItem>
          </Menu>
          {/* Reviewers Dialog */}
          <Dialog
            open={showReviewersDialog}
            onClose={() => setShowReviewersDialog(false)}
            PaperProps={{
              sx: {
                bgcolor: '#fff',
                color: '#222',
                borderRadius: 2,
                minWidth: 350,
                maxWidth: 500
              }
            }}
          >
            <DialogTitle>Reviewers for this Project</DialogTitle>
            <DialogContent>
              {reviewersForProject.length === 0 ? (
                <Typography>No reviewers yet.</Typography>
              ) : (
                reviewersForProject.map(r => (
                  <Box key={r.id} sx={{ mb: 2, p: 1, borderBottom: '1px solid #eee' }}>
                    <Typography variant="subtitle1">{r.reviewerName}</Typography>
                    <Typography variant="body2">{r.reviewerEmail}</Typography>
                    <Typography variant="body2" sx={{ color: r.status === 'accepted' ? 'green' : r.status === 'pending' ? 'orange' : 'red' }}>
                      Status: {r.status}
                    </Typography>
                  </Box>
                ))
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowReviewersDialog(false)}>Close</Button>
            </DialogActions>
          </Dialog>
        </section>

        {/* Collaborations Section - horizontal scroll, reviewer card style */}
        <section style={{ marginTop: 48, maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto' }}>
          <h2 style={{ marginBottom: 24, fontSize: '1.7rem'}}>Your Collaborations</h2>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
            '&::-webkit-scrollbar': { height: 8 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#e3e8ee', borderRadius: 4 },
          }}>
            {collabListings.map((listing, idx) => (
              <Box
                key={`collab-${listing.id}-${idx}`}
                sx={{
                  maxWidth: 350,
                  minWidth: 280,
                  bgcolor: "#fff",
                  color: "#222",
                  borderRadius: "1.2rem",
                  boxShadow: "0 6px 24px rgba(30, 60, 90, 0.12), 0 1.5px 4px rgba(30, 60, 90, 0.10)",
                  border: "1px solid #e3e8ee",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  m: 0,
                  transition: "box-shadow 0.2s, transform 0.2s",
                  '&:hover': {
                    boxShadow: "0 12px 32px rgba(30, 60, 90, 0.18), 0 2px 8px rgba(30, 60, 90, 0.12)",
                    transform: "translateY(-4px) scale(1.03)",
                    borderColor: "#B1EDE8",
                  },
                  position: 'relative'
                }}
              >
                <Box sx={{ flex: 1, pt: 0, px: 2, pb: 2 }}>
                  <Typography variant="h6" sx={{ color: "var(--dark-blue)", fontWeight: 700, fontSize: "1.2rem", mb: 1 }}>
                    {listing.title}
                  </Typography>
                  <Typography sx={{ color: "#222", mb: 1 }}>
                    {listing.summary}
                  </Typography>
                </Box>
                <Box sx={{ pt: 0, px: 2, pb: 2 }}>
                  <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        bgcolor: 'var(--light-blue)',
                        color: 'var(--dark-blue)',
                        borderRadius: '1.5rem',
                        fontWeight: 600,
                        px: 2,
                        py: 0.5,
                        minWidth: 0,
                        boxShadow: '0 2px 10px rgba(100,204,197,0.08)',
                        textTransform: "none",
                        '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' },
                        flex: 1
                      }}
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    >
                      View Project
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        bgcolor: 'var(--light-blue)',
                        color: 'var(--dark-blue)',
                        borderRadius: '1.5rem',
                        fontWeight: 600,
                        px: 2,
                        py: 0.5,
                        minWidth: 0,
                        boxShadow: '0 2px 10px rgba(100,204,197,0.08)',
                        textTransform: "none",
                        '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' },
                        flex: 1
                      }}
                      onClick={() => navigate(`/collaboration/${listing.id}`)}
                    >
                      Collaboration Room
                    </Button>
                  </Stack>
                </Box>
              </Box>
            ))}
          </Box>
        </section>
        {/* Collaboration Requests Section */}
<section style={{ maxWidth: 1200, margin: '48px auto 0 auto' }}>
  
  <Paper
    sx={{
      p: 2,
      bgcolor: '#fff',           // White background
      color: '#222',             // Black text
      boxShadow: "0 6px 24px rgba(30, 60, 90, 0.10)",
      borderRadius: "1.2rem",
      mb: 4
    }}
  >
    <CollaborationRequestsPanel />
  </Paper>
</section>
<section ref={pendingReviewRef} style={{ maxWidth: 800, margin: '32px auto' }}>
  <h2>Pending Review Requests</h2>
  {reviewRequests.length === 0 ? (
    <p>No pending review requests.</p>
  ) : (
    reviewRequests.map(req => (
      <Paper key={req.id} sx={{ p: 2, mb: 2, bgcolor: '#1a2a42', color: '#B1EDE8' }}>
        <Typography variant="subtitle1">
          Reviewer: {req.reviewerName} {req.reviewerEmail && <>(
            {req.reviewerEmail}
          )</>}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Project: <strong>{req.projectTitle}</strong>
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {req.projectSummary}
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          <Button variant="contained" color="success" onClick={() => handleAcceptReviewRequest(req.id)}>
            Accept
          </Button>
          <Button variant="contained" color="error" onClick={() => handleDeclineReviewRequest(req.id)}>
            Decline
          </Button>
        </Box>
      </Paper>
    ))
  )}
</section>

        {/* Contact Form Dialog */}
        <Dialog
          open={showContactForm}
          onClose={() => setShowContactForm(false)}
          PaperProps={{
            sx: {
              bgcolor: '#1a2a42',
              color: '#B1EDE8',
              borderRadius: 2
            }
          }}
        >
          <DialogTitle>
            <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Contact Form
              <IconButton onClick={() => setShowContactForm(false)}>
                <Close sx={{ color: '#B1EDE8' }} />
              </IconButton>
            </section>
          </DialogTitle>
          <DialogContent>
            <ContactForm onClose={() => setShowContactForm(false)} />
          </DialogContent>
        </Dialog>
      </section>

      <footer>
        <Footer />
      </footer>
    </main>
  );
};

export default ResearcherDashboard;
