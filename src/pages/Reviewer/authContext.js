// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { logEvent } from '../../utils/logEvent'; // Import the logEvent function

const AuthContext = createContext();
const auth = getAuth();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User logged in:", user);

        // Log the login event
        await logEvent({
          userId: user.uid,
          role: "Reviewer", // Adjust role as needed
          userName: user.displayName || "N/A",
          action: "Login",
          details: "User logged in",
        });

        setCurrentUser(user);
      } else {
        console.log("User logged out or session expired");

        // Log the logout event
        await logEvent({
          userId: "N/A",
          role: "Reviewer", // Adjust role as needed
          userName: "N/A",
          action: "Logout",
          details: "User logged out or session expired",
        });

        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
