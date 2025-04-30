import React, { useEffect, useState } from 'react';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebaseConfig';
import { useAuth } from './authContext';
import { useNavigate } from 'react-router-dom';
import { logEvent } from '../../utils/logEvent';
import { signOut } from 'firebase/auth';
import ReviewerRecommendations from '../../components/ReviewerRecommendations'; // Import the component

export default function ReviewerPage() {
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const saveToken = async () => {
      if (currentUser) {
        const token = await currentUser.getIdToken();
        localStorage.setItem('authToken', token);

        // Log the login event
        await logEvent({
          userId: currentUser.uid,
          role: "Reviewer",
          userName: currentUser.displayName || "N/A",
          action: "Login",
          details: "User logged in",
        });
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
          navigate('/signin'); // Redirect to sign-in if no token is found
          return;
        }

        if (!currentUser?.uid) {
          return; // Wait until currentUser is available
        }

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
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReviewerStatus();

    return () => {
      isMounted = false;
    };
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
      if (!currentUser?.uid) {
        throw new Error('User not authenticated');
      }

      const docRef = doc(db, "reviewers", currentUser.uid);
      await deleteDoc(docRef);

      setStatus('not_found');
    } catch (error) {
      console.error("Error revoking application:", error);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Attempting to log out...");

      // Log the logout event before signing out
      if (currentUser?.uid) {
        const userName = currentUser.displayName || "N/A"; // Resolve userName
        await logEvent({
          userId: currentUser.uid,
          role: "Reviewer",
          userName: userName,
          action: "Logout",
          details: "User logged out",
        });
        console.log("Logout event recorded.");
      } else {
        console.warn("No userId found to log the event.");
      }

      // Perform logout
      await signOut(auth);
      localStorage.removeItem("authToken");
      console.log("User signed out successfully.");
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
    <main 
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-4"
      style={{ backgroundColor: '#1A2E40' }}
      aria-label="Reviewer dashboard"
    >
      <header className="text-center text-white mb-4">
        <h1>Reviewer Dashboard</h1>
        <p className="lead">Manage and track your reviewer application status.</p>
      </header>

      {loading ? (
        <section className="text-center text-muted" aria-live="polite">
          <p className="mt-3">Retrieving your reviewer status...</p>
          <progress className="spinner-border text-primary" aria-busy="true"></progress>
        </section>
      ) : (
        <article 
          className="card w-100 text-white"
          style={{ 
            maxWidth: '600px', 
            backgroundColor: '#2B3E50',
            border: 'none',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}
          aria-labelledby="reviewerStatusHeading"
        >
          <section className="card-body">
            <h2 className="fs-5 mb-3" id="reviewerStatusHeading">Reviewer Status</h2>

            {status === "approved" && (
              <>
                <section 
                  className="p-3 rounded mt-2"
                  style={statusStyles.approved}
                  aria-live="polite"
                >
                  <p className="fw-medium mb-0">✅ You are an approved reviewer.</p>
                  <button 
                    className="btn btn-danger mt-3" 
                    onClick={handleRevoke}
                    aria-label="Stop being a reviewer"
                  >
                    Stop Being a Reviewer
                  </button>
                </section>

                {/* Render ReviewerRecommendations for approved reviewers */}
              <section className="mt-4 w-100">
                <ReviewerRecommendations userId={currentUser.uid} />
              </section>
              </>
            )}

            {status === "in_progress" && (
              <section
                className="p-3 rounded mt-2"
                style={statusStyles.inProgress}
                aria-live="polite"
              >
                <p className="fw-medium mb-0">🕐 Your application is being reviewed.</p>
                <button 
                  className="btn btn-danger mt-3" 
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
                <p className="fw-medium mb-0">❌ Application rejected.</p>
                <p className="small mt-2 mb-0">
                  Reason: {reason || "No reason provided."}
                </p>
                <button 
                  className="btn btn-danger mt-3" 
                  onClick={handleRevoke}
                  aria-label="Remove rejected application"
                >
                  Remove Rejected Application
                </button>
              </section>
            )}

            {status === "not_found" && (
              <section className="text-center mt-4" aria-live="polite">
                <p className="text-muted mb-3">No reviewer profile found.</p>
                <button 
                  className="btn btn-success" 
                  onClick={() => navigate('/reviewer-form')} // Navigate to ReviewerForm
                  aria-label="Apply as a reviewer"
                >
                  Apply Now
                </button>
              </section>
            )}
          </section>

          {/* Logout Button */}
          <footer className="card-footer text-center">
            <button
              className="btn btn-danger"
              onClick={handleLogout}
              aria-label="Logout"
            >
              Logout
            </button>
          </footer>
        </article>
      )}
    </main>
  );
}
