// ResearcherDashboard.jsx - Frontend UI Component
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebaseConfig';
import './ResearcherDashboard.css';
import CollaborationRequestsPanel from '../../components/CollaborationRequestsPanel';
import Footer from '../../components/Footer';
import ContactForm from '../../components/ContactForm';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import {
  useResearcherDashboard
} from './researcherDashboardLogic'; // Import backend logic

// MUI Components
import { 
  Button,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Paper,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Box
} from '@mui/material';
import { Notifications, Menu as MenuIcon, Close } from '@mui/icons-material';

// Notification dropdown component
const MessageNotification = ({ messages, unreadCount, onMessageClick }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <Badge 
      color="error" 
      badgeContent={unreadCount}
      sx={{ 
        '& .MuiBadge-badge': {
          right: 8,
          top: 8
        }
      }}
    >
      <IconButton
        color="inherit"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          color: '#B1EDE8',
          '&:hover': { transform: 'scale(1.1)' }
        }}
      >
        <Notifications />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            bgcolor: '#132238',
            border: '1px solid #B1EDE8',
            width: 350,
            maxHeight: 500
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            color: '#B1EDE8',
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid #2a3a57',
            pb: 1,
            mb: 2
          }}>
            <Typography variant="h6">Notifications</Typography>
            <IconButton onClick={() => setAnchorEl(null)} size="small">
              <Close sx={{ color: '#B1EDE8' }} />
            </IconButton>
          </Box>
          
          {messages.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              No new messages
            </Typography>
          ) : (
            messages.map(message => (
              <Paper
                key={message.id}
                sx={{
                  p: 2,
                  mb: 1,
                  cursor: 'pointer',
                  color: '#B1EDE8',
                  bgcolor: message.read ? 'inherit' : 'rgba(177, 237, 232, 0.05)',
                  '&:hover': { bgcolor: 'rgba(177, 237, 232, 0.1)' }
                }}
                onClick={() => {
                  onMessageClick(message);
                  setAnchorEl(null);
                }}
              >
                <Typography variant="subtitle1">{message.title}</Typography>
                <Typography variant="body2">{message.content}</Typography>
                <Typography variant="caption" sx={{ color: '#7a8fb1' }}>
                  {message.timestamp.toLocaleString()}
                </Typography>
              </Paper>
            ))
          )}
        </Box>
      </Menu>
    </Badge>
  );
};

