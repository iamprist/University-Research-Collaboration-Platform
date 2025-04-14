import { Routes, Route, Navigate } from "react-router-dom"; // No need for BrowserRouter here
import SignInPage from "./pages/SignInPage";
import AdminPage from "./pages/AdminPage";
import ReviewerPage from "./pages/ReviewerPage";
import AddListing from "./pages/AddListing";
import ResearcherDashboard from "./pages/ResearcherDashboard";
import LandingPage from "./pages/LandingPage"; // Import LandingPage
import { auth, db } from "./firebaseConfig"; // Firebase authentication and Firestore
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);

        const userDocRef = doc(db, "users", authUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        }
      } else {
        setUser(null);
        setRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) {
      return <Navigate to="/" />; // Redirect to LandingPage if not authenticated
    }
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/" />; // Redirect to LandingPage if role is not allowed
    }
    return children;
  };

  return (
    <Routes>
      {/* Default route to LandingPage */}
      <Route path="/" element={<LandingPage />} />

      {/* SignIn route */}
      <Route path="/signin" element={<SignInPage />} />

      {/* Protected routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviewer"
        element={
          <ProtectedRoute allowedRoles={['reviewer']}>
            <ReviewerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/researcher-dashboard"
        element={
          <ProtectedRoute allowedRoles={['researcher']}>
            <ResearcherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['researcher']}>
            <AddListing />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;