import React, { useEffect, useState } from 'react'
import { IconButton, Menu, MenuItem, TextField, Button, Paper, Box, Typography } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'

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
} from 'firebase/firestore'
import { db, auth } from '../../config/firebaseConfig'
import { useAuth } from './authContext'
import { useNavigate } from 'react-router-dom'
import ReviewerRecommendations from '../../components/ReviewerRecommendations'
import MyReviewRequests from '../../components/MyReviewRequests'
import axios from 'axios'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert from '@mui/material/Alert'

export default function ReviewerPage() {
  const [status, setStatus] = useState('')
   const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuth()
  const [ipAddress, setIpAddress] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notif, setNotif] = useState({ open: false, msg: '', severity: 'info' })
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [showNoResults, setShowNoResults] = useState(false)
  const [allListings, setAllListings] = useState([])
  const [requestedIds, setRequestedIds] = useState([]);
  const [reviewedIds, setReviewedIds] = useState([]);
  const dropdownTimeout = React.useRef(null)
  const navigate = useNavigate()

  

  // fetch client IP
  useEffect(() => {
    axios
      .get('https://api.ipify.org?format=json')
      .then(res => setIpAddress(res.data.ip))
      .catch(err => console.error('Error fetching IP:', err))
  }, [])

  // save auth token
  useEffect(() => {
    if (currentUser) {
      currentUser
        .getIdToken()
        .then(token => localStorage.setItem('authToken', token))
    }
  }, [currentUser])

  // fetch reviewer record
  useEffect(() => {
    let mounted = true
    const fetchStatus = async () => {
      const token = localStorage.getItem('authToken')
      if (!token) return navigate('/signin')
      if (!currentUser?.uid) return
      try {
        const snap = await getDoc(doc(db, 'reviewers', currentUser.uid))
        if (!mounted) return
        if (snap.exists()) {
          const data = snap.data()
          setStatus(data.status || 'in_progress')
          setReason(data.rejectionReason || '')
        } else {
          setStatus('not_found')
        }
      } catch (e) {
        console.error('Error fetching reviewer status:', e)
      } finally {
        mounted && setLoading(false)
      }
    }
    fetchStatus()
    return () => {
      mounted = false
    }
  }, [currentUser, navigate])

  // log on tab close
  useEffect(() => {
    const onClose = async () => {
      const user = auth.currentUser
      if (user) {
        await addDoc(collection(db, 'logs'), {
          userId: user.uid,
          role: 'Reviewer',
          userName: user.displayName || 'N/A',
          action: 'Logout',
          details: 'Tab closed',
          timestamp: serverTimestamp()
        })
      }
    }
    window.addEventListener('beforeunload', onClose)
    return () => window.removeEventListener('beforeunload', onClose)
  }, [])

  // reviewer request status notifications
  useEffect(() => {
    if (!currentUser) return
    const q = query(
      collection(db, 'reviewRequests'),
      where('reviewerId', '==', currentUser.uid)
    )
    const unsub = onSnapshot(q, snap => {
      snap.docChanges().forEach(change => {
        const data = change.doc.data()
        if (change.type === 'modified') {
          if (data.status === 'accepted') {
            setNotif({ open: true, msg: 'Your review request was accepted!', severity: 'success' })
          }
          if (data.status === 'declined') {
            setNotif({ open: true, msg: 'Your review request was declined.', severity: 'warning' })
          }
        }
      })
    })
    return () => unsub()
  }, [currentUser]) 

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
  }, []); // <--- Remove db from here

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

  const toggleSidebar = () => setSidebarOpen(o => !o)

  const handleRevoke = async () => {
    if (!currentUser?.uid) return
    try {
      await deleteDoc(doc(db, 'reviewers', currentUser.uid))
      setStatus('not_found')
    } catch (e) {
      console.error('Error revoking:', e)
    }
  }

  const handleLogout = async () => {
    const user = auth.currentUser
    if (!user) return
    await addDoc(collection(db, 'logs'), {
      userId: user.uid,
      role: 'Reviewer',
      userName: user.displayName || 'N/A',
      action: 'Logout',
      details: 'User clicked logout',
      ip: ipAddress,
      target: 'Reviewer Dashboard',
      timestamp: serverTimestamp()
    })
    await auth.signOut()
    navigate('/signin')
  }

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
  }

  const handleInputChange = e => {
    setSearchTerm(e.target.value)
    if (!e.target.value.trim()) {
      setSearchResults([])
      setShowNoResults(false)
      setDropdownVisible(false)
    } else {
      setDropdownVisible(true)
    }
  }

  const handleInputFocus = () => {
    if (searchTerm.trim()) {
      setDropdownVisible(true)
    }
  }

  const handleClear = () => {
    setSearchTerm('')
    setSearchResults([])
    setShowNoResults(false)
    setDropdownVisible(false)
  }

  const statusStyles = {
    approved: {
      backgroundColor: '#D1FAE5',
      borderLeft: '4px solid #10B981',
      color: '#065F46'
    },
    in_progress: {
      backgroundColor: '#FEF3C7',
      borderLeft: '4px solid #F59E0B',
      color: '#92400E'
    },
    rejected: {
      backgroundColor: '#FECACA',
      borderLeft: '4px solid #EF4444',
      color: '#991B1B'
    }
  }

  const renderBadge = () => {
    if (status === 'approved')
      return (
        <section
          style={statusStyles.approved}
          className="p-2 rounded"
        >
          Approved Reviewer
        </section>
      )
    if (status === 'in_progress')
      return (
        <section
          style={statusStyles.in_progress}
          className="p-2 rounded"
        >
          Application Under Review
        </section>
      )
    if (status === 'rejected')
      return (
        <section
          style={statusStyles.rejected}
          className="p-2 rounded"
        >
          Application Rejected
        </section>
      )
    return (
      <section className="p-2 rounded text-muted">
        {currentUser?.displayName || 'Reviewer'} – you are not a
        reviewer. Apply below.
      </section>
    )
  }

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

  return (
    <main
      style={{
        backgroundColor: '#FFFFFF',
        color: '#000000',
        minHeight: '100vh',
        paddingTop: '70px' /* offset for the fixed navbar */
      }}
    >
      <header
        className="navbar navbar-light bg-light fixed-top px-4 py-3"
        style={{ borderBottom: '1px solid #000' }}
      >
        <h1 className="navbar-brand fw-bold fs-4">Innerk Hub</h1>
        <IconButton
          onClick={e => setMenuAnchorEl(e.currentTarget)}
          sx={{
            bgcolor: 'var(--light-blue)',
            color: 'var(--dark-blue)',
            borderRadius: '1.5rem',
            ml: 2,
            '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' }
          }}
        >
          <MenuIcon />
        </IconButton>
         <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={() => setMenuAnchorEl(null)}
          PaperProps={{
            sx: {
              bgcolor: 'var(--dark-blue)',
              color: 'var(--accent-teal)',
              borderRadius: '0.8rem',
              minWidth: 200,
              mt: 1,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            },
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
           transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem
            onClick={() => {
              setMenuAnchorEl(null)
              navigate('/reviewer-profile')
            }}
            sx={{
              color: 'var(--accent-teal)',
              borderRadius: '0.5rem',
              px: 2,
              py: 1,
              fontSize: '1.1rem',
              '&:hover': { bgcolor: 'var(--light-blue)', color: 'var(--dark-blue)' },
            }}
          >
            View Profile
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMenuAnchorEl(null)
              handleLogout()
            }}
            sx={{
              color: 'var(--accent-teal)',
              borderRadius: '0.5rem',
              px: 2,
              py: 1,
              fontSize: '1.1rem',
              '&:hover': { bgcolor: 'var(--light-blue)', color: 'var(--dark-blue)' },
            }}
          >
            Logout
          </MenuItem>
        </Menu>
      </header>

      <aside
        className={`position-fixed top-0 end-0 h-100 bg-light shadow p-4 d-flex flex-column ${
          sidebarOpen ? 'd-block' : 'd-none'
        }`}
        style={{ width: '280px', zIndex: 1050 }}
      >
        <button
          className="btn-close align-self-end"
          onClick={toggleSidebar}
          aria-label="Close sidebar"
        />

        <section className="text-center mb-4">
          <img
            src={currentUser?.photoURL || 'https://via.placeholder.com/70'}
            alt="Profile"
            className="rounded-circle mb-2"
            style={{
              width: '70px',
              height: '70px',
              objectFit: 'cover',
              border: '2px solid #ccc'
            }}
          />
          <h2 className="h6 mb-0 mt-2">
            {currentUser?.displayName || 'N/A'}
          </h2>
          <address className="text-muted">
            {currentUser?.email || 'N/A'}
          </address>
        </section>

        <section className="mb-4">
          {renderBadge()}
          {status === 'rejected' && reason && (
            <small className="text-danger d-block mt-1">
              Reason: {reason}
            </small>
          )}
        </section>

        <hr />

        <nav aria-label="Sidebar links" className="mb-4">
          <ul className="list-unstyled">
            <li>
              <a href="/about" className="text-decoration-none text-dark">
                About Us
              </a>
            </li>
            <li>
              <a href="/terms" className="text-decoration-none text-dark">
                Terms &amp; Conditions
              </a>
            </li>
          </ul>
        </nav>

        <section className="mt-auto">
          {status === 'approved' && (
            <button
              onClick={handleRevoke}
              className="btn btn-warning w-100 mb-2"
            >
              Stop Being a Reviewer
            </button>
          )}
          {status !== 'approved' && status !== 'not_found' && (
            <button
              onClick={handleRevoke}
              className="btn btn-warning w-100 mb-2"
            >
              {status === 'rejected'
                ? 'Remove Rejected Application'
                : 'Revoke Application'}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="btn btn-danger w-100"
          >
            Logout
          </button>
        </section>
      </aside>

           <section
        className="container"
        style={{ backgroundColor: 'white', color: 'black' }}
      >
        {loading ? (
          <section className="text-center text-muted mt-4">
            <p>Retrieving your reviewer status…</p>
            <div className="spinner-border text-dark" role="status" />
          </section>
        ) : (
          <>
            <header className="text-center my-4">
              <h2>Reviewer Dashboard</h2>
              <p>Hi {currentUser?.displayName || 'Reviewer'}</p>
              <p>
                Welcome back! Ready to read, review, and recommend
                cutting-edge research?
              </p>
            </header>

            {/* --- Search Bar Section --- */}
            <Box sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
              <Paper 
                component="form"
                onSubmit={e => { e.preventDefault(); handleSearch() }}
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
                      borderColor: '#000'
                    }
                  }}
                />
                <Button 
                  type="button"
                  variant="contained"
                  onClick={handleClear}
                  sx={{
                    bgcolor: '#F59E0B',
                    color: '#fff',
                    borderRadius: '1.5rem',
                    minWidth: '100px',
                    px: 3,
                    '&:hover': { bgcolor: '#FBBF24' }
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
                    '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' }
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
                      searchResults.map(item => {
                        const alreadyRequested = requestedIds.includes(item.id);
                        const alreadyReviewed = reviewedIds.includes(item.id);
                        return (
                          <Box key={item.id} sx={{ p: 2, cursor: 'pointer', borderBottom: '1px solid #eee', '&:hover': { bgcolor: 'action.hover' } }}>
                            <Typography variant="subtitle1">{item.title}</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              By: {item.researcherName}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {item.summary}
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              sx={{
                                bgcolor: alreadyRequested || alreadyReviewed ? '#ccc' : 'var(--light-blue)',
                                color: alreadyRequested || alreadyReviewed ? '#888' : 'var(--dark-blue)',
                                borderRadius: '1.5rem',
                                fontWeight: 600,
                                px: 2,
                                py: 0.5,
                                minWidth: 0,
                                mt: 1,
                                boxShadow: '0 2px 10px rgba(100,204,197,0.08)',
                                '&:hover': { bgcolor: alreadyRequested || alreadyReviewed ? '#ccc' : '#5AA9A3', color: alreadyRequested || alreadyReviewed ? '#888' : 'var(--white)' }
                              }}
                              onClick={() => handleRequestReviewAndNotify(item)}
                              disabled={alreadyRequested || alreadyReviewed}
                            >
                              {alreadyReviewed
                                ? "Already Reviewed"
                                : alreadyRequested
                                  ? "Already Requested"
                                  : "Request Review"}
                            </Button>
                          </Box>
                        );
                      })
                    }
                  </Paper>
                )}
              </Paper>
            </Box>

            {/* --- Main Content Section --- */}
            <section className="mb-5">
              {status === 'not_found' && (
                <section className="alert alert-warning text-center py-4">
                  <h3 className="mb-3">Become a Reviewer</h3>
                  <p className="mb-0">
                    Your account is not yet approved as a reviewer. Apply now to start reviewing research.
                  </p>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/apply-reviewer')}
                    sx={{
                      bgcolor: 'var(--light-blue)',
                      color: 'var(--dark-blue)',
                      borderRadius: '1.5rem',
                      px: 4,
                      py: 2,
                      mt: 2,
                      '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' }
                    }}
                  >
                    Apply to be a Reviewer
                  </Button>
                </section>
              )}

              <MyReviewRequests />
            </section>

            <ReviewerRecommendations />
          </>
        )}
      </section>

      <Snackbar 
        open={notif.open} 
        autoHideDuration={6000} 
        onClose={() => setNotif({ ...notif, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert 
          onClose={() => setNotif({ ...notif, open: false })} 
          severity={notif.severity} 
          sx={{ width: '100%' }}
        >
          {notif.msg}
        </MuiAlert>
      </Snackbar>
    </main>
  )
}
