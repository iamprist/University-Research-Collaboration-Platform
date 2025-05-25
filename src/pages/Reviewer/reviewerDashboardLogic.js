import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../config/firebaseConfig';
import {
  doc,
  getDoc,
  deleteDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
const axios = require('axios');

export const useReviewerDashboard = () => {
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [ipAddress, setIpAddress] = useState('');
  const [notif, setNotif] = useState({ open: false, msg: '', severity: 'info' });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const [allListings, setAllListings] = useState([]);
  const [requestedIds, setRequestedIds] = useState([]);
  const [reviewedIds, setReviewedIds] = useState([]);
  const dropdownTimeout = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const { currentUser } = auth; // You may need to use your context if you use one
  const navigate = useNavigate();

  // Fetch client IP
  useEffect(() => {
    axios
      .get('https://api.ipify.org?format=json')
      .then(res => setIpAddress(res.data.ip))
      .catch(err => console.error('Error fetching IP:', err));
  }, []);

  // Save auth token
  useEffect(() => {
    if (currentUser) {
      currentUser
        .getIdToken()
        .then(token => localStorage.setItem('authToken', token));
    }
  }, [currentUser]);

  // Fetch reviewer record
  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return navigate('/signin');
      if (!currentUser?.uid) return;
      try {
        const snap = await getDoc(doc(db, 'reviewers', currentUser.uid));
        if (!mounted) return;
        if (snap.exists()) {
          const data = snap.data();
          setStatus(data.status || 'in_progress');
          setReason(data.rejectionReason || '');
        } else {
          setStatus('not_found');
        }
      } catch (e) {
        console.error('Error fetching reviewer status:', e);
      } finally {
        mounted && setLoading(false);
      }
    };
    fetchStatus();
    return () => {
      mounted = false;
    };
  }, [currentUser, navigate]);

  // Log on tab close
  useEffect(() => {
    const onClose = async () => {
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, 'logs'), {
          userId: user.uid,
          role: 'Reviewer',
          userName: user.displayName || 'N/A',
          action: 'Logout',
          details: 'Tab closed',
          timestamp: serverTimestamp()
        });
      }
    };
    window.addEventListener('beforeunload', onClose);
    return () => window.removeEventListener('beforeunload', onClose);
  }, []);

  // Reviewer request status notifications
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'reviewRequests'),
      where('reviewerId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(q, snap => {
      snap.docChanges().forEach(change => {
        const data = change.doc.data();
        if (change.type === 'modified') {
          if (data.status === 'accepted') {
            setNotif({ open: true, msg: 'Your review request was accepted!', severity: 'success' });
          }
          if (data.status === 'declined') {
            setNotif({ open: true, msg: 'Your review request was declined.', severity: 'warning' });
          }
        }
      });
    });
    return () => unsub();
  }, [currentUser]);

  // Fetch all listings on mount
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const q = collection(db, 'research-listings');
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
  }, []);

  // Fetch requested review listing IDs
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'reviewRequests'),
      where('reviewerId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(q, snap => {
      setRequestedIds(snap.docs.map(doc => doc.data().listingId));
    });
    return () => unsub();
  }, [currentUser]);

  // Fetch reviewed listing IDs
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'reviews'),
      where('reviewerId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(q, snap => {
      setReviewedIds(snap.docs.map(doc => doc.data().listingId));
    });
    return () => unsub();
  }, [currentUser]);

  // Search logic
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowNoResults(false);
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
    clearTimeout(dropdownTimeout.current);
    dropdownTimeout.current = setTimeout(() => {
      setDropdownVisible(false);
    }, 5000);
  };

  const handleInputChange = e => {
    setSearchTerm(e.target.value);
    if (!e.target.value.trim()) {
      setSearchResults([]);
      setShowNoResults(false);
      setDropdownVisible(false);
    } else {
      setDropdownVisible(true);
    }
  };

  const handleInputFocus = () => {
    if (searchTerm.trim()) {
      setDropdownVisible(true);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowNoResults(false);
    setDropdownVisible(false);
  };

  const handleRevoke = async () => {
    if (!currentUser?.uid) return;
    try {
      await deleteDoc(doc(db, 'reviewers', currentUser.uid));
      setStatus('not_found');
    } catch (e) {
      console.error('Error revoking:', e);
    }
  };

  const handleLogout = async () => {
    const user = auth.currentUser;
    if (!user) return;
    await addDoc(collection(db, 'logs'), {
      userId: user.uid,
      role: 'Reviewer',
      userName: user.displayName || 'N/A',
      action: 'Logout',
      details: 'User clicked logout',
      ip: ipAddress,
      target: 'Reviewer Dashboard',
      timestamp: serverTimestamp()
    });
    await auth.signOut();
    navigate('/signin');
  };

  const handleRequestReviewAndNotify = async (listing) => {
    try {
      if (!currentUser) {
        setNotif({ open: true, msg: "You must be logged in.", severity: "error" });
        return;
      }
      // 1. Create review request
      await addDoc(collection(db, "reviewRequests"), {
        listingId: listing.id,
        reviewerId: currentUser.uid,
        researcherId: listing.userId,
        status: "pending",
        requestedAt: serverTimestamp(),
      });

      // 2. Notify researcher
      await addDoc(collection(db, "users", listing.userId, "messages"), {
        type: "review-request",
        title: "New Review Request",
        content: `${currentUser.displayName || "A reviewer"} requested to review your project "${listing.title}".`,
        relatedId: listing.id,
        read: false,
        timestamp: serverTimestamp(),
        senderId: currentUser.uid,
      });

      setNotif({ open: true, msg: "Review request sent and researcher notified!", severity: "success" });
    } catch (err) {
      console.error("Error sending review request:", err);
      setNotif({ open: true, msg: "Failed to send request.", severity: "error" });
    }
  };

  return {
    // State
    status,
    reason,
    loading,
    ipAddress,
    notif,
    searchTerm,
    searchResults,
    dropdownVisible,
    showNoResults,
    allListings,
    requestedIds,
    reviewedIds,
    sidebarOpen,
    menuAnchorEl,
    // Setters
    setSidebarOpen,
    setMenuAnchorEl,
    setNotif,
    // Handlers
    handleSearch,
    handleInputChange,
    handleInputFocus,
    handleClear,
    handleRevoke,
    handleLogout,
    handleRequestReviewAndNotify,
  };
};