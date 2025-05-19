import React, { useState, useEffect } from "react";
import { auth, provider, db } from "../config/firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { setDoc, doc, getDocs, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import './TermsAndConditions.css';
import Footer from "../components/Footer";
import "../pages/Researcher/ResearcherDashboard.css";
import axios from "axios";

// Add this above function SignInPage
const logEvent = async ({ userId, role, userName, action, details, ip, target }) => {
  try {
    await addDoc(collection(db, "logs"), {
      userId,
      role,
      userName,
      action,
      details,
      ip,
      target,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging event:", error);
  }
};

function SignInPage() {
  const [ipAddress, setIpAddress] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the user's IP address
    const fetchIpAddress = async () => {
      try {
        const response = await axios.get("https://api.ipify.org?format=json");
        setIpAddress(response.data.ip);
      } catch (error) {
        console.error("Error fetching IP address:", error);
      }
    };
    fetchIpAddress();
  }, []);

  // Add enhanced animations via dynamic <style>
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes gradientBG {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes neon-glow {
        0%, 100% {
          box-shadow: 0 0 5px #64CCC5, 0 0 10px #64CCC5, 0 0 20px #64CCC5;
        }
        50% {
          box-shadow: 0 0 10px #B1EDE8, 0 0 20px #B1EDE8, 0 0 30px #B1EDE8;
        }
      }
      @keyframes fadeInUp {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      .neon-button::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 300%;
        height: 300%;
        background: radial-gradient(circle, rgba(99,204,200,0.2) 0%, transparent 70%);
        transform: translate(-50%, -50%) scale(0.5);
        transition: transform 0.5s ease;
        border-radius: 50%;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // --- Sign-in logic from the provided code ---
  const handleSignIn = async (role) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (role === "admin") {
        const newAdminSnapshot = await getDocs(collection(db, "newAdmin"));
        const isAuthorizedInNewAdmin = newAdminSnapshot.docs.some(
          (doc) => doc.data().email.toLowerCase() === user.email.toLowerCase()
        );
        const usersSnapshot = await getDocs(collection(db, "users"));
        const isAuthorizedInUsers = usersSnapshot.docs.some(
          (doc) =>
            doc.data().email.toLowerCase() === user.email.toLowerCase() &&
            doc.data().role === "admin"
        );

        if (!isAuthorizedInNewAdmin && !isAuthorizedInUsers) {
          const modal = document.createElement("section");
          modal.setAttribute("role", "dialog");
          modal.setAttribute("aria-modal", "true");
          modal.className = "modal";
          modal.style = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(0, 0, 0, 0.5);
            font-family: Inter, sans-serif;
            z-index: 1000;
            animation: fadeInScale 0.3s ease forwards;
          `;
          modal.innerHTML = `
            <article role="document" style="
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
                transition: all 0.3s ease;
              " onclick="this.closest('section').remove()">Close</button>
            </article>
          `;
          document.body.appendChild(modal);
          return;
        }
      }

      const token = await user.getIdToken();
      localStorage.setItem("authToken", token);

      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName,
        email: user.email,
        role,
      });

      await logEvent({
        userId: user.uid,
        role,
        userName: user.displayName || "N/A",
        action: "Login",
        details: "User logged in",
        ip: ipAddress,
        target: "Sign In Page",
      });

      if (role === "researcher") navigate("/researcher-dashboard");
      else if (role === "reviewer") navigate("/reviewer");
      else if (role === "admin") navigate("/admin");
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        console.log("Login canceled by user");
      } else {
        console.error("Login error:", error);
        toast.error("Login failed. Please try again.");
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
    card: {
      background: "rgba(255, 255, 255, 0.9)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      boxShadow: "0 4px 6px 0 rgba(18, 34, 56, 0.2)",
      borderRadius: "1.5rem",
      padding: "2.5rem",
      maxWidth: "400px",
      width: "100%",
      margin: "2rem auto",
      position: "relative",
      zIndex: 1,
      opacity: 0,
      transform: "translateY(20px)",
      animation: "fadeInUp 0.6s ease forwards",
      backgroundImage: "radial-gradient(circle at 2px 2px, rgba(99,204,200,0.05) 2px, transparent 0)",
      backgroundSize: "40px 40px"
    },
    button: {
      backgroundColor: "#132238",
      color: "#FFFFFF",
      padding: "1rem 2rem",
      borderRadius: "8rem",
      border: "none",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      marginBottom: "1rem",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      position: "relative",
      overflow: "hidden",
    },
    footer: {
      backgroundColor: "#364E68",
      color: "#B1EDE8",
      padding: "2rem",
      marginTop: "auto",
      textAlign: "center",
    },
    footerLinks: {
      display: "flex",
      justifyContent: "center",
      gap: "2rem",
      marginBottom: "1rem",
    },
    footerLink: {
      color: "#2a3a57",
      textDecoration: "none",
      fontSize: "0.9rem",
    },
  };

  return (
    <main role="main" style={styles.container}>
      <header className="researcher-header">
        <nav className="header-actions" aria-label="Navigation actions">
          <button
            className="back-button"
            onClick={() => navigate(-1)}
            style={{
              color: 'var(--white)',
              marginRight: '1.5rem'
            }}
          >
            <ArrowBackIosIcon />
          </button>
        </nav>
        <section className="header-title" aria-label="Header title section"
          style={{
            textAlign: 'left',
            width: '100%',
            padding: '0 4rem'
          }}
        >
          <h1>Welcome to Innerk Hub</h1>
          <p>Empowering Researchers to Connect, Collaborate, and Innovate</p>
        </section>
        {/* Right side - Home button */}
        <section className="header-right-actions">
          <button
            className="home-button"
            onClick={() => navigate("/")}
            style={{
              color: 'var(--white)',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: '1px solid var(--white)',
              background: 'transparent',
              cursor: 'pointer'
            }}
          >
            Home
          </button>
        </section>
      </header>

      {/* Sign-In Section */}
      <section
        aria-label="Sign in options"
        style={styles.card}
        className="card"
      >
        {["researcher", "reviewer", "admin"].map((role) => (
          <button
            key={role}
            className="neon-button"
            style={styles.button}
            onMouseOver={(e) => {
              e.target.style.animation = "neon-glow 1.5s ease-in-out infinite";
              e.target.querySelector("img").style.filter = "brightness(1.2)";
            }}
            onMouseOut={(e) => {
              e.target.style.animation = "none";
              e.target.querySelector("img").style.filter = "brightness(1)";
            }}
            onClick={() => handleSignIn(role)}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt=""
              aria-hidden="true"
              style={{
                height: "1.5rem",
                transition: "filter 0.3s ease"
              }}
            />
            Continue as {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        ))}
      </section>

      <Footer />
    </main>
  );
}

export default SignInPage;