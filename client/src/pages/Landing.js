import React from 'react';
import './Landing.css'; 

import { Link } from 'react-router-dom'; 

function Landing() {
  return (
    <main className="landing-main">
      <section className="landing-card card p-4">
        <header>
          <h1 className="text-center mb-4" style={{ color: 'var(--primary-blue)' }}>Welcome to Innerk</h1>
        </header>
        
        <p className="text-center mb-4">
          Innerk is a platform to connect researchers and reviewers for academic collaboration.
        </p>

        <footer className="text-center">
          <Link to="/signup" className="btn" style={{ backgroundColor: 'var(--primary-blue)', color: '#fff364E68' }}>
            Sign Up
          </Link>
        </footer>
      </section>
    </main>
  );
}

export default Landing;
