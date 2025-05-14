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
import './ResearcherDashboard.css'; // <-- Make sure your CSS is imported

const CollaboratePage = () => {
  const navigate = useNavigate();
  const [collaborateListings, setCollaborateListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requestStates, setRequestStates] = useState({});

  useEffect(() => {
    const fetchCollaborateListings = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;
    
        // Get user's friends list
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const friends = userDoc.exists() ? userDoc.data().friends || [] : [];
    
        // Get listings user is already collaborating on
        const collabSnapshot = await getDocs(
          query(
            collection(db, 'collaborations'),
            where('collaboratorId', '==', user.uid)
          )
        );
        const collaboratedListingIds = collabSnapshot.docs.map(doc => doc.data().listingId);
    
        // Get all listings except user's own
        const otherQuery = query(
          collection(db, 'research-listings'),
          where('userId', '!=', user.uid)
        );
        const otherSnapshot = await getDocs(otherQuery);
    
        // Process listings with researcher names and request status
        const listingsWithNames = await Promise.all(
          otherSnapshot.docs.map(async (docSnapshot) => {
            const listingData = docSnapshot.data();
            const listingId = docSnapshot.id;
            
            // Skip if already collaborating
            if (collaboratedListingIds.includes(listingId)) return null;
            
            // Get researcher info
            const researcherDoc = await getDoc(doc(db, 'users', listingData.userId));
            const researcherName = researcherDoc.exists()
              ? researcherDoc.data().name
              : 'Unknown Researcher';
    
            // Check for pending requests
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
              hasPendingRequest,
              isFriend: friends.includes(listingData.userId) // Add friend flag
            };
          })
        );
    
        // Filter out nulls and sort with friends first
        const filteredListings = listingsWithNames.filter(Boolean);
        const sortedListings = filteredListings.sort((a, b) => {
          if (a.isFriend && !b.isFriend) return -1; // a comes first
          if (!a.isFriend && b.isFriend) return 1;  // b comes first
          return 0; // no change in order
        });
    
        // Update state with sorted listings
        setCollaborateListings(sortedListings);
    
        // Initialize request states
        const initialStates = {};
        sortedListings.forEach(listing => {
          initialStates[listing.id] = {
            message: '',
            requesting: false,
            hasPendingRequest: listing.hasPendingRequest
          };
        });
        setRequestStates(initialStates);
      } catch (error) {
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
      toast.error("Failed to send collaboration request");
      setRequestStates(prev => ({
        ...prev,
        [listingId]: { ...prev[listingId], requesting: false }
      }));
    }
  };

  return (
    <main>
      <header className="researcher-header">
  <section className="header-title">
    <h1>Collaborate with Other Researchers</h1>
  </section>
  <nav className="header-nav">
    <a href="/researcher-dashboard" className="header-link">Dashboard</a>
    <a href="/researcher-profile" className="header-link">Profile</a>
    <a href="/researcher/add-listing" className="header-link">Add Listing</a>
  </nav>
</header>

      <section className="collaborate-main">
        {loading ? (
          <div style={{ textAlign: 'center', color: '#132238' }}>
            <p>Loading available projects...</p>
          </div>
        ) : (
          <section>
            <h3 style={{ color: '#132238', marginBottom: '1.5rem', textAlign: 'center' }}>Available Projects</h3>
            {collaborateListings.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#132238' }}>No projects available for collaboration at this time.</p>
            ) : (
              collaborateListings.map((listing) => {
                const state = requestStates[listing.id] || {};
                const isRequesting = state.requesting;
                const hasPending = state.hasPendingRequest;

                return (
                  <article key={listing.id} className="collaborate-card">
                    <h4>{listing.title}</h4>
                    <div className="byline">By: {listing.researcherName}</div>
                    <div className="summary">{listing.summary}</div>
                    {!hasPending && (
                      <textarea
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
                    <section className="button-row">
                      <button
                        className="view-btn"
                        onClick={() => navigate(`/listing/${listing.id}`)}
                      >
                        View Details
                      </button>
                      <button
                        className={hasPending ? "collab-btn disabled-btn" : "collab-btn"}
                        onClick={() => !hasPending && handleCollaborateRequest(listing.id, listing.researcherId)}
                        disabled={hasPending || isRequesting}
                      >
                        {hasPending
                          ? "Request Pending"
                          : isRequesting
                          ? "Sending..."
                          : "Request Collaboration"}
                      </button>
                    </section>
                  </article>
                );
              })
            )}
          </section>
        )}
      </section>

      <footer className="collaborate-footer">
        <a href="/contact">Contact</a>
        <a href="/privacy-policy">Privacy Policy</a>
        <a href="/terms-of-service">Terms of Service</a>
        <p>&copy; 2025 Innerk Hub</p>
      </footer>
    </main>
  );
};

export default CollaboratePage;
