import { auth, provider, db } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import React from "react";

function SignInPage() {
  const navigate = useNavigate();

  // List of allowed admin emails
  const allowedAdmins = [
    "2550411@students.wits.ac.za",
    "2465030@students.wits.ac.za",
    "2562270@students.wits.ac.za",
    "2542032@students.wits.ac.za",
    "2556239@students.wits.ac.za",
    "2555497@students.wits.ac.za",
  ];

  const handleSignIn = async (role) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if the user is an admin and if the email is allowed
      if (role === "admin" && !allowedAdmins.includes(user.email)) {
        alert("Access denied: You are not an authorized admin.");
        return;
      }

      // Store user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName,
        email: user.email,
        role,
      });

      // Navigate to the respective role-based page
      if (role === "researcher") {
        navigate("/researcher-dashboard"); // Redirect to researcher page
      } else if (role === "reviewer") {
        navigate("/reviewer"); // Redirect to reviewer page
      } else if (role === "admin") {
        navigate("/admin"); // Redirect to admin page
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#FFFCF9",
      fontFamily: "Inter, sans-serif",
    },
    header: {
      backgroundColor: "#132238",
      color: "#FFFFFF",
      padding: "1.5rem",
      textAlign: "center",
    },
    main: {
      flexGrow: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F8F9FA",
      padding: "2rem",
    },
    card: {
      backgroundColor: "#FFFFFF",
      padding: "2rem",
      borderRadius: "1rem",
      boxShadow: "0 4px 6px rgba(18, 34, 56, 0.1)",
      textAlign: "center",
      maxWidth: "400px",
      width: "100%",
    },
    heading: {
      fontSize: "2rem",
      fontWeight: "700",
      color: "#132238",
      marginBottom: "1.5rem",
    },
    button: {
      position: "relative",
      padding: "0.75rem 1.5rem",
      borderRadius: "2rem",
      fontSize: "1rem",
      fontWeight: "600",
      border: "none",
      cursor: "pointer",
      transition: "all 0.3s ease",
      marginBottom: "1rem",
      width: "100%",
      textAlign: "center", // Center the text
    },
    googleIcon: {
      position: "absolute",
      left: "1rem", // Align the icon to the left
      width: "20px",
      height: "20px",
    },
    researcherButton: {
      backgroundColor: "#64CCC5",
      color: "#132238",
    },
    reviewerButton: {
      backgroundColor: "#B1EDE8",
      color: "#132238",
    },
    adminButton: {
      backgroundColor: "#A0E7E5", // Lighter shade of researcher button
      color: "#132238",
    },
    footer: {
      backgroundColor: "#364E68",
      color: "#B1EDE8",
      padding: "1.5rem",
      textAlign: "center",
    },
    footerLink: {
      color: "#B1EDE8",
      textDecoration: "none",
      margin: "0 1rem",
      fontSize: "0.9rem",
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Innerk Hub</h1>
        <p>Collaborate and innovate with ease</p>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.heading}>Sign In</h2>
          <button
            style={{ ...styles.button, ...styles.researcherButton }}
            onClick={() => handleSignIn("researcher")}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google Icon"
              style={styles.googleIcon}
            />
            Sign in as Researcher
          </button>
          <button
            style={{ ...styles.button, ...styles.reviewerButton }}
            onClick={() => handleSignIn("reviewer")}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google Icon"
              style={styles.googleIcon}
            />
            Sign in as Reviewer
          </button>
          <button
            style={{ ...styles.button, ...styles.adminButton }}
            onClick={() => handleSignIn("admin")}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google Icon"
              style={styles.googleIcon}
            />
            Sign in as Admin
          </button>
        </div>
      </main>

      <footer style={styles.footer}>
        <a href="/privacy-policy" style={styles.footerLink}>
          Privacy Policy
        </a>
        <a href="/terms-of-service" style={styles.footerLink}>
          Terms of Service
        </a>
        <a href="/contact-us" style={styles.footerLink}>
          Contact Us
        </a>
        <p style={{ marginTop: "1rem", fontSize: "0.8rem" }}>
          &copy; 2025 Innerk Hub
        </p>
      </footer>
    </div>
  );
}

export default SignInPage;
