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

// Main component for managing reviewer accounts and applications
export default function ManageReviewers() {
  // State for pending, current, and revoked reviewers
  const [reviewers, setReviewers] = useState([]);
  const [currentReviewers, setCurrentReviewers] = useState([]);
  const [revokedReviewers, setRevokedReviewers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state for each section
  const [pendingPage, setPendingPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [revokedPage, setRevokedPage] = useState(1);
  const itemsPerPage = 10;

  // Search state for each section
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const [revokedSearchTerm, setRevokedSearchTerm] = useState("");

  // Modal state for revoking and rejecting reviewers
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokingReviewerId, setRevokingReviewerId] = useState(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingReviewerId, setRejectingReviewerId] = useState(null);

  // Fetch all pending reviewer applications
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

  // Fetch all currently approved reviewers
  const fetchCurrentReviewers = async () => {
    try {
      const reviewersQuery = query(
        collection(db, "reviewers"),
        where("status", "==", "approved")
      );
      const querySnapshot = await getDocs(reviewersQuery);
      const reviewerList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCurrentReviewers(reviewerList);
    } catch (error) {
      console.error("Error fetching current reviewers:", error);
    }
  };

  // Fetch all revoked or rejected reviewers
  const fetchRevokedReviewers = async () => {
    try {
      // Fetch reviewers with status "rejected" or "revoked"
      const rejectedQuery = query(collection(db, "reviewers"), where("status", "==", "rejected"));
      const revokedQuery = query(collection(db, "reviewers"), where("status", "==", "revoked"));

      const [rejectedSnap, revokedSnap] = await Promise.all([
        getDocs(rejectedQuery),
        getDocs(revokedQuery),
      ]);

      const rejectedReviewers = rejectedSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const revokedReviewers = revokedSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Combine both results for display
      const combinedRevokedList = [...rejectedReviewers, ...revokedReviewers];
      setRevokedReviewers(combinedRevokedList);
    } catch (error) {
      console.error("Error fetching revoked/rejected reviewers:", error);
    }
  };

  // Approve a reviewer application
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

  // Open reject modal for a reviewer
  const handleReject = (id) => {
    setRejectingReviewerId(id);
    setRejectReason("");
    setShowRejectModal(true);
  };

  // Confirm rejection with reason and update Firestore
  const confirmReject = async () => {
    if (!rejectingReviewerId || !rejectReason.trim()) return;
    try {
      const reviewerDoc = doc(db, "reviewers", rejectingReviewerId);
      await updateDoc(reviewerDoc, {
        status: "rejected",
        reason: rejectReason.trim(),
      });
      setReviewers((prev) => prev.filter((reviewer) => reviewer.id !== rejectingReviewerId));
      fetchRevokedReviewers();
    } catch (error) {
      console.error("Error rejecting reviewer:", error);
    } finally {
      setShowRejectModal(false);
      setRejectReason("");
      setRejectingReviewerId(null);
    }
  };

  // Open revoke modal for a reviewer
  const handleRevoke = (id) => {
    setRevokingReviewerId(id);
    setRevokeReason("");
    setShowRevokeModal(true);
  };

  // Confirm revoke with reason and update Firestore
  const confirmRevoke = async () => {
    if (!revokingReviewerId || !revokeReason.trim()) return;
    try {
      const reviewerDoc = doc(db, "reviewers", revokingReviewerId);
      await updateDoc(reviewerDoc, {
        status: "revoked",
        reason: revokeReason.trim(),
      });
      setCurrentReviewers((prev) =>
        prev.filter((reviewer) => reviewer.id !== revokingReviewerId)
      );
      fetchRevokedReviewers();
    } catch (error) {
      console.error("Error revoking reviewer:", error);
    } finally {
      setShowRevokeModal(false);
      setRevokeReason("");
      setRevokingReviewerId(null);
    }
  };

  // Delete a revoked/rejected reviewer from Firestore
  const handleDeleteReviewer = async (id) => {
    try {
      await deleteDoc(doc(db, "reviewers", id));
      setRevokedReviewers((prev) => prev.filter((reviewer) => reviewer.id !== id));
    } catch (error) {
      console.error("Error deleting reviewer:", error);
    }
  };

  // Fetch all reviewer data on mount
  useEffect(() => {
    fetchReviewers();
    fetchCurrentReviewers();
    fetchRevokedReviewers();
  }, []);

  // Helper for paginating lists
  const paginate = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  // Filtered lists for search functionality
  const filteredReviewers = reviewers.filter((reviewer) =>
    (reviewer.name || "")
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase())
  );
  const filteredCurrentReviewers = currentReviewers.filter((reviewer) =>
    (reviewer.name || "")
      .toLowerCase()
      .includes(currentSearchTerm.trim().toLowerCase())
  );
  const filteredRevokedReviewers = revokedReviewers.filter((reviewer) =>
    (reviewer.name || "")
      .toLowerCase()
      .includes(revokedSearchTerm.trim().toLowerCase())
  );

  // Consistent styles with ManageAdmins and ManageResearchers
  const styles = {
    container: {
      minHeight: "100vh",
      background: "#1a2e40",
      color: "white",
      padding: "2rem 0",
    },
    article: {
      maxWidth: "960px",
      margin: "2rem auto",
      padding: "1.5rem",
      backgroundColor: "#1a2e40",
      borderRadius: "0.5rem",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
    },
    heading: {
      fontSize: "2rem",
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: "1.5rem",
    },
    description: {
      textAlign: "center",
      color: "#cbd5e0",
      marginBottom: "1.5rem",
    },
    searchInput: {
      width: "100%",
      maxWidth: "350px",
      margin: "0 auto 1.2rem auto",
      display: "block",
      padding: "0.5rem 1rem",
      borderRadius: "0.4rem",
      border: "1px solid #4a5568",
      background: "#243447",
      color: "#fff",
      fontSize: "1rem",
      outline: "none",
    },
    card: {
      backgroundColor: "#243447",
      padding: "1rem",
      borderRadius: "0.5rem",
      marginBottom: "1rem",
      color: "#FFFFFF",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
    cardName: {
      color: "#64CCC5",
      marginBottom: "0.5rem",
      fontWeight: "bold",
      fontSize: "1.1rem",
    },
    cardEmail: {
      color: "#A0AEC0",
      fontSize: "0.95rem",
      margin: 0,
    },
    button: {
      padding: "0.5rem 1rem",
      border: "none",
      borderRadius: "0.5rem",
      cursor: "pointer",
      fontWeight: "bold",
      fontSize: "1rem",
      marginRight: "0.5rem",
      marginTop: "0.5rem",
    },
    approveButton: {
      backgroundColor: "#64CCC5",
      color: "#132238",
    },
    rejectButton: {
      backgroundColor: "#FF6B6B",
      color: "#fff",
    },
    revokeButton: {
      backgroundColor: "#FF6B6B",
      color: "#fff",
    },
    deleteButton: {
      backgroundColor: "#E53E3E",
      color: "#fff",
    },
    pagination: {
      display: "flex",
      justifyContent: "center",
      marginTop: "1rem",
      gap: "0.5rem",
    },
    paginationBtn: (active) => ({
      padding: "0.5rem 1rem",
      margin: "0 0.25rem",
      borderRadius: "0.25rem",
      backgroundColor: active ? "#4299e1" : "#4a5568",
      color: active ? "#fff" : "#cbd5e0",
      border: "none",
      cursor: "pointer",
    }),
  };

  return (
    <section style={styles.container}>
      {/* Pending Applications Section */}
      <article style={styles.article}>
        <h2 style={styles.heading}>Reviewer Applications</h2>
        <p style={styles.description}>
          Below is the list of all pending reviewer applications:
        </p>
        {/* Search input for pending reviewers */}
        <input
          type="text"
          placeholder="Search by reviewer name..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setPendingPage(1);
          }}
        />
        {/* List of pending reviewers */}
        {loading ? (
          <p style={{ textAlign: "center", color: "#a0aec0" }}>Loading applications...</p>
        ) : filteredReviewers.length === 0 ? (
          <p style={{ textAlign: "center", color: "#a0aec0" }}>No pending applications.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {paginate(filteredReviewers, pendingPage).map((reviewers) => (
              <li key={reviewers.id} style={{ marginBottom: "1rem" }}>
                <article style={styles.card}>
                  <header>
                    <div style={styles.cardName}>{reviewers.name || "N/A"}</div>
                  </header>
                  <p style={styles.cardEmail}><strong>Email:</strong> {reviewers.email || "N/A"}</p>
                  <p style={styles.cardEmail}><strong>Institution:</strong> {reviewers.institution || "N/A"}</p>
                  <p style={styles.cardEmail}><strong>Expertise:</strong> {Array.isArray(reviewers.expertiseTags) ? reviewers.expertiseTags.join(", ") : "N/A"}</p>
                  <p style={styles.cardEmail}><strong>Years Experience:</strong> {reviewers.yearsExperience || "N/A"}</p>
                  {/* Publications and CV links */}
                  {reviewers.publications && reviewers.publications.length > 0 && (
                    <section style={styles.cardEmail}>
                      <strong>Publications:</strong>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {reviewers.publications.map((pub, idx) => (
                          <li key={idx}>
                            <a
                              href={pub}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#64CCC5", textDecoration: "underline" }}
                            >
                              View Publications
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {reviewers.cvUrl && (
                    <p style={styles.cardEmail}>
                      <strong>CV:</strong>{" "}
                      <a
                        href={reviewers.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#64CCC5", textDecoration: "underline" }}
                      >
                        View CV
                      </a>
                    </p>
                  )}
                  <p style={styles.cardEmail}><strong>Applied:</strong> {reviewers.createdAt ? new Date(reviewers.createdAt.seconds ? reviewers.createdAt.seconds * 1000 : reviewers.createdAt).toLocaleDateString() : "N/A"}</p>
                  {/* Approve and Reject buttons */}
                  <button
                    onClick={() => handleApprove(reviewers.id)}
                    style={{ ...styles.button, ...styles.approveButton }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(reviewers.id)}
                    style={{ ...styles.button, ...styles.rejectButton }}
                  >
                    Reject
                  </button>
                </article>
              </li>
            ))}
          </ul>
        )}
        {/* Pagination for pending reviewers */}
        <nav style={styles.pagination} aria-label="Pending reviewer pagination">
          {Array.from({ length: Math.ceil(filteredReviewers.length / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => setPendingPage(i + 1)}
              style={styles.paginationBtn(pendingPage === i + 1)}
              aria-current={pendingPage === i + 1 ? "page" : undefined}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      </article>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <dialog open style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <form
            style={{
              background: "#243447",
              padding: "2rem",
              borderRadius: "0.5rem",
              minWidth: 320,
              maxWidth: "90vw",
              boxShadow: "0 4px 24px rgba(0,0,0,0.3)"
            }}
            onSubmit={e => {
              e.preventDefault();
              confirmReject();
            }}
          >
            <h3 style={{ marginBottom: "1rem", color: "#fff" }}>Reject Reviewer</h3>
            <label htmlFor="reject-reason" style={{ color: "#64CCC5", fontWeight: 600, display: "block", marginBottom: 8 }}>
              Please provide a reason for rejection:
            </label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                borderRadius: "0.4rem",
                border: "1.5px solid #64CCC5",
                background: "#132238",
                color: "#fff",
                padding: "0.7rem",
                marginBottom: "1.2rem",
                fontSize: "1rem",
                resize: "vertical"
              }}
              placeholder="Enter reason..."
            />
            {/* Modal action buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setRejectingReviewerId(null);
                }}
                style={{
                  background: "#4a5568",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 1.2rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!rejectReason.trim()}
                style={{
                  background: "#FF6B6B",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 1.2rem",
                  fontWeight: 600,
                  cursor: rejectReason.trim() ? "pointer" : "not-allowed",
                  opacity: rejectReason.trim() ? 1 : 0.7
                }}
              >
                Confirm Reject
              </button>
            </div>
          </form>
        </dialog>
      )}

      {/* Current Reviewers Section */}
      <article style={styles.article}>
        <h2 style={styles.heading}>Current Reviewers</h2>
        {/* Search input for current reviewers */}
        <input
          type="text"
          placeholder="Search by reviewer name..."
          style={styles.searchInput}
          value={currentSearchTerm}
          onChange={e => {
            setCurrentSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        {/* List of current reviewers */}
        {filteredCurrentReviewers.length === 0 ? (
          <p style={{ textAlign: "center", color: "#a0aec0" }}>No current reviewers.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {paginate(filteredCurrentReviewers, currentPage).map((reviewer) => (
              <li key={reviewer.id} style={{ marginBottom: "1rem" }}>
                <article style={styles.card}>
                  <header>
                    <div style={styles.cardName}>{reviewer.name || "N/A"}</div>
                  </header>
                  <p style={styles.cardEmail}><strong>Email:</strong> {reviewer.email || "N/A"}</p>
                  <p style={styles.cardEmail}><strong>Institution:</strong> {reviewer.institution || "N/A"}</p>
                  <p style={styles.cardEmail}><strong>Expertise:</strong> {Array.isArray(reviewer.expertiseTags) ? reviewer.expertiseTags.join(", ") : "N/A"}</p>
                  <p style={styles.cardEmail}><strong>Years Experience:</strong> {reviewer.yearsExperience || "N/A"}</p>
                  {/* Publications and CV links */}
                  {reviewer.publications && reviewer.publications.length > 0 && (
                    <section style={styles.cardEmail}>
                      <strong>Publications:</strong>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {reviewer.publications.map((pub, idx) => (
                          <li key={idx}>
                            <a
                              href={pub}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#64CCC5", textDecoration: "underline" }}
                            >
                              View Publications
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {reviewer.cvUrl && (
                    <p style={styles.cardEmail}>
                      <strong>CV:</strong>{" "}
                      <a
                        href={reviewer.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#64CCC5", textDecoration: "underline" }}
                      >
                        View CV
                      </a>
                    </p>
                  )}
                  <p style={styles.cardEmail}><strong>Joined:</strong> {reviewer.createdAt ? new Date(reviewer.createdAt.seconds ? reviewer.createdAt.seconds * 1000 : reviewer.createdAt).toLocaleDateString() : "N/A"}</p>
                  {/* Revoke button */}
                  <button
                    onClick={() => handleRevoke(reviewer.id)}
                    style={{ ...styles.button, ...styles.revokeButton }}
                  >
                    Revoke
                  </button>
                </article>
              </li>
            ))}
          </ul>
        )}
        {/* Pagination for current reviewers */}
        <nav style={styles.pagination} aria-label="Current reviewer pagination">
          {Array.from({ length: Math.ceil(filteredCurrentReviewers.length / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              style={styles.paginationBtn(currentPage === i + 1)}
              aria-current={currentPage === i + 1 ? "page" : undefined}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      </article>

      {/* Revoke Reason Modal */}
      {showRevokeModal && (
        <dialog open style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <form
            style={{
              background: "#243447",
              padding: "2rem",
              borderRadius: "0.5rem",
              minWidth: 320,
              maxWidth: "90vw",
              boxShadow: "0 4px 24px rgba(0,0,0,0.3)"
            }}
            onSubmit={e => {
              e.preventDefault();
              confirmRevoke();
            }}
          >
            <h3 style={{ marginBottom: "1rem", color: "#fff" }}>Revoke Reviewer</h3>
            <label htmlFor="revoke-reason" style={{ color: "#64CCC5", fontWeight: 600, display: "block", marginBottom: 8 }}>
              Please provide a reason for revoking:
            </label>
            <textarea
              id="revoke-reason"
              value={revokeReason}
              onChange={e => setRevokeReason(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                borderRadius: "0.4rem",
                border: "1.5px solid #64CCC5",
                background: "#132238",
                color: "#fff",
                padding: "0.7rem",
                marginBottom: "1.2rem",
                fontSize: "1rem",
                resize: "vertical"
              }}
              placeholder="Enter reason..."
            />
            {/* Modal action buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => {
                  setShowRevokeModal(false);
                  setRevokeReason("");
                  setRevokingReviewerId(null);
                }}
                style={{
                  background: "#4a5568",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 1.2rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!revokeReason.trim()}
                style={{
                  background: "#FF6B6B",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 1.2rem",
                  fontWeight: 600,
                  cursor: revokeReason.trim() ? "pointer" : "not-allowed",
                  opacity: revokeReason.trim() ? 1 : 0.7
                }}
              >
                Confirm Revoke
              </button>
            </div>
          </form>
        </dialog>
      )}

      {/* Add space between current and revoked reviewers */}
      <div style={{ height: "2.5rem" }} />

      {/* Revoked/Rejected Reviewers Section */}
      <article style={styles.article}>
        <h2 style={styles.heading}>Revoked or Rejected Reviewers</h2>
        <p style={styles.description}>
          Below is the list of all reviewers who have been revoked or rejected:
        </p>
        {/* Search input for revoked reviewers */}
        <input
          type="text"
          placeholder="Search by reviewer name..."
          style={styles.searchInput}
          value={revokedSearchTerm}
          onChange={e => {
            setRevokedSearchTerm(e.target.value);
            setRevokedPage(1);
          }}
        />
        {/* List of revoked/rejected reviewers */}
        {filteredRevokedReviewers.length === 0 ? (
          <p style={{ textAlign: "center", color: "#a0aec0" }}>No revoked reviewers found.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {paginate(filteredRevokedReviewers, revokedPage).map((reviewer) => (
              <li key={reviewer.id} style={{ marginBottom: "1rem" }}>
                <article style={styles.card}>
                  <header>
                    <div style={styles.cardName}>{reviewer.name || "N/A"}</div>
                  </header>
                  <p style={styles.cardEmail}><strong>Email:</strong> {reviewer.email || "N/A"}</p>
                  <p style={styles.cardEmail}><strong>Institution:</strong> {reviewer.institution || "N/A"}</p>
                  <p style={styles.cardEmail}><strong>Expertise:</strong> {Array.isArray(reviewer.expertiseTags) ? reviewer.expertiseTags.join(", ") : "N/A"}</p>
                  <p style={styles.cardEmail}><strong>Years Experience:</strong> {reviewer.yearsExperience || "N/A"}</p>
                  {/* Publications and CV links */}
                  {reviewer.publications && reviewer.publications.length > 0 && (
                    <section style={styles.cardEmail}>
                      <strong>Publications:</strong>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {reviewer.publications.map((pub, idx) => (
                          <li key={idx}>
                            <a
                              href={pub}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#64CCC5" }}
                            >
                              {pub}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {reviewer.cvUrl && (
                    <p style={styles.cardEmail}>
                      <strong>CV:</strong>{" "}
                      <a
                        href={reviewer.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#64CCC5", textDecoration: "underline" }}
                      >
                        View CV
                      </a>
                    </p>
                  )}
                  <p style={styles.cardEmail}><strong>Status:</strong> {reviewer.status || reviewer.role || "N/A"}</p>
                  <p style={styles.cardEmail}>
                    <strong>Reason:</strong> {reviewer.reason ? reviewer.reason : <span style={{ color: "#888" }}>—</span>}
                  </p>
                  <p style={styles.cardEmail}><strong>Joined:</strong> {reviewer.createdAt ? new Date(reviewer.createdAt.seconds ? reviewer.createdAt.seconds * 1000 : reviewer.createdAt).toLocaleDateString() : "N/A"}</p>
                  {/* Delete button for revoked/rejected reviewers */}
                  <button
                    onClick={() => handleDeleteReviewer(reviewer.id)}
                    style={{ ...styles.button, ...styles.deleteButton }}
                  >
                    Delete
                  </button>
                </article>
              </li>
            ))}
          </ul>
        )}
        {/* Pagination for revoked/rejected reviewers */}
        <nav style={styles.pagination} aria-label="Revoked reviewer pagination">
          {Array.from({ length: Math.ceil(filteredRevokedReviewers.length / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => setRevokedPage(i + 1)}
              style={styles.paginationBtn(revokedPage === i + 1)}
              aria-current={revokedPage === i + 1 ? "page" : undefined}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      </article>
    </section>
  );
}