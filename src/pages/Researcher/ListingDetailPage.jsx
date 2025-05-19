import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useEffect, useState } from 'react';
import './ListingDetailPage.css';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { Box, Typography, Button, IconButton, CircularProgress } from '@mui/material';

const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [researcher, setResearcher] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "research-listings", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const listingData = { id: docSnap.id, ...docSnap.data() };
          setListing(listingData);

          if (listingData.userId) {
            const researcherDoc = await getDoc(doc(db, "users", listingData.userId));
            if (researcherDoc.exists()) {
              setResearcher(researcherDoc.data());
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return (
    <Box className="loading-container">
      <CircularProgress sx={{ color: '#64CCC5', mb: 2 }} />
      <Typography>Loading listing details...</Typography>
    </Box>
  );

  if (!listing) return (
    <Box className="not-found">
      <Typography variant="h4">Listing not found</Typography>
      <Typography>The requested research listing could not be found.</Typography>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* Header styled like CollaboratePage */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'var(--dark-blue)',
          color: '#B1EDE8',
          p: 3,
          borderBottom: '2px solid #2a3a57',
          mb: 3
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{ color: '#FFFFFF', mr: 2 }}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 0.5 }}>
            {listing.title}
          </Typography>
          {researcher && (
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#B1EDE8', fontWeight: 500 }}>
                Lead Researcher: {researcher.title} {researcher.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#B1EDE8' }}>
                {researcher.email}
              </Typography>
            </Box>
          )}
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

      {/* Details */}
      <Box className="listing-container">
        <Box className="listing-details">
          <Box className="detail-section">
            <Typography variant="h5" sx={{ color: '#1A2E40', borderBottom: '2px solid #64CCC5', pb: '0.5rem', mb: '1rem' }}>
              Project Summary
            </Typography>
            <Typography>{listing.summary}</Typography>
          </Box>

          <Box className="detail-grid">
            <Box className="detail-card">
              <Typography variant="subtitle1" sx={{ color: '#132238', fontWeight: 600 }}>Department</Typography>
              <Typography>{listing.department || 'Not specified'}</Typography>
            </Box>
            <Box className="detail-card">
              <Typography variant="subtitle1" sx={{ color: '#132238', fontWeight: 600 }}>Methodology</Typography>
              <Typography>{listing.methodology || 'Not specified'}</Typography>
            </Box>
            <Box className="detail-card">
              <Typography variant="subtitle1" sx={{ color: '#132238', fontWeight: 600 }}>Collaboration Needs</Typography>
              <Typography>{listing.collaboratorNeeds || 'Not specified'}</Typography>
            </Box>
            {listing.researchArea && (
              <Box className="detail-card">
                <Typography variant="subtitle1" sx={{ color: '#132238', fontWeight: 600 }}>Research Area</Typography>
                <Typography>{listing.researchArea}</Typography>
              </Box>
            )}
            {listing.status && (
              <Box className="detail-card">
                <Typography variant="subtitle1" sx={{ color: '#132238', fontWeight: 600 }}>Project Status</Typography>
                <Typography>{listing.status}</Typography>
              </Box>
            )}
            {listing.endDate && (
              <Box className="detail-card">
                <Typography variant="subtitle1" sx={{ color: '#132238', fontWeight: 600 }}>Estimated Completion</Typography>
                <Typography>{new Date(listing.endDate).toLocaleDateString()}</Typography>
              </Box>
            )}
          </Box>

          {listing.publicationLink && (
            <Box className="external-links">
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Related Publications</Typography>
              <a href={listing.publicationLink} target="_blank" rel="noopener noreferrer">
                View Publication
              </a>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ListingDetailPage;