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
import './ManageAdmins.css';

// Main component for managing admin users
export default function ManageAdmins() {
  // State for current and revoked admins
  const [admins, setAdmins] = useState([]);
  const [revokedAdmins, setRevokedAdmins] = useState([]);
  // State for new admin form
  const [newAdminEmail, setNewAdminEmail] = useState("");
  // State for error/success messages and loading
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // State for revoke modal
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokingAdmin, setRevokingAdmin] = useState(null);

  // State for search inputs
  const [searchTerm, setSearchTerm] = useState("");
  const [revokedSearchTerm, setRevokedSearchTerm] = useState("");

  // Fetch all admins from Firestore
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

  // Fetch all revoked admins from Firestore
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

  // Add a new admin (by email)
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
      // Check if email already exists as admin
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

  // Open the revoke modal for a specific admin
  const openRevokeModal = (admin) => {
    setRevokingAdmin(admin);
    setRevokeReason("");
    setShowRevokeModal(true);
  };

  // Confirm revoke admin (update role and add reason)
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

  // Fetch admins and revoked admins on mount
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

  return (
    <section className="manage-admins-container">
      {/* Main admin management section */}
      <article className="manage-admins-article">
        <h2 className="manage-admins-heading">Manage Admins</h2>
        
        {/* Add Admin Form */}
        <form onSubmit={handleAddAdmin} className="manage-admins-form">
          <input
            type="email"
            placeholder="Enter admin email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="manage-admins-input"
          />
          <button type="submit" className="manage-admins-button" disabled={loading}>
            {loading ? "Adding..." : "Add Admin"}
          </button>
        </form>
        
        {/* Show error or success messages */}
        {error && <p className="manage-admins-error">{error}</p>}
        {success && <p className="manage-admins-success">{success}</p>}

        {/* Current Admins Heading */}
        <h3 className="manage-admins-subheading">Current Admins</h3>

        {/* Search Admins */}
        <input
          type="text"
          placeholder="Search by admin name or email..."
          className="manage-admins-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <p className="manage-admins-description">
          Below is the list of all users with the{" "}
          <span style={{ fontWeight: "bold" }}>admin</span> role:
        </p>
        {/* List of Admins */}
        {filteredAdmins.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {filteredAdmins.map((admin) => (
              <li key={admin.id} style={{ marginBottom: "1rem" }}>
                <article className="manage-admins-admin-card">
                  <p className="manage-admins-admin-name">{admin.name || admin.email}</p>
                  <p style={{ color: "#A0AEC0", fontSize: "0.95rem", margin: 0 }}>
                    {admin.email}
                  </p>
                  <button
                    onClick={() => openRevokeModal(admin)}
                    className="manage-admins-revoke-button"
                  >
                    Revoke Admin
                  </button>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "#cbd5e0", textAlign: "center" }}>No admins found.</p>
        )}
      </article>

      {/* Revoke Reason Modal */}
      {showRevokeModal && (
        <dialog open className="manage-admins-modal-overlay">
          <form
            className="manage-admins-modal"
            onSubmit={(e) => {
              e.preventDefault();
              confirmRevokeAdmin();
            }}
          >
            <h3 style={{ marginBottom: "1rem" }}>Revoke Admin</h3>
            <label htmlFor="revoke-reason" className="manage-admins-modal-label">
              Please provide a reason for revoking:
            </label>
            <textarea
              id="revoke-reason"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={3}
              className="manage-admins-modal-textarea"
            />
            <div className="manage-admins-modal-button-row">
              <button
                type="button"
                onClick={() => {
                  setShowRevokeModal(false);
                  setRevokeReason("");
                  setRevokingAdmin(null);
                }}
                className="manage-admins-modal-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="manage-admins-modal-confirm"
                disabled={loading}
              >
                Confirm Revoke
              </button>
            </div>
          </form>
        </dialog>
      )}

      {/* Add space between current and revoked admins */}
      <div style={{ height: "2.5rem" }} />

      {/* Revoked Admins Section */}
      <article className="manage-admins-article">
        <h2 className="manage-admins-heading">Revoked Admins</h2>
        <p className="manage-admins-description">
          Below is the list of all admins who have been revoked:
        </p>
        {/* Search Revoked Admins */}
        <input
          type="text"
          placeholder="Search by admin name or email..."
          className="manage-admins-search-input"
          value={revokedSearchTerm}
          onChange={(e) => setRevokedSearchTerm(e.target.value)}
        />
        {/* List of Revoked Admins */}
        {filteredRevokedAdmins.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {filteredRevokedAdmins.map((admin) => (
              <li key={admin.id} style={{ marginBottom: "1rem" }}>
                <article className="manage-admins-revoked-card">
                  <p className="manage-admins-admin-name">{admin.name || admin.email}</p>
                  <p style={{ color: "#A0AEC0", fontSize: "0.95rem", margin: 0 }}>
                    {admin.email}
                  </p>
                  {admin.revokeReason && (
                    <p className="manage-admins-revoked-reason">
                      <strong>Revoke Reason:</strong> {admin.revokeReason}
                    </p>
                  )}
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "#cbd5e0", textAlign: "center" }}>No revoked admins found.</p>
        )}
      </article>
    </section>
  );
}
