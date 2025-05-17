import React, { useEffect, useState } from "react";
import { db } from "../../config/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [revokedAdmins, setRevokedAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // For revoke modal
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokingAdmin, setRevokingAdmin] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [revokedSearchTerm, setRevokedSearchTerm] = useState("");

  // Fetch admins from Firestore
  const fetchAdmins = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const adminList = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.role?.toLowerCase() === "admin");
      setAdmins(adminList);
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  // Fetch revoked admins from Firestore
  const fetchRevokedAdmins = async () => {
    try {
      const revokedQuery = query(
        collection(db, "users"),
        where("role", "==", "revokedAdmin")
      );
      const revokedSnap = await getDocs(revokedQuery);
      const revokedList = revokedSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRevokedAdmins(revokedList);
    } catch (error) {
      console.error("Error fetching revoked admins:", error);
    }
  };

  // Add a new admin
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newAdminEmail) {
      setError("Email is required.");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      // Check if email already exists in Firestore with the role `admin`
      const querySnapshot = await getDocs(collection(db, "users"));
      const existingAdmin = querySnapshot.docs.some(
        (doc) =>
          doc.data().email.toLowerCase() === newAdminEmail.toLowerCase() &&
          doc.data().role?.toLowerCase() === "admin"
      );

      if (existingAdmin) {
        setError("This email is already associated with an admin account.");
        return;
      }

      // Add the new admin email to the "newAdmin" collection in Firestore
      await addDoc(collection(db, "newAdmin"), {
        email: newAdminEmail,
        role: "admin",
        createdAt: new Date(),
      });

      setNewAdminEmail("");
      fetchAdmins();
      setSuccess("Admin email added successfully!");
    } catch (error) {
      console.error("Error adding admin:", error);
      setError("Failed to add admin. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Open revoke modal
  const openRevokeModal = (admin) => {
    setRevokingAdmin(admin);
    setRevokeReason("");
    setShowRevokeModal(true);
  };

  // Confirm revoke admin
  const confirmRevokeAdmin = async () => {
    if (!revokeReason.trim()) {
      setError("Please provide a reason for revoking.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // 1. Update role to revokedAdmin and add revokeReason in users
      const userDocRef = doc(db, "users", revokingAdmin.id);
      await updateDoc(userDocRef, {
        role: "revokedAdmin",
        revokeReason: revokeReason.trim(),
      });

      // 2. Remove from newAdmin collection if present
      const newAdminQuery = query(
        collection(db, "newAdmin"),
        where("email", "==", revokingAdmin.email)
      );
      const newAdminSnap = await getDocs(newAdminQuery);
      for (const docSnap of newAdminSnap.docs) {
        await deleteDoc(doc(db, "newAdmin", docSnap.id));
      }

      setAdmins((prev) => prev.filter((admin) => admin.id !== revokingAdmin.id));
      fetchRevokedAdmins();
      setShowRevokeModal(false);
      setRevokeReason("");
      setRevokingAdmin(null);
      setSuccess("Admin revoked successfully.");
    } catch (error) {
      console.error("Error revoking admin:", error);
      setError("Failed to revoke admin. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchRevokedAdmins();
  }, []);

  // Filtered lists for search
  const filteredAdmins = admins.filter((admin) =>
    (admin.name || admin.email || "")
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase())
  );
  const filteredRevokedAdmins = revokedAdmins.filter((admin) =>
    (admin.name || admin.email || "")
      .toLowerCase()
      .includes(revokedSearchTerm.trim().toLowerCase())
  );

  // --- Styles using the provided color scheme and structure ---
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
    subheading: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      textAlign: "center",
      margin: "1.5rem 0 0.5rem 0",
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
    form: {
      display: "flex",
      flexDirection: "row",
      gap: "0.5rem",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: "2rem",
      flexWrap: "nowrap",
      width: "100%",
      maxWidth: "480px",
      marginLeft: "auto",
      marginRight: "auto",
    },
    input: {
      padding: "0.75rem",
      borderRadius: "0.5rem",
      border: "1px solid #CBD5E0",
      fontSize: "1rem",
      width: "100%",
      maxWidth: "260px",
      backgroundColor: "#243447",
      color: "#FFFFFF",
      boxSizing: "border-box",
      height: "44px",
      lineHeight: "1.2",
      display: "block",
    },
    button: {
      padding: "0 1.5rem",
      backgroundColor: "#64CCC5",
      color: "#132238",
      border: "none",
      borderRadius: "0.5rem",
      fontSize: "1rem",
      fontWeight: "bold",
      cursor: "pointer",
      whiteSpace: "nowrap",
      height: "44px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
    },
    error: {
      color: "#E53E3E",
      textAlign: "center",
      marginTop: "0.5rem",
    },
    success: {
      color: "#38A169",
      textAlign: "center",
      marginTop: "0.5rem",
    },
    adminCard: {
      backgroundColor: "#243447",
      padding: "1rem",
      borderRadius: "0.5rem",
      marginBottom: "1rem",
      color: "#FFFFFF",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
    adminName: {
      color: "#64CCC5",
      marginBottom: "0.5rem",
    },
    revokeButton: {
      marginTop: "0.5rem",
      padding: "0.5rem 1rem",
      backgroundColor: "#E53E3E",
      color: "#FFFFFF",
      border: "none",
      borderRadius: "0.5rem",
      cursor: "pointer",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
    revokedCard: {
      backgroundColor: "#243447",
      padding: "1rem",
      borderRadius: "0.5rem",
      marginBottom: "1rem",
      color: "#FFFFFF",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
    revokedReason: {
      color: "#FBBF24",
      marginTop: "0.5rem",
    },
  };

  return (
    <section style={styles.container}>
      <article style={styles.article}>
        <h2 style={styles.heading}>Manage Admins</h2>
        

        {/* Add Admin Form */}
        <form onSubmit={handleAddAdmin} style={styles.form}>
          <input
            type="email"
            placeholder="Enter admin email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Adding..." : "Add Admin"}
          </button>
        </form>
        
        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        {/* Current Admins Heading */}
        <h3 style={styles.subheading}>Current Admins</h3>

        {/* Search Admins */}
        <input
          type="text"
          placeholder="Search by admin name or email..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <p style={styles.description}>
          Below is the list of all users with the{" "}
          <span style={{ fontWeight: "bold" }}>admin</span> role:
        </p>
        {/* List of Admins */}
        {filteredAdmins.length > 0 ? (
          filteredAdmins.map((admin) => (
            <div key={admin.id} style={styles.adminCard}>
              <p style={styles.adminName}>{admin.name || admin.email}</p>
              <p style={{ color: "#A0AEC0", fontSize: "0.95rem", margin: 0 }}>
                {admin.email}
              </p>
              <button
                onClick={() => openRevokeModal(admin)}
                style={styles.revokeButton}
              >
                Revoke Admin
              </button>
            </div>
          ))
        ) : (
          <p style={{ color: "#cbd5e0", textAlign: "center" }}>No admins found.</p>
        )}
      </article>

      {/* Revoke Reason Modal */}
      {showRevokeModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ marginBottom: "1rem" }}>Revoke Admin</h3>
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
                  setRevokingAdmin(null);
                }}
                style={styles.modalCancel}
              >
                Cancel
              </button>
              <button
                onClick={confirmRevokeAdmin}
                style={styles.modalConfirm}
                disabled={loading}
              >
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add space between current and revoked admins */}
      <div style={{ height: "2.5rem" }} />

      {/* Revoked Admins */}
      <article style={styles.article}>
        <h2 style={styles.heading}>Revoked Admins</h2>
        <p style={styles.description}>
          Below is the list of all admins who have been revoked:
        </p>
        {/* Search Revoked Admins */}
        <input
          type="text"
          placeholder="Search by admin name or email..."
          style={styles.searchInput}
          value={revokedSearchTerm}
          onChange={(e) => setRevokedSearchTerm(e.target.value)}
        />
        {filteredRevokedAdmins.length > 0 ? (
          filteredRevokedAdmins.map((admin) => (
            <div key={admin.id} style={styles.revokedCard}>
              <p style={styles.adminName}>{admin.name || admin.email}</p>
              <p style={{ color: "#A0AEC0", fontSize: "0.95rem", margin: 0 }}>
                {admin.email}
              </p>
              {admin.revokeReason && (
                <p style={styles.revokedReason}>
                  <strong>Revoke Reason:</strong> {admin.revokeReason}
                </p>
              )}
            </div>
          ))
        ) : (
          <p style={{ color: "#cbd5e0", textAlign: "center" }}>No revoked admins found.</p>
        )}
      </article>
    </section>
  );
}
