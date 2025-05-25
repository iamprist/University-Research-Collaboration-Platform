//Sidebar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import { auth } from "../../config/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import axios from "axios"; // Import axios for fetching IP

// Sidebar navigation component for the admin dashboard
export default function Sidebar({ activeTab, setActiveTab }) {
  // State for sidebar collapse/expand
  const [isCollapsed, setIsCollapsed] = useState(false);
  // State to store the user's IP address
  const [ipAddress, setIpAddress] = useState("");
  const navigate = useNavigate();

  // Fetch the user's IP address on mount
  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await axios.get("https://api.ipify.org?format=json");
        setIpAddress(response.data.ip);
      } catch (error) {
        console.error("Error fetching IP address:", error);
      }
    };
    fetchIpAddress();
  }, []);

  // Inline styles for sidebar and navigation buttons
  const styles = {
    sidebar: {
      width: isCollapsed ? "60px" : "250px",
      backgroundColor: "#1a2e40",
      color: "#ffffff",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: isCollapsed ? "10px 0" : "10px",
      boxShadow: "2px 0 5px rgba(0, 0, 0, 0.1)",
      transition: "width 0.3s ease",
      overflow: "hidden",
    },
    toggleButtonContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: isCollapsed ? "center" : "space-between",
      marginBottom: "20px",
    },
    toggleButton: {
      backgroundColor: "transparent",
      color: "#ffffff",
      border: "none",
      fontSize: "28px",
      cursor: "pointer",
      textAlign: "center",
      padding: "10px",
    },
    navText: {
      marginLeft: "10px",
      display: isCollapsed ? "none" : "inline",
    },
  };

  // Style generator for sidebar navigation buttons
  const sidebarBtn = (isActive) => ({
    padding: "0.75rem 1rem",
    backgroundColor: isActive ? "#3a5a72" : "#243447",
    color: isActive ? "#ffffff" : "#B1EDE8",
    border: "none",
    borderRadius: "0.5rem",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    transition: "all 0.3s ease",
    marginBottom: "12px",
    width: "100%", // Ensures all buttons take the full width of the sidebar
  });

  // Log an event to Firestore logs collection
  const logEvent = async ({ userId, role, userName, action, details, ip, target }) => {
    try {
      await addDoc(collection(db, "logs"), {
        userId,
        role,
        userName,
        action,
        details,
        ip, // Add IP address
        target, // Add target field
        timestamp: serverTimestamp(),
      });
      console.log("Event logged:", { userId, role, userName, action, details, ip, target });
    } catch (error) {
      console.error("Error logging event:", error);
    }
  };

  // Handle user logout and log the event
  const handleLogout = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        console.log("Logging out user:", user.uid);

        const target = "Admin Dashboard"; // Example target

        await logEvent({
          userId: user.uid,
          role: "Admin",
          userName: user.displayName || "N/A",
          action: "Logout",
          details: "User logged out",
          ip: ipAddress, // Use the fetched IP address
          target, // Pass target
        });

        await auth.signOut();
        console.log("User logged out successfully.");
        navigate("/signin");
      } else {
        console.warn("No user is currently logged in.");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    // Sidebar container
    <aside style={styles.sidebar}>
      {/* Top section: navigation and collapse/expand controls */}
      <section>
        <header style={styles.toggleButtonContainer}>
          {/* Home button (only when expanded) */}
          {!isCollapsed && (
            <button
              style={styles.toggleButton}
              onClick={() => setActiveTab("dashboard")}
            >
              <FaHome />
            </button>
          )}
          {/* Collapse/expand sidebar button */}
          <button
            style={styles.toggleButton}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            ☰
          </button>
        </header>
        {/* Navigation buttons (only when expanded) */}
        {!isCollapsed && (
          <>
            <button
              style={sidebarBtn(activeTab === "logs")}
              onClick={() => setActiveTab("logs")}
            >
              <span style={styles.navText}>View Logs</span>
            </button>
            <button
              style={sidebarBtn(activeTab === "researchers")}
              onClick={() => setActiveTab("researchers")}
            >
              <span style={styles.navText}>Manage Researchers</span>
            </button>
            <button
              style={sidebarBtn(activeTab === "reviewers")}
              onClick={() => setActiveTab("reviewers")}
            >
              <span style={styles.navText}>Manage Reviewers</span>
            </button>
            <button
              style={sidebarBtn(activeTab === "admins")}
              onClick={() => setActiveTab("admins")}
            >
              <span style={styles.navText}>Manage Admin</span>
            </button>
          </>
        )}
      </section>
      {/* Logout button (only when expanded) */}
      {!isCollapsed && (
        <footer
          style={sidebarBtn(false)}
          onClick={handleLogout}
        >
          <span style={{ ...styles.navText, color: "#f44336" }}>Logout</span>
        </footer>
      )}
    </aside>
  );
}
