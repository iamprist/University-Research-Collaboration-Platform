// EditProfile.jsx - Improved width and layout
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResearcherDashboard.css';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import MenuIcon from '@mui/icons-material/Menu';
import Footer from '../../components/Footer';
import { 
  Box, Button, IconButton, Menu, MenuItem, Typography, 
  TextField, Select, InputLabel, FormControl, Avatar,
   Container 
} from '@mui/material';
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

const titles = [
  'Dr', 'Prof', 'Mr', 'Ms', 'Mrs', 'Mx', 'Other'
];

const EditProfile = () => {
  const navigate = useNavigate();
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [errors, setErrors] = useState({
    name: false,
    email: false
  });
  const [showCustomResearchArea, setShowCustomResearchArea] = useState(false);

  const {
    profile,
    handleChange: logicHandleChange,
    handleSubmit: logicHandleSubmit
  } = useEditProfileLogic();

  // Sync researchArea with customResearchArea if needed
  React.useEffect(() => {
    if (showCustomResearchArea && profile.customResearchArea) {
      if (profile.researchArea !== profile.customResearchArea) {
        logicHandleChange({ target: { name: 'researchArea', value: profile.customResearchArea } });
      }
    }
    // If user switches away from 'Other', clear customResearchArea
    if (!showCustomResearchArea && profile.customResearchArea) {
      logicHandleChange({ target: { name: 'customResearchArea', value: '' } });
    }
    // eslint-disable-next-line
  }, [showCustomResearchArea, profile.customResearchArea]);

  const handleSubmitWithValidation = (e) => {
    e.preventDefault();
    const newErrors = {
      name: !profile.name,
      email: !profile.email || !/^\S+@\S+\.\S+$/.test(profile.email)
    };
    setErrors(newErrors);
    if (!Object.values(newErrors).some(error => error)) {
      logicHandleSubmit(e);
    }
  };

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
    <Box component="main" sx={{ 
      minHeight: '100vh', 
      bgcolor: '#f5f7fa',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'var(--dark-blue)',
          color: 'var(--white)',
          p: '1.5rem',
          px: { xs: '1.5rem', md: '3rem' }
        }}
      >
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'var(--white)' }}>
          <ArrowBackIosIcon />
        </IconButton>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Edit Your Profile
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Update your research profile information
          </Typography>
        </Box>
        <IconButton 
          onClick={(e) => setMenuAnchorEl(e.currentTarget)}
          sx={{ color: 'var(--white)' }}
        >
          <MenuIcon />
        </IconButton>
        
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
            },
          }}
        >
          {[
            { label: 'Add Listing', path: '/researcher/add-listing' },
            { label: 'Dashboard', path: '/researcher-dashboard' },
            { label: 'Friends', path: '/friends' },
            { label: 'Collaborate', path: '/researcher/collaborate' }
          ].map((item) => (
            <MenuItem
              key={item.label}
              onClick={() => {
                setMenuAnchorEl(null);
                navigate(item.path);
              }}
              sx={{
                '&:hover': { bgcolor: 'var(--light-blue)', color: 'var(--dark-blue)' },
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Profile Form - Now using Container with maxWidth="md" */}
      <Container 
        maxWidth="md" 
        sx={{ 
          flex: 1,
          py: 4,
          px: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box 
          component="form" 
          onSubmit={handleSubmitWithValidation}
          sx={{
            width: '100%',
            bgcolor: '#1A2E40',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            p: { xs: 3, sm: 4 },
            color: '#FFFFFF',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Profile Picture Section */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            mb: 4 
          }}>
            <Avatar
              src={typeof profile.profilePicture === 'string' ? profile.profilePicture : ''}
              sx={{
                width: 120,
                height: 120,
                mb: 2,
                border: '2px solid #64CCC5'
              }}
            />
            <Button
              component="label"
              variant="contained"
              sx={{
                bgcolor: '#64CCC5',
                color: '#132238',
                '&:hover': { bgcolor: '#5AA9A3' },
              }}
            >
              Upload Photo
              <input
                type="file"
                name="profilePicture"
                accept="image/*"
                hidden
                onChange={logicHandleChange}
              />
            </Button>
          </Box>

          {/* Personal Information Section */}
          <Typography variant="h6" sx={{ 
            color: '#64CCC5', 
            mb: 3, 
            borderBottom: '1px solid #64CCC5',
            pb: 1,
            fontSize: '1.1rem'
          }}>
            Personal Information
          </Typography>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { sm: '1fr 1fr' }, 
            gap: 3, 
            mb: 3 
          }}>
            {/* Title Field */}
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#64CCC5' }}>Title</InputLabel>
              <Select
                name="title"
                value={profile.title || ''}
                onChange={logicHandleChange}
                sx={{
                  bgcolor: '#132238',
                  color: '#FFFFFF',
                  '& .MuiSelect-icon': { color: '#64CCC5' },
                }}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {titles.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Name Field */}
            <TextField
              name="name"
              label="Full Name *"
              value={profile.name || ''}
              onChange={logicHandleChange}
              error={errors.name}
              helperText={errors.name ? "Name is required" : ""}
              fullWidth
              sx={{
                '& .MuiInputBase-root': { bgcolor: '#132238', color: '#FFFFFF' },
                '& .MuiInputLabel-root': { color: '#64CCC5' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: errors.name ? '#ff1744' : '#64CCC5' },
                  '&:hover fieldset': { borderColor: errors.name ? '#ff1744' : '#64CCC5' },
                },
                '& .MuiFormHelperText-root': {
                  color: errors.name ? '#ff1744' : '#64CCC5',
                  fontWeight: 600,
                },
              }}
            />
          </Box>

          {/* Email Field */}
          <TextField
            name="email"
            label="Email *"
            type="email"
            value={profile.email || ''}
            onChange={logicHandleChange}
            error={errors.email}
            helperText={errors.email ? "Valid email is required" : ""}
            fullWidth
            sx={{ 
              mb: 3,
              '& .MuiInputBase-root': { bgcolor: '#132238', color: '#FFFFFF' },
              '& .MuiInputLabel-root': { color: '#64CCC5' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: errors.email ? '#ff1744' : '#64CCC5' },
                '&:hover fieldset': { borderColor: errors.email ? '#ff1744' : '#64CCC5' }
              },
              '& .MuiFormHelperText-root': {
                color: errors.email ? '#ff1744' : '#64CCC5',
                fontWeight: 600,
              },
            }}
          />

          {/* Institution Field */}
          <TextField
            name="university"
            label="Institution / University"
            value={profile.university || ''}
            onChange={logicHandleChange}
            fullWidth
            sx={{
              mb: 3,
              '& .MuiInputBase-root': { bgcolor: '#132238', color: '#FFFFFF' },
              '& .MuiInputLabel-root': { color: '#64CCC5' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#64CCC5' },
                '&:hover fieldset': { borderColor: '#64CCC5' }
              },
              '& .MuiFormHelperText-root': {
                color: '#64CCC5',
                fontWeight: 600,
              },
            }}
          />

          {/* Country Field */}
          <TextField
            name="country"
            label="Country"
            value={profile.country || ''}
            onChange={logicHandleChange}
            fullWidth
            sx={{
              mb: 3,
              '& .MuiInputBase-root': { bgcolor: '#132238', color: '#FFFFFF' },
              '& .MuiInputLabel-root': { color: '#64CCC5' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#64CCC5' },
                '&:hover fieldset': { borderColor: '#64CCC5' }
              },
              '& .MuiFormHelperText-root': {
                color: '#64CCC5',
                fontWeight: 600,
              },
            }}
          />

          {/* Research Information Section */}
          <Typography variant="h6" sx={{ 
            color: '#64CCC5', 
            mb: 3, 
            mt: 4,
            borderBottom: '1px solid #64CCC5',
            pb: 1,
            fontSize: '1.1rem'
          }}>
            Research Information
          </Typography>

          {/* Research Area */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel sx={{ color: '#64CCC5' }}>Research Area</InputLabel>
            <Select
              name="researchArea"
              value={showCustomResearchArea ? 'Other' : (profile.researchArea || '')}
              onChange={e => {
                logicHandleChange(e);
                setShowCustomResearchArea(e.target.value === 'Other');
              }}
              sx={{
                bgcolor: '#132238',
                color: '#FFFFFF',
                '& .MuiSelect-icon': { color: '#64CCC5' },
              }}
            >
              <MenuItem value=""><em>Select your field</em></MenuItem>
              {researchAreas.map((area) => (
                <MenuItem key={area} value={area}>{area}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {showCustomResearchArea && (
            <TextField
              name="customResearchArea"
              label="Please specify your research area"
              value={profile.customResearchArea || ''}
              onChange={logicHandleChange}
              fullWidth
              sx={{
                mb: 3,
                '& .MuiInputBase-root': { bgcolor: '#132238', color: '#FFFFFF' },
                '& .MuiInputLabel-root': { color: '#64CCC5' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#64CCC5' },
                  '&:hover fieldset': { borderColor: '#64CCC5' }
                },
              }}
            />
          )}

          {/* Biography */}
          <TextField
            name="biography"
            label="Biography"
            value={profile.biography || ''}
            onChange={logicHandleChange}
            multiline
            rows={6}
            fullWidth
            sx={{ 
              mb: 3,
              '& .MuiInputBase-root': { bgcolor: '#132238', color: '#FFFFFF' },
              '& .MuiInputLabel-root': { color: '#64CCC5' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#64CCC5' },
                '&:hover fieldset': { borderColor: '#64CCC5' }
              },
            }}
          />

          {/* Form Actions */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            mt: 'auto',
            pt: 3,
            gap: 2
          }}>
            <Button
              type="button"
              onClick={() => navigate(-1)}
              variant="outlined"
              sx={{
                color: '#64CCC5',
                borderColor: '#64CCC5',
                px: 4,
                minWidth: 160,
                '&:hover': {
                  borderColor: '#5AA9A3',
                  color: '#5AA9A3'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: '#64CCC5',
                color: '#132238',
                px: 4,
                minWidth: 160,
                '&:hover': {
                  bgcolor: '#5AA9A3'
                }
              }}
            >
              Save Profile
            </Button>
          </Box>
        </Box>
      </Container>
      
      <Footer />
    </Box>
  );
};

export default EditProfile;