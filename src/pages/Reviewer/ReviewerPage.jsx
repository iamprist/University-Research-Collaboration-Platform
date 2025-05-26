import React, { useEffect } from 'react'
import { IconButton, Menu, MenuItem, TextField, Button, Paper, Box, Typography, Snackbar } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import MuiAlert from '@mui/material/Alert'
import ReviewerRecommendations from '../../components/ReviewerRecommendations'
import MyReviewRequests from '../../components/MyReviewRequests'
import { useReviewerDashboard } from './reviewerDashboardLogic'
import { useNavigate } from 'react-router-dom'
import FloatingHelpChat from '../../components/FloatingHelpChat';
import { auth } from '../../config/firebaseConfig';

export default function ReviewerPage() {
  const navigate = useNavigate()
  const {
    status,
    reason,
    loading,
    notif,
    searchTerm,
    searchResults,
    dropdownVisible,
    showNoResults,
    requestedIds,
    reviewedIds,
    sidebarOpen,
    menuAnchorEl,
    setSidebarOpen,
    setMenuAnchorEl,
    setNotif,
    handleSearch,
    handleInputChange,
    handleInputFocus,
    handleClear,
    handleLogout,
    handleRequestReviewAndNotify,
    handleRevoke,
  } = useReviewerDashboard();

  const statusStyles = {
    approved: {
      backgroundColor: '#D1FAE5',
      borderLeft: '4px solid #10B981',
      color: '#065F46'
    },
    in_progress: {
      backgroundColor: '#FEF3C7',
      borderLeft: '4px solid #F59E0B',
      color: '#92400E'
    },
    rejected: {
      backgroundColor: '#FECACA',
      borderLeft: '4px solid #EF4444',
      color: '#991B1B'
    }
  }

  const renderBadge = () => {
    if (status === 'approved')
      return (
        <section style={statusStyles.approved} className="p-2 rounded">
          Approved Reviewer
        </section>
      )
    if (status === 'in_progress')
      return (
        <section style={statusStyles.in_progress} className="p-2 rounded">
          Application Under Review
        </section>
      )
    if (status === 'rejected')
      return (
        <section style={statusStyles.rejected} className="p-2 rounded">
          Application Rejected
        </section>
      )
    return (
      <section className="p-2 rounded text-muted">
        You are not a reviewer. Apply below.
      </section>
    )
  }

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  useEffect(() => {
    const faviconUrl = '/favicon.ico';
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = faviconUrl;
  }, []);
  return (
    <>
      <main
        style={{
          backgroundColor: '#FFFFFF',
          color: '#000000',
          minHeight: '100vh',
          paddingTop: '70px',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        <header
          className="navbar navbar-light bg-light fixed-top px-4 py-3"
          style={{ borderBottom: '1px solid #000' }}
        >
          <section style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="/favicon.ico"
              alt="Favicon"
              style={{
                width: 44,
                height: 44,
                marginRight: 12,
                borderRadius: '50%',
                border: '2px solid #B1EDE8',
                objectFit: 'cover'
              }}
            />
            <h1 className="navbar-brand fw-bold fs-4 mb-0">Reviewer</h1>
          </section>
          <IconButton
            onClick={e => setMenuAnchorEl(e.currentTarget)}
            sx={{
              bgcolor: 'var(--light-blue)',
              color: 'var(--dark-blue)',
              borderRadius: '1.5rem',
              ml: 2,
              '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' }
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
              View Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchorEl(null)
                handleLogout()
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
              Logout
            </MenuItem>
          </Menu>
        </header>

        <aside
          className={`position-fixed top-0 end-0 h-100 bg-light shadow p-4 d-flex flex-column ${sidebarOpen ? 'd-block' : 'd-none'}`}
          style={{ width: '280px', zIndex: 1050 }}
        >
          <button
            className="btn-close align-self-end"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          />

          <section className="text-center mb-4">
            <img
              src={'https://via.placeholder.com/70'}
              alt="Profile"
              className="rounded-circle mb-2"
              style={{
                width: '70px',
                height: '70px',
                objectFit: 'cover',
                border: '2px solid #ccc'
              }}
            />
            <h2 className="h6 mb-0 mt-2">
              Reviewer
            </h2>
            <address className="text-muted">
              N/A
            </address>
          </section>

          <section className="mb-4">
            {renderBadge()}
            {status === 'rejected' && reason && (
              <small className="text-danger d-block mt-1">
                Reason: {reason}
              </small>
            )}
          </section>

          <hr />

          <nav aria-label="Sidebar links" className="mb-4">
            <ul className="list-unstyled">
              <li>
                <a href="/about" className="text-decoration-none text-dark">
                  About Us
                </a>
              </li>
              <li>
                <a href="/terms" className="text-decoration-none text-dark">
                  Terms &amp; Conditions
                </a>
              </li>
            </ul>
          </nav>

          <section className="mt-auto">
            {status === 'approved' && (
              <button
                onClick={handleRevoke}
                className="btn btn-warning w-100 mb-2"
              >
                Stop Being a Reviewer
              </button>
            )}
            {status !== 'approved' && status !== 'not_found' && (
              <button
                onClick={handleRevoke}
                className="btn btn-warning w-100 mb-2"
              >
                {status === 'rejected'
                  ? 'Remove Rejected Application'
                  : 'Revoke Application'}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="btn btn-danger w-100"
            >
              Logout
            </button>
          </section>
        </aside>

        <section
          className="container"
          style={{ backgroundColor: 'white', color: 'black' }}
        >
          {loading ? (
            <section className="text-center text-muted mt-4">
              <p>Retrieving your reviewer status…</p>
              <section className="spinner-border text-dark" role="status" aria-label="Loading" />
            </section>
          ) : (
            <>
              <header className="text-center my-4">
                <h2>Reviewer Dashboard</h2>
                <p>Hi Reviewer</p>
                <p>
                  Welcome back! Ready to read, review, and recommend
                  cutting-edge research?
                </p>
              </header>

              {/* --- Search Bar Section --- */}
              <Box sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
                <Paper
                  component="form"
                  onSubmit={e => { e.preventDefault(); handleSearch() }}
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
                        borderColor: '#000'
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="contained"
                    onClick={handleClear}
                    sx={{
                      bgcolor: '#F59E0B',
                      color: '#fff',
                      borderRadius: '1.5rem',
                      minWidth: '100px',
                      px: 3,
                      '&:hover': { bgcolor: '#FBBF24' }
                    }}
                  >
                    Clear
                  </Button>
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
                      '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' }
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
                        searchResults.map(item => {
                          const alreadyRequested = requestedIds.includes(item.id);
                          const alreadyReviewed = reviewedIds.includes(item.id);
                          return (
                            <section key={item.id} style={{ padding: 16, cursor: 'pointer', borderBottom: '1px solid #eee', background: 'inherit' }}>
                              <Typography variant="subtitle1">{item.title}</Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                By: {item.researcherName}
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {item.summary}
                              </Typography>
                              <Button
                                variant="contained"
                                size="small"
                                sx={{
                                  bgcolor: alreadyRequested || alreadyReviewed ? '#ccc' : 'var(--light-blue)',
                                  color: alreadyRequested || alreadyReviewed ? '#888' : 'var(--dark-blue)',
                                  borderRadius: '1.5rem',
                                  fontWeight: 600,
                                  px: 2,
                                  py: 0.5,
                                  minWidth: 0,
                                  mt: 1,
                                  boxShadow: '0 2px 10px rgba(100,204,197,0.08)',
                                  '&:hover': { bgcolor: alreadyRequested || alreadyReviewed ? '#ccc' : '#5AA9A3', color: alreadyRequested || alreadyReviewed ? '#888' : 'var(--white)' }
                                }}
                                onClick={() => handleRequestReviewAndNotify(item)}
                                disabled={alreadyRequested || alreadyReviewed}
                              >
                                {alreadyReviewed
                                  ? "Already Reviewed"
                                  : alreadyRequested
                                    ? "Already Requested"
                                    : "Request Review"}
                              </Button>
                            </section>
                          );
                        })
                      }
                    </Paper>
                  )}
                </Paper>
              </Box>

              {/* --- Main Content Section --- */}
              <section className="mb-5">
                {status === 'not_found' && (
                  <section className="alert alert-warning text-center py-4">
                    <h3 className="mb-3">Become a Reviewer</h3>
                    <p className="mb-0">
                      Your account is not yet approved as a reviewer. Apply now to start reviewing research.
                    </p>
                    <Button
                      variant="contained"
                      sx={{
                        bgcolor: 'var(--light-blue)',
                        color: 'var(--dark-blue)',
                        borderRadius: '1.5rem',
                        px: 4,
                        py: 2,
                        mt: 2,
                        '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' }
                      }}
                      onClick={() => navigate('/reviewer-form')} // <-- Fix route here
                    >
                      Apply to be a Reviewer
                    </Button>
                  </section>
                )}

                <MyReviewRequests />
              </section>

              <ReviewerRecommendations />
            </>
          )}
        </section>

        <Snackbar
          open={notif.open}
          autoHideDuration={6000}
          onClose={() => setNotif({ ...notif, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <MuiAlert
            onClose={() => setNotif({ ...notif, open: false })}
            severity={notif.severity}
            sx={{ width: '100%' }}
          >
            {notif.msg}
          </MuiAlert>
        </Snackbar>
      </main>
      <FloatingHelpChat chatId={`support_${auth.currentUser?.uid}`} title="Contact Admin Support" />
    </>
  )
}