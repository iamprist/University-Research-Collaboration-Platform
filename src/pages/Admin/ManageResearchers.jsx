import React, { useEffect, useState } from "react";
import { db } from "../../config/firebaseConfig";
import { collection, getDocs, updateDoc, doc, query, where, deleteDoc } from "firebase/firestore";

export default function ManageResearchers() {
  const [researchers, setResearchers] = useState([]);
  const [revokedResearchers, setRevokedResearchers] = useState([]);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokingId, setRevokingId] = useState(null);

  // Pagination state
  const [researchersPage, setResearchersPage] = useState(1);
  const [revokedPage, setRevokedPage] = useState(1);
  const itemsPerPage = 5;

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [revokedSearchTerm, setRevokedSearchTerm] = useState("");

  // Fetch current researchers
  const fetchResearchers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const researcherList = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.role?.toLowerCase() === "researcher");
      setResearchers(researcherList);
    } catch (error) {
      console.error("Error fetching researchers:", error);
    }
  };

  // Fetch revoked researchers
  const fetchRevokedResearchers = async () => {
    try {
      const usersQuery = query(collection(db, "users"), where("role", "==", "revokedResearcher"));
      const usersSnap = await getDocs(usersQuery);
      const revokedResearcherList = usersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRevokedResearchers(revokedResearcherList);
    } catch (error) {
      console.error("Error fetching revoked researchers:", error);
    }
  };

  useEffect(() => {
    fetchResearchers();
    fetchRevokedResearchers();
  }, []);

  // Handle revoke modal open
  const handleRevoke = (id) => {
    setRevokingId(id);
    setShowRevokeModal(true);
  };

  // Confirm revoke with reason
  const confirmRevoke = async () => {
    if (!revokeReason.trim()) {
      alert("Please provide a reason for revoking.");
      return;
    }
    try {
      const userDoc = doc(db, "users", revokingId);
      await updateDoc(userDoc, { role: "revokedResearcher", revokeReason: revokeReason.trim() });
      setResearchers((prev) => prev.filter((researcher) => researcher.id !== revokingId));
      setShowRevokeModal(false);
      setRevokeReason("");
      setRevokingId(null);
      fetchRevokedResearchers();
    } catch (error) {
      console.error("Error revoking researcher:", error);
    }
  };

  // Delete revoked researcher
  const handleDeleteRevoked = async (id) => {
    try {
      await deleteDoc(doc(db, "users", id));
      setRevokedResearchers((prev) => prev.filter((researcher) => researcher.id !== id));
    } catch (error) {
      console.error("Error deleting revoked researcher:", error);
    }
  };

  // Pagination helpers
  const paginate = (items, page) => {
    const start = (page - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  };

  // Filtered lists for search
  const filteredResearchers = researchers.filter((researcher) =>
    (researcher.name || "")
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase())
  );
  const filteredRevokedResearchers = revokedResearchers.filter((researcher) =>
    (researcher.name || "")
      .toLowerCase()
      .includes(revokedSearchTerm.trim().toLowerCase())
  );

  // Inline styles
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
    cardHeader: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
    },
    cardTitle: {
      fontSize: "1.25rem",
      fontWeight: "bold",
      color: "#64CCC5",
    },
    cardEmail: {
      fontSize: "0.9rem",
      color: "#A0AEC0",
    },
    noData: {
      textAlign: "center",
      color: "#A0AEC0",
      marginTop: "1rem",
    },
    revokeButton: {
      backgroundColor: "#FF6B6B",
      color: "#fff",
      border: "none",
      borderRadius: "0.5rem",
      padding: "0.5rem 1rem",
      cursor: "pointer",
      marginTop: "0.5rem",
      alignSelf: "flex-start",
    },
    deleteButton: {
      backgroundColor: "#e53e3e",
      color: "#fff",
      border: "none",
      borderRadius: "0.5rem",
      padding: "0.5rem 1rem",
      cursor: "pointer",
      marginTop: "0.5rem",
      alignSelf: "flex-start",
    },
    modalOverlay: {
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    },
    modal: {
      background: "#243447",
      padding: "2rem",
      borderRadius: "0.5rem",
      minWidth: "320px",
      color: "#fff",
      boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
    },
    modalLabel: {
      display: "block",
      marginBottom: "0.5rem",
    },
    modalTextarea: {
      width: "100%",
      marginBottom: "1rem",
      borderRadius: "0.25rem",
      padding: "0.5rem",
    },
    modalButtonRow: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "0.5rem",
    },
    modalCancel: {
      backgroundColor: "#4a5568",
      color: "#fff",
      border: "none",
      borderRadius: "0.5rem",
      padding: "0.5rem 1rem",
      cursor: "pointer",
    },
    modalConfirm: {
      backgroundColor: "#FF6B6B",
      color: "#fff",
      border: "none",
      borderRadius: "0.5rem",
      padding: "0.5rem 1rem",
      cursor: "pointer",
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
      <article style={styles.article}>
        <h2 style={styles.heading}>Manage Researchers</h2>
        <p style={styles.description}>
          Below is the list of all users with the <span style={{ fontWeight: "bold" }}>researcher</span> role:
        </p>
        <input
          type="text"
          placeholder="Search by researcher name..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setResearchersPage(1);
          }}
        />
        <section>
          {paginate(filteredResearchers, researchersPage).map((researcher) => (
            <div key={researcher.id} style={styles.card}>
              <header style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  {researcher.name || "N/A"}
                </h3>
                <p style={styles.cardEmail}>{researcher.email || "N/A"}</p>
              </header>
              <button
                style={styles.revokeButton}
                onClick={() => handleRevoke(researcher.id)}
              >
                Revoke
              </button>
            </div>
          ))}
          {filteredResearchers.length === 0 && (
            <p style={styles.noData}>No researcher accounts found.</p>
          )}
        </section>
        {/* Pagination for researchers */}
        {filteredResearchers.length > itemsPerPage && (
          <div style={styles.pagination}>
            {Array.from({ length: Math.ceil(filteredResearchers.length / itemsPerPage) }, (_, i) => (
              <button
                key={i}
                style={styles.paginationBtn(researchersPage === i + 1)}
                onClick={() => setResearchersPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </article>

      {/* Revoke Reason Modal */}
      {showRevokeModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ marginBottom: "1rem" }}>Revoke Researcher</h3>
            <label htmlFor="revoke-reason" style={styles.modalLabel}>
              Please provide a reason for revoking:
            </label>
            <textarea
              id="revoke-reason"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={3}
              style={styles.modalTextarea}
            />
            <div style={styles.modalButtonRow}>
              <button
                onClick={() => {
                  setShowRevokeModal(false);
                  setRevokeReason("");
                  setRevokingId(null);
                }}
                style={styles.modalCancel}
              >
                Cancel
              </button>
              <button
                onClick={confirmRevoke}
                style={styles.modalConfirm}
              >
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoked Researchers */}
      <article style={styles.article}>
        <h2 style={styles.heading}>Revoked Researchers</h2>
        <p style={styles.description}>
          Below is the list of all researchers who have been revoked:
        </p>
        <input
          type="text"
          placeholder="Search by researcher name..."
          style={styles.searchInput}
          value={revokedSearchTerm}
          onChange={e => {
            setRevokedSearchTerm(e.target.value);
            setRevokedPage(1);
          }}
        />
        <section>
          {paginate(filteredRevokedResearchers, revokedPage).map((researcher) => (
            <div key={researcher.id} style={styles.card}>
              <header style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  {researcher.name || "N/A"}
                </h3>
                <p style={styles.cardEmail}>{researcher.email || "N/A"}</p>
                {researcher.revokeReason && (
                  <p>
                    <strong>Revoke Reason:</strong> {researcher.revokeReason}
                  </p>
                )}
              </header>
              <button
                style={styles.deleteButton}
                onClick={() => handleDeleteRevoked(researcher.id)}
              >
                Delete
              </button>
            </div>
          ))}
          {filteredRevokedResearchers.length === 0 && (
            <p style={styles.noData}>No revoked researcher accounts found.</p>
          )}
        </section>
        {/* Pagination for revoked researchers */}
        {filteredRevokedResearchers.length > itemsPerPage && (
          <div style={styles.pagination}>
            {Array.from({ length: Math.ceil(filteredRevokedResearchers.length / itemsPerPage) }, (_, i) => (
              <button
                key={i}
                style={styles.paginationBtn(revokedPage === i + 1)}
                onClick={() => setRevokedPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}