import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, auth } from '../../config/firebaseConfig'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { Box, Button, IconButton, Menu, MenuItem, Typography, TextField, Avatar, InputLabel } from '@mui/material'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import MenuIcon from '@mui/icons-material/Menu'


/*const expertiseOptions = [
  { value: 'PHYS', label: 'Physics' },
  { value: 'CHEM', label: 'Chemistry' },
  { value: 'BIO', label: 'Biology' },
  { value: 'CS', label: 'Computer Science' },
  { value: 'AI', label: 'Artificial Intelligence' },
  { value: 'MED', label: 'Medicine' },
  { value: 'LAW', label: 'Law' },
  { value: 'BUS', label: 'Business Administration' },
  { value: 'FIN', label: 'Finance' },
  { value: 'MKT', label: 'Marketing' },
  { value: 'HRM', label: 'Human Resources' },
];*/

export default function EditReviewerProfile() {
  const navigate = useNavigate()
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    institution: '',
    expertiseTags: [],
    profilePicture: ''
  })
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Auth check and get user ID
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      navigate('/signin')
      return
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid)
      else {
        localStorage.removeItem('authToken')
        navigate('/signin')
      }
    })
    return () => unsubscribe()
  }, [navigate])

  // Fetch reviewer profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return
      try {
        setLoading(true)
        const reviewerDoc = await getDoc(doc(db, 'reviewers', userId))
        if (reviewerDoc.exists()) {
          setProfile({
            name: reviewerDoc.data().name || '',
            email: reviewerDoc.data().email || '',
            institution: reviewerDoc.data().institution || '',
            expertiseTags: reviewerDoc.data().expertiseTags || [],
            profilePicture: reviewerDoc.data().profilePicture || ''
          })
        } else {
          setError('Reviewer profile not found')
        }
      } catch (err) {
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [userId])

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle expertise tags (comma separated)
  const handleExpertiseChange = (e) => {
    setProfile(prev => ({
      ...prev,
      expertiseTags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
    }))
  }

  // Handle profile picture upload (base64 for demo, use storage in prod)
  const handlePictureChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfile(prev => ({
        ...prev,
        profilePicture: reader.result
      }))
    }
    reader.readAsDataURL(file)
  }

  // Save changes
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateDoc(doc(db, 'reviewers', userId), {
        ...profile
      })
      navigate('/reviewer-profile')
    } catch (err) {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Box sx={{ p: 6, textAlign: 'center' }}><Typography>Loading...</Typography></Box>
  }
  if (error) {
    return <Box sx={{ p: 6, textAlign: 'center' }}><Typography color="error">{error}</Typography></Box>
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* Header */}
      <Box
        component="header"
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
          onClick={() => navigate(-1)}
          sx={{
            color: 'var(--white)',
            mr: '1.5rem',
          }}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.04em' }}>
            Edit Reviewer Profile
          </Typography>
        </Box>
        {/* Menu button */}
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={e => setMenuAnchorEl(e.currentTarget)}
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
                setMenuAnchorEl(null)
                navigate('/reviewer-profile')
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
              Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchorEl(null)
                navigate('/reviewer-dashboard')
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
          </Menu>
        </Box>
      </Box>

      {/* Edit Form */}
      <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4, p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{
            background: '#1A2E40',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.12)',
            p: '2rem',
            color: '#FFFFFF',
          }}>
            {/* Profile Picture Upload */}
            <Box sx={{ mb: '1.5rem', textAlign: 'center' }}>
              <Typography sx={{ mb: '0.5rem', color: '#64CCC5', fontWeight: 600 }}>
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
                  onChange={handlePictureChange}
                />
              </Button>
              {typeof profile.profilePicture === 'string' && profile.profilePicture && (
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

            {/* Name */}
            <Box sx={{ mb: '1.5rem' }}>
              <InputLabel
                htmlFor="name"
                sx={{ display: 'block', mb: '0.5rem', color: '#64CCC5', fontWeight: 600 }}
              >
                Name
              </InputLabel>
              <TextField
                id="name"
                name="name"
                value={profile.name}
                onChange={handleChange}
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

            {/* Email */}
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
                value={profile.email}
                onChange={handleChange}
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

            {/* Institution */}
            <Box sx={{ mb: '1.5rem' }}>
              <InputLabel
                htmlFor="institution"
                sx={{ display: 'block', mb: '0.5rem', color: '#64CCC5', fontWeight: 600 }}
              >
                Institution
              </InputLabel>
              <TextField
                id="institution"
                name="institution"
                value={profile.institution}
                onChange={handleChange}
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

            {/* Credentials */}
            <Box sx={{ mb: '1.5rem' }}>
              <InputLabel
                htmlFor="credentials"
                sx={{ display: 'block', mb: '0.5rem', color: '#64CCC5', fontWeight: 600 }}
              >
                Credentials
              </InputLabel>
              <TextField
                id="credentials"
                name="credentials"
                value={profile.credentials}
                onChange={handleChange}
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

            {/* Expertise Tags */}
            <Box sx={{ mb: '1.5rem' }}>
              <InputLabel
                htmlFor="expertiseTags"
                sx={{ display: 'block', mb: '0.5rem', color: '#64CCC5', fontWeight: 600 }}
              >
                Expertise Tags (comma separated)
              </InputLabel>
              <TextField
                id="expertiseTags"
                name="expertiseTags"
                value={profile.expertiseTags.join(', ')}
                onChange={handleExpertiseChange}
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

            {/* Actions */}
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
                disabled={saving}
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
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </form>
      </Box>
    </Box>
  )
}