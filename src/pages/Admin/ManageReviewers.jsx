import React, { useEffect, useState } from "react";
import { db } from "../../config/firebaseConfig";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

export default function ManageReviewers() {
  const [reviewers, setReviewers] = useState([]);
  const [currentReviewers, setCurrentReviewers] = useState([]);
  const [revokedReviewers, setRevokedReviewers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pendingPage, setPendingPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [revokedPage, setRevokedPage] = useState(1);
  const itemsPerPage = 10;

  const fetchReviewers = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "reviewers"),
        where("status", "==", "in_progress")
      );
      const snap = await getDocs(q);
      const reviewerList = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReviewers(reviewerList);
    } catch (error) {
      console.error("Error fetching reviewers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentReviewers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const reviewerList = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.role?.toLowerCase() === "reviewer");
      setCurrentReviewers(reviewerList);
    } catch (error) {
      console.error("Error fetching current reviewers:", error);
    }
  };

  const fetchRevokedReviewers = async () => {
    try {
      // Fetch users with role "revoked"
      const usersQuery = query(collection(db, "users"), where("role", "==", "revoked"));
      const usersSnap = await getDocs(usersQuery);
      const revokedUsers = usersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch reviewers with status "rejected"
      const reviewersQuery = query(collection(db, "reviewers"), where("status", "==", "rejected"));
      const reviewersSnap = await getDocs(reviewersQuery);
      const rejectedReviewers = reviewersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Combine both results
      const combinedRevokedList = [...revokedUsers, ...rejectedReviewers];
      setRevokedReviewers(combinedRevokedList);
    } catch (error) {
      console.error("Error fetching revoked reviewers:", error);
    }
  };

  const handleApprove = async (id) => {
    try {
      const reviewerDoc = doc(db, "reviewers", id);
      await updateDoc(reviewerDoc, { status: "approved" });
      setReviewers((prev) => prev.filter((reviewer) => reviewer.id !== id));
      fetchCurrentReviewers();
    } catch (error) {
      console.error("Error approving reviewer:", error);
    }
  };

  const handleReject = async (id) => {
    try {
      const reviewerDoc = doc(db, "reviewers", id);
      await updateDoc(reviewerDoc, { status: "rejected" });
      setReviewers((prev) => prev.filter((reviewer) => reviewer.id !== id));
      fetchRevokedReviewers();
    } catch (error) {
      console.error("Error rejecting reviewer:", error);
    }
  };

  const handleRevoke = async (id) => {
    try {
      const userDoc = doc(db, "users", id);
      await updateDoc(userDoc, { role: "revoked" });
      setCurrentReviewers((prev) => prev.filter((reviewer) => reviewer.id !== id));
    } catch (error) {
      console.error("Error revoking reviewer:", error);
    }
  };

  const handleDeleteReviewer = async (id) => {
    try {
      console.log(`Deleting reviewer with ID: ${id}`); // Debugging
      await deleteDoc(doc(db, "reviewers", id)); // Delete the reviewer from Firestore
      setRevokedReviewers((prev) => prev.filter((reviewer) => reviewer.id !== id)); // Remove from the UI
      console.log(`Reviewer with ID ${id} deleted successfully.`);
    } catch (error) {
      console.error("Error deleting reviewer:", error);
    }
  };

  useEffect(() => {
    fetchReviewers();
    fetchCurrentReviewers();
    fetchRevokedReviewers();
  }, []);

  const paginate = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  const sectionStyle = {
    minHeight: "100vh",
    background: "#1a2e40",
    color: "white",
    padding: "2rem 0",
  };

  const articleStyle = {
    maxWidth: "960px",
    margin: "2rem auto",
    padding: "1.5rem",
    backgroundColor: "#1a2e40", // Match the sidebar background color
    borderRadius: "0.5rem",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)", // Subtle shadow for depth
  };

  const titleStyle = {
    fontSize: "2rem",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "1.5rem",
  };

  const paragraphStyle = {
    textAlign: "center",
    marginBottom: "1.5rem",
    color: "#cbd5e0",
  };

  const cardStyle = {
    backgroundColor: "#243447", // Slightly lighter shade for cards
    padding: "1rem",
    borderRadius: "0.5rem",
    marginBottom: "1rem",
    color: "#FFFFFF",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  };

  const buttonStyle = {
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    marginRight: "0.5rem",
  };

  const paginationStyle = {
    display: "flex",
    justifyContent: "center",
    marginTop: "1rem",
  };

  const paginationButtonStyle = (active) => ({
    padding: "0.5rem 1rem",
    margin: "0 0.25rem",
    borderRadius: "0.25rem",
    backgroundColor: active ? "#4299e1" : "#4a5568",
    color: active ? "#fff" : "#cbd5e0",
    border: "none",
    cursor: "pointer",
  });

  return (
    <section style={sectionStyle}>
      {/* Pending Applications */}
      <article style={articleStyle}>
        <h2 style={titleStyle}>Reviewer Applications</h2>
        <p style={paragraphStyle}>
          Below is the list of all pending reviewer applications:
        </p>
        {loading ? (
          <p style={{ textAlign: "center", color: "#a0aec0" }}>Loading applications...</p>
        ) : reviewers.length === 0 ? (
          <p style={{ textAlign: "center", color: "#a0aec0" }}>No pending applications.</p>
        ) : (
          paginate(reviewers, pendingPage).map((reviewer) => (
            <article key={reviewer.id} style={cardStyle}>
              <h3 style={{ color: "#64CCC5", marginBottom: "0.5rem" }}>{reviewer.name || "N/A"}</h3>
              <p><strong>Email:</strong> {reviewer.email || "N/A"}</p>
              <p><strong>Institution:</strong> {reviewer.institution || "N/A"}</p>
              <p><strong>Expertise:</strong> {Array.isArray(reviewer.expertiseTags) ? reviewer.expertiseTags.join(", ") : "N/A"}</p>
              <button
                onClick={() => handleApprove(reviewer.id)}
                style={{ ...buttonStyle, backgroundColor: "#64CCC5", color: "#132238" }}
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(reviewer.id)}
                style={{ ...buttonStyle, backgroundColor: "#FF6B6B", color: "#ffffff" }}
              >
                Reject
              </button>
            </article>
          ))
        )}
        <div style={paginationStyle}>
          {Array.from({ length: Math.ceil(reviewers.length / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => setPendingPage(i + 1)}
              style={paginationButtonStyle(pendingPage === i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </article>

      {/* Current Reviewers */}
      <article style={articleStyle}>
        <h2 style={titleStyle}>Current Reviewers</h2>
        {currentReviewers.length === 0 ? (
          <p style={{ textAlign: "center", color: "#a0aec0" }}>No current reviewers.</p>
        ) : (
          paginate(currentReviewers, currentPage).map((reviewer) => (
            <article key={reviewer.id} style={cardStyle}>
              <h3 style={{ color: "#64CCC5", marginBottom: "0.5rem" }}>{reviewer.name || "N/A"}</h3>
              <p><strong>Email:</strong> {reviewer.email || "N/A"}</p>
              <button
                onClick={() => handleRevoke(reviewer.id)}
                style={{ ...buttonStyle, backgroundColor: "#FF6B6B", color: "#ffffff", marginTop: "0.5rem" }}
              >
                Revoke
              </button>
            </article>
          ))
        )}
        <div style={paginationStyle}>
          {Array.from({ length: Math.ceil(currentReviewers.length / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              style={paginationButtonStyle(currentPage === i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </article>

      {/* Revoked Reviewers */}
      <article style={articleStyle}>
        <h2 style={titleStyle}>Revoked or Rejected Reviewers</h2>
        <p style={paragraphStyle}>
          Below is the list of all reviewers who have been revoked or rejected:
        </p>
        {revokedReviewers.length === 0 ? (
          <p style={{ textAlign: "center", color: "#a0aec0" }}>No revoked reviewers found.</p>
        ) : (
          paginate(revokedReviewers, revokedPage).map((reviewer) => (
            <article key={reviewer.id} style={cardStyle}>
              <h3 style={{ color: "#64CCC5", marginBottom: "0.5rem" }}>{reviewer.name || "N/A"}</h3>
              <p><strong>Email:</strong> {reviewer.email || "N/A"}</p>
              <button
                onClick={() => handleDeleteReviewer(reviewer.id)}
                style={{ ...buttonStyle, backgroundColor: "#FF6B6B", color: "#ffffff", marginTop: "0.5rem" }}
              >
                Delete
              </button>
            </article>
          ))
        )}
        <div style={paginationStyle}>
          {Array.from({ length: Math.ceil(revokedReviewers.length / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => setRevokedPage(i + 1)}
              style={paginationButtonStyle(revokedPage === i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}
