import { useState } from "react";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import ManageReviewers from "./ManageReviewers";
import ManageResearchers from "./ManageResearchers";
import ManageAdmins from "./ManageAdmins";
import ViewLogs from "./ViewLogs";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard"); // Set "dashboard" as the default tab

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
      backgroundColor: "#1A2E40", // Updated to match the container background
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

  return (
    <section style={styles.container}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.title}>
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
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "logs" && <ViewLogs />}
        {activeTab === "researchers" && <ManageResearchers />}
        {activeTab === "admins" && <ManageAdmins />}
        {activeTab === "reviewers" && <ManageReviewers />}
      </main>
    </section>
  );
}