// AdminPage.js
import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc 
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const allowedAdmins = [
  "2550411@students.wits.ac.za",
  "2465030@students.wits.ac.za",
  "2562270@students.wits.ac.za",
  "2542032@students.wits.ac.za",
  "2556239@students.wits.ac.za",
  "2555497@students.wits.ac.za",
];

export default function AdminPage() {
  const styles = {
    container: {
      minHeight: "100vh",
      padding: "2rem",
      backgroundColor: "#FFFFFF",
      fontFamily: "Inter, sans-serif",
    },
    header: {
      fontSize: "2rem",
      fontWeight: "bold",
      marginBottom: "2rem",
      color: "#132238",
      textAlign: "center",
    },
    section: {
      marginBottom: "2rem",
    },
    sectionHeader: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#132238",
      marginBottom: "1rem",
    },
    card: {
      backgroundColor: "#F9F9F9",
      padding: "1rem",
      borderRadius: "0.5rem",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      marginBottom: "1rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    button: {
      padding: "0.5rem 1rem",
      marginRight: "1rem",
      borderRadius: "0.5rem",
      border: "none",
      cursor: "pointer",
      fontWeight: "bold",
    },
    approveButton: {
      backgroundColor: "#64CCC5",
      color: "#132238",
    },
    rejectButton: {
      backgroundColor: "#FF6B6B",
      color: "#FFFFFF",
    },
    userInfo: {
      flex: 1,
    },
  };

  const [admins, setAdmins] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState({
    admins: false,
    reviewers: false
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch authorized admins only
        setLoading(prev => ({...prev, admins: true}));
        const adminQuery = query(
          collection(db, "users"), 
          where("role", "==", "admin"),
          where("email", "in", allowedAdmins)
        );
        const adminSnapshot = await getDocs(adminQuery);
        const adminList = adminSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAdmins(adminList);

        // Fetch pending reviewer applications
        setLoading(prev => ({...prev, reviewers: true}));
        const reviewerQuery = query(
          collection(db, "users"),
          where("reviewerStatus", "==", "pending")
        );
        const reviewerSnapshot = await getDocs(reviewerQuery);
        const reviewerList = reviewerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReviewers(reviewerList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading({ admins: false, reviewers: false });
      }
    };

    fetchUsers();
  }, []);

  const handleApprove = async (id) => {
    try {
      await updateDoc(doc(db, "users", id), {
        role: "reviewer",
        reviewerStatus: "approved",
        approvedAt: new Date()
      });
      setReviewers(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("Approval error:", error);
    }
  };

  const handleReject = async (id) => {
    try {
      await updateDoc(doc(db, "users", id), {
        reviewerStatus: "rejected",
        rejectedAt: new Date()
      });
      setReviewers(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("Rejection error:", error);
    }
  };

  const handleRevoke = async (id) => {
    try {
      const adminToRevoke = admins.find(admin => admin.id === id);
      if (!allowedAdmins.includes(adminToRevoke.email)) {
        alert("Cannot revoke pre-authorized admin");
        return;
      }
      
      await updateDoc(doc(db, "users", id), {
        role: "researcher"
      });
      setAdmins(prev => prev.filter(admin => admin.id !== id));
    } catch (error) {
      console.error("Revoke error:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Admin Dashboard</h1>

      {/* Reviewer applications */}
      <section style={styles.section}>
        <h2 style={styles.sectionHeader}>Reviewer Applications</h2>
        {loading.reviewers ? (
          <p>Loading reviewer applications...</p>
        ) : reviewers.length === 0 ? (
          <p>No pending reviewer applications.</p>
        ) : (
          reviewers.map((reviewer) => (
            <div key={reviewer.id} style={styles.card}>
              <div style={styles.userInfo}>
                <p><strong>{reviewer.name}</strong></p>
                <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>{reviewer.email}</p>
              </div>
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
      </section>

      {/* Admin users */}
      <section style={styles.section}>
        <h2 style={styles.sectionHeader}>Current Admins</h2>
        {loading.admins ? (
          <p>Loading admins...</p>
        ) : admins.length === 0 ? (
          <p>No admins found.</p>
        ) : (
          admins.map((admin) => (
            <div key={admin.id} style={styles.card}>
              <div style={styles.userInfo}>
                <p><strong>{admin.name}</strong></p>
                <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>{admin.email}</p>
              </div>
              <button
                style={{ ...styles.button, ...styles.rejectButton }}
                onClick={() => handleRevoke(admin.id)}
              >
                Revoke Admin
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}