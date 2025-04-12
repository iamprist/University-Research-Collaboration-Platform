import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebaseConfig";

function ResearcherDashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const q = query(
          collection(db, "projects"),
          where("ownerId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(data);
        setLoading(false);
      }
    });
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Your Project Listings</h2>
      {projects.length === 0 ? (
        <p>You have no projects yet.</p>
      ) : (
        projects.map((proj) => (
          <div key={proj.id}>
            <h3>{proj.title}</h3>
            <p>{proj.description}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default ResearcherDashboard;
