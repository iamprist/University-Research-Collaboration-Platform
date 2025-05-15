import React, { useEffect, useCallback, useMemo } from "react";
import { auth, provider, db } from "../config/firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { setDoc, doc, getDocs, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { logEvent } from "../utils/logEvent";
import { toast } from "react-toastify";
import { ArrowLeftIcon, SparklesIcon, GlobeAltIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

function SignInPage() {
  const navigate = useNavigate();

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
      .hero-section {
        background-size: 400% 400%;
        animation: gradientBG 15s ease infinite;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleSignIn = useCallback(async (role) => {
    const navigateToRoleDashboard = (role) => {
      if (role === "researcher") navigate("/researcher-dashboard");
      else if (role === "reviewer") navigate("/reviewer");
      else if (role === "admin") navigate("/admin");
    };

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const isAuthorized = await checkAuthorization(user.email, role);
      if (!isAuthorized) {
        showAccessDeniedModal();
        return;
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
      });

      navigateToRoleDashboard(role);
    } catch (error) {
      handleSignInError(error);
    }
  }, [navigate]);

  const checkAuthorization = async (email, role) => {
    const newEmailsSnapshot = await getDocs(collection(db, "newEmails"));
    const isAuthorizedInNewEmails = newEmailsSnapshot.docs.some(
      (doc) => doc.data().email.toLowerCase() === email.toLowerCase()
    );

    const usersSnapshot = await getDocs(collection(db, "users"));
    const isAuthorizedInUsers = usersSnapshot.docs.some(
      (doc) =>
        doc.data().email.toLowerCase() === email.toLowerCase() &&
        doc.data().role === role
    );

    return isAuthorizedInNewEmails || isAuthorizedInUsers;
  };

  const showAccessDeniedModal = () => {
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
  };

  const handleSignInError = (error) => {
    if (error.code === "auth/popup-closed-by-user") {
      console.log("Login canceled by user");
    } else {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    }
  };

  const stats = useMemo(() => [
    { number: "Multiple", label: "Daily Collaborations" },
    { number: "Protected", label: "Submission Integrity" },
    { number: "Guaranteed", label: "Faster Peer Review" },
  ], []);

  const features = useMemo(() => [
    { icon: SparklesIcon, text: "Peer-Powered Research Validation" },
    { icon: GlobeAltIcon, text: "Global Academic Network" },
    { icon: ShieldCheckIcon, text: "Ensures Academic Integrity" },
  ], []);

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#FFFCF9",
      fontFamily: "Inter, sans-serif",
    },
    heroSection: {
      background: "linear-gradient(135deg, #132238 0%, #364E68 100%)",
      padding: "clamp(1.5rem, 5vw, 3rem)",
      color: "#FFFFFF",
      textAlign: "center",
      position: "relative",
    },
    content: {
      maxWidth: "90%",
      margin: "0 auto",
      padding: "1rem 0",
    },
    heading: {
      fontSize: "clamp(2rem, 5vw, 2.5rem)",
      fontWeight: "700",
      marginBottom: "0.5rem",
    },
    tagline: {
      fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
      fontWeight: "600",
      color: "#B1EDE8",
      marginBottom: "0.75rem",
    },
    description: {
      fontSize: "clamp(0.9rem, 1.5vw, 1.1rem)",
      color: "#FFFFFF",
      maxWidth: "90%",
      margin: "0 auto 1.5rem",
      lineHeight: "1.5",
      textShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    statsContainer: {
      display: "flex",
      justifyContent: "center",
      gap: "clamp(1.5rem, 5vw, 3rem)",
      margin: "1.5rem 0",
      flexWrap: "wrap",
    },
    statItem: {
      textAlign: "center",
      padding: "0.75rem 1rem",
      background: "rgba(99, 204, 197, 0.15)",
      borderRadius: "0.5rem",
      minWidth: "120px",
    },
    statNumber: {
      fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
      fontWeight: "700",
      color: "#64CCC5",
    },
    statLabel: {
      fontSize: "clamp(0.75rem, 1vw, 0.9rem)",
      color: "#B1EDE8",
    },
    featureList: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: "0.75rem",
      marginBottom: "1.5rem",
    },
    featureItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.5rem 1rem",
      borderRadius: "2rem",
      background: "rgba(255, 255, 255, 0.1)",
      fontSize: "clamp(0.8rem, 1.2vw, 0.95rem)",
      color: "#FFFFFF",
      flexShrink: 0,
    },
    featureIcon: {
      height: "1rem",
      width: "1rem",
      color: "#64CCC5",
    },
    subheading: {
      fontSize: "clamp(1rem, 2vw, 1.25rem)",
      color: "#B1EDE8",
      marginBottom: "1.5rem",
    },
    card: {
      background: "rgba(255, 255, 255, 0.9)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      boxShadow: "0 8px 32px 0 rgba(18, 34, 56, 0.2)",
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
      backgroundSize: "40px 40px",
    },
    button: {
      backgroundColor: "#132238",
      color: "#64CCC5",
      padding: "1rem 2rem",
      borderRadius: "2rem",
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
    backButton: {
      position: "absolute",
      left: "clamp(1rem, 5vw, 2rem)",
      top: "clamp(1rem, 3vw, 2rem)",
      display: "flex",
      alignItems: "center",
      gap: "clamp(0.25rem, 1vw, 0.5rem)",
      color: "#B1EDE8",
      cursor: "pointer",
      background: "none",
      border: "none",
      fontSize: "clamp(0.875rem, 3vw, 1rem)",
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
      color: "#64CCC5",
      textDecoration: "none",
      fontSize: "0.9rem",
    },
  };

  return (
    <main role="main" style={styles.container}>
      <section className="hero-section" style={styles.heroSection}>
        <button style={styles.backButton} onClick={() => navigate("/")}>
          <ArrowLeftIcon style={{ height: "clamp(1rem, 3vw, 1.25rem)" }} />
          Back to Home
        </button>
        <header style={styles.content}>
          <h1 style={styles.heading}>Welcome to Innerk Hub</h1>
          <p style={styles.tagline}>Your Gateway to Cutting-Edge Scientific Collaboration</p>
          <p style={styles.description}>
            Join a vibrant ecosystem of researchers and institutions pushing the boundaries of knowledge. 
            Innerk Hub empowers global scientific progress through secure collaboration, peer-reviewed excellence, 
            and AI-enhanced research management.
          </p>
          <section aria-label="Platform statistics" style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <article key={index} style={styles.statItem}>
                <div style={styles.statNumber}>{stat.number}</div>
                <div style={styles.statLabel}>{stat.label}</div>
              </article>
            ))}
          </section>
          <section aria-label="Key features" style={styles.featureList}>
            {features.map(({ icon: Icon, text }, index) => (
              <article key={index} style={styles.featureItem}>
                <Icon style={styles.featureIcon} />
                <span>{text}</span>
              </article>
            ))}
          </section>
          <p style={styles.subheading}>
            Secure authentication powered by Google Cloud. Choose your role to continue:
          </p>
        </header>
      </section>
      <section aria-label="Sign in options" style={styles.card} className="card">
        {["researcher", "reviewer", "admin"].map((role) => (
          <button
            key={role}
            className="neon-button"
            style={styles.button}
            onClick={() => handleSignIn(role)}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt=""
              aria-hidden="true"
              style={{ height: "1.5rem" }}
            />
            Continue as {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        ))}
      </section>
      <footer style={styles.footer} role="contentinfo">
        <nav style={styles.footerLinks} aria-label="Footer navigation">
          <a href="/privacy-policy" style={styles.footerLink}>Privacy Policy</a>
          <a href="/terms-of-service" style={styles.footerLink}>Terms of Service</a>
          <a href="/contact-us" style={styles.footerLink}>Contact Support</a>
        </nav>
        <p style={{ fontSize: "0.9rem", marginTop: "1rem" }}>
          ©2025 Innerk Hub · Advancing Scientific Collaboration
        </p>
      </footer>
    </main>
  );
}

export default SignInPage;