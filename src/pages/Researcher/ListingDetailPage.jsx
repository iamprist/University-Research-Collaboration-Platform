// ListingDetailPage.jsx - Displays detailed information about a research listing
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useEffect, useState } from 'react';
import './ListingDetailPage.css';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { Box, Typography, Button, IconButton, CircularProgress, Chip, Avatar } from '@mui/material';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [researcher, setResearcher] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [isLeadResearcher, setIsLeadResearcher] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState('');
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch listing data
        const docRef = doc(db, "research-listings", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setLoading(false);
          return;
        }

        const listingData = { id: docSnap.id, ...docSnap.data() };
        setListing(listingData);

        // 2. Fetch lead researcher info if available
        if (listingData.userId) {
          const researcherDoc = await getDoc(doc(db, "users", listingData.userId));
          if (researcherDoc.exists()) {
            setResearcher(researcherDoc.data());
          }
          // Check if current user is lead researcher
          if (currentUser && listingData.userId === currentUser.uid) {
            setIsLeadResearcher(true);
          } else {
            setIsLeadResearcher(false);
          }
        } else {
          setIsLeadResearcher(false);
        }

        // 3. Fetch collaborators
        setCollaboratorsLoading(true);
        try {
          const collaboratorsQuery = query(
            collection(db, "collaborations"),
            where("listingId", "==", id),
            where("status", "in", ["active", "pending"])
          );
          const collaboratorsSnapshot = await getDocs(collaboratorsQuery);
          console.log(`Found ${collaboratorsSnapshot.size} collaborators`);

          const collaboratorsData = [];
          let foundSelf = false;
          for (const collabDoc of collaboratorsSnapshot.docs) {
            const collabData = collabDoc.data();
            console.log('Collaboration data:', collabData);
            
            try {
              const userDoc = await getDoc(doc(db, "users", collabData.collaboratorId));
              if (userDoc.exists()) {
                console.log('Found user:', userDoc.data());
                collaboratorsData.push({
                  id: userDoc.id,
                  ...userDoc.data()
                });
              } else {
                console.warn(`User not found for collaboratorId: ${collabData.collaboratorId}`);
              }
            } catch (userError) {
              console.error('Error fetching user:', userError);
            }

            if (currentUser && collabData.collaboratorId === currentUser.uid) {
              if (collabData.status === "active") setIsCollaborator(true);
              if (collabData.status === "pending") setRequestPending(true);
              foundSelf = true;
            }
          }
          if (!foundSelf) {
            setIsCollaborator(false);
            setRequestPending(false);
          }
          setCollaborators(collaboratorsData);
          console.log('Final collaborators data:', collaboratorsData);
        } catch (collabError) {
          console.error('Error fetching collaborators:', collabError);
        } finally {
          setCollaboratorsLoading(false);
        }

      } catch (error) {
        console.error("Error fetching listing data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line
  }, [id, currentUser]);

  // Handler for requesting collaboration
  const handleRequestCollaboration = async () => {
    setRequestLoading(true);
    setRequestError('');
    if (!currentUser) {
      setRequestError('You must be signed in to request collaboration.');
      setRequestLoading(false);
      return;
    }
    try {
      // Check for existing pending request in messages
      const snap = await getDocs(query(
        collection(db, "messages"),
        where("listingId", "==", id),
        where("from", "==", currentUser.uid),
        where("type", "==", "collaboration-request"),
        where("status", "==", "pending")
      ));
      if (!snap.empty) {
        setRequestError('You have already requested collaboration.');
        setRequestLoading(false);
        return;
      }
      // Defensive: double-check listing.userId is not currentUser.uid
      if (listing && listing.userId && listing.userId !== currentUser.uid) {
        await addDoc(collection(db, "messages"), {
          to: listing.userId,
          from: currentUser.uid,
          listingId: id,
          type: "collaboration-request",
          status: "pending",
          content: `${currentUser.displayName || currentUser.email || currentUser.uid} has requested to collaborate on your project: ${listing.title}`,
          createdAt: new Date(),
          collaboratorId: currentUser.uid,
          researcherName: currentUser.displayName || currentUser.email || currentUser.uid
        });
        setRequestPending(true);
      } else {
        setRequestError('Invalid listing or you cannot request your own project.');
      }
    } catch (err) {
      setRequestError('Failed to send request. Please try again.');
    }
    setRequestLoading(false);
  };

  // Render logic
  if (loading) return (
    <Box className="loading-container">
      <CircularProgress sx={{ color: '#64CCC5', mb: 2 }} />
      <Typography>Loading listing details...</Typography>
    </Box>
  );

  if (!listing) return (
    <Box className="not-found">
      <Typography variant="h4">Listing not found</Typography>
      <Typography>The requested research listing could not be found.</Typography>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'var(--dark-blue)',
          color: '#B1EDE8',
          p: 3,
          borderBottom: '2px solid #2a3a57',
          mb: 3
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{ color: '#FFFFFF', mr: 2 }}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 0.5 }}>
            {listing.title}
          </Typography>
          {/* Lead Researcher */}
          {researcher && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle1" sx={{ color: '#B1EDE8', fontWeight: 500 }}>
                Lead Researcher: {researcher.title} {researcher.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#B1EDE8' }}>
                {researcher.email}
              </Typography>
            </Box>
          )}
          {/* Collaborators */}
          <Box sx={{ mt: 2 }}>
            {collaboratorsLoading ? (
              <CircularProgress size={20} sx={{ color: '#B1EDE8' }} />
            ) : collaborators.length > 0 ? (
              <>
                <Typography variant="subtitle2" sx={{ color: '#B1EDE8', fontWeight: 500, mb: 1 }}>
                  Collaborators:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {collaborators.map((collaborator) => (
                    <Chip
                      key={collaborator.id}
                      avatar={collaborator.photoURL ? <Avatar src={collaborator.photoURL} /> : undefined}
                      label={`${collaborator.title || ''} ${collaborator.name}`.trim()}
                      sx={{
                        backgroundColor: '#64CCC5',
                        color: '#132238',
                        '& .MuiChip-label': {
                          overflow: 'visible',
                          whiteSpace: 'normal'
                        }
                      }}
                    />
                  ))}
                </Box>
              </>
            ) : (
              <Typography variant="subtitle2" sx={{ color: '#B1EDE8', fontStyle: 'italic' }}>
                No active collaborators yet
              </Typography>
            )}
          </Box>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate('/researcher-dashboard')}
          sx={{
            ml: 'auto',
            bgcolor: '#B1EDE8',
            color: '#132238',
            '&:hover': { bgcolor: '#9dd8d3' }
          }}
        >
          Back to Dashboard
        </Button>
      </Box>
      <Box className="listing-container">
        <Box className="listing-details">
          <Box className="detail-section">
            <Typography variant="h5" sx={{ color: '#1A2E40', borderBottom: '2px solid #64CCC5', pb: '0.5rem', mb: '1rem' }}>
              Project Summary
            </Typography>
            <Typography>{listing.summary}</Typography>
          </Box>
          <Box className="detail-grid">
            <Box className="detail-card">
              <Typography variant="subtitle1" sx={{ color: '#132238', fontWeight: 600 }}>Department</Typography>
              <Typography>{listing.department || 'Not specified'}</Typography>
            </Box>
            <Box className="detail-card">
              <Typography variant="subtitle1" sx={{ color: '#132238', fontWeight: 600 }}>Methodology</Typography>
              <Typography>{listing.methodology || 'Not specified'}</Typography>
            </Box>
            <Box className="detail-card">
              <Typography variant="subtitle1" sx={{ color: '#132238', fontWeight: 600 }}>Collaboration Needs</Typography>
              <Typography>{listing.collaboratorNeeds || 'Not specified'}</Typography>
            </Box>
            {listing.researchArea && (
              <Box className="detail-card">
                <Typography variant="subtitle1" sx={{ color: '#132238', fontWeight: 600 }}>Research Area</Typography>
                <Typography>{listing.researchArea}</Typography>
              </Box>
            )}
            {listing.status && (
              <Box className="detail-card">
                <Typography variant="subtitle1" sx={{ color: '#132238', fontWeight: 600 }}>Project Status</Typography>
                <Typography>{listing.status}</Typography>
              </Box>
            )}
            {listing.endDate && (
              <Box className="detail-card">
                <Typography variant="subtitle1" sx={{ color: '#132238', fontWeight: 600 }}>Estimated Completion</Typography>
                <Typography>{new Date(listing.endDate).toLocaleDateString()}</Typography>
              </Box>
            )}
          </Box>
          {listing.publicationLink && (
            <Box className="external-links">
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Related Publications</Typography>
              <a href={listing.publicationLink} target="_blank" rel="noopener noreferrer">
                View Publication
              </a>
            </Box>
          )}
          {/* Request to Collaborate Button */}
          {!loading && currentUser && !isLeadResearcher && !isCollaborator && !requestPending && (
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                disabled={requestLoading}
                onClick={handleRequestCollaboration}
                sx={{ bgcolor: '#64CCC5', color: '#132238', '&:hover': { bgcolor: '#4dbbb2' } }}
              >
                {requestLoading ? 'Requesting...' : 'Request to Collaborate'}
              </Button>
              {requestError && (
                <Typography color="error" sx={{ mt: 1 }}>{requestError}</Typography>
              )}
            </Box>
          )}
          {requestPending && (
            <Box sx={{ mt: 3 }}>
              <Chip label="Collaboration Request Pending" color="warning" />
            </Box>
          )}
          {isCollaborator && (
            <Box sx={{ mt: 3 }}>
              <Chip label="You are a collaborator" color="success" />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ListingDetailPage;