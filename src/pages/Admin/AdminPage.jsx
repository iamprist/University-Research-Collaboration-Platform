//AdminPage.jsx
import { useState } from "react";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import ManageReviewers from "./ManageReviewers";
import ManageResearchers from "./ManageResearchers";
import ManageAdmins from "./ManageAdmins";
import ViewLogs from "./ViewLogs";
import './AdminPage.css';

// Main admin page component
export default function AdminPage({ initialTab = "dashboard" }) { // Allow an initial tab via props
  // State to track which tab is currently active
  const [activeTab, setActiveTab] = useState(initialTab);

  // Debug: log the currently active tab
  console.log("ActiveTab is:", activeTab);

  return (
    // Main container for the admin page
    <section className="admin-container">
      {/* Sidebar navigation for switching tabs */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* Main content area */}
      <main className="admin-main">
        {/* Header with dynamic title and subtitle based on active tab */}
        <header className="admin-header">
          <h1 className="admin-title">
            {console.log("Heading is rendering for:", activeTab)}
            {activeTab === "dashboard"
              ? "Dashboard"
              : activeTab === "logs"
              ? "System Logs"
              : activeTab === "researchers"
              ? "Manage Researchers"
              : activeTab === "admins"
              ? "Manage Admins"
              : activeTab === "reviewers"
              ? "Manage Reviewers"
              : "User Management"}
          </h1>
          <p className="admin-subtitle">
            {activeTab === "dashboard"
              ? "Overview of platform usage and engagement."
              : activeTab === "logs"
              ? "View detailed activity logs for all users."
              : activeTab === "researchers"
              ? "Manage researcher accounts and permissions."
              : activeTab === "admins"
              ? "Manage admin accounts and permissions."
              : activeTab === "reviewers"
              ? "Manage reviewer accounts and permissions."
              : "Manage user accounts and permissions."}
          </p>
        </header>
        {/* Render the selected tab's component */}
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "logs" && <ViewLogs />}
        {activeTab === "researchers" && <ManageResearchers />}
        {activeTab === "admins" && <ManageAdmins />}
        {activeTab === "reviewers" && <ManageReviewers />}
      </main>
    </section>
  );
}