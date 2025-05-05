import React, { useEffect, useState } from "react";
import { db } from "../../config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function ManageResearchers() {
  const [researchers, setResearchers] = useState([]);

  const fetchResearchers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const researcherList = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.role?.toLowerCase() === "researcher"); // Case-insensitive comparison

      setResearchers(researcherList);
    } catch (error) {
      console.error("Error fetching researchers:", error);
    }
  };

  useEffect(() => {
    fetchResearchers();
  }, []);

  // Inline styles
  const styles = {
    container: {
      minHeight: "100vh",
      background: "#1a2e40", // Match reviewer list background
      color: "#FFFFFF",
      padding: "2rem 1rem",
    },
    article: {
      maxWidth: "960px",
      margin: "0 auto",
      padding: "1.5rem",
      backgroundColor: "#1a2e40", // Match sidebar background
      borderRadius: "0.5rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    heading: {
      fontSize: "2rem",
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: "1.5rem",
    },
    description: {
      textAlign: "center",
      color: "#A0AEC0",
      marginBottom: "1.5rem",
    },
    card: {
      backgroundColor: "#243447", // Slightly lighter shade for cards
      padding: "1rem",
      borderRadius: "0.5rem",
      marginBottom: "1rem",
      color: "#FFFFFF",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "0.5rem",
    },
    cardTitle: {
      fontSize: "1.25rem",
      fontWeight: "bold",
      color: "#64CCC5", // Teal color for titles
    },
    cardEmail: {
      fontSize: "0.9rem",
      color: "#A0AEC0",
    },
    noData: {
      textAlign: "center",
      color: "#A0AEC0",
      marginTop: "1rem",
    },
  };

  return (
    <section style={styles.container}>
      <article style={styles.article}>
        <h2 style={styles.heading}>Manage Researchers</h2>
        <p style={styles.description}>
          Below is the list of all users with the <span style={{ fontWeight: "bold" }}>researcher</span> role:
        </p>
        <section>
          {researchers.map((researcher, index) => (
            <div key={researcher.id} style={styles.card}>
              <header style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  {index + 1}. {researcher.name || "N/A"}
                </h3>
                <p style={styles.cardEmail}>{researcher.email || "N/A"}</p>
              </header>
            </div>
          ))}
          {researchers.length === 0 && (
            <p style={styles.noData}>No researcher accounts found.</p>
          )}
        </section>
      </article>
    </section>
  );
}