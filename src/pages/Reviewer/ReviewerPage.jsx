import React, { useEffect, useState } from 'react';
import { doc, getDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../config/firebaseConfig';
import { useAuth } from './authContext';
import { useNavigate } from 'react-router-dom';
import TextSummariser from '../../components/TextSummariser';
import ReviewerRecommendations from '../../components/ReviewerRecommendations';
import axios from 'axios';

export default function ReviewerPage() {
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const [ipAddress, setIpAddress] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch IP
  useEffect(() => {
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

  useEffect(() => {
    const saveToken = async () => {
      if (currentUser) {
        const token = await currentUser.getIdToken();
        localStorage.setItem('authToken', token);
      }
    };
    saveToken();
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;

    const fetchReviewerStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/signin');
          return;
        }
        if (!currentUser?.uid) return;

        const docRef = doc(db, "reviewers", currentUser.uid);
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
        console.error("Error fetching reviewer status:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReviewerStatus();
    return () => { isMounted = false; };
  }, [currentUser, navigate]);

  useEffect(() => {
    const handleTabClose = async () => {
      if (auth.currentUser) {
        await logEvent({
          userId: auth.currentUser.uid,
          role: "Reviewer",
          userName: auth.currentUser.displayName || "N/A",
          action: "Logout",
          details: "User closed the browser/tab",
        });
      }
    };
    window.addEventListener("beforeunload", handleTabClose);
    return () => window.removeEventListener("beforeunload", handleTabClose);
  }, []);

  const handleRevoke = async () => {
    try {
      if (!currentUser?.uid) throw new Error('User not authenticated');
      const docRef = doc(db, "reviewers", currentUser.uid);
      await deleteDoc(docRef);
      setStatus('not_found');
    } catch (error) {
      console.error("Error revoking application:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await logEvent({
          userId: user.uid,
          role: "Reviewer",
          userName: user.displayName || "N/A",
          action: "Logout",
          details: "User logged out",
          ip: ipAddress,
          target: "Reviewer Dashboard",
        });
        await auth.signOut();
        navigate("/signin");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

const statusStyles = {
  approved: {
    backgroundColor: '#D1FAE5',
    borderLeft: '4px solid #10B981',
    color: '#065F46' // you can keep or change to '#000000'
  },
  inProgress: {
    backgroundColor: '#FEF3C7',
    borderLeft: '4px solid #F59E0B',
    color: '#92400E' // or '#000000'
  },
  rejected: {
    backgroundColor: '#FECACA',
    borderLeft: '4px solid #EF4444',
    color: '#991B1B' // or '#000000'
  }
};


  const renderStatusBadge = () => {
    switch (status) {
      case 'approved':
        return (
          <div className="p-2 rounded" style={statusStyles.approved}>
            Approved Reviewer
          </div>
        );
      case 'in_progress':
        return (
          <div className="p-2 rounded" style={statusStyles.inProgress}>
            Application Under Review
          </div>
        );
      case 'rejected':
        return (
          <div className="p-2 rounded" style={statusStyles.rejected}>
            Application Rejected
          </div>
        );
      case 'not_found':
        return (
          <div className="p-2 rounded text-muted">
            {currentUser?.displayName || 'Reviewer'} You are not a reviewer you can apply below.
          </div>
        );
      default:
        return null;
    }
  };

  return (
<div style={{ backgroundColor: '#FFFFFF', color: '#000000', minHeight: '100vh' }}>
      {/* Fixed Navbar */}
<nav className="navbar navbar-light bg-light fixed-top px-4 py-3" style={{ borderBottom: '1px solid #000' }}>
        <div className="d-flex align-items-center justify-content-between w-100">
<span className="navbar-brand fw-bold fs-4 text-dark">Innerk Hub</span>
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-outline-light p-0"
              onClick={toggleSidebar}
              aria-label="Toggle profile sidebar"
              style={{ borderRadius: '50%', width: '40px', height: '40px', overflow: 'hidden' }}
            >
              <img
                src={currentUser?.photoURL || 'https://via.placeholder.com/40?text=👤'}
                alt="Profile"
                className="rounded-circle"
                style={{ width: '40px', height: '40px', objectFit: 'cover', display: 'block' }}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
{/* Sidebar */}
<div
  className={`position-fixed top-0 end-0 h-100 bg-light shadow p-4 d-flex flex-column ${sidebarOpen ? 'd-block' : 'd-none'}`}
  style={{ width: '280px', zIndex: 1050 }}
>
  <button className="btn-close float-end" onClick={toggleSidebar} aria-label="Close sidebar"></button>

{/* Profile Info with Smaller Picture */}
<div className="text-center mb-4">
  <img
    src={currentUser?.photoURL || 'https://via.placeholder.com/70?text=👤'}
    alt="Profile"
    className="rounded-circle mb-2"
    style={{
      width: '70px',
      height: '70px',
      objectFit: 'cover',
      border: '2px solid #ccc'
    }}
  />
  <h6 className="mb-0 mt-2">{currentUser?.displayName || 'N/A'}</h6>
  <small className="text-muted">{currentUser?.email || 'N/A'}</small>
</div>


  {/* Reviewer Status */}
  <div className="mb-4">
    {renderStatusBadge()}
    {status === "rejected" && reason && (
      <small className="text-danger d-block mt-1">Reason: {reason}</small>
    )}
  </div>

  <hr />

<ul className="list-unstyled mb-4">
  <li><a href="/about" className="text-decoration-none text-dark">About Us</a></li>
  <li><a href="/terms" className="text-decoration-none text-dark">Terms & Conditions</a></li>
</ul>


  {/* Buttons fixed at bottom */}
  <div className="mt-auto">
    {status === "approved" && (
      <button onClick={handleRevoke} className="btn btn-warning w-100 mb-2">Stop Being a Reviewer</button>
    )}
    {(status !== "approved") && status !== "not_found" && (
      <button onClick={handleRevoke} className="btn btn-warning w-100 mb-2">
        {status === "rejected" ? "Remove Rejected Application" : "Revoke Application"}
      </button>
    )}
    <button onClick={handleLogout} className="btn btn-danger w-100">Logout</button>
  </div>
</div>


{/* Content below navbar */}
<div className="container pt-5 mt-5" style={{ backgroundColor: 'white', color: 'black' }}>
  <header className="text-center mb-4">
    <h1>Reviewer Dashboard</h1>
    <p>👋 Hi {currentUser?.displayName || 'Reviewer'}</p>
    <p>Welcome back! Ready to read, review, and recommend cutting-edge research?</p>
  </header>

  {loading ? (
    <div className="text-center text-muted">
      <p>Retrieving your reviewer status...</p>
      <div className="spinner-border text-dark" role="status" />
    </div>
  ) : (
    <div>
      {status === "approved" && (
        <>
          <TextSummariser />
          <ReviewerRecommendations />
        </>
      )}

      {status === "not_found" && (
        <div className="text-center mt-4">
          <p className="text-muted mb-3">No reviewer profile found.</p>
          <button className="btn btn-success" onClick={() => navigate('/reviewer-form')}>
            Apply Now
          </button>
        </div>
      )}

      {status === "in_progress" && (
        <div className="text-center text-warning mt-4">
          <p>Your application is currently being reviewed.</p>
        </div>
      )}

      {status === "rejected" && (
        <div className="text-center text-danger mt-4">
          <p>Your application was rejected.</p>
          <small>Reason: {reason || "No reason provided."}</small>
        </div>
      )}
    </div>
  )}
</div>

    </div>
  );
}