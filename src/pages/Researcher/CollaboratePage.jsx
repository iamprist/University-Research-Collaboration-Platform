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
  const [requestStates, setRequestStates] = useState({}); // Holds message, requesting, and pending state per listing

  useEffect(() => {
    const fetchCollaborateListings = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;
  
        // Get all listings where user is already collaborating
        const collabSnapshot = await getDocs(
          query(
            collection(db, 'collaborations'),
            where('collaboratorId', '==', user.uid)
          )
        );
        const collaboratedListingIds = collabSnapshot.docs.map(doc => doc.data().listingId);
  
        // Fetch all listings NOT created by the current user
        const otherQuery = query(
          collection(db, 'research-listings'),
          where('userId', '!=', user.uid)
        );
        const otherSnapshot = await getDocs(otherQuery);
  
        const listingsWithNames = await Promise.all(
          otherSnapshot.docs.map(async (docSnapshot) => {
            const listingData = docSnapshot.data();
            const listingId = docSnapshot.id;
  
            // Skip listings the user is already collaborating on
            if (collaboratedListingIds.includes(listingId)) return null;
  
            const researcherDoc = await getDoc(doc(db, 'users', listingData.userId));
            const researcherName = researcherDoc.exists()
              ? researcherDoc.data().name
              : 'Unknown Researcher';
  
            // Check if there's a pending request for this listing
            const requestQuery = query(
              collection(db, 'collaboration-requests'),
              where('listingId', '==', listingId),
              where('requesterId', '==', user.uid),
              where('status', '==', 'pending')
            );
            const existingRequest = await getDocs(requestQuery);
            const hasPendingRequest = !existingRequest.empty;
  
            return {
              id: listingId,
              ...listingData,
              researcherName,
              researcherId: listingData.userId,
              hasPendingRequest
            };
          })
        );
  
        // Filter out any nulls (i.e., skipped listings)
        const filteredListings = listingsWithNames.filter(Boolean);
        setCollaborateListings(filteredListings);
  
        // Initialize requestStates
        const initialStates = {};
        filteredListings.forEach(listing => {
          initialStates[listing.id] = {
            message: '',
            requesting: false,
            hasPendingRequest: listing.hasPendingRequest
          };
        });
        setRequestStates(initialStates);
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
      setRequestStates(prev => ({
        ...prev,
        [listingId]: { ...prev[listingId], requesting: true }
      }));

      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("You need to be logged in to collaborate");
        return;
      }

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

      const message = requestStates[listingId]?.message || `Request to collaborate on your project`;

      await addDoc(collection(db, "collaboration-requests"), {
        listingId,
        researcherId,
        requesterId: currentUser.uid,
        requesterName: currentUser.displayName || "Anonymous Researcher",
        status: "pending",
        createdAt: serverTimestamp(),
        message
      });

      toast.success("Collaboration request sent successfully!");
      setRequestStates(prev => ({
        ...prev,
        [listingId]: {
          ...prev[listingId],
          requesting: false,
          message: '',
          hasPendingRequest: true
        }
      }));
    } catch (error) {
      console.error("Error sending request:", error);
      toast.error("Failed to send collaboration request");
      setRequestStates(prev => ({
        ...prev,
        [listingId]: { ...prev[listingId], requesting: false }
      }));
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
            collaborateListings.map((listing) => {
              const state = requestStates[listing.id] || {};
              const isRequesting = state.requesting;
              const hasPending = state.hasPendingRequest;

              return (
                <div key={listing.id} style={styles.card}>
                  <h4 style={styles.cardTitle}>{listing.title}</h4>
                  <p style={{ color: '#64CCC5', fontStyle: 'italic' }}>
                    By: {listing.researcherName}
                  </p>
                  <p style={styles.cardText}>{listing.summary}</p>

                  {!hasPending && (
                    <textarea
                      style={styles.messageInput}
                      placeholder="Add a message to the researcher (optional)"
                      value={state.message || ""}
                      onChange={(e) =>
                        setRequestStates((prev) => ({
                          ...prev,
                          [listing.id]: {
                            ...prev[listing.id],
                            message: e.target.value
                          }
                        }))
                      }
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
                      style={hasPending ? styles.disabledButton : styles.collabButton}
                      onClick={() => !hasPending && handleCollaborateRequest(listing.id, listing.researcherId)}
                      disabled={hasPending || isRequesting}
                    >
                      {hasPending
                        ? "Request Pending"
                        : isRequesting
                          ? "Sending..."
                          : "Request Collaboration"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}
    </main>
  );
};

export default CollaboratePage;
