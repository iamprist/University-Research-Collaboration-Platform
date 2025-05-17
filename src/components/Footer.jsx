
import React, { useEffect } from "react";
const Footer = () => {
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
      backgroundSize: "40px 40px"
    },
    button: {
      backgroundColor: "#132238",
      color: "#FFFFFF",
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
    <footer className="footer-wrapper">
        <nav style={styles.footerLinks} aria-label="Footer navigation">
          <a href="/privacy-policy" style={styles.footerLink}>
            Privacy Policy
          </a>
          <a href="/terms" style={styles.footerLink}>
            Terms of Service
          </a>
        </nav>
        <p style={{ fontSize: "0.9rem", marginTop: "1rem" }}>
          ©2025 Innerk Hub · Empowering Researchers to Connect, Collaborate, and Innovate.
        </p>
    </footer>
  );
};

export default Footer;
