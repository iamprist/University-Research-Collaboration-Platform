import { Routes, Route } from "react-router-dom";
import SignInPage from "./pages/SignInPage";
import AdminPage from "./pages/AdminPage";
import ReviewerPage from "./pages/ReviewerPage";
import ResearcherPage from "./pages/ResearcherPage";
import ResearcherDashboard from "./pages/ResearcherDashboard";

function App()
{
  return (
    <Routes>
      <Route path="/" element={<SignInPage />} />
      <Route path="/researcher" element={<ResearcherPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/reviewer" element={<ReviewerPage />} />
      <Route path="/researcher-dashboard" element={<ResearcherDashboard />} />
    </Routes>
  );
}

export default App;
