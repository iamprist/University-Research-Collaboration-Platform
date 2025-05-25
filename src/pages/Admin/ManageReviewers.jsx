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
import './ManageReviewers.css'; // <-- Import the CSS file

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

  return (
    <section className="manage-reviewers-container">
      {/* Pending Applications Section */}
      <article className="manage-reviewers-article">
        <h2 className="manage-reviewers-heading">Reviewer Applications</h2>
        <p className="manage-reviewers-description">
          Below is the list of all pending reviewer applications:
        </p>
        {/* Search input for pending reviewers */}
        <input
          type="text"
          placeholder="Search by reviewer name..."
          className="manage-reviewers-search-input"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setPendingPage(1);
          }}
        />
        {/* List of pending reviewers */}
        {loading ? (
          <p className="manage-reviewers-no-data">Loading applications...</p>
        ) : filteredReviewers.length === 0 ? (
          <p className="manage-reviewers-no-data">No pending applications.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {paginate(filteredReviewers, pendingPage).map((reviewers) => (
              <li key={reviewers.id} style={{ marginBottom: "1rem" }}>
                <article className="manage-reviewers-card">
                  <header>
                    <div className="manage-reviewers-card-name">{reviewers.name || "N/A"}</div>
                  </header>
                  <p className="manage-reviewers-card-email"><strong>Email:</strong> {reviewers.email || "N/A"}</p>
                  <p className="manage-reviewers-card-email"><strong>Institution:</strong> {reviewers.institution || "N/A"}</p>
                  <p className="manage-reviewers-card-email"><strong>Expertise:</strong> {Array.isArray(reviewers.expertiseTags) ? reviewers.expertiseTags.join(", ") : "N/A"}</p>
                  <p className="manage-reviewers-card-email"><strong>Years Experience:</strong> {reviewers.yearsExperience || "N/A"}</p>
                  {/* Publications and CV links */}
                  {reviewers.publications && reviewers.publications.length > 0 && (
                    <section className="manage-reviewers-card-email">
                      <strong>Publications:</strong>
                      <ul className="manage-reviewers-publications-list">
                        {reviewers.publications.map((pub, idx) => (
                          <li key={idx}>
                            <a
                              href={pub}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="manage-reviewers-publication-link"
                            >
                              View Publications
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {reviewers.cvUrl && (
                    <p className="manage-reviewers-card-email">
                      <strong>CV:</strong>{" "}
                      <a
                        href={reviewers.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="manage-reviewers-cv-link"
                      >
                        View CV
                      </a>
                    </p>
                  )}
                  <p className="manage-reviewers-card-email"><strong>Applied:</strong> {reviewers.createdAt ? new Date(reviewers.createdAt.seconds ? reviewers.createdAt.seconds * 1000 : reviewers.createdAt).toLocaleDateString() : "N/A"}</p>
                  {/* Approve and Reject buttons */}
                  <button
                    onClick={() => handleApprove(reviewers.id)}
                    className="manage-reviewers-button manage-reviewers-approve"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(reviewers.id)}
                    className="manage-reviewers-button manage-reviewers-reject"
                  >
                    Reject
                  </button>
                </article>
              </li>
            ))}
          </ul>
        )}
        {/* Pagination for pending reviewers */}
        <nav className="manage-reviewers-pagination" aria-label="Pending reviewer pagination">
          {Array.from({ length: Math.ceil(filteredReviewers.length / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => setPendingPage(i + 1)}
              className={`manage-reviewers-pagination-btn${pendingPage === i + 1 ? " active" : ""}`}
              aria-current={pendingPage === i + 1 ? "page" : undefined}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      </article>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <dialog open className="manage-reviewers-modal-overlay">
          <form
            className="manage-reviewers-modal"
            onSubmit={e => {
              e.preventDefault();
              confirmReject();
            }}
          >
            <h3 style={{ marginBottom: "1rem", color: "#fff" }}>Reject Reviewer</h3>
            <label htmlFor="reject-reason" className="manage-reviewers-modal-label">
              Please provide a reason for rejection:
            </label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              className="manage-reviewers-modal-textarea"
              placeholder="Enter reason..."
            />
            {/* Modal action buttons */}
            <div className="manage-reviewers-modal-button-row">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setRejectingReviewerId(null);
                }}
                className="manage-reviewers-modal-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!rejectReason.trim()}
                className="manage-reviewers-modal-confirm"
              >
                Confirm Reject
              </button>
            </div>
          </form>
        </dialog>
      )}

      {/* Current Reviewers Section */}
      <article className="manage-reviewers-article">
        <h2 className="manage-reviewers-heading">Current Reviewers</h2>
        {/* Search input for current reviewers */}
        <input
          type="text"
          placeholder="Search by reviewer name..."
          className="manage-reviewers-search-input"
          value={currentSearchTerm}
          onChange={e => {
            setCurrentSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        {/* List of current reviewers */}
        {filteredCurrentReviewers.length === 0 ? (
          <p className="manage-reviewers-no-data">No current reviewers.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {paginate(filteredCurrentReviewers, currentPage).map((reviewer) => (
              <li key={reviewer.id} style={{ marginBottom: "1rem" }}>
                <article className="manage-reviewers-card">
                  <header>
                    <div className="manage-reviewers-card-name">{reviewer.name || "N/A"}</div>
                  </header>
                  <p className="manage-reviewers-card-email"><strong>Email:</strong> {reviewer.email || "N/A"}</p>
                  <p className="manage-reviewers-card-email"><strong>Institution:</strong> {reviewer.institution || "N/A"}</p>
                  <p className="manage-reviewers-card-email"><strong>Expertise:</strong> {Array.isArray(reviewer.expertiseTags) ? reviewer.expertiseTags.join(", ") : "N/A"}</p>
                  <p className="manage-reviewers-card-email"><strong>Years Experience:</strong> {reviewer.yearsExperience || "N/A"}</p>
                  {/* Publications and CV links */}
                  {reviewer.publications && reviewer.publications.length > 0 && (
                    <section className="manage-reviewers-card-email">
                      <strong>Publications:</strong>
                      <ul className="manage-reviewers-publications-list">
                        {reviewer.publications.map((pub, idx) => (
                          <li key={idx}>
                            <a
                              href={pub}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="manage-reviewers-publication-link"
                            >
                              View Publications
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {reviewer.cvUrl && (
                    <p className="manage-reviewers-card-email">
                      <strong>CV:</strong>{" "}
                      <a
                        href={reviewer.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="manage-reviewers-cv-link"
                      >
                        View CV
                      </a>
                    </p>
                  )}
                  <p className="manage-reviewers-card-email"><strong>Joined:</strong> {reviewer.createdAt ? new Date(reviewer.createdAt.seconds ? reviewer.createdAt.seconds * 1000 : reviewer.createdAt).toLocaleDateString() : "N/A"}</p>
                  {/* Revoke button */}
                  <button
                    onClick={() => handleRevoke(reviewer.id)}
                    className="manage-reviewers-button manage-reviewers-revoke"
                  >
                    Revoke
                  </button>
                </article>
              </li>
            ))}
          </ul>
        )}
        {/* Pagination for current reviewers */}
        <nav className="manage-reviewers-pagination" aria-label="Current reviewer pagination">
          {Array.from({ length: Math.ceil(filteredCurrentReviewers.length / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`manage-reviewers-pagination-btn${currentPage === i + 1 ? " active" : ""}`}
              aria-current={currentPage === i + 1 ? "page" : undefined}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      </article>

      {/* Revoke Reason Modal */}
      {showRevokeModal && (
        <dialog open className="manage-reviewers-modal-overlay">
          <form
            className="manage-reviewers-modal"
            onSubmit={e => {
              e.preventDefault();
              confirmRevoke();
            }}
          >
            <h3 style={{ marginBottom: "1rem", color: "#fff" }}>Revoke Reviewer</h3>
            <label htmlFor="revoke-reason" className="manage-reviewers-modal-label">
              Please provide a reason for revoking:
            </label>
            <textarea
              id="revoke-reason"
              value={revokeReason}
              onChange={e => setRevokeReason(e.target.value)}
              rows={4}
              className="manage-reviewers-modal-textarea"
              placeholder="Enter reason..."
            />
            {/* Modal action buttons */}
            <div className="manage-reviewers-modal-button-row">
              <button
                type="button"
                onClick={() => {
                  setShowRevokeModal(false);
                  setRevokeReason("");
                  setRevokingReviewerId(null);
                }}
                className="manage-reviewers-modal-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!revokeReason.trim()}
                className="manage-reviewers-modal-confirm"
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
      <article className="manage-reviewers-article">
        <h2 className="manage-reviewers-heading">Revoked or Rejected Reviewers</h2>
        <p className="manage-reviewers-description">
          Below is the list of all reviewers who have been revoked or rejected:
        </p>
        {/* Search input for revoked reviewers */}
        <input
          type="text"
          placeholder="Search by reviewer name..."
          className="manage-reviewers-search-input"
          value={revokedSearchTerm}
          onChange={e => {
            setRevokedSearchTerm(e.target.value);
            setRevokedPage(1);
          }}
        />
        {/* List of revoked/rejected reviewers */}
        {filteredRevokedReviewers.length === 0 ? (
          <p className="manage-reviewers-no-data">No revoked reviewers found.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {paginate(filteredRevokedReviewers, revokedPage).map((reviewer) => (
              <li key={reviewer.id} style={{ marginBottom: "1rem" }}>
                <article className="manage-reviewers-card">
                  <header>
                    <div className="manage-reviewers-card-name">{reviewer.name || "N/A"}</div>
                  </header>
                  <p className="manage-reviewers-card-email"><strong>Email:</strong> {reviewer.email || "N/A"}</p>
                  <p className="manage-reviewers-card-email"><strong>Institution:</strong> {reviewer.institution || "N/A"}</p>
                  <p className="manage-reviewers-card-email"><strong>Expertise:</strong> {Array.isArray(reviewer.expertiseTags) ? reviewer.expertiseTags.join(", ") : "N/A"}</p>
                  <p className="manage-reviewers-card-email"><strong>Years Experience:</strong> {reviewer.yearsExperience || "N/A"}</p>
                  {/* Publications and CV links */}
                  {reviewer.publications && reviewer.publications.length > 0 && (
                    <section className="manage-reviewers-card-email">
                      <strong>Publications:</strong>
                      <ul className="manage-reviewers-publications-list">
                        {reviewer.publications.map((pub, idx) => (
                          <li key={idx}>
                            <a
                              href={pub}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="manage-reviewers-publication-link"
                            >
                              {pub}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {reviewer.cvUrl && (
                    <p className="manage-reviewers-card-email">
                      <strong>CV:</strong>{" "}
                      <a
                        href={reviewer.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="manage-reviewers-cv-link"
                      >
                        View CV
                      </a>
                    </p>
                  )}
                  <p className="manage-reviewers-card-email"><strong>Status:</strong> {reviewer.status || reviewer.role || "N/A"}</p>
                  <p className="manage-reviewers-card-email">
                    <strong>Reason:</strong> {reviewer.reason ? reviewer.reason : <span style={{ color: "#888" }}>—</span>}
                  </p>
                  <p className="manage-reviewers-card-email"><strong>Joined:</strong> {reviewer.createdAt ? new Date(reviewer.createdAt.seconds ? reviewer.createdAt.seconds * 1000 : reviewer.createdAt).toLocaleDateString() : "N/A"}</p>
                  {/* Delete button for revoked/rejected reviewers */}
                  <button
                    onClick={() => handleDeleteReviewer(reviewer.id)}
                    className="manage-reviewers-button manage-reviewers-delete"
                  >
                    Delete
                  </button>
                </article>
              </li>
            ))}
          </ul>
        )}
        {/* Pagination for revoked/rejected reviewers */}
        <nav className="manage-reviewers-pagination" aria-label="Revoked reviewer pagination">
          {Array.from({ length: Math.ceil(filteredRevokedReviewers.length / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => setRevokedPage(i + 1)}
              className={`manage-reviewers-pagination-btn${revokedPage === i + 1 ? " active" : ""}`}
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