import React, { useState, useEffect } from 'react';
import { db, auth } from '../../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './ResearcherDashboard.css';
import Footer from '../../components/Footer';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

const ResearcherProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  // Check authentication and get user ID on component mount
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

  // Fetch profile data when userId changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          // Ensure all fields have proper fallback values
          const profileData = userDoc.data();
          setProfile({
            title: profileData.title || '',
            name: profileData.name || '',
            email: profileData.email || '',
            researchArea: profileData.researchArea || '',
            biography: profileData.biography || '',
            country: profileData.country || '',
            university: profileData.university || '',
            otherUniversity: profileData.otherUniversity || '',
            otherCountry: profileData.otherCountry || '',
            profilePicture: profileData.profilePicture || null
          });
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

  // Display loading state
  if (loading) {
    return (
      <main className="loading-container">
        <p>Loading profile...</p>
      </main>
    );
  }

  // Display error state
  if (error) {
    return (
      <main className="error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </main>
    );
  }

  // Helper function to display university information
  const displayUniversity = () => {
    if (profile.university === 'Other' && profile.otherUniversity) {
      return profile.otherUniversity;
    }
    return profile.university;
  };

  // Helper function to display country information
  const displayCountry = () => {
    if (profile.country === 'Other' && profile.otherCountry) {
      return profile.otherCountry;
    }
    return profile.country;
  };

  return (
    <main className="researcher-profile-container">
      <header className="researcher-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
          style={{ 
            color: 'var(--white)',
            marginRight: '1.5rem'
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
            <p><strong>University/Institution:</strong> {displayUniversity()}</p>
            <p><strong>Country:</strong> {displayCountry()}</p>
          </section>

          <section className="profile-bio">
            <h3>Biography</h3>
            <p>{profile.biography || 'No biography provided'}</p>
          </section>

          <footer className="profile-actions">
            <button 
              onClick={() => navigate('/researcher-edit-profile')} 
              className="edit-profile-btn"
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