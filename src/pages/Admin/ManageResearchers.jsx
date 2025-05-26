import React, { useEffect, useState } from "react";
import { db } from "../../config/firebaseConfig";
import { collection, getDocs, updateDoc, doc, query, where, deleteDoc } from "firebase/firestore";
import './ManageResearchers.css';

// Main component for managing researcher accounts
export default function ManageResearchers() {
  // State for current and revoked researchers
  const [researchers, setResearchers] = useState([]);
  const [revokedResearchers, setRevokedResearchers] = useState([]);
  // State for revoke modal
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

  // Fetch all current researchers from Firestore
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

  // Fetch all revoked researchers from Firestore
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

  // Fetch researchers and revoked researchers on mount
  useEffect(() => {
    fetchResearchers();
    fetchRevokedResearchers();
  }, []);

  // Open revoke modal for a researcher
  const handleRevoke = (id) => {
    setRevokingId(id);
    setShowRevokeModal(true);
  };

  // Confirm revoke with reason and update Firestore
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

  // Delete a revoked researcher from Firestore
  const handleDeleteRevoked = async (id) => {
    try {
      await deleteDoc(doc(db, "users", id));
      setRevokedResearchers((prev) => prev.filter((researcher) => researcher.id !== id));
    } catch (error) {
      console.error("Error deleting revoked researcher:", error);
    }
  };

  // Helper for paginating lists
  const paginate = (items, page) => {
    const start = (page - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  };

  // Filtered lists for search functionality
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

  return (
    <section className="manage-researchers-container">
      {/* Main researcher management section */}
      <article className="manage-researchers-article">
        <h2 className="manage-researchers-heading">Manage Researchers</h2>
        <p className="manage-researchers-description">
          Below is the list of all users with the <span style={{ fontWeight: "bold" }}>researcher</span> role:
        </p>
        {/* Search input for researchers */}
        <input
          type="text"
          placeholder="Search by researcher name..."
          className="manage-researchers-search-input"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setResearchersPage(1);
          }}
        />
        {/* List of current researchers */}
        <section>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {paginate(filteredResearchers, researchersPage).map((researcher) => (
              <li key={researcher.id} style={{ marginBottom: "1rem" }}>
                <article className="manage-researchers-card">
                  <header className="manage-researchers-card-header">
                    <h3 className="manage-researchers-card-title">
                      {researcher.name || "N/A"}
                    </h3>
                    <p className="manage-researchers-card-email">{researcher.email || "N/A"}</p>
                  </header>
                  <button
                    className="manage-researchers-revoke-button"
                    onClick={() => handleRevoke(researcher.id)}
                  >
                    Revoke
                  </button>
                </article>
              </li>
            ))}
          </ul>
          {/* Show message if no researchers found */}
          {filteredResearchers.length === 0 && (
            <p className="manage-researchers-no-data">No researcher accounts found.</p>
          )}
        </section>
        {/* Pagination for researchers */}
        {filteredResearchers.length > itemsPerPage && (
          <nav className="manage-researchers-pagination" aria-label="Researcher pagination">
            {Array.from({ length: Math.ceil(filteredResearchers.length / itemsPerPage) }, (_, i) => (
              <button
                key={i}
                className={`manage-researchers-pagination-btn${researchersPage === i + 1 ? " active" : ""}`}
                onClick={() => setResearchersPage(i + 1)}
                aria-current={researchersPage === i + 1 ? "page" : undefined}
              >
                {i + 1}
              </button>
            ))}
          </nav>
        )}
      </article>

      {/* Revoke Reason Modal */}
      {showRevokeModal && (
        <dialog
          open
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(20, 30, 50, 0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            border: "none",
            padding: 0,
            margin: 0,
          }}
        >
          <form
            style={{
              background: "linear-gradient(135deg, #243447 80%, #1a2e40 100%)",
              borderRadius: "0.7rem",
              color: "#fff",
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              minWidth: 320,
              maxWidth: "90vw",
              width: 340,
              padding: "1.2rem 1.4rem",
              border: "none",
            }}
            onSubmit={e => {
              e.preventDefault();
              confirmRevoke();
            }}
          >
            <h3
              style={{
                marginBottom: "0.7rem",
                fontSize: "1.25rem",
                color: "#64CCC5",
                textAlign: "center",
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
            >
              Revoke Researcher
            </h3>
            <label
              htmlFor="revoke-reason"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 600,
                color: "#b1ede8",
                fontSize: "1.05rem",
                letterSpacing: "0.2px",
              }}
            >
              Please provide a reason for revoking:
            </label>
            <textarea
              id="revoke-reason"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                marginBottom: "1rem",
                borderRadius: "0.5rem",
                padding: "0.7rem 1rem",
                border: "1.5px solid #364e68",
                background: "#1a2e40",
                color: "#fff",
                fontSize: "1.08rem",
                resize: "vertical",
                minHeight: 70,
                transition: "border 0.2s, box-shadow 0.2s",
                boxShadow: "0 2px 8px rgba(50, 80, 120, 0.07)",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.7rem",
                marginTop: "0.2rem",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowRevokeModal(false);
                  setRevokeReason("");
                  setRevokingId(null);
                }}
                style={{
                  backgroundColor: "#4a5568",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.45rem 1.1rem",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "1rem",
                  transition: "background 0.18s",
                  boxShadow: "0 2px 8px rgba(50, 80, 120, 0.08)",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  backgroundColor: "#FF6B6B",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.45rem 1.1rem",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "1rem",
                  transition: "background 0.18s, box-shadow 0.18s",
                  boxShadow: "0 2px 8px rgba(255, 107, 107, 0.10)",
                }}
              >
                Confirm Revoke
              </button>
            </div>
          </form>
        </dialog>
      )}

      {/* Revoked Researchers section */}
      <article className="manage-researchers-article">
        <h2 className="manage-researchers-heading">Revoked Researchers</h2>
        <p className="manage-researchers-description">
          Below is the list of all researchers who have been revoked:
        </p>
        {/* Search input for revoked researchers */}
        <input
          type="text"
          placeholder="Search by researcher name..."
          className="manage-researchers-search-input"
          value={revokedSearchTerm}
          onChange={e => {
            setRevokedSearchTerm(e.target.value);
            setRevokedPage(1);
          }}
        />
        {/* List of revoked researchers */}
        <section>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {paginate(filteredRevokedResearchers, revokedPage).map((researcher) => (
              <li key={researcher.id} style={{ marginBottom: "1rem" }}>
                <article className="manage-researchers-card">
                  <header className="manage-researchers-card-header">
                    <h3 className="manage-researchers-card-title">
                      {researcher.name || "N/A"}
                    </h3>
                    <p className="manage-researchers-card-email">{researcher.email || "N/A"}</p>
                    {researcher.revokeReason && (
                      <p>
                        <strong>Revoke Reason:</strong> {researcher.revokeReason}
                      </p>
                    )}
                  </header>
                  <button
                    className="manage-researchers-delete-button"
                    onClick={() => handleDeleteRevoked(researcher.id)}
                  >
                    Delete
                  </button>
                </article>
              </li>
            ))}
          </ul>
          {/* Show message if no revoked researchers found */}
          {filteredRevokedResearchers.length === 0 && (
            <p className="manage-researchers-no-data">No revoked researcher accounts found.</p>
          )}
        </section>
        {/* Pagination for revoked researchers */}
        {filteredRevokedResearchers.length > itemsPerPage && (
          <nav className="manage-researchers-pagination" aria-label="Revoked researcher pagination">
            {Array.from({ length: Math.ceil(filteredRevokedResearchers.length / itemsPerPage) }, (_, i) => (
              <button
                key={i}
                className={`manage-researchers-pagination-btn${revokedPage === i + 1 ? " active" : ""}`}
                onClick={() => setRevokedPage(i + 1)}
                aria-current={revokedPage === i + 1 ? "page" : undefined}
              >
                {i + 1}
              </button>
            ))}
          </nav>
        )}
      </article>
    </section>
  );
}