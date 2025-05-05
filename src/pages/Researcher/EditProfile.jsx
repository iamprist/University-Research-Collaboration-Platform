import React, { useState, useEffect } from 'react';
import { db, auth } from '../../config/firebaseConfig';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

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

  const goBack = () => navigate(-1);

  return (
    <main style={styles.main}>
      <button onClick={goBack} style={styles.backLink}>← Back</button>

      <header style={styles.header}>
        <h1 style={styles.title}>Edit Your Profile</h1>
      </header>

      <section style={styles.section}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Profile Picture:
            <input
              type="file"
              name="profilePicture"
              accept="image/*"
              onChange={handleChange}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Title:
            <select
              name="title"
              value={profile.title || ''}
              onChange={handleChange}
              required
              style={styles.input}
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
          </label>

          <label style={styles.label}>
            Name and Surname:
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Email:
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Research Area:
            <input
              type="text"
              name="researchArea"
              value={profile.researchArea}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Biography:
            <textarea
              name="biography"
              value={profile.biography}
              onChange={handleChange}
              style={{ ...styles.input, height: '100px' }}
            />
          </label>

          <button type="submit" style={styles.button}>Save Changes</button>
        </form>
      </section>
    </main>
  );
};

const styles = {
  main: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#ffffff',
    color: '#333',
    border: '1px solid #eee',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.05)'
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
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '1.8em',
    color: '#222'
  },
  section: {
    display: 'flex',
    justifyContent: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%'
  },
  label: {
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    marginTop: '5px',
    fontSize: '1em',
    borderRadius: '5px',
    border: '1px solid #ccc'
  },
  button: {
    marginTop: '20px',
    padding: '10px',
    fontSize: '1em',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  }
};

export default EditProfile;
