// src/pages/Researcher/CollaboratePage.jsx
import React, { useEffect, useState } from 'react';
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

const CollaboratePage = () => {
  const navigate = useNavigate();
  const [collaborateListings, setCollaborateListings] = useState([]);

  useEffect(() => {
    const fetchCollaborateListings = async () => {
      try {
        // get current user's uid
        const user = auth.currentUser;
        if (!user) return;

        // fetch all listings not by this user
        const otherQuery = query(
          collection(db, 'research-listings'),
          where('userId', '!=', user.uid)
        );
        const otherSnapshot = await getDocs(otherQuery);

        // for each listing, fetch the researcher's name
        const listingsWithNames = await Promise.all(
          otherSnapshot.docs.map(async (docSnapshot) => {
            const listingData = docSnapshot.data();
            const researcherDoc = await getDoc(doc(db, 'users', listingData.userId));
            const researcherName = researcherDoc.exists()
              ? researcherDoc.data().name
              : 'Unknown Researcher';
            return {
              id: docSnapshot.id,
              ...listingData,
              researcherName
            };
          })
        );

        setCollaborateListings(listingsWithNames);
      } catch (error) {
        console.error('Error fetching listings for collaboration:', error);
      }
    };

    fetchCollaborateListings();
  }, []);

  const styles = {
    card: {
      backgroundColor: '#1A2E40',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
      padding: '1.5rem',
      margin: '1rem auto',
      maxWidth: '600px',
      color: '#FFFFFF'
    },
    cardTitle: { fontSize: '1.25rem', fontWeight: '600' },
    cardText: { fontSize: '1rem', color: '#B1EDE8' },
    viewButton: {
      backgroundColor: '#64CCC5',
      color: '#FFFFFF',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease'
    }
  };

  return (
    <main>
      <header>
        <h1>Collaborate with Other Researchers</h1>
      </header>

      <section>
        <h5>Available Projects</h5>
        {collaborateListings.map((listing) => (
          <div key={listing.id} style={styles.card}>
            <h6 style={styles.cardTitle}>
              {listing.researcherName}: {listing.title}
            </h6>
            <p style={styles.cardText}>{listing.summary || listing.description}</p>
            <button
              style={styles.viewButton}
              onClick={() => navigate(`/listing/${listing.id}`)}
            >
              View Listing
            </button>
          </div>
        ))}
      </section>
    </main>
  );
};

export default CollaboratePage;
