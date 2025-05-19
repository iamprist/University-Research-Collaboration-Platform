import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../config/firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc, onSnapshot, orderBy, updateDoc, addDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import './ResearcherDashboard.css';
import axios from "axios";
import CollaborationRequestsPanel from '../../components/CollaborationRequestsPanel';
import Footer from '../../components/Footer';
import ContactForm from '../../components/ContactForm';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

const MessageNotification = ({ messages, unreadCount, onMessageClick }) => {
  const [showMessages, setShowMessages] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMessages(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <section className="message-notification-container" ref={dropdownRef}>
      <button 
        className="message-notification-bell"
        onClick={() => setShowMessages(!showMessages)}
      >
        🔔 {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>
      
      {showMessages && (
        <section className="messages-dropdown">
          <section className="messages-header">
            <h4>Notifications</h4>
            <button onClick={() => setShowMessages(false)}>×</button>
          </section>
          {messages.length === 0 ? (
            <p className="no-messages">No new messages</p>
          ) : (
            messages.map(message => (
              <article 
                key={message.id} 
                className={`message-item ${message.read ? '' : 'unread'}`}
                onClick={() => {
                  onMessageClick(message);
                  setShowMessages(false);
                }}
              >
                <h4>{message.title}</h4>
                <p>{message.content}</p>
                <small>{message.timestamp.toLocaleString()}</small>
                {message.type === 'collaboration-request' && (
                  <span className="message-tag collaboration">Collaboration</span>
                )}
                {message.type === 'review-request' && (
                  <span className="message-tag review">Review</span>
                )}
                {message.type === 'upload-confirmation' && (
                  <span className="message-tag upload">Upload</span>
                )}
              </article>
            ))
          )}
        </section>
      )}
    </section>
  );
};

const ResearcherDashboard = () => {
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
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [ipAddress, setIpAddress] = useState("");
  const [showCollaborationRequests, setShowCollaborationRequests] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requesterProfile, setRequesterProfile] = useState(null);
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
        setShowCollaborationRequests(true);
        break;
      case 'review-request':
        navigate(`/review-requests/${message.relatedId}`);
        break;
      case 'upload-confirmation':
        navigate(`/listing/${message.relatedId}`);
        break;
      default:
        // Default action if needed
    }
  };

  const handleViewRequesterProfile = async (request) => {
    try {
      const profileDoc = await getDoc(doc(db, 'users', request.requesterId));
      if (profileDoc.exists()) {
        setRequesterProfile(profileDoc.data());
        setSelectedRequest(request);
      }
    } catch (error) {
      console.error("Error fetching requester profile:", error);
    }
  };

  const handleAcceptCollaboration = async () => {
    if (!selectedRequest) return;

    try {
      const requestRef = doc(db, 'collaboration-requests', selectedRequest.id);
      await updateDoc(requestRef, { 
        status: 'accepted',
        respondedAt: new Date()
      });

      // Create collaboration
      await addDoc(collection(db, 'collaborations'), {
        listingId: selectedRequest.listingId,
        researcherId: selectedRequest.researcherId,
        collaboratorId: selectedRequest.requesterId,
        joinedAt: new Date(),
        status: 'active'
      });

      // Update listing collaborators
      await updateDoc(doc(db, 'research-listings', selectedRequest.listingId), {
        collaborators: arrayUnion(selectedRequest.requesterId)
      });

      // Close the profile view
      setSelectedRequest(null);
      setRequesterProfile(null);
    } catch (error) {
      console.error('Error accepting collaboration:', error);
    }
  };

  const handleRejectCollaboration = async () => {
    if (!selectedRequest) return;

    try {
      const requestRef = doc(db, 'collaboration-requests', selectedRequest.id);
      await updateDoc(requestRef, { 
        status: 'rejected',
        respondedAt: new Date()
      });

      // Close the profile view
      setSelectedRequest(null);
      setRequesterProfile(null);
    } catch (error) {
      console.error('Error rejecting collaboration:', error);
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
      console.log("Event logged:", { userId, role, userName, action, details, ip, target });
    } catch (error) {
      console.error("Error logging event:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        console.log("Logging out user:", user.uid);

        const target = "Researcher Dashboard";

        await logEvent({
          userId: user.uid,
          role: "Researcher",
          userName: user.displayName || "N/A",
          action: "Logout",
          details: "User logged out",
          ip: ipAddress,
          target, 
        });

        await auth.signOut();
        console.log("User logged out successfully.");
        navigate("/signin");
      } else {
        console.warn("No user is currently logged in.");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(dropdownTimeout.current);
    };
  }, []);

  return (
    <main className="researcher-dashboard">
      {showErrorModal && (
        <section className="error-modal">
          <p>Error loading profile. Please try again.</p>
          <button onClick={() => setShowErrorModal(false)}>Close</button>
        </section>
      )}

      {showCollaborationRequests && (
        <section className="collaboration-requests-modal">
          <div className="modal-content">
            <button 
              className="close-modal"
              onClick={() => setShowCollaborationRequests(false)}
            >
              ×
            </button>
            <CollaborationRequestsPanel 
              userId={userId} 
              onViewProfile={handleViewRequesterProfile}
            />
          </div>
        </section>
      )}

      {selectedRequest && requesterProfile && (
        <section className="requester-profile-modal">
          <div className="modal-content">
            <button 
              className="close-modal"
              onClick={() => {
                setSelectedRequest(null);
                setRequesterProfile(null);
              }}
            >
              ×
            </button>
            <h3>{requesterProfile.name}'s Profile</h3>
            <div className="profile-details">
              <p><strong>Email:</strong> {requesterProfile.email}</p>
              <p><strong>Institution:</strong> {requesterProfile.institution}</p>
              <p><strong>Department:</strong> {requesterProfile.department}</p>
              <p><strong>Research Interests:</strong> {requesterProfile.researchInterests}</p>
              <p><strong>Bio:</strong> {requesterProfile.bio}</p>
            </div>
            <div className="request-actions">
              <button 
                className="accept-btn"
                onClick={handleAcceptCollaboration}
              >
                Accept Collaboration
              </button>
              <button 
                className="reject-btn"
                onClick={handleRejectCollaboration}
              >
                Reject Request
              </button>
            </div>
          </div>
        </section>
      )}

      <header className="researcher-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
          style={{ 
            color: 'var(--white)',
            marginRight: '1.5rem'
          }}
        >
          <ArrowBackIosIcon />
        </button>
        <section className="header-title">
          <h1>Welcome, {userName}</h1>
          <p>Manage your research and collaborate with other researchers</p>
        </section>
        <section className="header-actions">
          <MessageNotification 
            messages={messages}
            unreadCount={unreadCount}
            onMessageClick={handleMessageClick}
          />
          
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
                <button className="chat-with-us-btn" onClick={() => setShowContactForm(true)}>Chat with Us</button>
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
            <button type="submit" onClick={handleClear}>Clear</button>
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
        <section className="listings-grid">
          {filteredListings.length === 0 ? (
            <p className="no-listings">No research listings found.</p>
          ) : (
            filteredListings.map(item => (
              <article key={item.id} className="listing-card">
                <h4>{item.title}</h4>
                <p>{item.summary}</p>
                <section className="listing-actions">
                  <button
                    onClick={() => navigate(`/listing/${item.id}`)}
                  >
                    View Listing
                  </button>
                  <button
                    className="chat-btn"
                    onClick={() => navigate(`/chat/${item.id}`)}
                  >
                    Chat
                  </button>
                </section>
              </article>
            ))
          )}
        </section>

        <section className="collaborations-section">
          <h3>Your Collaborations</h3>
          {collabListings.length > 0 ? (
            <section className="listings-grid">
              {collabListings.map(listing => (
                <article key={listing.id} className="listing-card">
                  <h4>{listing.title}</h4>
                  <p>{listing.summary}</p>
                  <section className="listing-actions">
                    <button
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    >
                      View Project
                    </button>
                    <button
                      className="chat-btn"
                      onClick={() => navigate(`/chat/${listing.id}`)}
                    >
                      Chat
                    </button>
                  </section>
                </article>
              ))}
            </section>
          ) : (
            <p className="no-listings">
              No active collaborations yet. Browse projects to collaborate!
            </p>
          )}
        </section>
      </section>

      {showContactForm && (
        <section className="contact-form-modal">
          <ContactForm onClose={() => setShowContactForm(false)} />
        </section>
      )}

      <Footer />
    </main>
  );
};

export default ResearcherDashboard;