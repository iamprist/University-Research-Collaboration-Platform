import React, { useState, useEffect } from 'react';
import { db, auth } from '../../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './ResearcherDashboard.css';
import Footer from '../../components/Footer'; // Import the Footer component

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
const ResearcherProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  

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
      <section className="loading-container">
        <p>Loading profile...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </section>
    );
  }

  return (
    <main className="researcher-profile-container">
      <header className="researcher-header">
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
        <section className="header-title">
          <h1>Researcher Profile</h1>
          <p>View and manage your professional details</p>
        </section>
       <section className="dropdown-menu-container">
            <button
              className="menu-toggle-btn"
              onClick={() => setShowMenu(prev => !prev)}
            >
              ☰ 
            </button>
            {showMenu && (
              <section className="menu-dropdown">
                                <button onClick={() => navigate('/researcher-dashboard')}>Dashboard</button>
                <button onClick={() => navigate('/researcher/add-listing')}>Add Listing</button>
                <button onClick={() => navigate('/friends')}>Friends</button>
                <button onClick={() => navigate('/researcher/collaborate')}>Collaborate</button>
              </section>
            )}
          </section>
      </header>

      <section className="profile-content">
        <article className="profile-card">
          <header className="profile-header">
              {profile?.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt="Profile"
                className="profile-image"
                onError={(e) => {
                  e.target.style.display = 'none'; // Hide broken images
                }}
              />
            ) : (
            <section className="profile-image-placeholder">
              {profile?.name?.charAt(0) || 'A'}
            </section>
            )}
            <h2 className="profile-name">{profile?.title} {profile?.name}</h2>
          </header>

          <section className="profile-details">
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Research Area:</strong> {profile.researchArea}</p>
          </section>

          <section className="profile-bio">
            <h3>Biography</h3>
            <p>{profile.biography}</p>
          </section>

          <footer className="profile-actions">
           <button onClick={() => navigate('/researcher-edit-profile')} className="menu-toggle-btn"
              >
                Edit Profile
             </button>
          </footer>
        </article>
      </section>

      <Footer />
    </main>
  );
};

export default ResearcherProfile;