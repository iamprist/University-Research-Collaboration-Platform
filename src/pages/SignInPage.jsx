import React from "react";
import { auth, provider, db } from "../config/firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { setDoc, doc, getDocs, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { logEvent } from "../utils/logEvent";

function SignInPage() {
  const navigate = useNavigate();

  const handleSignIn = async (role) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (role === "admin") {
        // Check if the email exists in the "newEmails" collection
        const newEmailsSnapshot = await getDocs(collection(db, "newEmails"));
        const isAuthorizedInNewEmails = newEmailsSnapshot.docs.some(
          (doc) => doc.data().email.toLowerCase() === user.email.toLowerCase()
        );

        // Check if the user exists in the "users" collection with the "admin" role
        const usersSnapshot = await getDocs(collection(db, "users"));
        const isAuthorizedInUsers = usersSnapshot.docs.some(
          (doc) =>
            doc.data().email.toLowerCase() === user.email.toLowerCase() &&
            doc.data().role === "admin"
        );

        // If the user is not authorized in either collection, deny access
        if (!isAuthorizedInNewEmails && !isAuthorizedInUsers) {
          // Styled popup for unauthorized admins
          const popup = document.createElement("div");
          popup.innerHTML = `
            <div style="
              position: fixed;
              top: 0; 
              left: 0;
              width: 100%; 
              height: 100%; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              background: rgba(0, 0, 0, 0.5); 
              font-family: Inter, sans-serif;
              z-index: 1000;
            ">
              <div style="
                background: #FFFFFF;
                padding: 2rem;
                border-radius: 1rem;
                text-align: center;
                box-shadow: 0 4px 6px rgba(18, 34, 56, 0.1);
              ">
                <h2 style="font-size: 1.5rem; color: #132238; margin-bottom: 1rem;">Access Denied</h2>
                <p style="font-size: 1rem; color: #364E68; margin-bottom: 1.5rem;">
                  You are not authorized to access the admin dashboard.
                </p>
                <button style="
                  background-color: #FF0000;
                  color: #FFFFFF;
                  padding: 0.75rem 1.5rem;
                  border: none;
                  border-radius: 0.5rem;
                  cursor: pointer;
                " onclick="this.parentElement.parentElement.remove()">Close</button>
              </div>
            </div>
          `;
          document.body.appendChild(popup);
          return;
        }
      }

      // Save the token in localStorage
      const token = await user.getIdToken();
      localStorage.setItem("authToken", token);

      // Save user details in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName,
        email: user.email,
        role,
      });

      // Log the login event
      await logEvent({
        userId: user.uid,
        role,
        userName: user.displayName || "N/A",
        action: "Login",
        details: "User logged in",
      });

      // Redirect to the appropriate page
      if (role === "researcher") navigate("/researcher-dashboard");
      else if (role === "reviewer") navigate("/reviewer");
      else if (role === "admin") navigate("/admin");
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        console.log("Login canceled by user");
      } else {
        console.error("Login error:", error);
        alert("Login failed. Please try again.");
      }
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
    },
    googleIcon: {
      position: "absolute",
      left: "1rem",
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
      backgroundColor: "#A0E7E5",
      color: "#132238",
    },
    landingPageButton: {
      backgroundColor: "#F4F4F4",
      color: "#132238",
      border: "1px solid #D1D5DB",
      marginTop: "1rem",
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
          <button
            style={{ ...styles.button, ...styles.landingPageButton }}
            onClick={() => navigate("/")}
          >
            Go to Landing Page
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
