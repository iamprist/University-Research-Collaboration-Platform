import { auth, provider, db } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import React from "react";

function SignInPage() {
  const navigate = useNavigate();

  // List of allowed admin emails
  const allowedAdmins = ["2550411@students.wits.ac.za", "2465030@students.wits.ac.za", "2562270@students.wits.ac.za", "2542032@students.wits.ac.za", "2556239@students.wits.ac.za", "2555497@students.wits.ac.za"];

  const handleSignIn = async (role) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (role === "admin" && !allowedAdmins.includes(user.email)) {
        alert("Access denied: You are not an authorized admin.");
        return;
      }

      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName,
        email: user.email,
        role,
      });

      navigate(`/${role}`);
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <section style={{ textAlign: "center", padding: "2rem" }}>
      <h2>Login As:</h2>
      <button onClick={() => handleSignIn("researcher")}>Researcher</button>
      <button onClick={() => handleSignIn("reviewer")}>Reviewer</button>
      <button onClick={() => handleSignIn("admin")}>Admin</button>
    </section>
  );
}

export default SignInPage;
