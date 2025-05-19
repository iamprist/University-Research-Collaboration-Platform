import React, { useState, useEffect } from 'react';
import { db, auth } from '../../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import {
  Box,
  Paper,
  Button,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';

const ResearcherProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  // Check authentication and get user ID
  useEffect(() => {
    const checkAuthToken = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/signin');
        return;
      }

      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          localStorage.removeItem('authToken');
          navigate('/signin');
        }
      });

      return () => unsubscribe();
    };

    checkAuthToken();
  }, [navigate]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setProfile(userDoc.data());
        } else {
          setError('Profile not found');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <Box className="loading-container" sx={{ p: 6, textAlign: 'center' }}>
        <Typography>Loading profile...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="error-container" sx={{ p: 6, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button
          onClick={() => window.location.reload()}
          variant="contained"
          sx={{
            mt: 2,
            bgcolor: 'var(--light-blue)',
            color: 'var(--dark-blue)',
            borderRadius: '1.5rem',
            px: 4,
            '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' },
          }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box className="researcher-profile-container" sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <Box
        component="header"
        className="researcher-header"
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          bgcolor: 'var(--dark-blue)',
          color: 'var(--white)',
          borderBottom: '2px solid var(--light-blue)',
          p: '1.5rem 2rem',
          width: '100%',
          maxWidth: '100vw',
        }}
      >
        <IconButton
          className="back-button"
          onClick={() => navigate(-1)}
          sx={{
            color: 'var(--white)',
            mr: '1.5rem',
          }}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Box className="header-title" sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.04em' }}>
            Researcher Profile
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', mt: 0.5 }}>
            View and manage your professional details
          </Typography>
        </Box>
       
    <Box className="dropdown-menu-container" sx={{ position: 'relative' }}>
      <Button
        className="menu-toggle-btn"
        onClick={(e) => setMenuAnchorEl(e.currentTarget)}
        sx={{
          bgcolor: 'var(--light-blue)',
          color: 'var(--dark-blue)',
          borderRadius: '1.5rem',
          fontWeight: 600,
          px: 3,
          py: 1.2,
          boxShadow: '0 2px 10px rgba(100,204,197,0.2)',
          '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' },
        }}
      >
        ☰
      </Button>
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            bgcolor: 'var(--dark-blue)',
            color: 'var(--accent-teal)',
            borderRadius: '0.8rem',
            minWidth: 200,
            mt: 1,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchorEl(null);
            navigate('/researcher-dashboard');
          }}
          sx={{
            color: 'var(--accent-teal)',
            borderRadius: '0.5rem',
            px: 2,
            py: 1,
            fontSize: '1.1rem',
            '&:hover': { bgcolor: 'var(--light-blue)', color: 'var(--dark-blue)' },
          }}
        >
          Dashboard
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchorEl(null);
            navigate('/researcher/add-listing');
          }}
          sx={{
            color: 'var(--accent-teal)',
            borderRadius: '0.5rem',
            px: 2,
            py: 1,
            fontSize: '1.1rem',
            '&:hover': { bgcolor: 'var(--light-blue)', color: 'var(--dark-blue)' },
          }}
        >
          Add Listing
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchorEl(null);
            navigate('/friends');
          }}
          sx={{
            color: 'var(--accent-teal)',
            borderRadius: '0.5rem',
            px: 2,
            py: 1,
            fontSize: '1.1rem',
            '&:hover': { bgcolor: 'var(--light-blue)', color: 'var(--dark-blue)' },
          }}
        >
          Friends
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchorEl(null);
            navigate('/researcher/collaborate');
          }}
          sx={{
            color: 'var(--accent-teal)',
            borderRadius: '0.5rem',
            px: 2,
            py: 1,
            fontSize: '1.1rem',
            '&:hover': { bgcolor: 'var(--light-blue)', color: 'var(--dark-blue)' },
          }}
        >
          Collaborate
        </MenuItem>
      </Menu>

            </Box>
          </Box>

          <Box className="profile-content" sx={{ p: 4, bgcolor: '#f5f7fa' }}>
            <Paper className="profile-card" sx={{ maxWidth: 720, mx: 'auto', borderRadius: '0.8rem', boxShadow: 3, overflow: 'hidden' }}>
              <Box className="profile-header" sx={{ bgcolor: '#f8f9fb', p: 4, textAlign: 'center', borderBottom: '1px solid #e3e8ee' }}>
                {profile?.profilePicture ? (
                  <Avatar
                    src={profile.profilePicture}
                    alt="Profile"
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      mb: 2,
                      border: '3px solid #fff',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <Box
                    className="profile-image-placeholder"
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      bgcolor: '#2d3748',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {profile?.name?.charAt(0) || 'A'}
                  </Box>
                )}
                <Typography className="profile-name" sx={{ fontSize: '1.5rem', color: '#2d3748', mt: 2 }}>
                  {profile?.title} {profile?.name}
                </Typography>
              </Box>

              <Box className="profile-details" sx={{ p: 3, color: '#4a5568' }}>
                <Typography>
                  <strong>Email:</strong> {profile.email}
                </Typography>
                <Typography>
                  <strong>Research Area:</strong> {profile.researchArea}
                </Typography>
              </Box>

              <Box className="profile-bio" sx={{ p: 3, borderTop: '1px solid #e3e8ee' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Biography
                </Typography>
                <Typography>{profile.biography}</Typography>
              </Box>

              <Box className="profile-actions" sx={{ p: 3, borderTop: '1px solid #e3e8ee', display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => navigate('/researcher-edit-profile')}
                  className="menu-toggle-btn"
                  variant="contained"
                  sx={{
                    bgcolor: 'var(--light-blue)',
                    color: 'var(--dark-blue)',
                    borderRadius: '1.5rem',
                    fontWeight: 600,
                    px: 3,
                    py: 1.2,
                    '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' },
                  }}
                >
                  Edit Profile
                </Button>
              </Box>
            </Paper>
          </Box>

      <Footer />
    </Box>
  );
};

export default ResearcherProfile;