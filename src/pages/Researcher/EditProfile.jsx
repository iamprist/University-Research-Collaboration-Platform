import React, { useState, useEffect } from 'react';
import { db, auth } from '../../config/firebaseConfig';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './ResearcherDashboard.css'; // Make sure to import the shared CSS

const researchAreas = [
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Mathematics',
  'Statistics',
  'Engineering',
  'Medicine',
  'Nursing',
  'Pharmacy',
  'Law',
  'Business',
  'Economics',
  'Political Science',
  'Psychology',
  'Sociology',
  'Anthropology',
  'Education',
  'Environmental Science',
  'History',
  'Artificial Intelligence',
  'Data Science',
  'Agriculture',
  'Architecture',
  'Geography',
  'Philosophy',
  'Linguistics',
  'Communication',
  'Other'
];

const EditProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    title: '',
    name: '',
    email: '',
    researchArea: '',
    biography: '',
    profilePicture: null
  });
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
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profilePicture') {
      setProfile({ ...profile, profilePicture: files[0] });
    } else {
      setProfile({ ...profile, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'users', userId), profile);
      navigate('/researcher-profile');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <main>
      <header className="researcher-header">
        <section className="header-title">
          <h1>Edit Your Profile</h1>
          <p>Update your research profile information</p>
        </section>
        <nav className="header-nav">
          <a href="/researcher-dashboard" className="header-link">Dashboard</a>
          <a href="/researcher-profile" className="header-link">Profile</a>
          <a href="/researcher/add-listing" className="header-link">Add Listing</a>
        </nav>
      </header>

      <section style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <form onSubmit={handleSubmit}>
          <article style={{ 
            background: '#1A2E40', 
            borderRadius: '1rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.12)',
            padding: '2rem',
            color: '#FFFFFF'
          }}>
            {/* 
            <section style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64CCC5', fontWeight: '600' }}>
                Profile Picture
              </label>
              <input
                type="file"
                name="profilePicture"
                accept="image/*"
                onChange={handleChange}
                style={{ 
                  width: '100%',
                  padding: '0.7rem',
                  backgroundColor: '#132238',
                  border: '1.5px solid #64CCC5',
                  borderRadius: '0.5rem',
                  color: '#FFFFFF'
                }}
              />
            </section>
            */}

            <section style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64CCC5', fontWeight: '600' }}>
                Title
              </label>
              <select
                name="title"
                value={profile.title || ''}
                onChange={handleChange}
                required
                style={{ 
                  width: '100%',
                  padding: '0.7rem',
                  backgroundColor: '#132238',
                  border: '1.5px solid #64CCC5',
                  borderRadius: '0.5rem',
                  color: '#FFFFFF'
                }}
              >
                <option value="">-- Select Title --</option>
                {[
                  'Mr', 'Mrs', 'Ms', 'Miss', 'Mx', 'Dr', 'Prof', 'Professor', 'Rev',
                  'Father', 'Sister', 'Brother', 'Imam', 'Rabbi', 'Sheikh', 'Eng',
                  'Engr', 'Hon', 'Capt', 'Major', 'Colonel', 'Lt', 'Lt. Col',
                  'Sir', 'Dame', 'Judge', 'Attorney', 'Principal', 'Dean',
                  'Chancellor', 'President', 'CEO', 'Chairperson'
                ].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </section>

            <section style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64CCC5', fontWeight: '600' }}>
                Name and Surname
              </label>
              <input
                type="text"
                name="name"
                value={profile.name || ''}
                onChange={handleChange}
                required
                style={{ 
                  width: '100%',
                  padding: '0.7rem',
                  backgroundColor: '#132238',
                  border: '1.5px solid #64CCC5',
                  borderRadius: '0.5rem',
                  color: '#FFFFFF'
                }}
              />
            </section>

            <section style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64CCC5', fontWeight: '600' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profile.email || ''}
                onChange={handleChange}
                required
                style={{ 
                  width: '100%',
                  padding: '0.7rem',
                  backgroundColor: '#132238',
                  border: '1.5px solid #64CCC5',
                  borderRadius: '0.5rem',
                  color: '#FFFFFF'
                }}
              />
            </section>

            {/* Research Area Dropdown */}
            <section style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64CCC5', fontWeight: '600' }}>
                Research Area
              </label>
              <select
                name="researchArea"
                value={profile.researchArea || ''}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  backgroundColor: '#132238',
                  border: '1.5px solid #64CCC5',
                  borderRadius: '0.5rem',
                  color: '#FFFFFF'
                }}
              >
                <option value="">-- Select Research Area --</option>
                {researchAreas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </section>

            <section style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64CCC5', fontWeight: '600' }}>
                Biography
              </label>
              <textarea
                name="biography"
                value={profile.biography || ''}
                onChange={handleChange}
                rows="6"
                style={{ 
                  width: '100%',
                  padding: '0.7rem',
                  backgroundColor: '#132238',
                  border: '1.5px solid #64CCC5',
                  borderRadius: '0.5rem',
                  color: '#FFFFFF',
                  resize: 'vertical'
                }}
              />
            </section>

            <section style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button 
                type="button" 
                onClick={() => navigate(-1)}
                style={{ 
                  backgroundColor: '#B1EDE8',
                  color: '#132238',
                  border: 'none',
                  padding: '0.7rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                type="submit"
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
                Save Changes
              </button>
            </section>
          </article>
        </form>
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

export default EditProfile;
