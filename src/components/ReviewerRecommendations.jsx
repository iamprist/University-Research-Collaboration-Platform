import React, { useEffect, useState } from "react";
import { getFirestore, collection, doc, getDoc, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const tagAliases = {
  CS: "Computer Science",
  AI: "Artificial Intelligence",
  ML: "Machine Learning",
  // add more aliases as needed
};

// Normalize tags: map alias to canonical form
function normalizeTag(tag) {
  const t = tag.trim().toLowerCase();
  for (const [alias, canonical] of Object.entries(tagAliases)) {
    if (alias.toLowerCase() === t) return canonical.toLowerCase();
  }
  return t;
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.map(normalizeTag);
}

export default function ReviewerRecommendations() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    async function fetchRecommendations() {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("User not logged in");
          setLoading(false);
          return;
        }

        // Get reviewer doc by uid
        const reviewerDocRef = doc(db, "reviewers", user.uid);
        const reviewerDocSnap = await getDoc(reviewerDocRef);
        if (!reviewerDocSnap.exists()) {
          setError("Reviewer profile not found");
          setLoading(false);
          return;
        }

        const reviewerData = reviewerDocSnap.data();
        if (!Array.isArray(reviewerData.expertiseTags) || reviewerData.expertiseTags.length === 0) {
          setExpertiseTags([]);
          setRecommendations([]);
          setLoading(false);
          return;
        }

        // Normalize expertise tags
        const normalizedExpertiseTags = normalizeTags(reviewerData.expertiseTags);
        setExpertiseTags(normalizedExpertiseTags);

        // Fetch all research listings
        const researchListingsCol = collection(db, "research-listings");
        const researchSnapshot = await getDocs(researchListingsCol);
        const matches = [];

        researchSnapshot.forEach((docSnap) => {
          const data = docSnap.data();

          // Normalize research tags
          const keywords = normalizeTags(data.keywords || []);
          const researchArea = data.researchArea ? normalizeTag(data.researchArea) : null;

          // Check for overlap between expertiseTags and keywords or researchArea
          const hasOverlap =
            normalizedExpertiseTags.some((tag) => keywords.includes(tag)) ||
            (researchArea && normalizedExpertiseTags.includes(researchArea));

          if (hasOverlap) {
            matches.push({
              id: docSnap.id,
              title: data.title || "Untitled",
              summary: data.summary || "",
              researchArea: data.researchArea || "",
              keywords: data.keywords || [],
              institution: data.institution || "",
              department: data.department || "",
            });
          }
        });

        setRecommendations(matches);
        setLoading(false);
      } catch (e) {
        console.error("Error fetching recommendations:", e);
        setError("Failed to fetch recommendations");
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [auth, db]);

  if (loading) return <div>Loading recommendations...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  if (!expertiseTags.length)
    return (
      <div>
        <p>You have no expertise tags set in your profile, so no recommendations can be made.</p>
      </div>
    );

  if (recommendations.length === 0)
    return (
      <div>
        <p>
          No research listings matched your expertise tags: <b>{expertiseTags.join(", ")}</b>.
        </p>
      </div>
    );

  return (
    <div>
      <h3>Recommended Research Based on Your Expertise</h3>
      <ul className="list-group">
        {recommendations.map((r) => (
          <li key={r.id} className="list-group-item mb-3">
            <h5>{r.title}</h5>
            <p><b>Summary:</b> {r.summary}</p>
            <p>
              <b>Research Area:</b> {r.researchArea} <br />
              <b>Keywords:</b> {r.keywords.join(", ")} <br />
              <b>Institution:</b> {r.institution} <br />
              <b>Department:</b> {r.department}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
