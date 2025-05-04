import React, { useState } from 'react';
import { useAuth } from '../pages/Reviewer/authContext';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

export default function ReviewerNavbar({ onRevoke }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Handle Logout
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("authToken");
    navigate("/signin");
  };

  // Toggle the sidebar menu visibility
  const toggleMenu = () => setMenuOpen(prev => !prev);

  // Close the menu
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* Top Navbar */}
      <nav 
        className="navbar fixed-top navbar-dark" 
        style={{ 
          backgroundColor: '#1A2E40', 
          padding: '1.25rem 1.5rem', 
          minHeight: '80px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)' 
        }}
      >
        <span className="navbar-brand fw-bold fs-4">Innerk Hub</span>
        <button 
          onClick={toggleMenu}
          aria-label="Toggle menu"
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '28px',
            cursor: 'pointer'
          }}
        >
          ☰
        </button>
      </nav>

      {/* Overlay to close menu */}
      {menuOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
          onClick={closeMenu}
        />
      )}

      {/* Sidebar Menu */}
      {menuOpen && (
        <div 
          className="position-fixed top-0 end-0 p-3 shadow-lg d-flex flex-column"
          style={{
            width: '260px',
            backgroundColor: '#2B3E50',
            height: '100vh',
            zIndex: 1051,
            overflowY: 'auto',
          }}
        >
          <div className="d-flex flex-column text-white">
            {/* Profile */}
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="Profile" 
                className="rounded-circle mb-3" 
                style={{ width: 60, height: 60 }}
              />
            ) : (
              <div className="rounded-circle mb-3" style={{ width: 60, height: 60, backgroundColor: '#ccc' }} />
            )}

            <h5 style={{ fontSize: '14px', paddingLeft: '10px', paddingBottom: '10px' }}>
              Hi, {currentUser?.displayName || 'User'}
            </h5>

            <hr className="w-100 text-light" />

            {/* Navigation Links */}
            <a href="/about" className="text-light mb-2 d-block" style={{ fontSize: '14px', paddingLeft: '10px' }}>About Us</a>
            <a href="/contact" className="text-light mb-2 d-block" style={{ fontSize: '14px', paddingLeft: '10px' }}>Contact Us</a>
            <a href="/terms" className="text-light mb-2 d-block" style={{ fontSize: '14px', paddingLeft: '10px' }}>Terms & Conditions</a>
          </div>

          {/* Bottom Links */}
          <div className="mt-auto text-white pt-3">
            {/* Revoke reviewer */}
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onRevoke(); closeMenu(); }}
              className="text-light d-block mb-2" 
              style={{ fontSize: '14px', paddingLeft: '10px', textDecoration: 'none' }}
            >
              Stop Being a Reviewer
            </a>
            
            {/* Logout */}
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); handleLogout(); closeMenu(); }}
              className="text-light d-block" 
              style={{ fontSize: '14px', paddingLeft: '10px', textDecoration: 'none' }}
            >
              Logout
            </a>
          </div>
        </div>
      )}
    </>
  );
}
