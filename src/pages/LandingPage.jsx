import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BeakerIcon, UserGroupIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const LandingPage = () => {
  const navigate = useNavigate();
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#FFFCF9',
      fontFamily: 'Inter, sans-serif',
    },
    heroSection: {
      background: 'linear-gradient(135deg, #132238 0%, #364E68 100%)',
      padding: '4rem 2rem',
      color: '#FFFFFF',
      textAlign: 'center',
      position: 'relative',
    },
    content: {
      position: 'relative',
    },
    heading: {
      fontSize: '3.5rem',
      fontWeight: '700',
      marginBottom: '1.5rem',
      lineHeight: '1.2',
    },
    tagline: {
      fontSize: '1.5rem',
      color: '#B1EDE8',
      marginBottom: '2.5rem',
      maxWidth: '800px',
      margin: '0 auto',
    },
    ctaButton: {
      backgroundColor: '#64CCC5',
      color: '#132238',
      padding: '1rem 2.5rem',
      borderRadius: '2rem',
      border: 'none',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    featuresSection: {
      padding: '4rem 2rem',
      backgroundColor: '#FFFFFF',
    },
    featureCard: {
      backgroundColor: '#FFFCF9',
      borderRadius: '1rem',
      padding: '2rem',
      boxShadow: '0 4px 6px rgba(18, 34, 56, 0.1)',
    },
    sectionHeading: {
      color: '#132238',
      fontSize: '2.5rem',
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: '3rem',
    },
    footer: {
      backgroundColor: '#364E68',
      color: '#B1EDE8',
      padding: '2rem',
      marginTop: 'auto',
    },
  };

  return (
    <section style={styles.container}>
      <section style={styles.heroSection}>
        <section style={styles.content}>
          <h1 style={styles.heading}>Collaborate. Innovate. Publish.</h1>
          <p style={styles.tagline}>
            Join a global network of researchers and institutions to accelerate scientific discovery
          </p>
          <button
            style={styles.ctaButton}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#B1EDE8';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#64CCC5';
              e.target.style.transform = 'translateY(0)';
            }}
            onClick={() => navigate('/signin')}
          >
            Start Your Journey
          </button>
        </section>
      </section>
      <section style={styles.featuresSection}>
        <h2 style={styles.sectionHeading}>Why Choose Innerk Hub?</h2>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <section style={styles.featureCard}>
            <BeakerIcon style={{ height: '3rem', color: '#64CCC5' }} />
            <h3 style={{ color: '#132238', fontSize: '1.5rem', margin: '1rem 0' }}>
              Interdisciplinary Collaboration
            </h3>
            <p style={{ color: '#747C92' }}>
              Connect with researchers across multiple disciplines and institutions
            </p>
          </section>
          <section style={styles.featureCard}>
            <UserGroupIcon style={{ height: '3rem', color: '#64CCC5' }} />
            <h3 style={{ color: '#132238', fontSize: '1.5rem', margin: '1rem 0' }}>
              Secure Workspaces
            </h3>
            <p style={{ color: '#747C92' }}>
              Private project spaces with version control and real-time collaboration
            </p>
          </section>
          <section style={styles.featureCard}>
            <DocumentTextIcon style={{ height: '3rem', color: '#64CCC5' }} />
            <h3 style={{ color: '#132238', fontSize: '1.5rem', margin: '1rem 0' }}>
              Publication Pipeline
            </h3>
            <p style={{ color: '#747C92' }}>
              Integrated tools for peer review and journal submissions
            </p>
          </section>
        </section>
      </section>
      <footer style={styles.footer}>
        <section
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            maxWidth: '1200px',
            margin: '0 auto',
            flexWrap: 'wrap',
            gap: '2rem',
          }}
        >
          <section>
            <h4 style={{ color: '#B1EDE8', marginBottom: '1rem' }}>Innerk Hub</h4>
            <p style={{ fontSize: '0.9rem' }}>Advancing research through global collaboration</p>
          </section>
          <nav style={{ display: 'flex', gap: '2rem' }}>
            <section>
              <h4 style={{ color: '#B1EDE8', marginBottom: '1rem' }}>Resources</h4>
              <a href="#privacy" style={{ color: '#64CCC5', textDecoration: 'none' }}>
                Privacy Policy
              </a>
              <br />
              <a href="#terms" style={{ color: '#64CCC5', textDecoration: 'none' }}>
                Terms of Service
              </a>
            </section>
            <section>
              <h4 style={{ color: '#B1EDE8', marginBottom: '1rem' }}>Contact</h4>
              <a href="#contact" style={{ color: '#64CCC5', textDecoration: 'none' }}>
                Support
              </a>
              <br />
              <a href="#partners" style={{ color: '#64CCC5', textDecoration: 'none' }}>
                Partnerships
              </a>
            </section>
          </nav>
        </section>
        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
          ©2025 Innerk Hub · Advancing Scientific Collaboration
        </p>
      </footer>
    </section>
  );
};

export default LandingPage;