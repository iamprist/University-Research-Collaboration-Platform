import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useEffect, useState } from 'react';
import './ListingDetailPage.css'; 
import { useNavigate } from "react-router-dom";

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import '../../pages/Researcher/ResearcherDashboard.css'; // Import your CSS file

const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate(); 
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [researcher, setResearcher] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch listing
        const docRef = doc(db, "research-listings", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const listingData = { id: docSnap.id, ...docSnap.data() };
          setListing(listingData);

          // Fetch researcher info
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
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading listing details...</p>
    </div>
  );

  if (!listing) return (
    <div className="not-found">
      <h2>Listing not found</h2>
      <p>The requested research listing could not be found.</p>
    </div>
  );

  return (
    <div className="listing-container">
        <button 
            className="back-button"
            onClick={() => navigate(-1)}
            style={{ 
              color: 'var(--white)',
              marginRight: '1.5rem' // Add spacing between arrow and title
            }}
          >
            <ArrowBackIosIcon />
          </button>
      <div className="listing-header">
        <h1>{listing.title}</h1>
        {researcher && (
          <div className="researcher-info">
            <h3>Lead Researcher</h3>
            <p>{researcher.title} {researcher.name}</p>
            <p>{researcher.email}</p>
          </div>
        )}
      </div>

      <div className="listing-details">
        <section className="detail-section">
          <h2>Project Summary</h2>
          <p>{listing.summary}</p>
        </section>

        <div className="detail-grid">
          <section className="detail-card">
            <h3>Department</h3>
            <p>{listing.department || 'Not specified'}</p>
          </section>

          <section className="detail-card">
            <h3>Methodology</h3>
            <p>{listing.methodology || 'Not specified'}</p>
          </section>

          <section className="detail-card">
            <h3>Collaboration Needs</h3>
            <p>{listing.collaboratorNeeds || 'Not specified'}</p>
          </section>

          {listing.researchArea && (
            <section className="detail-card">
              <h3>Research Area</h3>
              <p>{listing.researchArea}</p>
            </section>
          )}

          {listing.status && (
            <section className="detail-card">
              <h3>Project Status</h3>
              <p>{listing.status}</p>
            </section>
          )}

          {listing.endDate && (
            <section className="detail-card">
              <h3>Estimated Completion</h3>
              <p>{new Date(listing.endDate).toLocaleDateString()}</p>
            </section>
          )}
        </div>

        {listing.publicationLink && (
          <section className="external-links">
            <h3>Related Publications</h3>
            <a href={listing.publicationLink} target="_blank" rel="noopener noreferrer">
              View Publication
            </a>
          </section>
        )}
      </div>
    </div>
  );
};

export default ListingDetailPage;