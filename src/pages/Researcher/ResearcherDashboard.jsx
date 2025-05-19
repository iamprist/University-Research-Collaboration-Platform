import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../config/firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc, onSnapshot, orderBy, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import './ResearcherDashboard.css';
import axios from "axios";
import CollaborationRequestsPanel from '../../components/CollaborationRequestsPanel';
import Footer from '../../components/Footer';
import ContactForm from '../../components/ContactForm';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

// MUI Components
import { 
  Button,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Paper,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Box
} from '@mui/material';
import { Notifications, Menu as MenuIcon, Close } from '@mui/icons-material';

const MessageNotification = ({ messages, unreadCount, onMessageClick }) => {
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
        onClose={() => setAnchorEl(null)}
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
            <IconButton onClick={() => setAnchorEl(null)} size="small">
              <Close sx={{ color: '#B1EDE8' }} />
            </IconButton>
          </Box>
          
          {messages.length === 0 ? (
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
                  setAnchorEl(null);
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [ipAddress, setIpAddress] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

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
      setUnreadCount(messagesData.filter(msg => !msg.read).length);
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
    markMessageAsRead(message.id);
    switch(message.type) {
      case 'collaboration-request':
        navigate('/collaboration-requests');
        break;
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

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box 
        component="header"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'var(--dark-blue)',
          color: 'var(--white)',
          borderBottom: '2px solid var(--light-blue)',
          p: '1.5rem 2rem'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: 'var(--white)' }}>
            <ArrowBackIosIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, fontSize: '1.7rem'}}>
              Welcome, {userName}
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--accent-teal)' }}>
              Manage your research and collaborate
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MessageNotification 
            messages={messages}
            unreadCount={unreadCount}
            onMessageClick={handleMessageClick}
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
            <MenuItem onClick={() => navigate('/researcher-profile')}>View Profile</MenuItem>
            <MenuItem onClick={handleAddListing}>New Research</MenuItem>
            <MenuItem onClick={() => navigate('/friends')}>Friends</MenuItem>
            <MenuItem onClick={handleCollaborate}>Collaborate</MenuItem>
            <MenuItem onClick={() => setShowContactForm(true)}>Chat with Us</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 3 }}>
{/* Updated Search Section with matching buttons */}
<Box sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
  <Paper 
    component="form"
    onSubmit={(e) => { 
      e.preventDefault();
      handleSearch();
    }}
    sx={{ 
      p: 1,
      display: 'flex',
      gap: 1,
      bgcolor: 'background.paper',
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
    
    {/* Clear Button */}
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

    {/* Search Button */}
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
      <Paper sx={{
        position: 'absolute',
        top: '110%',
        left: 0,
        right: 0,
        zIndex: 999,
        bgcolor: 'background.paper',
        boxShadow: 3,
        maxHeight: 300,
        overflowY: 'auto'
      }}>
        {searchResults.length === 0 ? (
      <Typography sx={{ p: 2 }}>
        {showNoResults ? "No research listings found." : "Start typing to search"}
      </Typography>
    ) : 
      searchResults.map(item => (
          <Box 
            key={item.id}
            sx={{
              p: 2,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' }
            }}
            onClick={() => navigate(`/listing/${item.id}`)}
          >
            <Typography variant="subtitle1">{item.title}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              By: {item.researcherName}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {item.summary}
            </Typography>
          </Box>
        ))}
      </Paper>
    )}
  </Paper>
</Box>

        {/* Listings Grid */}
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Typography variant="h4" sx={{ mb: 3, fontSize: '1.7rem' }}>Your Research</Typography>
          <Grid container spacing={3}>
            {filteredListings.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Paper 
                  sx={{
                    p: 3,
                    bgcolor: '#132238',
                    color: '#B1EDE8',
                    borderRadius: 2,
                    transition: 'transform 0.3s',
                    '&:hover': { 
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)'
                    }
                  }}
                >
                  <Typography variant="h6" gutterBottom>{item.title}</Typography>
                  <Typography variant="body2" paragraph>{item.summary}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/listing/${item.id}`)}
                      sx={{
                        bgcolor: '#2a3a57',
                        '&:hover': { bgcolor: '#3a4a67' }
                      }}
                    >
                      View Listing
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/collaboration/${item.id}`)}
                      sx={{
                        bgcolor: '#B1EDE8',
                        color: '#132238',
                        '&:hover': { bgcolor: '#9dd8d3' }
                      }}
                    >
                      Collaboration Room
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
           <Box sx={{ mt: 6, maxWidth: 1200, mx: 'auto' }}>
  <Typography variant="h4" sx={{ mb: 3, fontSize: '1.7rem' }}>Collaboration Requests</Typography>
  <Paper sx={{ p: 3, bgcolor: '#132238', borderRadius: 2 }}>
    <CollaborationRequestsPanel userId={userId} />
  </Paper>
</Box> 
        {/* Collaborations Section */}
        <Box sx={{ mt: 6, maxWidth: 1200, mx: 'auto' }}>
          <Typography variant="h4" sx={{ mb: 3, fontSize: '1.7rem'}}>Your Collaborations</Typography>
          <Grid container spacing={3}>
            {collabListings.map(listing => (
              <Grid item xs={12} sm={6} md={4} key={listing.id}>
                <Paper 
                  sx={{
                    p: 3,
                    bgcolor: '#132238',
                    color: '#B1EDE8',
                    borderRadius: 2,
                    transition: 'transform 0.3s',
                    '&:hover': { 
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)'
                    }
                  }}
                >
                  <Typography variant="h6" gutterBottom>{listing.title}</Typography>
                  <Typography variant="body2" paragraph>{listing.summary}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/listing/${listing.id}`)}
                      sx={{
                        bgcolor: '#2a3a57',
                        
                        '&:hover': { bgcolor: '#3a4a67' }
                      }}
                    >
                      View Project
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/collaboration/${listing.id}`)}
                      sx={{
                        bgcolor: '#B1EDE8',
                        color: '#132238',
                        '&:hover': { bgcolor: '#9dd8d3' }
                      }}
                    >
                      Collaboration Room
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

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
            <Box display="flex" justifyContent="space-between" alignItems="center">
              Contact Form
              <IconButton onClick={() => setShowContactForm(false)}>
                <Close sx={{ color: '#B1EDE8' }} />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <ContactForm onClose={() => setShowContactForm(false)} />
          </DialogContent>
        </Dialog>
      </Box>

      <Footer />
    </Box>
  );
};

export default ResearcherDashboard;
