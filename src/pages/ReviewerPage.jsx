import React from "react";

export default function ReviewerPage() {
  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#1A2E40", // Dark blue-gray for the background
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, sans-serif",
      padding: "2rem",
    },
    header: {
      textAlign: "center",
      color: "#FFFFFF", // White text for contrast
      marginBottom: "1.5rem",
    },
    card: {
      backgroundColor: "#2B3E50", // Slightly lighter dark blue-gray for the card
      borderRadius: "1rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
      padding: "2rem",
      maxWidth: "600px",
      width: "100%",
      textAlign: "center",
      color: "#FFFFFF", // White text for the card content
    },
    button: {
      marginTop: "1.5rem",
      backgroundColor: "#64CCC5", // Vibrant teal for the button
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
      backgroundColor: "#5AA9A3", // Slightly darker teal for hover
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Reviewer Dashboard</h1>
        <p>Manage and review research submissions with ease.</p>
      </header>
      <div style={styles.card}>
        <h2>Coming Soon</h2>
        <p>
          This page will allow reviewers to view, manage, and provide feedback
          on research submissions.
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
