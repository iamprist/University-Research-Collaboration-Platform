import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../config/firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { logEvent } from '../../utils/logEvent';
import './ResearcherDashboard.css';

import CollaborationRequestsPanel from '../../components/CollaborationRequestsPanel';

const ResearcherDashboard = () => {
  const navigate = useNavigate();
  const [allListings, setAllListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [userId, setUserId] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [collabListings, setCollabListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const dropdownTimeout = useRef(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [filteredListings, setFilteredListings] = useState([]);
  const [userName, setUserName] = useState('');

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
        setShowErrorModal(true);
      }
    })();
  }, [userId, navigate]);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "collaborations"),
      where("collaboratorId", "==", userId)
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const collabs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCollabListings(collabs);
      const listings = await Promise.all(
        collabs.map(async collab => {
          const listingDoc = await getDoc(doc(db, "research-listings", collab.listingId));
          return listingDoc.exists() ? { id: listingDoc.id, ...listingDoc.data() } : null;
        })
      );
      setCollabListings(listings.filter(Boolean));
    });
    return () => unsubscribe();
  }, [userId]);

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

    if (filtered.length === 0) {
      setShowNoResults(true);
      setTimeout(() => setShowNoResults(false), 3000);
    } else {
      setShowNoResults(false);
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

  useEffect(() => {
    return () => {
      clearTimeout(dropdownTimeout.current);
    };
  }, []);

  const handleLogout = async () => {
    try {
      if (auth.currentUser) {
        await logEvent({
          userId: auth.currentUser.uid,
          role: "Researcher",
          userName: auth.currentUser.displayName || "N/A",
          action: "Logout",
          details: "User logged out",
        });
      }
      await auth.signOut();
      navigate("/signin");
    } catch {
      alert("Failed to log out. Please try again.");
    }
  };

  return (
    <main>
      {showErrorModal && (
        <section className="error-modal">
          <p>Error loading profile. Please try again.</p>
          <button onClick={() => setShowErrorModal(false)}>Close</button>
        </section>
      )}

      <header className="researcher-header">
        <section className="header-title">
          <h1>Welcome, {userName}</h1>
          <p>Manage your research and collaborate with other researchers</p>
        </section>
        <section className="header-actions">
          <section className="dropdown-menu-container">
            <button
              className="menu-toggle-btn"
              onClick={() => setShowMenu(prev => !prev)}
            >
              ☰ Menu
            </button>
            {showMenu && (
              <section className="menu-dropdown">
                <button onClick={() => navigate('/researcher-profile')}>View Profile</button>
                <button onClick={handleAddListing}>New Research</button>
                <button onClick={() => navigate('/friends')}>Friends</button>
                <button onClick={handleCollaborate}>Collaborate</button>
                <button onClick={handleLogout}>Logout</button>
              </section>
            )}
          </section>
        </section>
      </header>

      <section className="dashboard-content">
        <section className="search-section">
          <form onSubmit={e => { e.preventDefault(); handleSearch(); }}>
            <input
              type="text"
              placeholder="Search for research by title or researcher name..."
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
            />
            <button type="submit">Search</button>
            <button type="button" onClick={handleClear}>Clear</button>
          </form>
          {dropdownVisible && (
            <section className="search-dropdown">
              {searchResults.length === 0 ? (
                <section>
                  {showNoResults && "No research listings found."}
                </section>
              ) : (
                searchResults.map(item => (
                  <section
                    key={item.id}
                    className="dropdown-item"
                    tabIndex={0}
                    role="button"
                    onClick={() => {
                      setDropdownVisible(false);
                      navigate(`/listing/${item.id}`);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        setDropdownVisible(false);
                        navigate(`/listing/${item.id}`);
                      }
                    }}
                  >
                    <strong>{item.title}</strong>
                    <section style={{ fontSize: '0.95em', color: '#B1EDE8' }}>
                      By: {item.researcherName || 'Unknown Researcher'}
                    </section>
                    <section style={{ fontSize: '0.9em', color: '#B1EDE8' }}>{item.summary}</section>
                  </section>
                ))
              )}
            </section>
          )}
        </section>

        <h3>Your Research</h3>
        <section>
          {filteredListings.length === 0 ? (
            <p style={{ color: '#B1EDE8', textAlign: 'center' }}>No research listings found.</p>
          ) : (
            filteredListings.map(item => (
              <article key={item.id}>
                <h4>{item.title}</h4>
                <p>{item.summary}</p>
                <button
                  onClick={() => navigate(`/listing/${item.id}`)}
                >
                  View Listing
                </button>
                <button
                  style={{
                    background: '#B1EDE8',
                    color: '#132238',
                    marginLeft: '0.5rem'
                  }}
                  onClick={() => navigate(`/chat/${item.id}`)}
                >
                  Chat
                </button>
              </article>
            ))
          )}
        </section>
      </section>

      <section className="collaboration-requests-section">
        <CollaborationRequestsPanel />
      </section>

      <section className="collaborations-section">
        <h3>Your Collaborations</h3>
        {collabListings.length > 0 ? (
          collabListings.map(listing => (
            <article key={listing.id}>
              <h4>{listing.title}</h4>
              <p>{listing.summary}</p>
              <button
                onClick={() => navigate(`/listing/${listing.id}`)}
              >
                View Project
              </button>
              <button
                style={{
                  background: '#B1EDE8',
                  color: '#132238',
                  marginLeft: '0.5rem'
                }}
                onClick={() => navigate(`/chat/${listing.id}`)}
              >
                Chat
              </button>
            </article>
          ))
        ) : (
          <p style={{ color: '#B1EDE8', textAlign: 'center' }}>
            No active collaborations yet. Browse projects to collaborate!
          </p>
        )}
      </section>

      <footer className="researcher-footer">
        <a href="/some-path">Contact</a>
        <a href="/some-path">Privacy Policy</a>
        <a href="/some-path">Terms of Service</a>
        <p>&copy; 2025 Innerk Hub</p>
      </footer>
    </main>
  );
};

export default ResearcherDashboard;
