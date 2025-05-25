//AdminPage.jsx
import { useState } from "react";
import React from 'react';
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import ManageReviewers from "./ManageReviewers";
import ManageResearchers from "./ManageResearchers";
import ManageAdmins from "./ManageAdmins";
import ViewLogs from "./ViewLogs";

// Main admin page component
export default function AdminPage({ initialTab = "dashboard" }) { // Allow an initial tab via props
  // State to track which tab is currently active
  const [activeTab, setActiveTab] = useState(initialTab);

  // Inline styles for layout and appearance
  const styles = {
    container: {
      display: "flex",
      height: "100vh",
      backgroundColor: "#1A2E40", // Consistent dark background
      fontFamily: "Arial, sans-serif",
    },
    main: {
      flex: 1,
      padding: "20px",
      overflowY: "auto",
      backgroundColor: "#1A2E40", // Match container background
      borderLeft: "1px solid #2B3E50", // Subtle border for separation
    },
    header: {
      marginBottom: "20px",
      borderBottom: "2px solid #2B3E50", // Subtle border for the header
      paddingBottom: "10px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#FFFFFF", // White text for contrast
    },
    subtitle: {
      fontSize: "16px",
      color: "#B1EDE8", // Light teal for subtitles
    },
  };

  // Debug: log the currently active tab
  console.log("ActiveTab is:", activeTab);

  return (
    // Main container for the admin page
    <section style={styles.container}>
      {/* Sidebar navigation for switching tabs */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* Main content area */}
      <main style={styles.main}>
        {/* Header with dynamic title and subtitle based on active tab */}
        <header style={styles.header}>
          <h1 style={styles.title}>
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
          <p style={styles.subtitle}>
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