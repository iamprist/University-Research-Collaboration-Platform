import React, { useState, useEffect } from 'react';
import { db, auth } from '../../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './ResearcherDashboard.css';

const ResearcherProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);

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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setProfile(userDoc.data());
        } else {
          console.log('Profile not found.');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchProfile();
  }, [userId]);

  return (
    <main>
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

      <section style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 1.5rem' }}>
        {profile ? (
          <article style={{ 
            background: '#1A2E40', 
            borderRadius: '1rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.12)',
            padding: '2rem',
            color: '#FFFFFF'
          }}>
            <header style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              {profile.profilePicture && (
                <img
                  src={URL.createObjectURL(profile.profilePicture)}
                  alt="Profile"
                  style={{ 
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #64CCC5'
                  }}
                />
              )}
              <h2 style={{ color: '#64CCC5', marginTop: '1rem' }}>{profile.title} {profile.name}</h2>
            </header>
            
            <section style={{ marginBottom: '1.5rem' }}>
              <p><strong style={{ color: '#64CCC5' }}>Email:</strong> <span style={{ color: '#B1EDE8' }}>{profile.email}</span></p>
              <p><strong style={{ color: '#64CCC5' }}>Research Area:</strong> <span style={{ color: '#B1EDE8' }}>{profile.researchArea}</span></p>
            </section>
            
            <section style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#64CCC5', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Biography</h3>
              <p style={{ color: '#B1EDE8', lineHeight: '1.6' }}>{profile.biography}</p>
            </section>
            
            <footer style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                onClick={() => navigate('/researcher-edit-profile')}
                style={{ 
                  backgroundColor: '#64CCC5',
                  color: '#132238',
                  border: 'none',
                  padding: '0.7rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Edit Profile
              </button>
            </footer>
          </article>
        ) : (
          <p style={{ textAlign: 'center', color: '#132238' }}>Loading profile...</p>
        )}
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