// Main dashboard component
const ResearcherDashboard = () => {
  // Get all state and handlers from our custom hook
  const {
    // State
    allListings,
    myListings,
    userId,
    hasProfile,
    collabListings,
    searchTerm,
    searchResults,
    dropdownVisible,
    showNoResults,
    showErrorModal,
    filteredListings,
    userName,
    messages,
    unreadCount,
    showContactForm,
    anchorEl,
    ipAddress,
    
    // Handlers
    handleSearch,
    handleMessageClick,
    handleAddListing,
    handleCollaborate,
    handleInputFocus,
    handleInputChange,
    handleClear,
    handleLogout,
    setSearchTerm,
    setAnchorEl,
    setShowContactForm,
    setShowErrorModal
  } = useResearcherDashboard();

  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box 
        component="header"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'var(--dark-blue)',
          color: 'var(--white)',
          borderBottom: '2px solid var(--light-blue)',
          p: '1.5rem 2rem'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: 'var(--white)' }}>
            <ArrowBackIosIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, fontSize: '1.7rem'}}>
              Welcome, {userName}
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--accent-teal)' }}>
              Manage your research and collaborate
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MessageNotification 
            messages={messages}
            unreadCount={unreadCount}
            onMessageClick={handleMessageClick}
          />

          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              bgcolor: 'var(--light-blue)',
              color: 'var(--dark-blue)',
              '&:hover': { bgcolor: '#5AA9A3' }
            }}
          >
            <MenuIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: {
                bgcolor: 'var(--dark-blue)',
                minWidth: 200,
                color: 'var(--light-blue)',
                borderRadius: '0.8rem'
              }
            }}
          >
            <MenuItem onClick={() => navigate('/researcher-profile')}>View Profile</MenuItem>
            <MenuItem onClick={handleAddListing}>New Research</MenuItem>
            <MenuItem onClick={() => navigate('/friends')}>Friends</MenuItem>
            <MenuItem onClick={handleCollaborate}>Collaborate</MenuItem>
            <MenuItem onClick={() => setShowContactForm(true)}>Chat with Us</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 3 }}>
        {/* Search Section */}
        <Box sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
          <Paper 
            component="form"
            onSubmit={(e) => { 
              e.preventDefault();
              handleSearch();
            }}
            sx={{ 
              p: 1,
              display: 'flex',
              gap: 1,
              bgcolor: 'background.paper',
              position: 'relative'
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search research by title or researcher name..."
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '1.2rem',
                  borderColor: 'var(--dark-blue)'
                }
              }}
            />
            
            {/* Error Modal */}
            {showErrorModal && (
              <Dialog
                open={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                PaperProps={{
                  sx: {
                    bgcolor: 'var(--dark-blue)',
                    color: 'var(--white)',
                    padding: '1.5rem'
                  }
                }}
              >
                <DialogTitle>Profile Error</DialogTitle>
                <DialogContent>
                  <Typography variant="body1">
                    Error loading profile. Please try again.
                  </Typography>
                  <Button 
                    onClick={() => setShowErrorModal(false)}
                    variant="contained"
                    sx={{ 
                      mt: 2,
                      bgcolor: 'var(--light-blue)',
                      color: 'var(--dark-blue)'
                    }}
                  >
                    Close
                  </Button>
                </DialogContent>
              </Dialog>
            )}
            
            {/* Clear Button */}
            <Button 
              type="button"
              variant="contained"
              onClick={handleClear}
              sx={{
                bgcolor: 'var(--light-blue)',
                color: 'var(--dark-blue)',
                borderRadius: '1.5rem',
                minWidth: '100px',
                px: 3,
                '&:hover': { 
                  bgcolor: '#5AA9A3',
                  color: 'var(--white)'
                }
              }}
            >
              Clear
            </Button>

            {/* Search Button */}
            <Button 
              type="button"
              variant="contained"
              onClick={handleSearch}
              sx={{
                bgcolor: 'var(--light-blue)',
                color: 'var(--dark-blue)',
                borderRadius: '1.5rem',
                minWidth: '100px',
                px: 3,
                '&:hover': { 
                  bgcolor: '#5AA9A3',
                  color: 'var(--white)'
                }
              }}
            >
              Search
            </Button>

            {/* Search Dropdown */}
            {dropdownVisible && (
              <Paper sx={{
                position: 'absolute',
                top: '110%',
                left: 0,
                right: 0,
                zIndex: 999,
                bgcolor: 'background.paper',
                boxShadow: 3,
                maxHeight: 300,
                overflowY: 'auto'
              }}>
                {searchResults.length === 0 ? (
                  <Typography sx={{ p: 2 }}>
                    {showNoResults ? "No research listings found." : "Start typing to search"}
                  </Typography>
                ) : 
                  searchResults.map(item => (
                    <Box 
                      key={item.id}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => navigate(`/listing/${item.id}`)}
                    >
                      <Typography variant="subtitle1">{item.title}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        By: {item.researcherName}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {item.summary}
                      </Typography>
                    </Box>
                  ))}
              </Paper>
            )}
          </Paper>
        </Box>

        {/* Listings Grid */}
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Typography variant="h4" sx={{ mb: 3, fontSize: '1.7rem' }}>Your Research</Typography>
          <Grid container spacing={3}>
            {filteredListings.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Paper 
                  sx={{
                    p: 3,
                    bgcolor: '#132238',
                    color: '#B1EDE8',
                    borderRadius: 2,
                    transition: 'transform 0.3s',
                    '&:hover': { 
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)'
                    }
                  }}
                >
                  <Typography variant="h6" gutterBottom>{item.title}</Typography>
                  <Typography variant="body2" paragraph>{item.summary}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/listing/${item.id}`)}
                      sx={{
                        bgcolor: '#2a3a57',
                        '&:hover': { bgcolor: '#3a4a67' }
                      }}
                    >
                      View Listing
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/chat/${item.id}`)}
                      sx={{
                        bgcolor: '#B1EDE8',
                        color: '#132238',
                        '&:hover': { bgcolor: '#9dd8d3' }
                      }}
                    >
                      Chat
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Collaboration Requests */}
        <Box sx={{ mt: 6, maxWidth: 1200, mx: 'auto' }}>
          <Typography variant="h4" sx={{ mb: 3, fontSize: '1.7rem' }}>Collaboration Requests</Typography>
          <Paper sx={{ p: 3, color: '#FFFFFF', bgcolor: '#132238', borderRadius: 2 }}>
            <CollaborationRequestsPanel userId={userId} />
          </Paper>
        </Box> 

        {/* Collaborations Section */}
        <Box sx={{ mt: 6, maxWidth: 1200, mx: 'auto' }}>
          <Typography variant="h4" sx={{ mb: 3, fontSize: '1.7rem'}}>Your Collaborations</Typography>
          <Grid container spacing={3}>
            {collabListings.map(listing => (
              <Grid item xs={12} sm={6} md={4} key={listing.id}>
                <Paper 
                  sx={{
                    p: 3,
                    bgcolor: '#132238',
                    color: '#B1EDE8',
                    borderRadius: 2,
                    transition: 'transform 0.3s',
                    '&:hover': { 
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)'
                    }
                  }}
                >
                  <Typography variant="h6" gutterBottom>{listing.title}</Typography>
                  <Typography variant="body2" paragraph>{listing.summary}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/listing/${listing.id}`)}
                      sx={{
                        bgcolor: '#2a3a57',
                        '&:hover': { bgcolor: '#3a4a67' }
                      }}
                    >
                      View Project
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/chat/${listing.id}`)}
                      sx={{
                        bgcolor: '#B1EDE8',
                        color: '#132238',
                        '&:hover': { bgcolor: '#9dd8d3' }
                      }}
                    >
                      Chat
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Contact Form Dialog */}
        <Dialog
          open={showContactForm}
          onClose={() => setShowContactForm(false)}
          PaperProps={{
            sx: {
              bgcolor: '#1a2a42',
              color: '#B1EDE8',
              borderRadius: 2
            }
          }}
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              Contact Form
              <IconButton onClick={() => setShowContactForm(false)}>
                <Close sx={{ color: '#B1EDE8' }} />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <ContactForm onClose={() => setShowContactForm(false)} />
          </DialogContent>
        </Dialog>
      </Box>

      <Footer />
    </Box>
  );
};

export default ResearcherDashboard;