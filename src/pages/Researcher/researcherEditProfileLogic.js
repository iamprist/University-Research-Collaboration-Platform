/* global globalThis */
// researcherEditProfileLogic.js
// Backend logic for EditProfile (data fetching, updating, and auth)

import { useState, useEffect, useCallback } from 'react';
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
    profilePicture: null,
    university: '',
    country: '',
  });

  const [userId, setUserId] = useState(null);

  // 1. TOKEN / AUTH GUARD
  useEffect(() => {
    const token = globalThis.localStorage?.getItem?.('authToken');
    if (!token) {
      navigate('/signin');
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        globalThis.localStorage?.removeItem?.('authToken');
        navigate('/signin');
      }
    });
    // Make sure unsubscribe exists before returning it
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [navigate]);

  // 2. FETCH EXISTING PROFILE DATA
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const profileDocRef = doc(db, 'researcherProfiles', userId);
        const userDoc = await getDoc(profileDocRef);
        if (userDoc && typeof userDoc.exists === 'function' && userDoc.exists()) {
          const data = userDoc.data();
          setProfile({
            title: data.title || '',
            name: data.name || '',
            email: data.email || '',
            researchArea: data.researchArea || '',
            biography: data.biography || '',
            profilePicture: data.profilePicture || null,
            university: data.university || '',
            country: data.country || '',
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    })();
  }, [userId]);

  // 3. FIELD CHANGE HANDLER
  const handleChange = ({ target: { name, value, files } }) => {
    if (name === 'profilePicture') {
      setProfile((prev) => ({ ...prev, profilePicture: files[0] }));
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 4. FORM SUBMIT HANDLER
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      let effectiveUid = userId ?? auth?.currentUser?.uid ?? null;
      if (!effectiveUid) {
        console.error('User ID is not set.');
        return false;
      }
      if (!userId) setUserId(effectiveUid);
      try {
        let profileData = { ...profile };
        if (
          profile.profilePicture &&
          (profile.profilePicture instanceof File ||
            profile.profilePicture instanceof Blob)
        ) {
          const storageRef = ref(storage, `profilePictures/${effectiveUid}`);
          await uploadBytes(storageRef, profile.profilePicture);
          const downloadURL = await getDownloadURL(storageRef);
          profileData.profilePicture = downloadURL;
        } else if (typeof profile.profilePicture === 'undefined') {
          profileData.profilePicture = null;
        }
        Object.keys(profileData).forEach((k) => {
          if (typeof profileData[k] === 'undefined') profileData[k] = null;
        });
        await setDoc(doc(db, 'researcherProfiles', effectiveUid), profileData, {
          merge: true,
        });
        navigate('/researcher-profile');
        return true;
      } catch (err) {
        console.error('Error updating your profile:', err);
        return false;
      }
    },
    [profile, userId, navigate]
  );

  // 5. LOG-OUT HANDLER
  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      // Always clear the token, even if signOut throws
      if (typeof globalThis.localStorage?.removeItem === 'function') {
        globalThis.localStorage?.removeItem?.('authToken');
      }
      navigate('/signin');
    }
  }, [navigate]);

  // 6. PUBLIC API
  return {
    profile,
    setProfile,
    userId,
    handleChange,
    handleSubmit,
    handleLogout,
  };
};
