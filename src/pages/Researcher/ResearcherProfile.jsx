import React, { useState, useEffect } from 'react';
import { db, auth } from '../../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './ResearcherDashboard.css';

const ResearcherProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <div className="loading-container">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <main className="researcher-profile-container">
      <header className="researcher-header">
        <section className="header-title">
          <h1>Researcher Profile</h1>
          <p>View and manage your professional details</p>
        </section>
        <nav className="header-nav">
          <a href="/researcher-dashboard" className="header-link">Dashboard</a>
          <a href="/researcher/add-listing" className="header-link">Add Listing</a>
          <a href="/researcher/collaborate" className="header-link">Collaborate</a>
        </nav>
      </header>

      <section className="profile-content">
        <article className="profile-card">
          <header className="profile-header">
            {profile.profilePicture && (
              <img
                src={profile.profilePicture}
                alt="Profile"
                className="profile-image"
              />
            )}
            <h2 className="profile-name">{profile.title} {profile.name}</h2>
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
            <button
              onClick={() => navigate('/researcher-edit-profile')}
              className="edit-button"
            >
              Edit Profile
            </button>
          </footer>
        </article>
      </section>

      <footer className="researcher-footer">
        <a href="/contact">Contact</a>
        <a href="/privacy-policy">Privacy Policy</a>
        <a href="/terms-of-service">Terms of Service</a>
        <p>&copy; 2025 Innerk Hub</p>
      </footer>
    </main>
  );
};

export default ResearcherProfile;