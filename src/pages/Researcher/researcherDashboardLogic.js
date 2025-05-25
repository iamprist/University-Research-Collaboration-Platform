// researcherDashboardLogic.js - Backend logic for ResearcherDashboard
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../config/firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import axios from 'axios';
import { deleteDoc } from 'firebase/firestore';


export const useResearcherDashboard = () => {
  const navigate = useNavigate();

  // State variables
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [listingToDelete, setListingToDelete] = useState(null);
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
  const [ipAddress, setIpAddress] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Fetch user's public IP address
  useEffect(() => {
    let isMounted = true;
    const fetchIpAddress = async () => {
      try {
        const response = await axios.get('https://api.ipify.org?format=json');
        // In test mode, use setTimeout to avoid act warnings; otherwise, use microtask
        if (isMounted) {
          if (process.env.NODE_ENV === 'test') {
            setTimeout(() => setIpAddress(response.data.ip), 0);
          } else {
            Promise.resolve().then(() => setIpAddress(response.data.ip));
          }
        }
      } catch (error) {
        console.error('Error fetching IP address:', error);
      }
    };
    fetchIpAddress();
    return () => { isMounted = false; };
  }, []);

  // Check authentication and set userId
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
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [navigate]);

  // Fetch user profile and name
  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!isMounted) return;
        if (userDoc.exists()) {
          setHasProfile(true);
          setUserName(userDoc.data().name || 'Researcher');
        } else {
          navigate('/researcher-edit-profile');
        }
      } catch (err) {
        if (isMounted) setShowErrorModal(true);
      }
    };
    fetchUserProfile();
    return () => { isMounted = false; };
  }, [userId, navigate]);

  // Listen for messages and collaborations
  useEffect(() => {
    if (!userId) return;
    let unsubMessages = null;
    let unsubCollabs = null;
    try {
      const messagesRef = collection(db, 'users', userId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));
      unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        setMessages(messagesData);
        setUnreadCount(messagesData.filter(msg => !msg.read).length);
      });
      const collabQuery = query(
        collection(db, 'collaborations'),
        where('collaboratorId', '==', userId)
      );
      unsubCollabs = onSnapshot(collabQuery, async (snapshot) => {
        const collabs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const listings = await Promise.all(
          collabs.map(async collab => {
            const listingDoc = await getDoc(doc(db, 'research-listings', collab.listingId));
            return listingDoc.exists() ? { id: listingDoc.id, ...listingDoc.data() } : null;
          })
        );
        setCollabListings(listings.filter(Boolean));
      });
    } catch (err) {
      // Defensive: log error if snapshot setup fails
      console.error('Error setting up Firestore listeners:', err);
    }
    return () => {
      if (typeof unsubMessages === 'function') unsubMessages();
      if (typeof unsubCollabs === 'function') unsubCollabs();
    };
  }, [userId]);

  // Fetch all research listings for search
  useEffect(() => {
    if (!userId || !hasProfile) return;
    let isMounted = true;
    const fetchListings = async () => {
      try {
        const q = query(collection(db, 'research-listings'));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot || !Array.isArray(querySnapshot.docs)) {
          setAllListings([]);
          return;
        }
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
        if (isMounted) setAllListings(data);
      } catch (error) {
        console.error('Error fetching listings:', error);
      }
    };
    fetchListings();
    return () => { isMounted = false; };
  }, [userId, hasProfile]);

  // Fetch only the current user's listings
  useEffect(() => {
    if (!userId || !hasProfile) return;
    let isMounted = true;
    const fetchMyListings = async () => {
      try {
        const q = query(collection(db, 'research-listings'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot || !Array.isArray(querySnapshot.docs)) {
          setMyListings([]);
          return;
        }
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (isMounted) setMyListings(data);
      } catch (error) {
        console.error('Error fetching user listings:', error);
      }
    };
    fetchMyListings();
    return () => { isMounted = false; };
  }, [userId, hasProfile]);

  // Update filtered listings when myListings changes
  useEffect(() => {
    setFilteredListings(myListings);
  }, [myListings]);

  // Search handler for research listings
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setDropdownVisible(false);
      setShowNoResults(false); // reset when search is empty
      return;
    }
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = allListings.filter(item => {
      const title = item.title?.toLowerCase() || '';
      const researcherName = item.researcherName?.toLowerCase() || '';
      return title.includes(searchTermLower) || researcherName.includes(searchTermLower);
    });
    setSearchResults(filtered);
    setDropdownVisible(filtered.length > 0); //only show dropdown if there are results
    setShowNoResults(filtered.length === 0);  // Set showNoResults based on actual results
    clearTimeout(dropdownTimeout.current);
    dropdownTimeout.current = setTimeout(() => {
      setDropdownVisible(false);
    }, 5000);
    setShowNoResults(filtered.length === 0);
  };

  // Mark a message as read in Firestore
