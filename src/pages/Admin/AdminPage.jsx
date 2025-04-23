import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, updateDoc, doc, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
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

  // Define the logEvent function locally
  const logEvent = async ({ userId, role, userName, action, target, details, ip }) => {
    try {
      let resolvedUserName = userName;

      // Fetch the user's name from Firestore if not provided
      if (!userName && userId) {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        resolvedUserName = userDoc.exists() ? userDoc.data().name : "N/A";
      }

      await addDoc(collection(db, "logs"), {
        userId,
        role,
        userName: resolvedUserName,
        action,
        target,
        details,
        ip,
        timestamp: serverTimestamp(),
      });
      console.log("Event logged:", { userId, role, action, details });
    } catch (error) {
      console.error("Error logging event:", error);
    }
  };

  useEffect(() => {
    const fetchReviewers = async () => {
      setLoading(true);
      try {
        const reviewerQuery = query(
          collection(db, "reviewers"),
          where("status", "==", "in_progress")
        );
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

      if (user?.uid) {
        await logEvent({
          userId: user.uid,
          role: "Admin",
          action: "Approve Reviewer",
          details: `Approved reviewer with ID: ${id}`,
        });
        console.log(`Reviewer with ID: ${id} approved and logged.`);
      }

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

      if (user?.uid) {
        await logEvent({
          userId: user.uid,
          role: "Admin",
          action: "Reject Reviewer",
          details: `Rejected reviewer with ID: ${id}`,
        });
        console.log(`Reviewer with ID: ${id} rejected and logged.`);
      }

      setReviewers((prev) => prev.filter((reviewer) => reviewer.id !== id));
    } catch (error) {
      console.error("Error rejecting reviewer:", error);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Attempting to log out...");

      if (user?.uid) {
        await logEvent({
          userId: user.uid,
          role: "Admin",
          action: "Logout",
          details: "User logged out",
        });
        console.log("Logout event recorded.");
      } else {
        console.warn("No userId found to log the event.");
      }

      await auth.signOut();
      localStorage.removeItem("authToken");
      console.log("User signed out successfully.");
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
              <p>{reviewer.email}</p>
              <a
                href={reviewer.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                View CV
              </a>
              <div>
                <button
                  style={{ ...styles.button, ...styles.approveButton }}
                  onClick={() => handleApprove(reviewer.id)}
                >
                  Approve
                </button>
                <button
                  style={{ ...styles.button, ...styles.rejectButton }}
                  onClick={() => handleReject(reviewer.id)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <button
          style={{
            ...styles.button,
            backgroundColor: "#4C93AF",
            marginRight: "1rem",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#417e94")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#4C93AF")}
          onClick={() => navigate("/logs")}
        >
          View Logs
        </button>
        <button
          style={styles.logoutButton}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#d32f2f")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#f44336")}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
