import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../config/firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



const CollaboratePage = () => {
  const navigate = useNavigate();
  const [collaborateListings, setCollaborateListings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCollaborateListings = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;

        // Fetch listings not created by current user
        const otherQuery = query(
          collection(db, 'research-listings'),
          where('userId', '!=', user.uid)
        );
        const otherSnapshot = await getDocs(otherQuery);

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
              researcherName,
              researcherId: listingData.userId
            };
          })
        );

        setCollaborateListings(listingsWithNames);
      } catch (error) {
        console.error('Error fetching listings:', error);
        toast.error('Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborateListings();
  }, []);

  const handleCollaborateRequest = async (listingId, researcherId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
  
      // Check if already collaborating
      const collabQuery = query(
        collection(db, "collaborations"),
        where("listingId", "==", listingId),
        where("collaboratorId", "==", currentUser.uid)
      );
      const existingCollab = await getDocs(collabQuery);
      if (!existingCollab.empty) {
        toast.info("You're already collaborating on this project");
        return;
      }
  
      // Rest of your existing request code...
    } catch (error) {
      console.error(error);
      toast.error("Failed to send request");
    }
  };

  const styles = {
    card: {
      backgroundColor: '#1A2E40',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
      padding: '1.5rem',
      margin: '1rem auto',
      maxWidth: '600px',
      color: '#FFFFFF',
      position: 'relative'
    },
    cardTitle: { fontSize: '1.25rem', fontWeight: '600' },
    cardText: { fontSize: '1rem', color: '#B1EDE8', marginBottom: '1rem' },
    viewButton: {
      backgroundColor: '#64CCC5',
      color: '#132238',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      marginRight: '0.5rem',
      fontWeight: '600'
    },
    collabButton: {
      backgroundColor: '#B1EDE8',
      color: '#132238',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontWeight: '600'
    },
    buttonContainer: {
      display: 'flex',
      marginTop: '1rem'
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#132238' }}>Collaborate with Other Researchers</h1>
      </header>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <section>
          <h3 style={{ color: '#132238', marginBottom: '1.5rem' }}>Available Projects</h3>
          {collaborateListings.map((listing) => (
            <div key={listing.id} style={styles.card}>
              <h4 style={styles.cardTitle}>{listing.title}</h4>
              <p style={{ color: '#64CCC5', fontStyle: 'italic' }}>
                By: {listing.researcherName}
              </p>
              <p style={styles.cardText}>{listing.summary}</p>
              <div style={styles.buttonContainer}>
                <button
                  style={styles.viewButton}
                  onClick={() => navigate(`/listing/${listing.id}`)}
                >
                  View Details
                </button>
                <button
                  style={styles.collabButton}
                  onClick={() => handleCollaborateRequest(listing.id, listing.researcherId)}
                >
                  Request Collaboration
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
};

export default CollaboratePage;
