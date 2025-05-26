// CollaboratePage.jsx - Allows researchers to find and request collaboration on research projects
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
  CircularProgress,
  IconButton
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { sendMessage, messageTypes } from '../../utils/sendMessage';
import Footer from '../../components/Footer';

// Main component for collaboration page
const CollaboratePage = () => {
  const navigate = useNavigate();
  // State for listings available for collaboration
  const [collaborateListings, setCollaborateListings] = useState([]);
  // Loading state for async operations
  const [loading, setLoading] = useState(false);
  // State for tracking request messages and status per listing
  const [requestStates, setRequestStates] = useState({});
  // Toggle to show only friends' projects
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);

  // --- Search State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const dropdownTimeout = React.useRef(null);

  // Fetch available listings and friends on mount
  useEffect(() => {
    let unsubscribe;
    const waitForAuthAndFetch = () => {
      unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          setCollaborateListings([]);
          setRequestStates({});
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
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
      });
    };
    waitForAuthAndFetch();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Handle sending a collaboration request
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

      // Check for existing pending request
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

      // Use custom message or default
      const message = requestStates[listingId]?.message || `Request to collaborate on your project`;

      // Add collaboration request to Firestore
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

  // --- Search Handlers ---
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setDropdownVisible(false);
    clearTimeout(dropdownTimeout.current);
  };
  const handleInputFocus = () => {
    setDropdownVisible(false);
    clearTimeout(dropdownTimeout.current);
  };
  const handleClear = () => {
    setSearchTerm("");
    setSearchResults([]);
    setDropdownVisible(false);
    setShowNoResults(false);
  };
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setDropdownVisible(false);
      setShowNoResults(false);
      return;
    }
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = collaborateListings.filter(item => {
      const title = item.title?.toLowerCase() || '';
      const researcherName = item.researcherName?.toLowerCase() || '';
      return title.includes(searchTermLower) || researcherName.includes(searchTermLower);
    });
    setSearchResults(filtered);
    setDropdownVisible(filtered.length > 0);
    setShowNoResults(filtered.length === 0);
    clearTimeout(dropdownTimeout.current);
    dropdownTimeout.current = setTimeout(() => {
      setDropdownVisible(false);
    }, 5000);
  };

  // Filter listings to show only friends' projects if enabled
  const displayedListings = showFriendsOnly
    ? collaborateListings.filter(listing => listing.isFriend)
    : collaborateListings;

  // --- Search Results to Display ---
  const listingsToDisplay = searchTerm && dropdownVisible ? searchResults : displayedListings;

  // Render the collaboration page UI
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

      {/* Search Section */}
      <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <form
          onSubmit={e => { e.preventDefault(); handleSearch(); }}
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            position: 'relative',
            background: 'var(--background-paper, #fff)',
            borderRadius: 16,
            boxShadow: '0 2px 12px rgba(30,60,90,0.08)',
            padding: 8,
            border: '1.5px solid #B1EDE8',
            flex: 1,
            minWidth: 0
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by project or researcher name..."
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            sx={{
              bgcolor: 'transparent',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'transparent',
                fontWeight: 500,
                fontSize: 18,
                color: '#132238',
                border: 'none',
                boxShadow: 'none',
                padding: '0 0',
                '& fieldset': { border: 'none' },
              },
            }}
            inputProps={{ style: { padding: '14px 12px' } }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleClear}
              sx={{
                bgcolor: '#b1ede8',
                color: '#132238',
                minWidth: 64,
                height: 32,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: 14,
                boxShadow: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                '&:hover': { bgcolor: '#d1e0e0', border: 'none' }
              }}
              disableElevation
              size="small"
            >
              Search
            </Button>
            <Button
              variant="contained"
              onClick={handleClear}
              sx={{
                bgcolor: '#b1ede8',
                color: '#132238',
                minWidth: 64,
                height: 32,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: 14,
                boxShadow: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                '&:hover': { bgcolor: '#d1e0e0', border: 'none' }
              }}
              disableElevation
              size="small"
            >
              Clear
            </Button>
          </Box>
          {/* Search Dropdown */}
          {dropdownVisible && (
            <Box sx={{
              position: 'absolute',
              top: '110%',
              left: 0,
              right: 0,
              zIndex: 999,
              background: '#fff',
              boxShadow: '0 8px 32px rgba(30,60,90,0.18)',
              maxHeight: 340,
              overflowY: 'auto',
              borderRadius: 2,
              color: '#132238',
              p: 0,
              mt: 1,
              border: '1.5px solid #B1EDE8',
              minWidth: 0
            }}>
              {searchResults.length === 0 ? (
                <Typography sx={{ p: 2, color: '#7a8fb1', textAlign: 'center', fontSize: 16 }}>
                  {showNoResults ? "No projects found." : "Start typing to search"}
                </Typography>
              ) : (
                searchResults.map(item => (
                  <Box
                    key={item.id}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f4f8',
                      '&:hover': { bgcolor: '#eaf7f6' },
                      transition: 'background 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      borderRadius: 1
                    }}
                    onClick={() => navigate(`/listing/${item.id}`)}
                  >
                    <Typography variant="h6" sx={{ m: 0, color: '#132238', fontWeight: 700, fontSize: 18 }}>{item.title}</Typography>
                    <Typography variant="body2" sx={{ color: '#5AA9A3', fontWeight: 500, fontSize: 15 }}>By: {item.researcherName}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: '#7a8fb1', fontSize: 15 }}>{item.summary}</Typography>
                  </Box>
                ))
              )}
            </Box>
          )}
        </form>
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, p: 0, minHeight: 0, minWidth: 0 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showFriendsOnly}
                onChange={() => setShowFriendsOnly(!showFriendsOnly)}
                sx={{ color: '#132238', p: 0.5, '& .MuiSvgIcon-root': { fontSize: 18 } }}
              />
            }
            label={<span style={{ color: '#132238', fontWeight: 500, fontSize: 12 }}>Show Friends Only</span>}
            sx={{ color: '#132238', m: 0, p: 0, minHeight: 0, minWidth: 0 }}
          />
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 3, maxWidth: 1200, mx: 'auto', width: '100%' }}>
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
            {listingsToDisplay.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: '#7a8fb1' }}>
                No projects available for collaboration at this time.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  overflowX: 'auto',
                  gap: 3,
                  pb: 2,
                  px: 1,
                  scrollbarWidth: 'thin',
                  '&::-webkit-scrollbar': {
                    height: 8,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#eaf7f6',
                    borderRadius: 4,
                  },
                }}
              >
                {listingsToDisplay.map((listing) => {
                  const state = requestStates[listing.id] || {};
                  const isRequesting = state.requesting;
                  const hasPending = state.hasPendingRequest;
                  return (
                    <Paper
                      key={listing.id}
                      elevation={3}
                      sx={{
                        minWidth: 340,
                        maxWidth: 340,
                        flex: '0 0 340px',
                        borderRadius: 3,
                        p: 0,
                        overflow: 'hidden',
                        bgcolor: '#fff',
                        border: '1.5px solid #B1EDE8',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 260,
                        boxShadow: '0 2px 12px rgba(30,60,90,0.08)',
                        transition: 'box-shadow 0.2s',
                        '&:hover': {
                          boxShadow: '0 4px 24px rgba(30,60,90,0.16)',
                          borderColor: '#5AA9A3',
                        },
                      }}
                    >
                      <Box sx={{ p: 2.5, pb: 1.5, flexGrow: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            color: '#132238',
                            fontWeight: 700,
                            fontSize: 20,
                            mb: 1,
                            lineHeight: 1.2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {listing.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#5AA9A3',
                            fontWeight: 500,
                            mb: 1,
                            fontSize: 15
                          }}
                        >
                          By: {listing.researcherName}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#7a8fb1',
                            mb: 2,
                            fontSize: 15,
                            minHeight: 44,
                            maxHeight: 44,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
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
                              mb: 1.5,
                              '& .MuiOutlinedInput-root': {
                                color: '#132238',
                                fontSize: 14,
                                bgcolor: '#f7fafc',
                                '& fieldset': { borderColor: '#B1EDE8' }
                              }
                            }}
                          />
                        )}
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          px: 2.5,
                          pb: 2.5,
                          pt: 0,
                          borderTop: '1px solid #eaf7f6',
                          bgcolor: '#f7fafc'
                        }}
                      >
                        <Button
                          variant="outlined"
                          onClick={() => navigate(`/listing/${listing.id}`)}
                          sx={{
                            color: '#5AA9A3',
                            borderColor: '#B1EDE8',
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: 14,
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            '&:hover': { borderColor: '#5AA9A3', bgcolor: '#eaf7f6' }
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => !hasPending && handleCollaborateRequest(listing.id, listing.researcherId)}
                          disabled={hasPending || isRequesting}
                          sx={{
                            bgcolor: hasPending ? '#eaf7f6' : '#5AA9A3',
                            color: hasPending ? '#7a8fb1' : '#fff',
                            fontWeight: 700,
                            textTransform: 'none',
                            fontSize: 14,
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            boxShadow: 'none',
                            flexGrow: 1,
                            '&:hover': {
                              bgcolor: hasPending ? '#eaf7f6' : '#3e7e7b'
                            }
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
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </Box>
      <Footer />
    </Box>
  );
};

export default CollaboratePage;