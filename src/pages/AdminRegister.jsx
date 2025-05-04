import React, { useState } from "react";
import { auth, db } from "../config/firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function AdminRegister() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!email || !password || !name) return toast.error("All fields are required.");
    setLoading(true);
    try {
      // Check if email is in invitedAdmins
      const invitedDoc = await getDoc(doc(db, "invitedAdmins", email));
      if (!invitedDoc.exists()) {
        toast.error("You are not authorized to register as an admin.");
        setLoading(false);
        return;
      }

      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });

      // Save to users collection
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        role: "admin",
      });

      toast.success("Registration successful!");
      navigate("/admin");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to register.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto" }}>
      <h2>Admin Registration</h2>
      <p>Only invited admins may register here.</p>

      <input
        type="text"
        value={name}
        placeholder="Full Name"
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />
      <input
        type="email"
        value={email}
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />
      <input
        type="password"
        value={password}
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />
      <button onClick={handleRegister} style={buttonStyle} disabled={loading}>
        {loading ? "Registering..." : "Register as Admin"}
      </button>
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "0.75rem",
  marginBottom: "1rem",
  borderRadius: "0.5rem",
  border: "1px solid #ccc",
};

const buttonStyle = {
  width: "100%",
  padding: "0.75rem",
  backgroundColor: "#132238",
  color: "#fff",
  border: "none",
  borderRadius: "0.5rem",
  fontWeight: "bold",
  cursor: "pointer",
};

export default AdminRegister;
