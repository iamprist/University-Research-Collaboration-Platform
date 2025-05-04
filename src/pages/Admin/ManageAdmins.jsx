import React, { useEffect, useState } from "react";
import { db, auth } from "../../config/firebaseConfig";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  // Add a new admin (also create Firebase Auth user)
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setError(""); // Clear any previous error messages
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
      // Check if email already exists in Firestore
      const querySnapshot = await getDocs(collection(db, "users"));
      const existingAdmin = querySnapshot.docs.some(
        (doc) => doc.data().email === newAdminEmail
      );

      if (existingAdmin) {
        setError("This email is already associated with an admin account.");
        return;
      }

      // Create a Firebase Auth user
      const password = "TemporaryPassword123"; // Temp password for new admin
      const userCred = await createUserWithEmailAndPassword(auth, newAdminEmail, password);
      const user = userCred.user;

      // Add the new admin to Firestore
      await addDoc(collection(db, "users"), {
        email: newAdminEmail,
        role: "admin", // Assign the admin role
        uid: user.uid, // Store the Firebase Auth UID
      });

      setNewAdminEmail(""); // Reset the form
      fetchAdmins(); // Refresh the admin list
      setError(""); // Clear error if successful
    } catch (error) {
      console.error("Error adding admin:", error);
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already in use. Please try a different one.");
      } else {
        setError("Failed to add admin. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Revoke an admin (delete from Firestore)
  const handleRevokeAdmin = async (id) => {
    try {
      console.log("Revoking admin with ID:", id); // Debugging
      const adminDoc = doc(db, "users", id);
      await deleteDoc(adminDoc); // Delete the admin document from Firestore
      setAdmins((prev) => prev.filter((admin) => admin.id !== id)); // Remove from the list
      console.log("Admin deleted:", id);
    } catch (error) {
      console.error("Error revoking admin:", error);
      setError("Failed to revoke admin. Please try again.");
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Inline styles
  const styles = {
    container: {
      minHeight: "100vh",
      background: "#1a2e40", // Consistent with the sidebar color
      color: "#FFFFFF",
      padding: "1rem",
    },
    article: {
      maxWidth: "960px",
      margin: "0 auto",
      padding: "1.5rem",
      backgroundColor: "#243447", // Updated to a slightly lighter shade for better contrast
      borderRadius: "0.5rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    heading: {
      fontSize: "2rem",
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: "1rem",
    },
    description: {
      textAlign: "center",
      color: "#A0AEC0",
      marginBottom: "1.5rem",
    },
    form: {
      display: "flex",
      flexDirection: "row",
      gap: "1rem",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: "2rem",
      flexWrap: "wrap",
    },
    input: {
      padding: "0.75rem",
      borderRadius: "0.5rem",
      border: "1px solid #CBD5E0",
      fontSize: "1rem",
      width: "100%",
      maxWidth: "300px",
      backgroundColor: "#374151",
      color: "#FFFFFF",
    },
    button: {
      padding: "0.75rem 1.5rem",
      backgroundColor: "#64CCC5", // Original button color
      color: "#132238", // Original text color
      border: "none",
      borderRadius: "0.5rem",
      fontSize: "1rem",
      fontWeight: "bold",
      cursor: "pointer",
    },
    error: {
      color: "#E53E3E",
      textAlign: "center",
      marginTop: "0.5rem",
    },
    adminCard: {
      backgroundColor: "#4A5568",
      padding: "1rem",
      borderRadius: "0.5rem",
      marginBottom: "1rem",
      color: "#FFFFFF",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    adminName: {
      color: "#64CCC5", // Consistent with the button color
      marginBottom: "0.5rem",
    },
    revokeButton: {
      marginTop: "0.5rem",
      padding: "0.5rem 1rem",
      backgroundColor: "#E53E3E", // Red color for revoke button
      color: "#FFFFFF", // White text for contrast
      border: "none",
      borderRadius: "0.5rem",
      cursor: "pointer",
    },
  };

  return (
    <section style={styles.container}>
      <article style={styles.article}>
        <h2 style={styles.heading}>Manage Admins</h2>
        <p style={styles.description}>
          Below is the list of all users with the <span style={{ fontWeight: "bold" }}>admin</span> role:
        </p>

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

        {/* List of Admins */}
        {admins.length > 0 ? (
          admins.map((admin) => (
            <div key={admin.id} style={styles.adminCard}>
              <p style={styles.adminName}>{admin.email}</p>
              <button
                onClick={() => handleRevokeAdmin(admin.id)}
                style={styles.revokeButton}
              >
                Revoke Admin
              </button>
            </div>
          ))
        ) : (
          <p>No admins found.</p>
        )}
      </article>
    </section>
  );
}
