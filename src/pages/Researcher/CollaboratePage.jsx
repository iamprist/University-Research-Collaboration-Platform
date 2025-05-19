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
import { 
  Box,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  Paper,
  Grid,
  CircularProgress,
  IconButton
} from '@mui/material';
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
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box 
        sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'var(--dark-blue)',
          color: '#B1EDE8',
          p: 3,
          borderBottom: '2px solid #2a3a57'
        }}
      >
        <IconButton 
          onClick={() => navigate(-1)}
          sx={{ color: '#FFFFFF', mr: 2 }}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
            Collaborate with Other Researchers
          </Typography>
          <Typography variant="body1" sx={{ color: '#7a8fb1' }}>
            Find projects to join and collaborate on
          </Typography>
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

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 3, maxWidth: 1200, mx: 'auto', width: '100%' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={showFriendsOnly}
              onChange={() => setShowFriendsOnly(!showFriendsOnly)}
              sx={{ color: '#132238', }}
            />
          }
          label="Show Friends Only"
          sx={{ color: '#132238', mb: 3, justifyContent: 'center' }}
        />

        {loading ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <CircularProgress sx={{ color: '#132238' }} />
            <Typography variant="body1" sx={{ color: '#B1EDE8', mt: 2 }}>
              Loading available projects...
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="h5" sx={{ color: '#132238', mb: 4, textAlign: 'center' }}>
              Available Projects
            </Typography>
            
            {displayedListings.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: '#7a8fb1' }}>
                No projects available for collaboration at this time.
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {displayedListings.map((listing) => {
                  const state = requestStates[listing.id] || {};
                  const isRequesting = state.requesting;
                  const hasPending = state.hasPendingRequest;

                  return (
                    <Grid item xs={12} md={6} key={listing.id}>
                      <Paper 
                        sx={{
                          p: 3,
                          bgcolor: '#132238',
                          color: '#B1EDE8',
                          borderRadius: 2,
                          border: '1px solid #2a3a57'
                        }}
                      >
                        <Typography variant="h6"  gutterBottom>
                          {listing.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#FFFFFF', mb: 2 }}>
                          By: {listing.researcherName}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2, color: '#FFFFFF' }}>
                          {listing.summary} 
                        </Typography>

                        {!hasPending && (
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            variant="outlined"
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
                            sx={{
                              mb: 2,
                              '& .MuiOutlinedInput-root': {
                                color: '#FFFFFF',
                                '& fieldset': { borderColor: '#2a3a57' }
                              }
                            }}
                          />
                        )}

                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button
                            variant="outlined"
                            onClick={() => navigate(`/listing/${listing.id}`)}
                            sx={{
                              color: '#B1EDE8',
                              borderColor: '#2a3a57',
                              '&:hover': { borderColor: '#B1EDE8' }
                            }}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="contained"
                            onClick={() => !hasPending && handleCollaborateRequest(listing.id, listing.researcherId)}
                            disabled={hasPending || isRequesting}
                            sx={{
                              bgcolor: hasPending ? '#2a3a57' : '#B1EDE8',
                              color: hasPending ? '#FFFFFF' : '#132238',
                              '&:hover': { 
                                bgcolor: hasPending ? '#2a3a57' : '#9dd8d3',
                                boxShadow: 'none'
                                
                              },
                              flexGrow: 1
                            }}
                          >
                            {hasPending
                              ? "Request Pending"
                              : isRequesting
                              ? "Sending..."
                              : "Request Collaboration"}
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}
      </Box>

      <Footer />
    </Box>
  );
};

export default CollaboratePage;