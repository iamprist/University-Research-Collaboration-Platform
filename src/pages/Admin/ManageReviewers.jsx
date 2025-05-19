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

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const [revokedSearchTerm, setRevokedSearchTerm] = useState("");

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

  const fetchRevokedReviewers = async () => {
    try {
      // Fetch reviewers with status "rejected" or "revoked" from the reviewers collection
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

      // Combine both results
      const combinedRevokedList = [...rejectedReviewers, ...revokedReviewers];
      setRevokedReviewers(combinedRevokedList);
    } catch (error) {
      console.error("Error fetching revoked/rejected reviewers:", error);
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
      await deleteDoc(doc(db, "reviewers", id));
      setRevokedReviewers((prev) => prev.filter((reviewer) => reviewer.id !== id));
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

  // Filtered lists for search
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
      {/* Pending Applications */}
      <article style={styles.article}>
        <h2 style={styles.heading}>Reviewer Applications</h2>
        <p style={styles.description}>
          Below is the list of all pending reviewer applications:
        </p>
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
        {loading ? (
          <p style={{ textAlign: "center", color: "#a0aec0" }}>Loading applications...</p>
        ) : filteredReviewers.length === 0 ? (
          <p style={{ textAlign: "center", color: "#a0aec0" }}>No pending applications.</p>
        ) : (
          paginate(filteredReviewers, pendingPage).map((reviewers) => (
            <div key={reviewers.id} style={styles.card}>
              <div style={styles.cardName}>{reviewers.name || "N/A"}</div>
              <div style={styles.cardEmail}><strong>Email:</strong> {reviewers.email || "N/A"}</div>
              <div style={styles.cardEmail}><strong>Institution:</strong> {reviewers.institution || "N/A"}</div>
              <div style={styles.cardEmail}><strong>Expertise:</strong> {Array.isArray(reviewers.expertiseTags) ? reviewers.expertiseTags.join(", ") : "N/A"}</div>
              <div style={styles.cardEmail}><strong>Years Experience:</strong> {reviewers.yearsExperience || "N/A"}</div>
              {reviewers.publications && reviewers.publications.length > 0 && (
                <div style={styles.cardEmail}>
                  <strong>Publications:</strong>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {reviewers.publications.map((pub, idx) => (
                      <li key={idx}>
                        <a href={pub} target="_blank" rel="noopener noreferrer" style={{ color: "#64CCC5" }}>
                          {pub}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reviewers.cvUrl && (
                <div style={styles.cardEmail}>
                  <strong>CV:</strong>{" "}
                  <a
                    href={reviewers.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#64CCC5", textDecoration: "underline" }}
                  >
                    View CV
                  </a>
                </div>
              )}
              <div style={styles.cardEmail}><strong>Applied:</strong> {reviewers.createdAt ? new Date(reviewers.createdAt.seconds ? reviewers.createdAt.seconds * 1000 : reviewers.createdAt).toLocaleDateString() : "N/A"}</div>
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
            </div>
          ))
        )}
        <div style={styles.pagination}>
          {Array.from({ length: Math.ceil(filteredReviewers.length / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => setPendingPage(i + 1)}
              style={styles.paginationBtn(pendingPage === i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </article>

      {/* Current Reviewers */}
      <article style={styles.article}>
        <h2 style={styles.heading}>Current Reviewers</h2>
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
        {filteredCurrentReviewers.length === 0 ? (
          <p style={{ textAlign: "center", color: "#a0aec0" }}>No current reviewers.</p>
        ) : (
          paginate(filteredCurrentReviewers, currentPage).map((reviewer) => (
            <div key={reviewer.id} style={styles.card}>
              <div style={styles.cardName}>{reviewer.name || "N/A"}</div>
              <div style={styles.cardEmail}><strong>Email:</strong> {reviewer.email || "N/A"}</div>
              <div style={styles.cardEmail}><strong>Institution:</strong> {reviewer.institution || "N/A"}</div>
              <div style={styles.cardEmail}><strong>Expertise:</strong> {Array.isArray(reviewer.expertiseTags) ? reviewer.expertiseTags.join(", ") : "N/A"}</div>
              <div style={styles.cardEmail}><strong>Years Experience:</strong> {reviewer.yearsExperience || "N/A"}</div>
              {reviewer.publications && reviewer.publications.length > 0 && (
                <div style={styles.cardEmail}>
                  <strong>Publications:</strong>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {reviewer.publications.map((pub, idx) => (
                      <li key={idx}>
                        <a href={pub} target="_blank" rel="noopener noreferrer" style={{ color: "#64CCC5" }}>
                          {pub}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reviewer.cvUrl && (
                <div style={styles.cardEmail}>
                  <strong>CV:</strong>{" "}
                  <a
                    href={reviewer.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#64CCC5", textDecoration: "underline" }}
                  >
                    View CV
                  </a>
                </div>
              )}
              <div style={styles.cardEmail}><strong>Joined:</strong> {reviewer.createdAt ? new Date(reviewer.createdAt.seconds ? reviewer.createdAt.seconds * 1000 : reviewer.createdAt).toLocaleDateString() : "N/A"}</div>
              <button
                onClick={() => handleRevoke(reviewer.id)}
                style={{ ...styles.button, ...styles.revokeButton }}
              >
                Revoke
              </button>
            </div>
          ))
        )}
        <div style={styles.pagination}>
          {Array.from({ length: Math.ceil(filteredCurrentReviewers.length / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              style={styles.paginationBtn(currentPage === i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </article>

      {/* Add space between current and revoked reviewers */}
      <div style={{ height: "2.5rem" }} />

      {/* Revoked Reviewers */}
      <article style={styles.article}>
        <h2 style={styles.heading}>Revoked or Rejected Reviewers</h2>
        <p style={styles.description}>
          Below is the list of all reviewers who have been revoked or rejected:
        </p>
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
        {filteredRevokedReviewers.length === 0 ? (
          <p style={{ textAlign: "center", color: "#a0aec0" }}>No revoked reviewers found.</p>
        ) : (
          paginate(filteredRevokedReviewers, revokedPage).map((reviewer) => (
            <div key={reviewer.id} style={styles.card}>
              <div style={styles.cardName}>{reviewer.name || "N/A"}</div>
              <div style={styles.cardEmail}><strong>Email:</strong> {reviewer.email || "N/A"}</div>
              <div style={styles.cardEmail}><strong>Institution:</strong> {reviewer.institution || "N/A"}</div>
              <div style={styles.cardEmail}><strong>Expertise:</strong> {Array.isArray(reviewer.expertiseTags) ? reviewer.expertiseTags.join(", ") : "N/A"}</div>
              <div style={styles.cardEmail}><strong>Years Experience:</strong> {reviewer.yearsExperience || "N/A"}</div>
              {reviewer.publications && reviewer.publications.length > 0 && (
                <div style={styles.cardEmail}>
                  <strong>Publications:</strong>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {reviewer.publications.map((pub, idx) => (
                      <li key={idx}>
                        <a href={pub} target="_blank" rel="noopener noreferrer" style={{ color: "#64CCC5" }}>
                          {pub}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reviewer.cvUrl && (
                <div style={styles.cardEmail}>
                  <strong>CV:</strong>{" "}
                  <a
                    href={reviewer.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#64CCC5", textDecoration: "underline" }}
                  >
                    View CV
                  </a>
                </div>
              )}
              <div style={styles.cardEmail}><strong>Status:</strong> {reviewer.status || reviewer.role || "N/A"}</div>
              <div style={styles.cardEmail}><strong>Joined:</strong> {reviewer.createdAt ? new Date(reviewer.createdAt.seconds ? reviewer.createdAt.seconds * 1000 : reviewer.createdAt).toLocaleDateString() : "N/A"}</div>
              <button
                onClick={() => handleDeleteReviewer(reviewer.id)}
                style={{ ...styles.button, ...styles.deleteButton }}
              >
                Delete
              </button>
            </div>
          ))
        )}
        <div style={styles.pagination}>
          {Array.from({ length: Math.ceil(filteredRevokedReviewers.length / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => setRevokedPage(i + 1)}
              style={styles.paginationBtn(revokedPage === i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}
