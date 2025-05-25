//Sidebar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import { auth } from "../../config/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import axios from "axios";
import './Sidebar.css'; // <-- Import the CSS file

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

  // Log an event to Firestore logs collection
  const logEvent = async ({ userId, role, userName, action, details, ip, target }) => {
    try {
      await addDoc(collection(db, "logs"), {
        userId,
        role,
        userName,
        action,
        details,
        ip,
        target,
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

        const target = "Admin Dashboard";
        await logEvent({
          userId: user.uid,
          role: "Admin",
          userName: user.displayName || "N/A",
          action: "Logout",
          details: "User logged out",
          ip: ipAddress,
          target,
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
    <aside className={`sidebar${isCollapsed ? " collapsed" : " expanded"}`}>
      <section>
        <header className="sidebar-toggle-container">
          {!isCollapsed && (
            <button
              className="sidebar-toggle-btn"
              onClick={() => setActiveTab("dashboard")}
            >
              <FaHome />
            </button>
          )}
          <button
            className="sidebar-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            ☰
          </button>
        </header>
        {!isCollapsed && (
          <>
            <button
              className={`sidebar-nav-btn${activeTab === "logs" ? " active" : ""}`}
              onClick={() => setActiveTab("logs")}
            >
              <span className="sidebar-nav-text">View Logs</span>
            </button>
            <button
              className={`sidebar-nav-btn${activeTab === "researchers" ? " active" : ""}`}
              onClick={() => setActiveTab("researchers")}
            >
              <span className="sidebar-nav-text">Manage Researchers</span>
            </button>
            <button
              className={`sidebar-nav-btn${activeTab === "reviewers" ? " active" : ""}`}
              onClick={() => setActiveTab("reviewers")}
            >
              <span className="sidebar-nav-text">Manage Reviewers</span>
            </button>
            <button
              className={`sidebar-nav-btn${activeTab === "admins" ? " active" : ""}`}
              onClick={() => setActiveTab("admins")}
            >
              <span className="sidebar-nav-text">Manage Admin</span>
            </button>
          </>
        )}
      </section>
      {!isCollapsed && (
        <footer>
          <button
            className="sidebar-logout-btn"
            onClick={handleLogout}
          >
            <span className="sidebar-nav-text">Logout</span>
          </button>
        </footer>
      )}
    </aside>
  );
}
