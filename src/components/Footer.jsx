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
      
      /* Added footer styles */
      .footer-wrapper {
        text-align: center;
        padding: 1rem;
        color: #132238;
        background: #FFFFFF;
        margin-top: 2rem;
      }
      .footer-wrapper a {
        margin: 0 1rem;
        color: #132238;
        text-decoration: none;
        transition: color 0.3s ease;
      }
      .footer-wrapper a:hover {
        color: #64CCC5;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const styles = {
    footerLinks: {
      display: "flex",
      justifyContent: "center",
      gap: "2rem",
      marginBottom: "1rem",
    },
  };

  return (
    <footer className="footer-wrapper">
      <nav style={styles.footerLinks} aria-label="Footer navigation">
        <a href="/privacy-policy">
          Privacy Policy
        </a>
        <a href="/terms">
          Terms of Service
        </a>
        <a href="/">
          ©2025 Innerk Hub · Empowering Researchers to Connect, Collaborate, and Innovate.
        </a>
      </nav>
    </footer>
  );
};

export default Footer;