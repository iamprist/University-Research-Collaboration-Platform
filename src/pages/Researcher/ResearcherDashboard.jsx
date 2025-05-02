// src/pages/ResearcherDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'react-bootstrap-icons';
import { db, auth } from '../../config/firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc, addDoc} from 'firebase/firestore';
import { logEvent } from '../../utils/logEvent';

const ResearcherDashboard = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [collaborateListings, setCollaborateListings] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const checkAuthToken = async () => {
      const token = localStorage.getItem('authToken'); // Get the token from localStorage
      if (!token) {
        navigate('/signin'); // Redirect to login if no token is found
        return;
      }

      // Validate the token by checking the current user
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          localStorage.removeItem('authToken'); // Clear invalid token
          navigate('/signin'); // Redirect to login
        }
      });

      return () => unsubscribe();
    };

    checkAuthToken();
  }, [navigate]);

  useEffect(() => {
    const fetchListings = async () => {
      if (!userId) return;

      try {
        const userQuery = query(collection(db, 'research-listings'), where('userId', '==', userId));
        const userQuerySnapshot = await getDocs(userQuery);
        const userFetchedListings = userQuerySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        setListings(userFetchedListings);

        const otherQuery = query(collection(db, 'research-listings'), where('userId', '!=', userId));
        const otherQuerySnapshot = await getDocs(otherQuery);

        const otherFetchedListings = await Promise.all(
          otherQuerySnapshot.docs.map(async (docSnapshot) => {
            const listingData = docSnapshot.data();
            const userDocRef = doc(db, 'users', listingData.userId);
            const userDoc = await getDoc(userDocRef);
            const researcherName = userDoc.exists() ? userDoc.data().name : 'Unknown Researcher';
            return { ...listingData, id: docSnapshot.id, researcherName };
          })
        );

        setCollaborateListings(otherFetchedListings);
      } catch (error) {
        console.error('Error fetching listings:', error);
      }
    };

    fetchListings();
  }, [userId]);

  useEffect(() => {
    const handleTabClose = async () => {
      if (auth.currentUser) {
        await logEvent({
          userId: auth.currentUser.uid,
          role: "Researcher",
          userName: auth.currentUser.displayName || "N/A",
          action: "Logout",
          details: "User closed the browser/tab",
        });
      }
    };

    window.addEventListener("beforeunload", handleTabClose);
    return () => window.removeEventListener("beforeunload", handleTabClose);
  }, []);

  const handleAddListing = () => {
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      console.log("Attempting to log out...");

      // Log the logout event before signing out
      if (auth.currentUser) {
        await logEvent({
          userId: auth.currentUser.uid,
          role: "Researcher",
          userName: auth.currentUser.displayName || "N/A",
          action: "Logout",
          details: "User logged out",
        });
        console.log("Logout event recorded.");
      } else {
        console.warn("No authenticated user found to log the event.");
      }

      // Perform logout using Firebase Auth
      await auth.signOut();

      console.log("Logout successful. Redirecting to /signin...");
      // Redirect the user to the login page
      navigate("/signin");
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out. Please try again.");
    }
  };


<button onClick={() => startChat(userId)}>Message</button>

