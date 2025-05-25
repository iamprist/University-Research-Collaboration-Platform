import React, { useState, useEffect } from 'react'
import { db, auth } from '../../config/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { Box, Paper, Button, Typography, IconButton, Menu, MenuItem, Avatar, Link, List, ListItem } from '@mui/material'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import MenuIcon from '@mui/icons-material/Menu'



export default function ReviewerProfile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
 

  const expertiseOptions = [
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
];
  // Check authentication and get user ID on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      navigate('/signin')
      return
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid)
      } else {
        localStorage.removeItem('authToken')
        navigate('/signin')
      }
    })
    return () => unsubscribe()
  }, [navigate])

  // Fetch reviewer profile from Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return
      try {
        setLoading(true)
        const reviewerDocRef = doc(db, 'reviewers', userId)
        const reviewerDoc = await getDoc(reviewerDocRef)
        if (reviewerDoc.exists()) {
          const data = reviewerDoc.data()
          setProfile({
            name: data.name || '',
            email: data.email || '',
            institution: data.institution || '',
            country: data.country || '',
            expertiseTags: data.expertiseTags || [],
            summary: data.summary || '',
            yearsExperience: data.yearsExperience || 0,
            cvUrl: data.cvUrl || '',
            publications: data.publications || [],
            hasResearchExperience: data.hasResearchExperience || '',
            researchSummary: data.researchSummary || '',
            researchLinks: data.researchLinks || '',
            hasReviewedResearch: data.hasReviewedResearch || '',
            reviewedProjectLink: data.reviewedProjectLink || '',
            status: data.status || '',
            rejectionReason: data.rejectionReason || '',
            profilePicture: data.profilePicture || null
          })
        } else {
          setError('Reviewer profile not found')
        }
      } catch (err) {
        setError('Failed to load reviewer profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [userId])

  if (loading) {
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
        <Typography>Loading profile...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
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
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* Header with back and menu */}
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
            Reviewer Profile
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

      {/* Profile content card */}
      <Box sx={{ p: 4, bgcolor: '#f5f7fa' }}>
        <Paper sx={{ maxWidth: 720, mx: 'auto', borderRadius: '0.8rem', boxShadow: 3, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#f8f9fb', p: 4, textAlign: 'center', borderBottom: '1px solid #e3e8ee' }}>
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
                onError={e => {
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <Box
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
                {profile?.name?.charAt(0) || 'R'}
              </Box>
            )}
            <Typography sx={{ fontSize: '1.5rem', color: '#2d3748', mt: 2 }}>
              {profile?.name}
            </Typography>
          </Box>

          
    <Box sx={{ p: 3, color: '#4a5568' }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'var(--dark-blue)' }}>
        Professional Information
      </Typography>
      
      <Typography sx={{ mt: 0.5 }}>
        <strong>Email:</strong> {profile.email}
      </Typography>
      <Typography sx={{ mt: 0.5 }}>
        <strong>Institution:</strong> {profile.institution || 'Not specified'}
      </Typography>
      <Typography sx={{ mt: 0.5 }}>
        <strong>Country:</strong> {profile.country || 'Not specified'}
      </Typography>
      <Typography sx={{ mt: 0.5 }}>
        <strong>Years of Experience:</strong> {profile.yearsExperience || '0'}
      </Typography>
      
      <Typography sx={{ mt: 0.5 }}>
        <strong>Status:</strong> {profile.status === 'in_progress' ? 'In Progress' : profile.status}
      </Typography>
      {profile.status === 'rejected' && profile.rejectionReason && (
        <Typography color="error" sx={{ mt: 0.5 }}>
          <strong>Rejection Reason:</strong> {profile.rejectionReason}
        </Typography>
      )}
      <Typography sx={{ mt: 0.5 }}>
        <strong>Expertise Areas:</strong>
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
        {profile.expertiseTags.map(tag => {
          const expertise = expertiseOptions.find(opt => opt.value === tag);
          return (
            <Typography 
              key={tag}
              sx={{
                bgcolor: 'var(--light-blue)',
                color: 'var(--dark-blue)',
                px: 2,
                borderRadius: '1rem',
                fontSize: '0.9rem'
              }}
            >
              {expertise ? expertise.label : tag}
            </Typography>
          );
        })}
      </Box>

      <Typography sx={{ mt: 1 }}>
        <strong>Professional Summary:</strong>
      </Typography>
      <Typography sx={{ whiteSpace: 'pre-line' }}>{profile.summary}</Typography>

      {profile.publications && profile.publications.length > 0 && (
        <>
          <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Publications:</Typography>
          <List dense sx={{ mt: 0.5}}>
            {profile.publications.map((pub, index) => (
              <ListItem key={index}>
                <Link href={pub} target="_blank" rel="noopener">
                  Publication {index + 1}
                </Link>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {profile.hasResearchExperience === 'yes' && (
        <>
          <Typography sx={{ mt: 2, fontWeight: 'bold' }}>Research Experience:</Typography>
          <Typography sx={{ whiteSpace: 'pre-line' }}>{profile.researchSummary}</Typography>
          
          {profile.researchLinks && (
            <>
              <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Research Links:</Typography>
              <List dense>
                {profile.researchLinks.split(/[\n,]+/).map((link, index) => (
                  <ListItem key={index}>
                    <Link href={link.trim()} target="_blank" rel="noopener">
                      Research Link {index + 1}
                    </Link>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </>
      )}

      {profile.hasReviewedResearch === 'yes' && (
        <>
          <Typography sx={{ mt: 2, fontWeight: 'bold' }}>Reviewed Project:</Typography>
          <Link href={profile.reviewedProjectLink} target="_blank" rel="noopener">
            View Reviewed Project
          </Link>
        </>
      )}
    </Box>
          <Box sx={{ textAlign: 'center', mt: 3, mb: 2 }}>
            <Button
              variant="contained"
              sx={{
                bgcolor: 'var(--light-blue)',
                color: 'var(--dark-blue)',
                borderRadius: '1.5rem',
                px: 4,
                fontWeight: 600,
                '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' },
              }}
              onClick={() => navigate('/reviewer/edit-profile')}
            >
              Edit Profile
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}