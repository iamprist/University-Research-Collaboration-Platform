import { Routes, Route, Navigate } from "react-router-dom";
import SignInPage from "./pages/SignInPage";
import AdminPage from "./pages/AdminPage";
import ReviewerPage from "./pages/ReviewerPage";
import ResearcherPage from "./pages/ResearcherPage";
import ResearcherDashboard from "./pages/ResearcherDashboard";
import LandingPage from "./pages/LandingPage";

function App() {
  return (
    <Routes>
      {/* Set root path to redirect to landing page */}
      <Route path="/" element={<Navigate to="/landing-page" replace />} />
      
      {/* Make landing page accessible directly */}
      <Route path="/landing-page" element={<LandingPage />} />
      
      {/* Other routes */}
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/researcher" element={<ResearcherPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/reviewer" element={<ReviewerPage />} />
      <Route path="/researcher-dashboard" element={<ResearcherDashboard />} />
    </Routes>
  );
}

export default App;