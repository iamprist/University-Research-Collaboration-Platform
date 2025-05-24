// EditProfile.jsx - Allows researchers to edit and update their profile information
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResearcherDashboard.css';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import MenuIcon from '@mui/icons-material/Menu';
import Footer from '../../components/Footer';
import { Box, Button, IconButton, Menu, MenuItem, Typography, TextField, Select, InputLabel, FormControl, Avatar } from '@mui/material';
import { useEditProfileLogic } from './researcherEditProfileLogic';
import { auth } from '../../config/firebaseConfig';

const researchAreas = [
  'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Mathematics',
  'Statistics', 'Engineering', 'Medicine', 'Nursing', 'Pharmacy', 'Law',
  'Business', 'Economics', 'Political Science', 'Psychology', 'Sociology',
  'Anthropology', 'Education', 'Environmental Science', 'History',
  'Artificial Intelligence', 'Data Science', 'Agriculture', 'Architecture',
  'Geography', 'Philosophy', 'Linguistics', 'Communication', 'Other'
];

// Researcher titles for dropdown
const titles = [
  'Dr', 'Prof', 'Mr', 'Ms', 'Mrs', 'Mx', 'Other'
];

const EditProfile = () => {
  const navigate = useNavigate();
  // State for menu anchor (dropdown menu)
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  // Use backend logic hook
  const {
    profile,
    handleChange: logicHandleChange,
    handleSubmit: logicHandleSubmit
  } = useEditProfileLogic();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/signin');
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        localStorage.removeItem('authToken');
        navigate('/signin');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* HEADER: Navigation and menu */}
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
            Edit Your Profile
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', mt: 0.5 }}>
            Update your research profile information
          </Typography>
        </Box>
        {/* Dropdown menu for navigation */}
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
            <MenuIcon />
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
            {/* Menu navigation options */}
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

      {/* FORM: Edit profile fields */}
      <Box sx={{ maxWidth: '700px', margin: '2rem auto', px: '1.5rem' }}>
        <form onSubmit={logicHandleSubmit}>
          <Box
            sx={{
              background: '#1A2E40',
              borderRadius: '1rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.12)',
              p: '2rem',
              color: '#FFFFFF',
            }}
          >
            {/* Profile Picture Upload */}
            <Box sx={{ mb: '1.5rem' }}>
              <Typography sx={{ display: 'block', mb: '0.5rem', color: '#64CCC5', fontWeight: 600 }}>
                Profile Picture
              </Typography>
              <Button
                variant="outlined"
                component="label"
                sx={{
                  width: '100%',
                  bgcolor: '#132238',
                  border: '1.5px solid #64CCC5',
                  borderRadius: '0.5rem',
                  color: '#FFFFFF',
                  py: '0.7rem',
                  mb: 1,
                  '&:hover': { bgcolor: '#18304a', borderColor: '#64CCC5' },
                }}
              >
                Upload
                <input
                  type="file"
                  name="profilePicture"
                  accept="image/*"
                  hidden
                  onChange={logicHandleChange}
                />
              </Button>
              {typeof profile.profilePicture === 'string' && (
                <Avatar
                  src={profile.profilePicture}
                  alt="Profile"
                  sx={{
                    mt: 2,
                    width: 80,
                    height: 80,
                    borderRadius: '0.5rem',
                    mx: 'auto',
                  }}
                />
              )}
            </Box>

            {/* Title Dropdown */}
            <Box sx={{ mb: '1.5rem' }}>
              <InputLabel
                htmlFor="title"
                sx={{ display: 'block', mb: '0.5rem', color: '#64CCC5', fontWeight: 600 }}
              >
                Title
              </InputLabel>
              <FormControl fullWidth>
                <Select
                  id="title"
                  name="title"
                  value={profile.title || ''}
                  onChange={logicHandleChange}
                  sx={{
                    width: '100%',
                    bgcolor: '#132238',
                    border: '1.5px solid #64CCC5',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    py: '0.7rem',
                    '& .MuiSelect-icon': { color: '#64CCC5' },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#132238',
                        color: '#FFFFFF',
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>-- Select Title --</em>
                  </MenuItem>
                  {titles.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Email Field */}
            <Box sx={{ mb: '1.5rem' }}>
              <InputLabel
                htmlFor="email"
                sx={{ display: 'block', mb: '0.5rem', color: '#64CCC5', fontWeight: 600 }}
              >
                Email
              </InputLabel>
              <TextField
                id="email"
                name="email"
                type="email"
                value={profile.email || ''}
                onChange={logicHandleChange}
                required
                fullWidth
                variant="outlined"
                sx={{
                  input: {
                    bgcolor: '#132238',
                    color: '#FFFFFF',
                    borderRadius: '0.5rem',
                    padding: '0.7rem',
                  },
                  '& fieldset': {
                    border: '1.5px solid #64CCC5',
                  },
                }}
              />
            </Box>

            {/* Research Area Dropdown */}
            <Box sx={{ mb: '1.5rem' }}>
              <InputLabel
                htmlFor="researchArea"
                sx={{ display: 'block', mb: '0.5rem', color: '#64CCC5', fontWeight: 600 }}
              >
                Research Area
              </InputLabel>
              <FormControl fullWidth>
                <Select
                  id="researchArea"
                  name="researchArea"
                  value={profile.researchArea || ''}
                  onChange={logicHandleChange}
                  sx={{
                    bgcolor: '#132238',
                    border: '1.5px solid #64CCC5',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    py: '0.7rem',
                    '& .MuiSelect-icon': { color: '#64CCC5' },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#132238',
                        color: '#FFFFFF',
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>-- Select Research Area --</em>
                  </MenuItem>
                  {researchAreas.map((area) => (
                    <MenuItem key={area} value={area}>
                      {area}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Biography Field */}
            <Box sx={{ mb: '1.5rem' }}>
              <InputLabel
                htmlFor="biography"
                sx={{ display: 'block', mb: '0.5rem', color: '#64CCC5', fontWeight: 600 }}
              >
                Biography
              </InputLabel>
              <TextField
                id="biography"
                name="biography"
                value={profile.biography || ''}
                onChange={logicHandleChange}
                multiline
                minRows={6}
                fullWidth
                variant="outlined"
                sx={{
                  textarea: {
                    bgcolor: '#132238',
                    color: '#FFFFFF',
                    borderRadius: '0.5rem',
                    padding: '0.7rem',
                  },
                  '& fieldset': {
                    border: '1.5px solid #64CCC5',
                  },
                }}
              />
            </Box>

            {/* Actions: Cancel and Save buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                type="button"
                onClick={() => navigate(-1)}
                sx={{
                  backgroundColor: '#B1EDE8',
                  color: '#132238',
                  border: 'none',
                  px: '1.7rem',
                  py: '0.3rem',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#A0E1DB',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                sx={{
                  backgroundColor: '#B1EDE8',
                  color: '#132238',
                  border: 'none',
                  px: '1rem',
                  py: '0.7rem',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#A0E1DB',
                  },
                }}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </form>
      </Box>
      {/* Footer component */}
      <Footer />
    </Box>
  );
};

export default EditProfile;