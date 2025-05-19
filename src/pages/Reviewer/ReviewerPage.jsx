import React, { useEffect, useState } from 'react';
import { doc, getDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../config/firebaseConfig';
import { useAuth } from './authContext';
import { useNavigate } from 'react-router-dom';
import ReviewerRecommendations from '../../components/ReviewerRecommendations';
import axios from 'axios';

export default function ReviewerPage() {
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const [ipAddress, setIpAddress] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch IP address
  useEffect(() => {
    async function fetchIp() {
      try {
        const response = await axios.get('https://api.ipify.org?format=json');
        setIpAddress(response.data.ip);
      } catch (error) {
        console.error('Error fetching IP address:', error);
      }
    }
    fetchIp();
  }, []);

  // Log events to Firestore
  const logEvent = async ({ userId, role, userName, action, details, ip, target }) => {
    try {
      await addDoc(collection(db, 'logs'), {
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
      console.error('Error logging event:', error);
    }
  };

  // Save auth token
  useEffect(() => {
    async function saveToken() {
      if (currentUser) {
        const token = await currentUser.getIdToken();
        localStorage.setItem('authToken', token);
      }
    }
    saveToken();
  }, [currentUser]);

  // Fetch reviewer status
  useEffect(() => {
    let isMounted = true;
    async function fetchStatus() {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/signin');
          return;
        }
        if (!currentUser?.uid) return;
        const docRef = doc(db, 'reviewers', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (isMounted) {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setStatus(data.status || 'in_progress');
            setReason(data.rejectionReason || '');
          } else {
            setStatus('not_found');
          }
        }
      } catch (error) {
        console.error('Error fetching reviewer status:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchStatus();
    return () => { isMounted = false; };
  }, [currentUser, navigate]);

  // Log on tab close
  useEffect(() => {
    const handleTabClose = async () => {
      if (auth.currentUser) {
        await logEvent({
          userId: auth.currentUser.uid,
          role: 'Reviewer',
          userName: auth.currentUser.displayName || 'N/A',
          action: 'Logout',
          details: 'User closed the browser/tab',
        });
      }
    };
    window.addEventListener('beforeunload', handleTabClose);
    return () => window.removeEventListener('beforeunload', handleTabClose);
  }, []);

  // Revoke application
  const handleRevoke = async () => {
    try {
      if (!currentUser?.uid) throw new Error('User not authenticated');
      const docRef = doc(db, 'reviewers', currentUser.uid);
      await deleteDoc(docRef);
      setStatus('not_found');
    } catch (error) {
      console.error('Error revoking application:', error);
    }
  };

  // Logout user
  const handleLogout = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await logEvent({
          userId: user.uid,
          role: 'Reviewer',
          userName: user.displayName || 'N/A',
          action: 'Logout',
          details: 'User logged out',
          ip: ipAddress,
          target: 'Reviewer Dashboard',
        });
        await auth.signOut();
        navigate('/signin');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const toggleSidebar = () => setSidebarOpen(open => !open);

  // Styles for status badges
  const statusStyles = {
    approved: { backgroundColor: '#D1FAE5', borderLeft: '4px solid #10B981', color: '#065F46' },
    inProgress: { backgroundColor: '#FEF3C7', borderLeft: '4px solid #F59E0B', color: '#92400E' },
    rejected: { backgroundColor: '#FECACA', borderLeft: '4px solid #EF4444', color: '#991B1B' },
  };

  const renderStatusBadge = () => {
    switch (status) {
      case 'approved':
        return <p role="status" className="p-2 rounded" style={statusStyles.approved}>Approved Reviewer</p>;
      case 'in_progress':
        return <p role="status" className="p-2 rounded" style={statusStyles.inProgress}>Application Under Review</p>;
      case 'rejected':
        return <p role="status" className="p-2 rounded" style={statusStyles.rejected}>Application Rejected</p>;
      case 'not_found':
        return <p role="status" className="p-2 rounded text-muted">{currentUser?.displayName || 'Reviewer'}: You are not a reviewer. You can apply below.</p>;
      default:
        return null;
    }
  };

  return (
    <main
      style={{
        backgroundColor: '#FFFFFF',
        color: '#000000',
        minHeight: '100vh',
        paddingTop: '70px'  /* offset for fixed navbar */
      }}
    >
      <nav className="navbar navbar-light bg-light fixed-top px-4 py-3" style={{ borderBottom: '1px solid #000' }}>
        <h1 className="navbar-brand fw-bold fs-4 text-dark">Innerk Hub</h1>
        <button
          className="btn btn-outline-light p-0"
          onClick={toggleSidebar}
          aria-label="Toggle profile sidebar"
          style={{ borderRadius: '50%', width: '40px', height: '40px', overflow: 'hidden' }}>
          <img
            src={currentUser?.photoURL || 'https://via.placeholder.com/40?text=👤'}
            alt="Profile"
            className="rounded-circle"
            style={{ width: '40px', height: '40px', objectFit: 'cover', display: 'block' }} />
        </button>
      </nav>

      <aside
        className={`position-fixed top-0 end-0 h-100 bg-light shadow p-4 ${sidebarOpen ? 'd-block' : 'd-none'}`}
        style={{ width: '280px', zIndex: 1050 }}>
        <button className="btn-close float-end" onClick={toggleSidebar} aria-label="Close sidebar"></button>

        <figure className="text-center mb-4">
          <img
            src={currentUser?.photoURL || 'https://via.placeholder.com/70?text=👤'}
            alt="Profile"
            className="rounded-circle mb-2"
            style={{ width: '70px', height: '70px', objectFit: 'cover', border: '2px solid #ccc' }} />
          <figcaption>
            <h2 className="mb-0 mt-2 fs-6">{currentUser?.displayName || 'N/A'}</h2>
            <p className="text-muted fs-7">{currentUser?.email || 'N/A'}</p>
          </figcaption>
        </figure>

        <section className="mb-4">
          {renderStatusBadge()}
          {status === 'rejected' && reason && <p className="text-danger mt-1">Reason: {reason}</p>}
        </section>

        <hr />

        <nav aria-label="sidebar links">
          <ul className="list-unstyled mb-4">
            <li><a href="/about" className="text-decoration-none text-dark">About Us</a></li>
            <li><a href="/terms" className="text-decoration-none text-dark">Terms & Conditions</a></li>
          </ul>
        </nav>

        <section className="mt-auto">
          {status === 'approved' && (<button onClick={handleRevoke} className="btn btn-warning w-100 mb-2">Stop Being a Reviewer</button>)}
          {status !== 'approved' && status !== 'not_found' && (
            <button onClick={handleRevoke} className="btn btn-warning w-100 mb-2">
              {status === 'rejected' ? 'Remove Rejected Application' : 'Revoke Application'}
            </button>
          )}
          <button onClick={handleLogout} className="btn btn-danger w-100">Logout</button>
        </section>
      </aside>

      <section className="container pt-0 mt-5" style={{ backgroundColor: 'white', color: 'black' }}>
        <header className="text-center mb-4">
          <h2>Reviewer Dashboard</h2>
          <p>👋 Hi {currentUser?.displayName || 'Reviewer'}</p>
          <p>Welcome back! Ready to read, review, and recommend cutting-edge research?</p>
        </header>

        {loading
          ? (
            <section className="text-center text-muted">
              <p>Retrieving your reviewer status...</p>
              <div className="spinner-border text-dark" role="status" />
            </section>
          ) : (
            <section>
              {status === 'approved' && (<ReviewerRecommendations />)}

              {status === 'not_found' && (
                <section className="text-center mt-4">
                  <p className="text-muted mb-3">No reviewer profile found.</p>
                  <button className="btn btn-success" onClick={() => navigate('/reviewer-form')}>
                    Apply Now
                  </button>
                </section>
              )}

              {status === 'in_progress' && <p className="text-warning text-center mt-4">Your application is currently being reviewed.</p>}

              {status === 'rejected' && (
                <section className="text-danger text-center mt-4">
                  <p>Your application was rejected.</p>
                  <p>Reason: {reason || 'No reason provided.'}</p>
                </section>
              )}
            </section>
          )}
      </section>
    </main>
  );
}