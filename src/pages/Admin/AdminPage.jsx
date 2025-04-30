import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "../../config/firebaseConfig";
import { useNavigate, useLocation } from "react-router-dom";

export default function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user; // Ensure user is passed via state
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isReviewerSectionOpen, setIsReviewerSectionOpen] = useState(false);

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#1A2E40",
      padding: "2rem",
      fontFamily: "Inter, sans-serif",
      color: "#FFFFFF",
    },
    header: {
      textAlign: "center",
      marginBottom: "2rem",
    },
    collapsibleHeader: {
      backgroundColor: "#2B3E50",
      padding: "1rem",
      borderRadius: "0.5rem",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1rem",
      color: "#FFFFFF",
      fontWeight: "bold",
      fontSize: "1.1rem",
    },
    collapsibleContent: {
      display: isReviewerSectionOpen ? "block" : "none",
      marginTop: "1rem",
    },
    card: {
      backgroundColor: "#2B3E50",
      borderRadius: "1rem",
      padding: "1.5rem",
      marginBottom: "1rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    button: {
      padding: "0.75rem 1.5rem",
      borderRadius: "0.5rem",
      border: "none",
      fontWeight: "600",
      cursor: "pointer",
      marginRight: "1rem",
    },
    approveButton: {
      backgroundColor: "#64CCC5",
      color: "#132238",
    },
    rejectButton: {
      backgroundColor: "#FF6B6B",
      color: "#FFFFFF",
    },
    link: {
      color: "#64CCC5",
      textDecoration: "underline",
      cursor: "pointer",
    },
    logoutButton: {
      padding: "0.75rem 1.5rem",
      borderRadius: "0.5rem",
      border: "none",
      fontWeight: "600",
      cursor: "pointer",
      backgroundColor: "#f44336",
      color: "#FFFFFF",
    },
  };

  useEffect(() => {
    const fetchReviewers = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "reviewers"));
        const reviewersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReviewers(reviewersData); // Store all reviewers, not just pending ones
      } catch (error) {
        console.error("Error fetching reviewers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewers();
  }, []);

  const handleApprove = async (id) => {
    try {
      await updateDoc(doc(db, "reviewers", id), {
        status: "approved",
        updatedAt: new Date(),
      });

      setReviewers((prev) => prev.filter((reviewer) => reviewer.id !== id));
    } catch (error) {
      console.error("Error approving reviewer:", error);
    }
  };

  const handleReject = async (id) => {
    try {
      await updateDoc(doc(db, "reviewers", id), {
        status: "rejected",
        updatedAt: new Date(),
      });

      setReviewers((prev) => prev.filter((reviewer) => reviewer.id !== id));
    } catch (error) {
      console.error("Error rejecting reviewer:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem("authToken");
      navigate("/signin");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Admin Dashboard</h1>
        <p>Manage reviewer applications and oversee platform activity.</p>
      </header>

      <div
        style={styles.collapsibleHeader}
        onClick={() => setIsReviewerSectionOpen(!isReviewerSectionOpen)}
      >
        <span>Reviewer Applications</span>
        <span>{isReviewerSectionOpen ? "▲" : "▼"}</span>
      </div>

      <div style={styles.collapsibleContent}>
        {loading ? (
          <p>Loading reviewer applications...</p>
        ) : reviewers.length === 0 ? (
          <p>No pending reviewer applications.</p>
        ) : (
          reviewers.map((reviewer) => (
            <div key={reviewer.id} style={styles.card}>
              <h3>{reviewer.name}</h3>
              <p><strong>Email:</strong> {reviewer.email}</p>
              <p><strong>Institution:</strong> {reviewer.institution || "Not Provided"}</p>
              <p><strong>Expertise:</strong> {reviewer.expertiseTags ? reviewer.expertiseTags.join(", ") : "Not Provided"}</p>
              <p><strong>Years of Experience:</strong> {reviewer.yearsExperience || "Not Provided"}</p>
              {reviewer.publications && reviewer.publications.length > 0 ? (
                <p><strong>Publications:</strong> {reviewer.publications.map((pub) => (
                  <a href={pub} target="_blank" rel="noopener noreferrer">{pub}</a>
                ))}</p>
              ) : (
                <p><strong>Publications:</strong> No publications listed</p>
              )}
              <a href={reviewer.cvUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
                View CV
              </a>
              <div>
                <button style={{ ...styles.button, ...styles.approveButton }} onClick={() => handleApprove(reviewer.id)}>Approve</button>
                <button style={{ ...styles.button, ...styles.rejectButton }} onClick={() => handleReject(reviewer.id)}>Reject</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <button
          style={{ ...styles.button, backgroundColor: "#4C93AF", marginRight: "1rem" }}
          onClick={() => navigate("/logs")}
        >
          View Logs
        </button>
        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}