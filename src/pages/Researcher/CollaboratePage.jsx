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
import './ResearcherDashboard.css';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { sendMessage, messageTypes } from '../../utils/sendMessage';
import Footer from '../../components/Footer';

const CollaboratePage = () => {
  const navigate = useNavigate();
  const [collaborateListings, setCollaborateListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requestStates, setRequestStates] = useState({});
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);

  useEffect(() => {
    const fetchCollaborateListings = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;

        // Fetch friends with status 'accepted' where current user is in users array
        const friendsQuery = query(
          collection(db, 'friends'),
          where('users', 'array-contains', user.uid),
          where('status', '==', 'accepted')
        );
        const friendsSnapshot = await getDocs(friendsQuery);
        // Get friend IDs (the other user in each friendship)
        const friends = friendsSnapshot.docs.map(docSnap => {
          const users = docSnap.data().users;
          return users.find(uid => uid !== user.uid);
        });

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

            // Skip listings user is collaborating on
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

            // Check if the listing owner is a friend
            const isFriend = friends.map(String).includes(String(listingData.userId));

            return {
              id: listingId,
              ...listingData,
              researcherName,
              researcherId: listingData.userId,
              hasPendingRequest,
              isFriend
            };
          })
        );

        const filteredListings = listingsWithNames.filter(Boolean);

        // Sort with friends first
        const sortedListings = filteredListings.sort((a, b) => {
          if (a.isFriend === b.isFriend) return 0;
          return a.isFriend ? -1 : 1;
        });

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

      // Send notification to the researcher
      const listingDoc = await getDoc(doc(db, "research-listings", listingId));
      const listingTitle = listingDoc.exists() ? listingDoc.data().title : "Research Project"; 

      await sendMessage(researcherId, {
        title: 'New Collaboration Request',
        content: `${currentUser.displayName || "A researcher"} wants to collaborate on "${listingTitle}"`,
        type: messageTypes.COLLABORATION_REQUEST,
        relatedId: listingId
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

  // Apply filtering for friends only if enabled
  const displayedListings = showFriendsOnly
    ? collaborateListings.filter(listing => listing.isFriend)
    : collaborateListings;

  return (
    <main>
      <header className="researcher-header">
         <button 
            className="back-button"
            onClick={() => navigate(-1)}
            style={{ 
              color: 'var(--white)',
              marginRight: '1.5rem' // Add spacing between arrow and title
            }}
          >
            <ArrowBackIosIcon />
          </button>
        <section className="header-title">
          <h1>Collaborate with Other Researchers</h1>
          <p>Find projects to join and collaborate on</p>
        </section>
        <section className="header-actions">
          <button 
            className="dashboard-btn"
            onClick={() => navigate('/researcher-dashboard')}
          >
            Back to Dashboard
          </button>
        </section>
      </header>

      <section className="collaborate-main">
        <section style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <label style={{ color: '#132238', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showFriendsOnly} 
              onChange={() => setShowFriendsOnly(!showFriendsOnly)} 
              style={{ marginRight: '0.5rem' }}
            />
            Show Friends Only
          </label>
        </section>

        {loading ? (
          <section style={{ textAlign: 'center', color: '#132238' }}>
            <p>Loading available projects...</p>
          </section>
        ) : (
          <section>
            <h3 style={{ color: '#132238', marginBottom: '1.5rem', textAlign: 'center' }}>Available Projects</h3>
            {displayedListings.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#132238' }}>No projects available for collaboration at this time.</p>
            ) : (
              displayedListings.map((listing) => {
                const state = requestStates[listing.id] || {};
                const isRequesting = state.requesting;
                const hasPending = state.hasPendingRequest;

                return (
                  <article key={listing.id} className="collaborate-card">
                    <h4>{listing.title}</h4>
                    <section className="byline">By: {listing.researcherName}</section>
                    <section className="summary">{listing.summary}</section>
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

      <Footer />
    </main>
  );
};

export default CollaboratePage;
