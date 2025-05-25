import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../config/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, addDoc,serverTimestamp } from 'firebase/firestore';
import { 
  Box, 
  Typography, 
  Button, 
  Avatar, 
  Paper, 
  CircularProgress,
  IconButton
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';

const FriendProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;
        
        // Fetch user profile
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          setError(true);
          return;
        }
        setProfile(userDoc.data());
        
        // Fetch user's research listings
        const listingsQuery = query(
          collection(db, 'research-listings'),
          where('userId', '==', userId)
        );
        const listingsSnapshot = await getDocs(listingsQuery);
        const listingsData = listingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setListings(listingsData);
        
        // Check friendship status if logged in
        if (currentUser) {
          // Check if friends
          const friendsQuery = query(
            collection(db, 'friends'),
            where('users', 'array-contains', currentUser.uid),
            where('status', '==', 'accepted')
          );
          const friendsSnapshot = await getDocs(friendsQuery);
          const isFriend = friendsSnapshot.docs.some(doc => 
            doc.data().users.includes(userId)
          );
          setIsFriend(isFriend);

          // Check for pending requests
          const pendingQuery = query(
            collection(db, 'friends'),
            where('users', 'array-contains', currentUser.uid),
            where('status', '==', 'pending'),
            where('sender', '==', currentUser.uid)
          );
          const pendingSnapshot = await getDocs(pendingQuery);
          const hasPending = pendingSnapshot.docs.some(doc => 
            doc.data().users.includes(userId)
          );
          setHasPendingRequest(hasPending);
        }
        
      } catch (err) {
        console.error('Error fetching friend profile:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId]);

  const handleAddFriend = async () => {
    try {
      setProcessingRequest(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate('/signin');
        return;
      }

      await addDoc(collection(db, 'friends'), {
        users: [currentUser.uid, userId],
        status: 'pending',
        sender: currentUser.uid,
        createdAt: serverTimestamp()
      });

      setHasPendingRequest(true);
      toast.success('Friend request sent!');
    } catch (error) {
      toast.error('Failed to send request');
    } finally {
      setProcessingRequest(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h6">Profile not available</Typography>
        <Typography sx={{ mb: 2 }}>This user hasn't set up their profile yet.</Typography>
        <Button onClick={() => navigate(-1)} variant="contained">
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        bgcolor: 'var(--dark-blue)', 
        color: 'white', 
        p: 2,
        borderBottom: '2px solid var(--light-blue)'
      }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'white' }}>
          <ArrowBackIosIcon />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 2 }}>
          {profile.name}'s Profile
        </Typography>
      </Box>

      {/* Profile Content */}
      <Box sx={{ flex: 1, p: 3, maxWidth: 800, mx: 'auto', width: '100%' }}>
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'var(--accent-teal)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              src={profile.profilePicture}
              sx={{ 
                width: 80, 
                height: 80, 
                mr: 3,
                bgcolor: 'var(--primary-blue)',
                color: 'white'
              }}
            >
              {profile.name?.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5">{profile.name}</Typography>
              {profile.researchArea && (
                <Typography sx={{ color: 'var(--primary-blue)', fontWeight: 500 }}>
                  {profile.researchArea}
                </Typography>
              )}
            </Box>
            
            {auth.currentUser && auth.currentUser.uid !== userId && (
              <Box>
                {isFriend ? (
                  <Button variant="contained" disabled sx={{ bgcolor: 'var(--primary-blue)', color: 'white' }}>
                    Friends
                  </Button>
                ) : hasPendingRequest ? (
                  <Button variant="outlined" disabled sx={{ color: 'var(--primary-blue)', borderColor: 'var(--primary-blue)' }}>
                    Request Sent
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    onClick={handleAddFriend}
                    disabled={processingRequest}
                    sx={{ bgcolor: 'var(--light-blue)', color: 'var(--dark-blue)' }}
                  >
                    {processingRequest ? 'Sending...' : 'Add Friend'}
                  </Button>
                )}
              </Box>
            )}
          </Box>

          {profile.biography && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>About</Typography>
              <Typography>{profile.biography}</Typography>
            </Box>
          )}
        </Paper>

        {/* Research Listings */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Research Projects
        </Typography>
        
        {listings.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography>No research projects shared yet</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {listings.map(listing => (
              <Paper 
                key={listing.id} 
                sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  '&:hover': { 
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => navigate(`/listing/${listing.id}`)}
              >
                <Typography variant="h6">{listing.title}</Typography>
                <Typography variant="body2" sx={{ color: 'var(--gray-dark)' }}>
                  {listing.summary}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      <Footer />
    </Box>
  );
};

export default FriendProfile;