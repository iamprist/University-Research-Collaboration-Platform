// src/App.js
import { Routes, Route, Navigate} from "react-router-dom";
import SignInPage from "./pages/SignInPage";
import LandingPage from "./pages/LandingPage";

// Admin
import AdminPage from "./pages/Admin/AdminPage";
import ViewLogs from "./pages/Admin/ViewLogs";

// Reviewer

import ReviewerPage from "./pages/Reviewer/ReviewerPage";
import ReviewerForm from "./pages/Reviewer/ReviewerForm";
import TermsAndConditions from "./pages/TermsAndConditions";
import AdminRegister from "./pages/Admin/AdminRegister";

// Researcher
import NotificationHandler from './components/NotificationHandler';
import ResearcherDashboard from "./pages/Researcher/ResearcherDashboard";
import ResearcherProfile from "./pages/Researcher/ResearcherProfile";
import EditProfile from "./pages/Researcher/EditProfile";
import AddListing from "./pages/Researcher/AddListing";
import CollaboratePage from "./pages/Researcher/CollaboratePage";
import ChatRoom from "./pages/Researcher/ChatRoom";

import { auth, db } from "./config/firebaseConfig";
import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { logEvent } from "./utils/logEvent";
import axios from "axios";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("authToken");
  return token ? children : <Navigate to="/signin" />;
};

function App() {
  // Fetch IP for logging
  const fetchIpAddress = async () => {
    try {
      const { data } = await axios.get("https://api.ipify.org?format=json");
      return data.ip;
    } catch {
      return "N/A";
    }
  };

  // Log login events
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userName = userDoc.exists() ? userDoc.data().name : "N/A";
        const userRole = userDoc.exists() ? userDoc.data().role : "unknown";
        const ip = await fetchIpAddress();
        await logEvent({
          userId: user.uid,
          role: userRole,
          userName,
          action: "Login",
          details: "User logged in",
          ip,
        });
      }
    });
    return () => unsubscribe();
  }, []);



  return (

    <>
    <NotificationHandler />
    <ToastContainer position="bottom-right" />
    
  
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignInPage />} />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="/admin-register" element={<AdminRegister />} />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <ViewLogs />
          </ProtectedRoute>
        }
      />

      {/* Reviewer */}
      <Route
        path="/reviewer"
        element={
          <ProtectedRoute>
            <ReviewerPage />
          </ProtectedRoute>
        }
      />
      <Route path="/reviewer-form" element={<ReviewerForm />} />
      <Route path="/apply" element={<ReviewerForm />} />
      <Route path="/terms" element={<TermsAndConditions />} />

      {/* Researcher */}
      <Route
        path="/researcher-dashboard"
        element={
          <ProtectedRoute>
            <ResearcherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/researcher-profile"
        element={
          <ProtectedRoute>
            <ResearcherProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/researcher-edit-profile"
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/researcher/add-listing"
        element={
          <ProtectedRoute>
            <AddListing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/researcher/collaborate"
        element={
          <ProtectedRoute>
            <CollaboratePage />
          </ProtectedRoute>
        }
      />
      <Route path="/chat/:chatId" element={<ChatRoom />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    
      
    </Routes>
   </>
  );
}

export default App;