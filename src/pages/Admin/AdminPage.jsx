import React from "react";

export default function AdminPage() {
  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#1A2E40",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, sans-serif",
      padding: "2rem",
    },
    header: {
      textAlign: "center",
      color: "#FFFFFF",
      marginBottom: "1.5rem",
    },
    card: {
      backgroundColor: "#2B3E50",
      borderRadius: "1rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
      padding: "2rem",
      maxWidth: "600px",
      width: "100%",
      textAlign: "center",
      color: "#FFFFFF",
    },
    button: {
      marginTop: "1.5rem",
      backgroundColor: "#64CCC5",
      color: "#FFFFFF",
      padding: "0.75rem 1.5rem",
      borderRadius: "0.5rem",
      border: "none",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
    },
    buttonHover: {
      backgroundColor: "#5AA9A3",
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Admin Dashboard</h1>
        <p>Manage platform settings and oversee user activity.</p>
      </header>
      <div style={styles.card}>
        <h2>Coming Soon</h2>
        <p>
          This page will allow administrators to manage users, research
          submissions, and platform settings.
        </p>
        <button
          style={styles.button}
          onMouseOver={(e) => (e.target.style.backgroundColor = styles.buttonHover.backgroundColor)}
          onMouseOut={(e) => (e.target.style.backgroundColor = styles.button.backgroundColor)}
          onClick={() => alert("Feature coming soon!")}
        >
          Learn More
        </button>
      </div>
    </div>
  );
}
