import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "../../config/firebaseConfig";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
  const navigate = useNavigate();
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
      transition: "all 0.3s ease-in-out",
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
        const reviewerQuery = query(collection(db, "reviewers"), where("status", "!=", "rejected"));
        const snapshot = await getDocs(reviewerQuery);
        const reviewersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReviewers(reviewersData);
      } catch (error) {
        console.error("Error fetching reviewer applications:", error);
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

      <div style={styles.collapsibleHeader} onClick={() => setIsReviewerSectionOpen(!isReviewerSectionOpen)}>
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
              {/* White background box for details, left-aligned text */}
              <div style={{ 
                backgroundColor: "#FFFFFF", 
                padding: "1rem", 
                borderRadius: "0.5rem", 
                marginBottom: "1rem", 
                width: "80%", 
                marginLeft: "0" // Move box to the left
              }}>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1A2E40", marginBottom: "0.5rem", textAlign: "left" }}>{reviewer.name}</h3>
                <p style={{ color: "#1A2E40", fontWeight: "600" }}><strong>Email:</strong> {reviewer.email}</p>
                <p style={{ color: "#1A2E40", fontWeight: "600" }}><strong>Institution:</strong> {reviewer.institution || "Not Provided"}</p>
                <p style={{ color: "#FFD700", fontWeight: "600" }}><strong>Expertise:</strong> {Array.isArray(reviewer.expertiseTags) ? reviewer.expertiseTags.join(", ") : "Not Provided"}</p>
                <p style={{ color: "#1A2E40", fontWeight: "600" }}><strong>Years of Experience:</strong> {reviewer.yearsExperience || "Not Provided"}</p>
                {reviewer.publications && reviewer.publications.length > 0 ? (
                  <p style={{ color: "#1A2E40" }}><strong>Publications:</strong> {reviewer.publications.map((pub) => (
                    <a href={pub} target="_blank" rel="noopener noreferrer" style={styles.link}>{pub}</a>
                  ))}</p>
                ) : (
                  <p style={{ color: "#1A2E40" }}><strong>Publications:</strong> No publications listed</p>
                )}
          
                {/* Box-style View CV button with contrast */}
                <a href={reviewer.cvUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-block",
                  backgroundColor: "#64CCC5",
                  color: "#132238",
                  padding: "10px 15px",
                  borderRadius: "5px",
                  fontWeight: "bold",
                  textDecoration: "none",
                  textAlign: "center",
                  marginTop: "0.5rem",
                  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
                  width: "max-content" // Prevent stretching
                }}>
                  View CV
                </a>
              </div>
          
              <div>
                <button style={{ ...styles.button, backgroundColor: "#4C93AF", color: "#FFFFFF" }} onClick={() => handleApprove(reviewer.id)}>Approve</button>
                <button style={{ ...styles.button, backgroundColor: "#D32F2F", color: "#FFFFFF" }} onClick={() => handleReject(reviewer.id)}>Reject</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <button style={{ ...styles.button, backgroundColor: "#4C93AF", marginRight: "1rem" }} onClick={() => navigate("/logs")}>
          View Logs
        </button>
        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}