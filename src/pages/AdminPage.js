import React, { useState } from "react";

export default function AdminPage() {
  const styles = {
    page: {
      backgroundColor: "#F9FAFB",
      minHeight: "100vh",
      padding: "2rem",
      fontFamily: "Inter, sans-serif",
      display: "flex",
      justifyContent: "center",
    },
    container: {
      backgroundColor: "#FFFFFF",
      borderRadius: "1rem",
      padding: "2rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      maxWidth: "900px",
      width: "100%",
    },
    header: {
      textAlign: "center",
      color: "#1A2E40",
      marginBottom: "2rem",
    },
    section: {
      marginBottom: "2rem",
    },
    sectionHeader: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      marginBottom: "1rem",
      color: "#1A2E40",
    },
    card: {
      backgroundColor: "#1A2E40",
      color: "#FFFFFF",
      borderRadius: "1rem",
      padding: "1rem",
      marginBottom: "1rem",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
    },
    button: {
      marginRight: "0.5rem",
      backgroundColor: "#64CCC5",
      color: "#FFFFFF",
      padding: "0.5rem 1rem",
      borderRadius: "0.5rem",
      border: "none",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
    },
    rejectButton: {
      backgroundColor: "#E74C3C",
    },
  };

  const [reviewers, setReviewers] = useState([
    { id: 1, name: "Reviewer A", status: "pending" },
    { id: 2, name: "Reviewer B", status: "pending" },
  ]);

  const [admins, setAdmins] = useState([
    { id: 1, name: "Admin A" },
    { id: 2, name: "Admin B" },
  ]);

  const handleApprove = (id) => {
    console.log("Approved reviewer ID:", id);
  };

  const handleReject = (id) => {
    console.log("Rejected reviewer ID:", id);
  };

  const handleRevoke = (id) => {
    console.log("Revoked admin rights for ID:", id);
  };

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1>Admin Dashboard</h1>
          <p>Manage reviewers and admin roles</p>
        </header>

        <section style={styles.section}>
          <h2 style={styles.sectionHeader}>Reviewer Applications</h2>
          {reviewers.map((reviewer) => (
            <div key={reviewer.id} style={styles.card}>
              <p>{reviewer.name}</p>
              <button
                style={styles.button}
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
          ))}
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionHeader}>Current Admins</h2>
          {admins.map((admin) => (
            <div key={admin.id} style={styles.card}>
              <p>{admin.name}</p>
              <button
                style={styles.button}
                onClick={() => handleRevoke(admin.id)}
              >
                Revoke Admin
              </button>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
