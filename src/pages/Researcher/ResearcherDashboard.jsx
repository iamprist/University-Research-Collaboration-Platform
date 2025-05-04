import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../config/firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from 'firebase/firestore';
import { logEvent } from '../../utils/logEvent';
import './ResearcherDashboard.css';

const ResearcherDashboard = () => {
  const navigate = useNavigate();
  const [allListings, setAllListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [userId, setUserId] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const dropdownTimeout = useRef(null);

  // Modal state
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Filtered listings for "Your Research"
  const [filteredListings, setFilteredListings] = useState([]);

  //for username 
  const [userName, setUserName] = useState('');


  // Validate user auth
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

  // Check if researcher profile exists
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setHasProfile(true);
          setUserName(userDoc.data().name || 'Researcher');
        } else {
          navigate('/researcher-edit-profile');
        }
      } catch (err) {
        console.error('Error checking user profile:', err);
        setShowErrorModal(true);
      }
    })();
  }, [userId, navigate]);
  

  // Fetch ALL listings for search dropdown
  useEffect(() => {
    if (!userId || !hasProfile) return;
    (async () => {
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
      } catch {}
    })();
  }, [userId, hasProfile]);

  // Fetch only MY listings for "Your Research"
  useEffect(() => {
    if (!userId || !hasProfile) return;
    (async () => {
      try {
        const q = query(collection(db, 'research-listings'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyListings(data);
      } catch {}
    })();
  }, [userId, hasProfile]);

  // Filter MY listings for "Your Research" section
  useEffect(() => {
    setFilteredListings(myListings);
  }, [myListings]);

  // SEARCH BUTTON logic for dropdown (searches ALL listings)
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

    // Set timeout for dropdown to disappear after 5 seconds
    clearTimeout(dropdownTimeout.current);
    dropdownTimeout.current = setTimeout(() => {
      setDropdownVisible(false);
    }, 5000);

    // Set timeout for "No results" message
    if (filtered.length === 0) {
      setShowNoResults(true);
      setTimeout(() => setShowNoResults(false), 3000);
    } else {
      setShowNoResults(false);
    }
  };

  // Hide dropdown and allow new search when input is focused/changed
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

  // Cleanup timeout when component unmounts
  useEffect(() => {
    return () => {
      clearTimeout(dropdownTimeout.current);
    };
  }, []);

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (!confirmLogout) return;
    if (auth.currentUser) {
      await logEvent({
        userId: auth.currentUser.uid,
        role: 'Researcher',
        userName: auth.currentUser.displayName || 'N/A',
        action: 'Logout',
        details: 'User logged out'
      });
    }
    await auth.signOut();
    navigate('/signin');
  };

  const handleAddListing = () => navigate('/researcher/add-listing');
  const handleCollaborate = () => navigate('/collaborate');

  const styles = {
    card: {
      backgroundColor: '#1A2E40', borderRadius: '1rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.2)', padding: '1.5rem',
      margin: '1rem auto', maxWidth: '600px', color: '#FFFFFF'
    },
    cardTitle: { fontSize: '1.25rem', fontWeight: '600' },
    cardText: { fontSize: '1rem', color: '#B1EDE8' },
    viewButton: {
      backgroundColor: '#64CCC5', color: '#FFFFFF', border: 'none',
      padding: '0.5rem 1rem', borderRadius: '0.5rem',
      cursor: 'pointer', transition: 'background-color 0.3s ease'
    },
    footerLink: {
      color: '#B1EDE8', textDecoration: 'none',
      margin: '0 1rem', fontSize: '0.9rem'
    }
  };

  return (
    <main className="researcher-dashboard">
      {showErrorModal && (
        <div className="error-modal">
          <p>Error loading profile. Please try again.</p>
          <button onClick={() => setShowErrorModal(false)}>Close</button>
        </div>
      )}

      <header className="researcher-header">
        <section className="header-title">
          <h1>Welcome, {userName}</h1>
          <p>Manage your research and collaborate with other researchers</p>
        </section>

        <section className="header-actions">
          <div className="dropdown-menu-container">
            <button
              className="menu-toggle-btn"
              onClick={() => setShowMenu(prev => !prev)}
            >
              ☰ Menu
            </button>

            {showMenu && (
              <div className="menu-dropdown">
                <button onClick={() => navigate('/researcher-profile')}>View Profile</button>
                <button onClick={handleAddListing}>New Research</button>
                <button onClick={handleCollaborate}>Collaborate</button>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </section>
      </header>

      <section className="dashboard-content">
        <section className="search-section" style={{ textAlign: 'center', margin: '1rem 0' }}>
          <div style={{ position: 'relative', width: '60%', margin: '1rem auto' }}>
            <input
              type="text"
              placeholder="Search for research by title or researcher name..."
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #ccc', fontSize: '1rem' }}
            />
            <button
              onClick={handleSearch}
              style={{ marginLeft: '1rem', padding: '0.5rem 1.5rem' }}
            >
              Search
            </button>
            <button
              onClick={handleClear}
              style={{ marginLeft: '0.5rem', padding: '0.5rem 1.5rem', background: '#eee', color: '#333', border: 'none', borderRadius: '0.5rem' }}
            >
              Clear
            </button>
            {dropdownVisible && (
              <div style={{
                position: 'absolute',
                top: '2.5rem',
                left: 0,
                width: '100%',
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: '0.5rem',
                zIndex: 1000,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {searchResults.length === 0 ? (
                  <div style={{ padding: '1rem', color: '#888' }}>
                    {showNoResults && "No research listings found."}
                  </div>
                ) : (
                  searchResults.map(item => (
                    <div
                      key={item.id}
                      style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                      onClick={() => {
                        setDropdownVisible(false);
                        navigate(`/listing/${item.id}`);
                      }}
                    >
                      <strong>{item.title}</strong>
                      <div style={{ fontSize: '0.95em', color: '#666' }}>
                        By: {item.researcherName || 'Unknown Researcher'}
                      </div>
                      <div style={{ fontSize: '0.9em', color: '#666' }}>{item.summary}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>

        <h3>Your Research</h3>
        <section>
          {filteredListings.length === 0 ? (
            <p style={{ color: '#B1EDE8', textAlign: 'center' }}>No research listings found.</p>
          ) : (
            filteredListings.map(item => (
              <article key={item.id} style={styles.card}>
                <h4 style={styles.cardTitle}>{item.title}</h4>
                <p style={styles.cardText}>{item.summary}</p>
                <button
                  style={styles.viewButton}
                  onClick={() => navigate(`/listing/${item.id}`)}
                >
                  View Listing
                </button>
              </article>
            ))
          )}
        </section>
      </section>

      <footer className="researcher-footer">
        <a href="#" style={styles.footerLink}>Contact</a>
        <a href="#" style={styles.footerLink}>Privacy Policy</a>
        <a href="#" style={styles.footerLink}>Terms of Service</a>
        <p>&copy; 2025 Innerk Hub</p>
      </footer>
    </main>
  );
};

export default ResearcherDashboard;
