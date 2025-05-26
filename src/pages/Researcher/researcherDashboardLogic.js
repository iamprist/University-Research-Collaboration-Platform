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
  serverTimestamp,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import axios from "axios";

export function useResearcherDashboard() {
  // State
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
  const [reviewRequests, setReviewRequests] = useState([]);
  const [expandedSummaries, setExpandedSummaries] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);
  const [dropdownHover, setDropdownHover] = useState(false);
  const pendingReviewRef = useRef(null);
  const navigate = useNavigate();

  // Effects
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
      } catch (err) {}
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

  // Handlers
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

  const handleAcceptCollab = async (message) => {
    try {
      await updateDoc(doc(db, 'collaboration-requests', message.id), {
        status: 'accepted',
        respondedAt: new Date()
      });
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

  const handleClearNotifications = async () => {
    if (!userId) return;
    try {
      const messagesRef = collection(db, 'users', userId, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      const batch = writeBatch(db);
      let updatedMessages = [];
      messagesSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (!data.read) {
          batch.update(docSnap.ref, { read: true });
          updatedMessages.push({ ...data, id: docSnap.id, read: true });
        } else {
          updatedMessages.push({ ...data, id: docSnap.id });
        }
      });
      await batch.commit();
      // Update local state immediately for UI responsiveness
      setMessages(updatedMessages.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0)));
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const combinedNotifications = [
    ...messages,
    ...reviewRequests.map(req => ({
      id: req.id,
      type: 'review-request',
      title: 'Pending Review Request',
      content: `Reviewer ${req.reviewerName} requested to review your project "${req.projectTitle}".`,
      timestamp: req.requestedAt?.toDate?.() || new Date(),
      read: false,
    }))
  ];

  const handleShowReviewers = async (listingId) => {
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

  const handleToggleSummary = (id) => {
    setExpandedSummaries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDropdownMouseEnter = () => setDropdownHover(true);
  const handleDropdownMouseLeave = () => {
    setDropdownHover(false);
    setDropdownVisible(false);
  };

  const handleDeleteListing = async () => {
    if (!listingToDelete) return;
    try {
      await deleteDoc(doc(db, 'research-listings', listingToDelete));
      setMyListings(prev => prev.filter(l => l.id !== listingToDelete));
      setDeleteDialogOpen(false);
      setListingToDelete(null);
    } catch (error) {
      console.error("Error deleting listing:", error);
    }
  };

  return {
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
  };
}