const startChat = async (otherUserId) => {
  const chatRef = await addDoc(collection(db, 'chats'), {
    participants: [auth.currentUser.uid, otherUserId],
    messages: [],
  });
  navigate(`/chat/${chatRef.id}`);
};

  const styles = {
    header: {
      backgroundColor: '#132238',
      color: '#FFFFFF',
      padding: '2rem',
      textAlign: 'center',
    },
    addButton: {
      backgroundColor: '#64CCC5',
      color: '#132238',
      border: 'none',
      borderRadius: '50%',
      width: '80px',
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
      cursor: 'pointer',
      transition: 'transform 0.3s ease',
    },
    logoutButton: {
      backgroundColor: '#f44336',
      color: '#FFFFFF',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      marginTop: '1rem',
      transition: 'background-color 0.3s ease',
    },
    card: {
      backgroundColor: '#1A2E40',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      textAlign: 'left',
      maxWidth: '600px',
      margin: '1rem auto',
      color: '#FFFFFF',
    },
    cardTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#FFFFFF',
    },
    cardText: {
      fontSize: '1rem',
      color: '#B1EDE8',
    },
    viewButton: {
      backgroundColor: '#64CCC5',
      color: '#FFFFFF',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
    footer: {
      backgroundColor: '#132238',
      color: '#B1EDE8',
      padding: '1.5rem',
      textAlign: 'center',
    },
    footerLink: {
      color: '#B1EDE8',
      textDecoration: 'none',
      margin: '0 1rem',
      fontSize: '0.9rem',
      cursor: 'pointer',
    },
  };

  return (
    <main className="d-flex flex-column min-vh-100 justify-content-between" style={{ backgroundColor: '#F9FAFB' }}>
      <header style={styles.header}>
        <h1>Welcome, Researcher</h1>
        <p>Manage your research listings and collaborate effectively.</p>
        <button
          onClick={handleLogout}
          style={styles.logoutButton}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#d32f2f')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#f44336')}
        >
          Logout
        </button>
      </header>
      <section
        className="container my-5"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="text-center mb-4">
          <h5 style={{ color: '#132238' }}>Add New Research Listing</h5>
          <button
            style={styles.addButton}
            onClick={handleAddListing}
            onMouseOver={(e) => (e.target.style.transform = 'scale(1.1)')}
            onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
          >
            <Plus size={40} />
          </button>
        </div>
        {/* Your Listings Section */}
        <h6 className="mt-4 text-center" style={{ color: '#132238' }}>Your Listings:</h6>
        <section>
          {listings.length === 0 ? (
            <p className="text-center text-muted">No listings available.</p>
          ) : (
            listings.map((listing) => (
              <div key={listing.id} style={styles.card}>
                <h5 style={styles.cardTitle}>{listing.title}</h5>
                <p style={styles.cardText}>{listing.summary}</p>
                <p style={styles.cardText}>
                  <strong>Research Area:</strong> {listing.researchArea}
                </p>
                <p style={styles.cardText}>
                  <strong>Status:</strong> {listing.status}
                </p>
                <a
                  href={listing.publicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.viewButton}
                  onMouseOver={(e) => (e.target.style.backgroundColor = '#5AA9A3')}
                  onMouseOut={(e) => (e.target.style.backgroundColor = '#64CCC5')}
                >
                  View Publication
                </a>
              </div>
            ))
          )}
        </section>
        {/* Collaborate Section */}
        <h6 className="mt-5 text-center" style={{ color: '#132238' }}>Collaborate:</h6>
        <section>
          {collaborateListings.length === 0 ? (
            <p className="text-center text-muted">No listings available for collaboration.</p>
          ) : (
            collaborateListings.map((listing) => (
              <div key={listing.id} style={styles.card}>
                <h5 style={styles.cardTitle}>{listing.title}</h5>
                <p style={styles.cardText}>{listing.summary}</p>
                <p style={styles.cardText}>
                  <strong>Research Area:</strong> {listing.researchArea}
                </p>
                <p style={styles.cardText}>
                  <strong>Researcher:</strong> {listing.researcherName}
                </p>
                <p style={styles.cardText}>
                  <strong>Status:</strong> {listing.status}
                </p>
                <a
                  href={listing.publicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.viewButton}
                  onMouseOver={(e) => (e.target.style.backgroundColor = '#5AA9A3')}
                  onMouseOut={(e) => (e.target.style.backgroundColor = '#64CCC5')}
                >
                  View Publication
                </a>
              </div>
            ))
          )}
        </section>
      </section>
      <footer style={styles.footer}>
        <nav>
          <button
            style={{ ...styles.footerLink, background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => alert('Privacy Policy coming soon!')}
          >
            Privacy Policy
          </button>
          <button
            style={{ ...styles.footerLink, background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => alert('Terms of Service coming soon!')}
          >
            Terms of Service
          </button>
          <button
            style={{ ...styles.footerLink, background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => alert('Contact Us coming soon!')}
          >
            Contact Us
          </button>
        </nav>
        <p style={{ marginTop: '1rem', fontSize: '0.8rem' }}>&copy; 2025 Innerk Hub</p>
      </footer>
    </main>
  );
};

export default ResearcherDashboard;