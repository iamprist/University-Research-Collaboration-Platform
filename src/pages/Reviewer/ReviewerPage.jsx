import React, { useEffect, useState } from 'react';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebaseConfig';
import { useAuth } from './authContext';
import { useNavigate } from 'react-router-dom';
import { logEvent } from '../../utils/logEvent';
import { signOut } from 'firebase/auth';
import ReviewerRecommendations from '../../components/ReviewerRecommendations';
import ReviewerNavbar from '../../components/ReviewerNavbar';
import './ReviewerStyles.css'; // Import the custom styles

export default function ReviewerPage() {
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [expertiseTags, setExpertiseTags] = useState([]);

  useEffect(() => {
    const saveToken = async () => {
      if (currentUser) {
        const token = await currentUser.getIdToken();
        localStorage.setItem('authToken', token);
        await logEvent({
          userId: currentUser.uid,
          role: "Reviewer",
          userName: currentUser.displayName || "N/A",
          action: "Login",
          details: "User logged in",
        });
      }
    };

    if (currentUser) {
      saveToken();
    }
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;

    const fetchReviewerStatus = async () => {
      if (!currentUser) {
        navigate('/signin');
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/signin');
          return;
        }

        const docRef = doc(db, "reviewers", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (isMounted) {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setStatus(data.status || 'in_progress');
            setReason(data.rejectionReason || '');
            setExpertiseTags(data.expertiseTags || []);
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

    if (currentUser) {
      fetchReviewerStatus();
    }
    return () => { isMounted = false; };
  }, [currentUser, navigate]);

  const handleRevoke = async () => {
    if (!currentUser?.uid) return;
    try {
      const docRef = doc(db, "reviewers", currentUser.uid);
      await deleteDoc(docRef);
      setStatus('not_found');
    } catch (error) {
      console.error("Error revoking application:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("authToken");
      navigate("/signin");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  const statusStyles = {
    approved: {
      backgroundColor: '#D1FAE5',
      borderLeft: '4px solid #10B981',
      color: '#065F46'
    },
    inProgress: {
      backgroundColor: '#FEF3C7',
      borderLeft: '4px solid #F59E0B',
      color: '#92400E'
    },
    rejected: {
      backgroundColor: '#FECACA',
      borderLeft: '4px solid #EF4444',
      color: '#991B1B'
    }
  };

  return (
    <>
      <ReviewerNavbar onRevoke={handleRevoke} />
      <main 
        className="min-vh-100 d-flex flex-column p-4"
        style={{ backgroundColor: '#1A2E40' }}
        aria-label="Reviewer dashboard"
      >
        <header className="text-white mb-4" style={{ textAlign: 'left' }}>
          <h1 className="animated fadeIn">Reviewer Dashboard</h1>
          <p className="h5 mt-2">Hi {currentUser?.displayName || 'Reviewer'}</p>
        </header>

        {/* Description of being a reviewer */}
        <section className="my-4">
          <h2 className="text-white mb-3 animated slideInLeft">What does it mean to be a Reviewer?</h2>
          <p className="text-white lead animated typing-effect">
            As a reviewer, you'll play a crucial role in shaping the future of academic research. Your expertise and recommendations help researchers refine their work, ensuring quality and integrity in the research community.
          </p>
          <p className="text-white animated fadeInUp delay-1s">
            You'll have the opportunity to collaborate with leading experts, stay at the forefront of emerging trends, and have your voice heard in important academic discussions.
          </p>
        </section>

        {loading ? (
          <section className="text-center text-muted" aria-live="polite">
            <p className="mt-3">Retrieving your reviewer status...</p>
            <progress className="spinner-border text-primary" aria-busy="true"></progress>
          </section>
        ) : (
          <>
            {status === "approved" && (
              <section className="mt-4 w-100">
                <ReviewerRecommendations userId={currentUser.uid} />
              </section>
            )}

            {status === "in_progress" && (
              <section
                className="p-3 rounded mt-2"
                style={statusStyles.inProgress}
                aria-live="polite"
              >
                <p className="fw-medium mb-0"> Application Pending</p>
                <button 
                  className="btn btn-danger mt-3 animated bounceIn"
                  onClick={handleRevoke}
                  aria-label="Revoke application"
                >
                  Revoke Application
                </button>
              </section>
            )}

            {status === "rejected" && (
              <section
                className="p-3 rounded mt-2"
                style={statusStyles.rejected}
                aria-live="polite"
              >
                <p className="fw-medium mb-0">Application rejected.</p>
                <p className="small mt-2 mb-0">
                  Reason: {reason || "No reason provided."}
                </p>
                <button 
                  className="btn btn-danger mt-3 animated bounceIn"
                  onClick={handleRevoke}
                  aria-label="Remove rejected application"
                >
                  Remove Rejected Application
                </button>
              </section>
            )}

            {status === "not_found" && (
              <section className="mt-5">
                <button 
                  className="btn btn-warning apply-btn animated fadeInUp"
                  onClick={() => navigate('/reviewer-form')}
                  aria-label="Apply as a reviewer"
                >
                  Apply to Become a Reviewer
                </button>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
