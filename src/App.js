import { Routes, Route, Navigate } from "react-router-dom";
import SignInPage from "./pages/SignInPage";
import AdminPage from "./pages/Admin/AdminPage";
import ReviewerPage from "./pages/Reviewer/ReviewerPage";
import AddListing from "./pages/Researcher/AddListing";
import ResearcherDashboard from "./pages/Researcher/ResearcherDashboard";
import LandingPage from "./pages/LandingPage";
import LogsPage from "./pages/Admin/LogsPage";
import { auth, db } from "./config/firebaseConfig";
import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { logEvent } from "./utils/logEvent";
import axios from "axios";
import ReviewerForm from "./pages/Reviewer/ReviewerForm"; // Uncomment if ReviewerForm exists

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return <Navigate to="/signin" />;
  }
  return children;
};

function App() {
  const fetchIpAddress = async () => {
    try {
      const response = await axios.get("https://api.ipify.org?format=json");
      return response.data.ip;
    } catch (error) {
      console.error("Error fetching IP address:", error);
      return "N/A";
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        const userDocRef = doc(db, "users", authUser.uid);
        const userDoc = await getDoc(userDocRef);
        const userName = userDoc.exists() ? userDoc.data().name : "N/A";
        const userRole = userDoc.exists() ? userDoc.data().role : "unknown";

        const ip = await fetchIpAddress();

        await logEvent({
          userId: authUser.uid,
          role: userRole,
          userName,
          action: "Login",
          target: "N/A",
          details: "User logged in",
          ip,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <Routes>
      <Route path="/chats/:chatId" element={<ChatRoom />} />
      <Route path="/chat/:chatId" element={<ChatRoom />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <LogsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviewer"
        element={
          <ProtectedRoute>
            <ReviewerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/researcher-dashboard"
        element={
          <ProtectedRoute>
            <ResearcherDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route path="/apply" element={<ReviewerForm />} />
      <Route path="/reviewer-form" element={<ReviewerForm />} />
      
      {/* Researcher routes */}
      <Route path="/researcher-dashboard" element={<ProtectedRoute><ResearcherDashboard /></ProtectedRoute>} />
      <Route path="/researcher-profile" element={<ProtectedRoute><ResearcherProfile /></ProtectedRoute>} />
      <Route path="/researcher-edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      <Route path="/researcher/add-listing" element={<ProtectedRoute><AddListing /></ProtectedRoute>} />
      <Route path="/collaborate" element={<ProtectedRoute><CollaboratePage /></ProtectedRoute>} />

      {/* Redirect all other routes to the landing page */}
    </Routes>
  );
}

export default App;
