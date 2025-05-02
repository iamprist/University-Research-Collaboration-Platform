// components/ReviewerNavbar.js
import React, { useState } from 'react';
import { useAuth } from '../pages/Reviewer/authContext';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

export default function ReviewerNavbar({ onRevoke }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("authToken");
    navigate("/signin");
  };

  const toggleMenu = () => setMenuOpen(prev => !prev);

  return (
    <>
      <nav className="navbar fixed-top navbar-dark" style={{ backgroundColor: '#1A2E40', padding: '0.75rem 1rem' }}>
        <span className="navbar-brand fw-bold">Innerk Hub</span>
        <button 
          className="btn btn-outline-light" 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </nav>

      {menuOpen && (
        <div 
          className="position-fixed top-0 end-0 p-3 shadow-lg"
          style={{
            width: '260px',
            backgroundColor: '#2B3E50',
            height: '100vh',
            zIndex: 1050,
            overflowY: 'auto',
          }}
        >
          <div className="d-flex flex-column align-items-start text-white">
            {currentUser?.photoURL && (
              <img 
                src={currentUser.photoURL} 
                alt="Profile" 
                className="rounded-circle mb-3" 
                style={{ width: 60, height: 60 }}
              />
            )}
            <h5>Hi, {currentUser?.displayName || 'User'}</h5>

            <hr className="w-100 text-light" />

            <button onClick={onRevoke} className="btn btn-sm btn-warning w-100 mb-2">
              Stop Being a Reviewer
            </button>
            <a href="/terms" className="text-light mb-2">Terms & Conditions</a>
            <a href="/about" className="text-light mb-2">About Us</a>
            <a href="/contact" className="text-light mb-2">Contact Us</a>
            <a href="/reviewer-status" className="text-light mb-2">Reviewer Status</a>

            <button onClick={handleLogout} className="btn btn-sm btn-danger w-100 mt-3">
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
