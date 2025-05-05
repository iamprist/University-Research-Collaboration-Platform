import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../config/firebaseConfig';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CollaboratePage = () => {
  const navigate = useNavigate();
  const [collaborateListings, setCollaborateListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [activeRequestId, setActiveRequestId] = useState(null);

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
            
            // Check for existing requests
            const requestQuery = query(
              collection(db, 'collaboration-requests'),
              where('listingId', '==', docSnapshot.id),
              where('requesterId', '==', user.uid)
            );
            const existingRequest = await getDocs(requestQuery);

            return {
              id: docSnapshot.id,
              ...listingData,
              researcherName,
              researcherId: listingData.userId,
              hasPendingRequest: !existingRequest.empty
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
      setRequesting(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("You need to be logged in to collaborate");
        return;
      }

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

      // Check if request already exists
      const requestQuery = query(
        collection(db, "collaboration-requests"),
        where("listingId", "==", listingId),
        where("requesterId", "==", currentUser.uid),
        where("status", "==", "pending")
      );
      const existingRequest = await getDocs(requestQuery);
      if (!existingRequest.empty) {
        toast.info("You already have a pending request for this project");
        return;
      }

      // Create new request
      const requestRef = await addDoc(collection(db, "collaboration-requests"), {
        listingId,
        researcherId,
        requesterId: currentUser.uid,
        requesterName: currentUser.displayName || "Anonymous Researcher",
        status: "pending",
        createdAt: serverTimestamp(),
        message: requestMessage || `Request to collaborate on your project`
      });

      setActiveRequestId(requestRef.id);
      toast.success("Collaboration request sent successfully!", {
        onClose: () => {
          // Refresh the listings to show the request status
          setCollaborateListings(prev => prev.map(listing => 
            listing.id === listingId 
              ? { ...listing, hasPendingRequest: true } 
              : listing
          ));
          setRequestMessage("");
        }
      });
    } catch (error) {
      console.error("Error sending request:", error);
      toast.error("Failed to send collaboration request");
    } finally {
      setRequesting(false);
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
    disabledButton: {
      backgroundColor: '#747C92',
      color: '#132238',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      cursor: 'not-allowed',
      fontWeight: '600'
    },
    buttonContainer: {
      display: 'flex',
      marginTop: '1rem'
    },
    messageInput: {
      width: '100%',
      padding: '0.5rem',
      borderRadius: '0.5rem',
      border: '1px solid #64CCC5',
      backgroundColor: '#132238',
      color: '#FFFFFF',
      marginTop: '0.5rem'
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#132238' }}>Collaborate with Other Researchers</h1>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center' }}>
          <p>Loading available projects...</p>
        </div>
      ) : (
        <section>
          <h3 style={{ color: '#132238', marginBottom: '1.5rem' }}>Available Projects</h3>
          {collaborateListings.length === 0 ? (
            <p style={{ textAlign: 'center' }}>No projects available for collaboration at this time.</p>
          ) : (
            collaborateListings.map((listing) => (
              <div key={listing.id} style={styles.card}>
                <h4 style={styles.cardTitle}>{listing.title}</h4>
                <p style={{ color: '#64CCC5', fontStyle: 'italic' }}>
                  By: {listing.researcherName}
                </p>
                <p style={styles.cardText}>{listing.summary}</p>
                
                {!listing.hasPendingRequest && (
                  <textarea
                    style={styles.messageInput}
                    placeholder="Add a message to the researcher (optional)"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    rows={2}
                  />
                )}

                <div style={styles.buttonContainer}>
                  <button
                    style={styles.viewButton}
                    onClick={() => navigate(`/listing/${listing.id}`)}
                  >
                    View Details
                  </button>
                  <button
                    style={listing.hasPendingRequest ? styles.disabledButton : styles.collabButton}
                    onClick={() => !listing.hasPendingRequest && 
                      handleCollaborateRequest(listing.id, listing.researcherId)}
                    disabled={listing.hasPendingRequest || requesting}
                  >
                    {listing.hasPendingRequest 
                      ? "Request Pending" 
                      : requesting 
                        ? "Sending..." 
                        : "Request Collaboration"}
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      )}
    </main>
  );
};

export default CollaboratePage;
