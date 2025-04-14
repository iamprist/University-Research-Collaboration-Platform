// src/pages/ResearcherDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'react-bootstrap-icons';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

const ResearcherDashboard = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [collaborateListings, setCollaborateListings] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Get the logged-in user's ID
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        navigate('/signin'); // Redirect to sign-in if not logged in
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchListings = async () => {
      if (!userId) return; // Wait until userId is set

      try {
        // Fetch the logged-in researcher's listings
        const userQuery = query(collection(db, 'research-listings'), where('userId', '==', userId));
        const userQuerySnapshot = await getDocs(userQuery);
        const userFetchedListings = userQuerySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        setListings(userFetchedListings);

        // Fetch other researchers' listings
        const otherQuery = query(collection(db, 'research-listings'), where('userId', '!=', userId));
        const otherQuerySnapshot = await getDocs(otherQuery);

        // Fetch researcher names from the users collection
        const otherFetchedListings = await Promise.all(
          otherQuerySnapshot.docs.map(async (docSnapshot) => {
            const listingData = docSnapshot.data();
            const userDocRef = doc(db, 'users', listingData.userId); // Corrected doc reference
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

  const handleAddListing = () => {
    navigate('/dashboard'); // Redirect to your form/dashboard page
  };

  const styles = {
    header: {
      backgroundColor: '#132238', // Dark blue-gray for the header
      color: '#FFFFFF', // White text for contrast
      padding: '2rem',
      textAlign: 'center',
    },
    addButton: {
      backgroundColor: '#64CCC5', // Vibrant teal for the button
      color: '#132238', // Dark blue-gray for the icon
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
    card: {
      backgroundColor: '#1A2E40', // Dark blue-gray for the card background
      borderRadius: '1rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      textAlign: 'left',
      maxWidth: '600px',
      margin: '1rem auto', // Center the card horizontally
      color: '#FFFFFF', // White text for readability
    },
    cardTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#FFFFFF', // White text for the title
    },
    cardText: {
      fontSize: '1rem',
      color: '#B1EDE8', // Light teal for the card text
    },
    viewButton: {
      backgroundColor: '#64CCC5', // Vibrant teal for the button
      color: '#FFFFFF', // White text for the button
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
    footer: {
      backgroundColor: '#132238', // Dark blue-gray for the footer
      color: '#B1EDE8', // Light teal for the footer text
      padding: '1.5rem',
      textAlign: 'center',
    },
    footerLink: {
      color: '#B1EDE8', // Light teal for the footer links
      textDecoration: 'none',
      margin: '0 1rem',
      fontSize: '0.9rem',
      cursor: 'pointer',
    },
  };

  return (
    <main className="d-flex flex-column min-vh-100 justify-content-between" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <header style={styles.header}>
        <h1 className="fw-bold">Welcome, Researcher</h1>
        <p>Manage your research listings and collaborate effectively.</p>
      </header>

      {/* Main Content */}
      <section
        className="container my-5"
        style={{
          backgroundColor: '#FFFFFF', // White background for the main content
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Subtle shadow for separation
        }}
      >
        <div className="text-center mb-4">
          <h5 className="fw-semibold" style={{ color: '#132238' }}>Add New Research Listing</h5>
          <button
            style={styles.addButton}
            onClick={handleAddListing}
            onMouseOver={(e) => (e.target.style.transform = 'scale(1.1)')}
            onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
          >
            <Plus size={40} />
          </button>
        </div>

        {/* Your Listings */}
        <h6 className="mt-4 fw-medium text-center" style={{ color: '#132238' }}>Your Listings:</h6>
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
        <h6 className="mt-5 fw-medium text-center" style={{ color: '#132238' }}>Collaborate:</h6>
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

      {/* Footer */}
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
        <p style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
          &copy; 2025 Innerk Hub
        </p>
      </footer>
    </main>
  );
};

export default ResearcherDashboard;