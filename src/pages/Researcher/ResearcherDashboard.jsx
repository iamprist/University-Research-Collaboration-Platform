import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../config/firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc, onSnapshot, orderBy, updateDoc, addDoc, serverTimestamp, deleteDoc, writeBatch } from 'firebase/firestore';
import './ResearcherDashboard.css';
import axios from "axios";
import Footer from '../../components/Footer';
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
import FloatingHelpChat from '../../components/FloatingHelpChat';

function getFirstNSentences(text, n = 1) {
  if (!text) return "";
  const sentences = text.match(/[^.!?]+[.!?]+[\])'"`’”]*|.+/g) || [];
  return sentences.slice(0, n).join(" ");
}

const MessageNotification = ({ messages, unreadCount, onMessageClick, selectedMessage, onAccept, onReject, onCloseSelected, onClearNotifications }) => {
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
            <Box>
              <Button
                size="small"
                variant="outlined"
                sx={{ color: '#B1EDE8', borderColor: '#B1EDE8', mr: 1, minWidth: 0, px: 1 }}
                onClick={() => {
                  onClearNotifications && onClearNotifications();
                  setAnchorEl(null);
                  onCloseSelected && onCloseSelected();
                }}
              >
                Mark as read
              </Button>
              <IconButton onClick={() => { setAnchorEl(null); onCloseSelected && onCloseSelected(); }} size="small">
                <Close sx={{ color: '#B1EDE8' }} />
              </IconButton>
            </Box>
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
  const {
    allListings, setAllListings,
    myListings, setMyListings,
    userId, setUserId,
    hasProfile, setHasProfile,
    collabListings, setCollabListings,
    searchTerm, setSearchTerm,
    searchResults, setSearchResults,
    dropdownVisible, setDropdownVisible,
    showNoResults, setShowNoResults,
    dropdownTimeout,
    filteredListings, setFilteredListings,
    userName, setUserName,
    messages, setMessages,
    showContactForm, setShowContactForm,
    ipAddress, setIpAddress,
    anchorEl, setAnchorEl,
    selectedMessage, setSelectedMessage,
    cardMenuAnchor, setCardMenuAnchor,
    cardMenuId, setCardMenuId,
    showReviewersDialog, setShowReviewersDialog,
    reviewersForProject, setReviewersForProject,
    reviewRequests, setReviewRequests,
    expandedSummaries, setExpandedSummaries,
    deleteDialogOpen, setDeleteDialogOpen,
    listingToDelete, setListingToDelete,
    dropdownHover, setDropdownHover,
    pendingReviewRef,
    handleAcceptReviewRequest,
    handleDeclineReviewRequest,
    handleSearch,
    markMessageAsRead,
    handleMessageClick,
    handleAddListing,
    handleCollaborate,
    handleInputChange,
    handleClear,
    logEvent,
    handleLogout,
    handleAcceptCollab,
    handleRejectCollab,
    handleClearNotifications,
    combinedNotifications,
    handleShowReviewers,
    handleToggleSummary,
    handleDropdownMouseEnter,
    handleDropdownMouseLeave,
    handleDeleteListing,
  } = useResearcherDashboard();

  const navigate = useNavigate();

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


  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background-main, #f7fafc)' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, var(--dark-blue) 70%, var(--light-blue) 100%)',
          color: 'var(--white)',
          borderBottom: '2px solid var(--light-blue)',
          padding: '1.5rem 2rem',
          boxShadow: '0 2px 12px rgba(30,60,90,0.08)'
        }}
      >
        <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src="/favicon.ico"
            alt="Favicon"
            style={{
              width: 48,
              height: 48,
              marginRight: 16,
              borderRadius: '50%',
              border: '2.5px solid #B1EDE8',
              objectFit: 'cover',
              boxShadow: '0 2px 8px #5AA9A340'
            }}
          />
          <IconButton onClick={() => navigate(-1)} sx={{ color: 'var(--white)' }}>
            <ArrowBackIosIcon />
          </IconButton>
          <section>
            <h1 style={{ fontWeight: 700, fontSize: '2rem', margin: 0, letterSpacing: 0.5 }}>
              Welcome, {userName}
            </h1>
            <p style={{ color: 'var(--accent-teal)', margin: 0, fontSize: '1.1rem' }}>
              Manage your research and collaborate
            </p>
          </section>
        </nav>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MessageNotification 
            messages={combinedNotifications}
            unreadCount={combinedNotifications.filter(msg => !msg.read).length}
            onMessageClick={handleMessageClick}
            selectedMessage={selectedMessage}
            onAccept={handleAcceptCollab}
            onReject={handleRejectCollab}
            onCloseSelected={() => setSelectedMessage(null)}
            onClearNotifications={handleClearNotifications} // <-- add this
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
                      <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </nav>
      </header>

      {/* Main Content */}
      <section style={{ flex: 1, padding: 32, background: 'var(--background-main, #f7fafc)' }}>
        {/* Search Section */}
        <section style={{ maxWidth: 800, margin: '0 auto', marginBottom: 32 }}>
          <form
            onSubmit={(e) => { 
              e.preventDefault();
              handleSearch();
            }}
            style={{ 
              padding: 12,
              display: 'flex',
              gap: 12,
              background: 'var(--background-paper, #fff)',
              borderRadius: 18,
              boxShadow: '0 2px 12px rgba(30,60,90,0.06)',
              position: 'relative'
            }}
          >
            <TextField
              id="search-input"
              fullWidth
              variant="outlined"
              placeholder="Search research by title or researcher name..."
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() => setDropdownVisible(true)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '1.2rem',
                  borderColor: 'var(--dark-blue)'
                }
              }}
            />
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
                fontWeight: 600,
                boxShadow: 'none',
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
                fontWeight: 600,
                boxShadow: 'none',
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
              <section
                id="search-dropdown"
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleDropdownMouseLeave}
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  right: 0,
                  zIndex: 999,
                  background: 'var(--background-paper, #fff)',
                  boxShadow: '0 8px 32px rgba(30,60,90,0.18)',
                  maxHeight: 400,
                  overflowY: 'auto',
                  borderRadius: 18,
                  border: '1.5px solid #B1EDE8',
                  padding: 12,
                  marginTop: 6,
                  transition: 'box-shadow 0.2s',
                }}
              >
                {searchResults.length === 0 ? (
                  <Typography sx={{ p: 2, color: '#888', textAlign: 'center', fontSize: '1.08rem' }}>
                    {showNoResults ? "No research listings found." : "Start typing to search"}
                  </Typography>
                ) : (
                  searchResults.map(item => (
                    <Paper
                      key={item.id}
                      elevation={3}
                      sx={{
                        mb: 2,
                        p: 2.5,
                        borderRadius: 4,
                        cursor: 'pointer',
                        border: '1.5px solid #e3e8ee',
                        transition: 'box-shadow 0.18s, border 0.18s, background 0.18s',
                        '&:hover': {
                          boxShadow: '0 6px 24px #B1EDE880',
                          border: '2px solid #5AA9A3',
                          background: '#eafcfa',
                          transform: 'scale(1.015)'
                        },
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2,
                        minHeight: 90,
                      }}
                      onClick={() => {
                        setDropdownVisible(false);
                        navigate(`/listing/${item.id}`);
                      }}
                    >
                      <Box sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        <Typography variant="h6" sx={{ color: 'var(--dark-blue)', fontWeight: 700, fontSize: '1.13rem', mb: 0.5, lineHeight: 1.2 }}>
                          {item.title}
                        </Typography>
                        <Typography sx={{ color: '#5AA9A3', fontSize: '1rem', mb: 0.5, fontWeight: 500 }}>
                          By: {item.researcherName}
                        </Typography>
                        <Typography
                          sx={{
                            color: '#444',
                            fontSize: '0.99rem',
                            mb: 0.5,
                            lineHeight: 1.5,
                            maxHeight: 48,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2, // Show up to 2 lines, then ellipsis
                            WebkitBoxOrient: 'vertical',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word'
                          }}
                        >
                          {getFirstNSentences(item.summary, 1)}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          borderRadius: 3,
                          bgcolor: 'var(--light-blue)',
                          color: 'var(--dark-blue)',
                          fontWeight: 700,
                          px: 2.5,
                          minWidth: 0,
                          textTransform: 'none',
                          boxShadow: '0 2px 10px rgba(100,204,197,0.10)',
                          ml: 2,
                          alignSelf: 'center',
                          '&:hover': {
                            bgcolor: '#5AA9A3',
                            color: 'var(--white)'
                          }
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          setDropdownVisible(false);
                          navigate(`/listing/${item.id}`);
                        }}
                      >
                        View
                      </Button>
                    </Paper>
                  ))
                )}
              </section>
            )}
          </form>
        </section>

        {/* Listings Grid - Now horizontal scroll and reviewer card style */}
        <section style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 24, fontSize: '1.7rem', fontWeight: 700, color: 'var(--dark-blue)' }}>Your Research</h2>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 3,
            overflowX: 'auto',
            pb: 2,
            '&::-webkit-scrollbar': { height: 8 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#e3e8ee', borderRadius: 4 },
          }}>
            {filteredListings.map((item, idx) => {
              const sentences = (item.summary?.match(/[^.!?]+[.!?]+[\])'"`’”]*|.+/g) || []);
              const isLong = sentences.length > 1;
              const expanded = expandedSummaries[item.id];
              return (
                <Box
                  key={`my-${item.id}-${idx}`}
                  sx={{
                    maxWidth: 370,
                    minWidth: 290,
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
                    <Typography sx={{ color: "#222", mb: 1, fontSize: '1rem', lineHeight: 1.6 }}>
                      {expanded
                        ? item.summary
                        : getFirstNSentences(item.summary, 1)
                      }
                      {isLong && (
                        <Button
                          size="small"
                          sx={{
                            ml: 1,
                            color: 'var(--light-blue)',
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 0.5,
                            minWidth: 0,
                            background: 'none',
                            boxShadow: 'none',
                            fontSize: '0.98rem',
                            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                          }}
                          onClick={() => handleToggleSummary(item.id)}
                        >
                          {expanded ? "Show less" : "Show more"}
                        </Button>
                      )}
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
                        onClick={() => navigate(`/collaboration/${item.id}`, { state: { userRole: 'researcher' } })}
                      >
                        Collaboration Room
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              );
            })}
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

        {/* Collaborations Section */}
        <section style={{ marginTop: 48, maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto' }}>
          <h2 style={{ marginBottom: 24, fontSize: '1.7rem', fontWeight: 700, color: 'var(--dark-blue)' }}>Your Collaborations</h2>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 3,
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
    <Box sx={{ 
      flex: 1, 
      pt: 0, 
      px: 2, 
      pb: 2,
      height: '120px', // Fixed height for text container
      overflow: 'hidden' 
    }}>
      <Typography 
        variant="h6" 
        sx={{ 
          color: "var(--dark-blue)", 
          fontWeight: 700, 
          fontSize: "1.1rem", 
          mb: 0.5,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
                       {listing.title}
      </Typography>
      <Typography 
        sx={{ 
          color: "#222",
          fontSize: '0.875rem',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 7, // Limit to 3 lines
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          position: 'relative',
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1.5em',
            background: 'linear-gradient(to bottom, transparent, white 75%)'
          }
        }}
      >
        {listing.summary}
      </Typography>
    </Box>
    <Box sx={{ 
      pt: 0, 
      px: 2, 
      pb: 2,
      borderTop: '1px solid #e3e8ee' 
    }}>

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
                      onClick={() => navigate(`/collaboration/${listing.id}`, { state: { userRole: 'researcher' } })}
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
              bgcolor: '#fff',
              color: '#222',
              boxShadow: "0 6px 24px rgba(30, 60, 90, 0.10)",
              borderRadius: "1.2rem",
              mb: 4
            }}
          >
            <CollaborationRequestsPanel />
          </Paper>
        </section>

        {/* Pending Review Requests */}
        <section ref={pendingReviewRef} style={{ maxWidth: 800, margin: '32px auto' }}>
          <h2 style={{ color: 'var(--dark-blue)', fontWeight: 700, marginBottom: 16 }}>Pending Review Requests</h2>
          {reviewRequests.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', color: '#888', bgcolor: '#f5f7fa', borderRadius: 2 }}>
              No pending review requests.
            </Paper>
          ) : (
            reviewRequests.map(req => (
              <Paper key={req.id} sx={{ p: 2.5, mb: 2, bgcolor: '#1a2a42', color: '#B1EDE8', borderRadius: 2, boxShadow: '0 2px 8px #0001' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Reviewer: {req.reviewerName} {req.reviewerEmail && <span style={{ color: '#B1EDE8', fontWeight: 400 }}>({req.reviewerEmail})</span>}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Project: <strong>{req.projectTitle}</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, color: '#B1EDE8', opacity: 0.9 }}>
                  {getFirstNSentences(req.projectSummary, 5)}
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


        {/* Delete Listing Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Project</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this project? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button color="error" onClick={handleDeleteListing}>Delete</Button>
          </DialogActions>
        </Dialog>
      </section>

      <footer>
        <Footer />
      </footer>
      <FloatingHelpChat chatId={`support_${auth.currentUser?.uid}`} title="Contact Admin Support" />
    </main>
  );
};

export default ResearcherDashboard;