import React, { useEffect, useState } from 'react'
import {
  doc,
  getDoc,
  deleteDoc,
  addDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore'
import { db, auth } from '../../config/firebaseConfig'
import { useAuth } from './authContext'
import { useNavigate } from 'react-router-dom'
import ReviewerRecommendations from '../../components/ReviewerRecommendations'
import axios from 'axios'

// MUI imports
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Drawer,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Paper,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

export default function ReviewerPage() {
  const [status, setStatus] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuth()
  const [ipAddress, setIpAddress] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  // fetch client IP
  useEffect(() => {
    axios
      .get('https://api.ipify.org?format=json')
      .then(res => setIpAddress(res.data.ip))
      .catch(err => console.error('Error fetching IP:', err))
  }, [])

  // save auth token
  useEffect(() => {
    if (currentUser) {
      currentUser
        .getIdToken()
        .then(token => localStorage.setItem('authToken', token))
    }
  }, [currentUser])

  // fetch reviewer record
  useEffect(() => {
    let mounted = true
    const fetchStatus = async () => {
      const token = localStorage.getItem('authToken')
      if (!token) return navigate('/signin')
      if (!currentUser?.uid) return
      try {
        const snap = await getDoc(doc(db, 'reviewers', currentUser.uid))
        if (!mounted) return
        if (snap.exists()) {
          const data = snap.data()
          setStatus(data.status || 'in_progress')
          setReason(data.rejectionReason || '')
        } else {
          setStatus('not_found')
        }
      } catch (e) {
        console.error('Error fetching reviewer status:', e)
      } finally {
        mounted && setLoading(false)
      }
    }
    fetchStatus()
    return () => {
      mounted = false
    }
  }, [currentUser, navigate])

  // log on tab close
  useEffect(() => {
    const onClose = async () => {
      const user = auth.currentUser
      if (user) {
        await addDoc(collection(db, 'logs'), {
          userId: user.uid,
          role: 'Reviewer',
          userName: user.displayName || 'N/A',
          action: 'Logout',
          details: 'Tab closed',
          timestamp: serverTimestamp()
        })
      }
    }
    window.addEventListener('beforeunload', onClose)
    return () => window.removeEventListener('beforeunload', onClose)
  }, [])

  const toggleSidebar = () => setSidebarOpen(o => !o)

  const handleRevoke = async () => {
    if (!currentUser?.uid) return
    try {
      await deleteDoc(doc(db, 'reviewers', currentUser.uid))
      setStatus('not_found')
    } catch (e) {
      console.error('Error revoking:', e)
    }
  }

  const handleLogout = async () => {
    const user = auth.currentUser
    if (!user) return
    await addDoc(collection(db, 'logs'), {
      userId: user.uid,
      role: 'Reviewer',
      userName: user.displayName || 'N/A',
      action: 'Logout',
      details: 'User clicked logout',
      ip: ipAddress,
      target: 'Reviewer Dashboard',
      timestamp: serverTimestamp()
    })
    await auth.signOut()
    navigate('/signin')
  }

  // Badge color logic for Paper
  const badgeProps = (() => {
    if (status === 'approved') {
      return {
        bgcolor: '#132238',
        color: '#B1EDE8',
        borderLeft: '4px solid #10B981'
      }
    }
    if (status === 'in_progress') {
      return {
        bgcolor: '#2a3a57',
        color: '#F59E0B',
        borderLeft: '4px solid #F59E0B'
      }
    }
    if (status === 'rejected') {
      return {
        bgcolor: '#3a4a63',
        color: '#FECACA',
        borderLeft: '4px solid #EF4444'
      }
    }
    return {
      bgcolor: '#1a2a42',
      color: '#B1EDE8'
    }
  })()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* HEADER */}
      <AppBar position="fixed" color="default" elevation={1} sx={{ bgcolor: '#132238', borderBottom: '2px solid #64CCC5' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#B1EDE8' }}>
            Innerk Hub
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={toggleSidebar}
            aria-label="Toggle profile sidebar"
            sx={{ p: 0 }}
          >
            <Avatar
              src={currentUser?.photoURL || 'https://via.placeholder.com/40'}
              alt="Profile"
              sx={{ width: 40, height: 40, bgcolor: '#B1EDE8', color: '#132238' }}
            />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* SIDEBAR */}
      <Drawer
        anchor="right"
        open={sidebarOpen}
        onClose={toggleSidebar}
        PaperProps={{ sx: { width: 280, p: 3, bgcolor: '#132238', color: '#B1EDE8' } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <IconButton
            onClick={toggleSidebar}
            sx={{ alignSelf: 'flex-end', mb: 2, color: '#B1EDE8' }}
            aria-label="Close sidebar"
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar
              src={currentUser?.photoURL || 'https://via.placeholder.com/70'}
              alt="Profile"
              sx={{
                width: 70,
                height: 70,
                mx: 'auto',
                mb: 1,
                border: '2px solid #B1EDE8',
                bgcolor: '#1a2a42',
                color: '#B1EDE8'
              }}
            />
            <Typography variant="h6" sx={{ mt: 1, color: '#B1EDE8' }}>
              {currentUser?.displayName || 'N/A'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#B1EDE8', opacity: 0.7 }}>
              {currentUser?.email || 'N/A'}
            </Typography>
          </Box>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: badgeProps.bgcolor,
              color: badgeProps.color,
              borderLeft: badgeProps.borderLeft || undefined,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Typography sx={{ color: badgeProps.color }}>
              {status === 'approved'
                ? 'Approved Reviewer'
                : status === 'in_progress'
                ? 'Application Under Review'
                : status === 'rejected'
                ? 'Application Rejected'
                : `${currentUser?.displayName || 'Reviewer'} – you are not a reviewer. Apply below.`}
            </Typography>
            {status === 'rejected' && reason && (
              <Typography variant="caption" color="#EF4444" display="block" mt={1}>
                Reason: {reason}
              </Typography>
            )}
          </Paper>
          <Divider sx={{ my: 2, bgcolor: '#B1EDE8', opacity: 0.2 }} />
          <List>
            <ListItem button component="a" href="/about" sx={{ color: '#B1EDE8' }}>
              <ListItemText primary="About Us" />
            </ListItem>
            <ListItem button component="a" href="/terms" sx={{ color: '#B1EDE8' }}>
              <ListItemText primary="Terms & Conditions" />
            </ListItem>
          </List>
          <Box sx={{ mt: 'auto' }}>
            {status === 'approved' && (
              <Button
                onClick={handleRevoke}
                variant="contained"
                fullWidth
                sx={{
                  mb: 1,
                  bgcolor: '#F59E0B',
                  color: '#132238',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#d97706' }
                }}
              >
                Stop Being a Reviewer
              </Button>
            )}
            {status !== 'approved' && status !== 'not_found' && (
              <Button
                onClick={handleRevoke}
                variant="contained"
                fullWidth
                sx={{
                  mb: 1,
                  bgcolor: '#F59E0B',
                  color: '#132238',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#d97706' }
                }}
              >
                {status === 'rejected'
                  ? 'Remove Rejected Application'
                  : 'Revoke Application'}
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="contained"
              fullWidth
              sx={{
                bgcolor: '#EF4444',
                color: '#fff',
                fontWeight: 700,
                '&:hover': { bgcolor: '#b91c1c' }
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* MAIN CONTENT */}
      <Box sx={{
        maxWidth: '700px',
        margin: '90px auto 0 auto',
        px: '1.5rem',
        pb: 6,
      }}>
        <Paper
          sx={{
            background: '#fff',
            borderRadius: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
            p: { xs: '1.5rem', md: '2.5rem' },
            color: '#132238',
            mb: 4,
          }}
        >
          {loading ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography color="#132238" mb={2}>
                Retrieving your reviewer status…
              </Typography>
              <CircularProgress sx={{ color: '#64CCC5' }} />
            </Box>
          ) : (
            <>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight={700} sx={{ color: '#132238', mb: 1 }}>
                  Reviewer Dashboard
                </Typography>
                <Typography sx={{ color: '#132238', fontWeight: 500 }}>
                  Hi {currentUser?.displayName || 'Reviewer'}
                </Typography>
                <Typography sx={{ mb: 2, color: '#132238', opacity: 0.8 }}>
                  Welcome back! Ready to read, review, and recommend cutting-edge research?
                </Typography>
              </Box>

              {status === 'approved' && <ReviewerRecommendations />}

              {status === 'not_found' && (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Typography color="#132238" mb={2}>
                    No reviewer profile found.
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: '#64CCC5',
                      color: '#132238',
                      fontWeight: 700,
                      borderRadius: '0.5rem',
                      px: 4,
                      py: 1.2,
                      mt: 2,
                      '&:hover': { bgcolor: '#3a4a63' }
                    }}
                    onClick={() => navigate('/reviewer-form')}
                  >
                    Apply Now
                  </Button>
                </Box>
              )}

              {status === 'in_progress' && (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Typography sx={{ color: '#F59E0B', fontWeight: 600 }}>
                    Your application is currently being reviewed.
                  </Typography>
                </Box>
              )}

              {status === 'rejected' && (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Typography sx={{ color: '#EF4444', fontWeight: 600 }}>
                    Your application was rejected.
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#EF4444' }}>
                    Reason: {reason || 'No reason provided.'}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Box>
    </Box>
  )
}