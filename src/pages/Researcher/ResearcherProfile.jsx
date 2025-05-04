import React, { useState, useEffect } from 'react';
import { db, auth } from '../../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

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
const goBack = () => navigate('/researcher-dashboard');
  return (
    <main style={styles.main}>
      <button onClick={goBack} style={styles.backLink}>← Back</button>

      <header style={styles.header}>
        <h1>Your Profile</h1>
      </header>

      <section style={styles.section}>
        {profile ? (
          <div style={styles.profileBox}>
            {profile.profilePicture && (
              <img
                src={URL.createObjectURL(profile.profilePicture)}
                alt="Profile"
                style={styles.image}
              />
            )}

            <h2>{profile.title} {profile.name}</h2>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Research Area:</strong> {profile.researchArea}</p>
            <p><strong>Biography:</strong> {profile.biography}</p>
          </div>
        ) : (
          <p>Loading profile...</p>
        )}
      </section>

      <button onClick={() => navigate('/researcher-edit-profile')} style={styles.button}>
        Edit Profile
      </button>
    </main>
  );
};

const styles = {
  main: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#fff',
    border: '1px solid #eee',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
    color: '#333'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  section: {
    display: 'flex',
    justifyContent: 'center'
  },
  profileBox: {
    textAlign: 'left',
    width: '100%'
  },
  image: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: '20px'
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: 'black',
    fontSize: '1em',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '15px',
    textDecoration: 'underline',
    display: 'inline-block'
  },
  button: {
    display: 'block',
    marginTop: '30px',
    padding: '10px 15px',
    fontSize: '1em',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  }
};

export default ResearcherProfile;