const markMessageAsRead = async (messageId) => {
  if (!userId || !messageId) return;
  try {
    await updateDoc(doc(db, 'users', userId, 'messages', messageId), {
      read: true
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error; // Re-throw to allow handleMessageClick to handle it
  }
};

  // Handle clicking a notification message
const handleMessageClick = async (message) => {
  if (!message || !message.id) return;
  
  try {
    await markMessageAsRead(message.id);
    
    if (!userId) return;
    
    if (message.type === 'collaboration-request') {
      setSelectedMessage(message);
      return;
    }
    
    setSelectedMessage(message);
    switch (message.type) {
      case 'review-request':
        navigate(`/review-requests/${message.relatedId}`);
        break;
      case 'upload-confirmation':
        navigate(`/listing/${message.relatedId}`);
        break;
      default:
        break;
    }
  } catch (error) {
    // This ensures we don't set selectedMessage on error
    console.error('Error marking message as read:', error);
    setSelectedMessage(null); // Ensure selectedMessage is cleared on error
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

  // Navigation handlers
  const handleAddListing = () => navigate('/researcher/add-listing');
  const handleCollaborate = () => navigate('/researcher/collaborate');
  const handleInputFocus = () => {
    setDropdownVisible(false);
    clearTimeout(dropdownTimeout.current);
  };
  const handleInputChange = (e) => {
    setSearchTerm(e?.target?.value || '');
    setDropdownVisible(false);
    clearTimeout(dropdownTimeout.current);
  };
  const handleClear = () => {
    setSearchTerm('');
    setSearchResults([]);
    setDropdownVisible(false);
    setShowNoResults(false);
  };

  // Log user events
  const logEvent = async ({ userId, role, userName, action, details, ip, target }) => {
    try {
      await addDoc(collection(db, 'logs'), {
        userId,
        role,
        userName,
        action,
        details,
        ip,
        target: target || 'Unknown', // Ensure target is always defined
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error logging event:', error);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await logEvent({
          userId: user.uid,
          role: 'Researcher',
          userName: user.displayName || 'N/A',
          action: 'Logout',
          details: 'User logged out',
          ip: ipAddress,
          target: 'Researcher Dashboard',
        });
        await auth.signOut();
        navigate('/signin');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
const handleDeleteListing = async () => {
  if (!listingToDelete) return false;
  try {
    await deleteDoc(doc(db, 'research-listings', listingToDelete));
    await logEvent({
      userId,
      role: 'Researcher',
      userName,
      action: 'Delete Listing',
      details: 'Deleted a research listing',
      ip: ipAddress,
      target: listingToDelete
    });
    setListingToDelete(null);
    setDeleteDialogOpen(false);
    return true;
  } catch (error) {
    console.error('Error deleting listing:', error);
    return false;
  }
};
  // Return all state and handlers for the component to use
  return {
    // State
    allListings,
    myListings,
    userId,
    hasProfile,
    collabListings,
    searchTerm,
    searchResults,
    dropdownVisible,
    showNoResults,
    showErrorModal,
    filteredListings,
    userName,
    messages,
    unreadCount,
    showContactForm,
    anchorEl,
    ipAddress,
    selectedMessage,
    deleteDialogOpen,
  setDeleteDialogOpen,
  listingToDelete,
  setListingToDelete,
    // Handlers
    handleSearch,
    handleMessageClick,
    handleAddListing,
    handleCollaborate,
    handleInputFocus,
    handleInputChange,
    handleClear,
    handleLogout,
    setSearchTerm,
    setAnchorEl,
    setShowContactForm,
    setShowErrorModal,
    setSelectedMessage,
    // For testability: allow tests to set userId directly
    setUserId,
    handleAcceptCollab,
    handleRejectCollab,
  handleDeleteListing
  };
};