// researcherEditProfileLogic.js
// Backend logic for EditProfile (data fetching, updating, and auth)
import { useState, useEffect } from 'react';
import { db, auth, storage } from '../../config/firebaseConfig';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';

export const useEditProfileLogic = () => {
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
          const data = userDoc.data();
          setProfile({
            title: data.title || '',
            name: data.name || '',
            email: data.email || '',
            researchArea: data.researchArea || '',
            biography: data.biography || '',
            profilePicture: data.profilePicture || null
          });
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
    if (!userId) {
      console.error('User ID is not set.');
      return;
    }
    try {
      let profileData = { ...profile };
      if (profile.profilePicture instanceof File) {
        const storageRef = ref(storage, `profilePictures/${userId}`);
        await uploadBytes(storageRef, profile.profilePicture);
        const downloadURL = await getDownloadURL(storageRef);
        profileData.profilePicture = downloadURL;
      } else if (typeof profile.profilePicture === 'undefined') {
        profileData.profilePicture = null;
      }
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

  return {
    profile,
    setProfile,
    userId,
    handleChange,
    handleSubmit
  };
};
