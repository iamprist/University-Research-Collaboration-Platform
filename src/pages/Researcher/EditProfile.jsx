import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../../config/firebaseConfig';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './ResearcherDashboard.css';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import Footer from '../../components/Footer';

// Predefined options for form fields
const researchAreas = [
  'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Mathematics',
  'Statistics', 'Engineering', 'Medicine', 'Nursing', 'Pharmacy', 'Law',
  'Business', 'Economics', 'Political Science', 'Psychology', 'Sociology',
  'Anthropology', 'Education', 'Environmental Science', 'History',
  'Artificial Intelligence', 'Data Science', 'Agriculture', 'Architecture',
  'Geography', 'Philosophy', 'Linguistics', 'Communication', 'Other'
];

const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Japan', 'China', 'South Africa', 'Nigeria', 'Kenya',
  'Brazil', 'India', 'Russia', 'Other'
];

const universities = [
  'Harvard University', 'Stanford University', 'MIT', 'University of Oxford',
  'University of Cambridge', 'ETH Zurich', 'University of Cape Town',
  'University of Nairobi', 'University of Lagos', 'University of Johannesburg',
  'Other'
];

const EditProfile = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [profile, setProfile] = useState({
    title: '',
    name: '',
    email: '',
    researchArea: '',
    biography: '',
    country: '',
    university: '',
    otherUniversity: '',
    otherCountry: '',
    profilePicture: null
  });
  const [userId, setUserId] = useState(null);

  // Check authentication status on component mount
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

  // Fetch user profile when userId changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile({
            title: data.title || '',
            name: data.name || '',
            email: data.email || '',
            researchArea: data.researchArea || '',
            biography: data.biography || '',
            country: data.country || '',
            university: data.university || '',
            otherUniversity: data.otherUniversity || '',
            otherCountry: data.otherCountry || '',
            profilePicture: data.profilePicture || null
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [userId]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profilePicture') {
      setProfile({ ...profile, profilePicture: files[0] });
    } else {
      setProfile({ ...profile, [name]: value });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      console.error('User ID is not set.');
      return;
    }

    try {
      let profileData = { ...profile };

      // Upload new profile picture if selected
      if (profile.profilePicture instanceof File) {
        const storageRef = ref(storage, `profilePictures/${userId}`);
        await uploadBytes(storageRef, profile.profilePicture);
        const downloadURL = await getDownloadURL(storageRef);
        profileData.profilePicture = downloadURL;
      } else if (typeof profile.profilePicture === 'undefined') {
        profileData.profilePicture = null;
      }

      // Clean undefined values before saving
      Object.keys(profileData).forEach((key) => {
        if (typeof profileData[key] === 'undefined') {
          profileData[key] = null;
        }
      });

      await setDoc(doc(db, 'users', userId), profileData);
      navigate('/researcher-profile');
    } catch (error) {
      console.error('Error updating your profile:', error);
    }
  };

  return (
    <main>
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
          <h1>Edit Your Profile</h1>
          <p>Update your research profile information</p>
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
              <button onClick={() => navigate('/researcher/add-listing')}>Add Listing</button>
              <button onClick={() => navigate('/researcher-dashboard')}>Dashboard</button>
              <button onClick={() => navigate('/friends')}>Friends</button>
              <button onClick={() => navigate('/researcher/collaborate')}>Collaborate</button>
            </section>
          )}
        </section>
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
            {/* Profile Picture Upload */}
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
              {typeof profile.profilePicture === 'string' && (
                <img 
                  src={profile.profilePicture} 
                  alt="Profile" 
                  style={{ 
                    marginTop: '1rem', 
                    maxWidth: '150px', 
                    borderRadius: '0.5rem' 
                  }} 
                />
              )}
            </section>

            {/* Title Selection */}
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

            {/* Name Input */}
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

            {/* Email Input */}
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

            {/* Country Selection */}
            <section style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64CCC5', fontWeight: '600' }}>
                Country
              </label>
              <select
                name="country"
                value={profile.country || ''}
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
                <option value="">-- Select Country --</option>
                {countries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              {profile.country === 'Other' && (
                <input
                  type="text"
                  name="otherCountry"
                  value={profile.otherCountry || ''}
                  onChange={handleChange}
                  placeholder="Please specify your country"
                  required
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    backgroundColor: '#132238',
                    border: '1.5px solid #64CCC5',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    marginTop: '0.5rem'
                  }}
                />
              )}
            </section>

            {/* University Selection */}
            <section style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64CCC5', fontWeight: '600' }}>
                University/Institution
              </label>
              <select
                name="university"
                value={profile.university || ''}
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
                <option value="">-- Select University --</option>
                {universities.map((university) => (
                  <option key={university} value={university}>{university}</option>
                ))}
              </select>
              {profile.university === 'Other' && (
                <input
                  type="text"
                  name="otherUniversity"
                  value={profile.otherUniversity || ''}
                  onChange={handleChange}
                  placeholder="Please specify your university"
                  required
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    backgroundColor: '#132238',
                    border: '1.5px solid #64CCC5',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    marginTop: '0.5rem'
                  }}
                />
              )}
            </section>

            {/* Research Area Selection */}
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

            {/* Biography Textarea */}
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

            {/* Form Action Buttons */}
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
      <Footer />
    </main>
  );
};

export default EditProfile;