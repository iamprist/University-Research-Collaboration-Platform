import React, { useEffect, useState } from "react";
import { getFirestore, collection, doc, getDoc, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const tagAliases = {
  PHYS: "Physics",
  CHEM: "Chemistry",
  BIO: "Biology",
  CS: "Computer Science",
  AI: "Artificial Intelligence",
  MED: "Medicine",
  LAW: "Law",
  BUS: "Business Administration",
  FIN: "Finance",
  MKT: "Marketing",
  HRM: "Human Resources",
  EDU: "Education",
  PSY: "Psychology",
  ENG: "Engineering",
  ENV: "Environmental Science",
  SOC: "Sociology",
  POL: "Political Science",
  ECO: "Economics",
  PHIL: "Philosophy",
  HIST: "History",
  GEO: "Geography",
  ART: "Art",
  MATH: "Mathematics",
  STAT: "Statistics",
  ANTH: "Anthropology",
  LING: "Linguistics",
  COM: "Communication",
  NUR: "Nursing",
  PHAR: "Pharmacy",
  AGRI: "Agriculture",
  VET: "Veterinary Science",
  ARCH: "Architecture",
  Other: "Other (please specify)",
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

export default function ResearchProjectDisplay() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [expandedProject, setExpandedProject] = useState(null); // Track expanded project

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

        for (const docSnap of researchSnapshot.docs) {
          const data = docSnap.data();
          const userId = data.userId; // Get userId from the research listing

          // Normalize research tags
          const keywords = normalizeTags(data.keywords || []);
          const researchArea = data.researchArea ? normalizeTag(data.researchArea) : null;

          // Check for overlap between expertiseTags and keywords or researchArea
          const hasOverlap =
            normalizedExpertiseTags.some((tag) => keywords.includes(tag)) ||
            (researchArea && normalizedExpertiseTags.includes(researchArea));

          if (hasOverlap) {
            // Fetch user details (name, email) from the users collection
            const userDocRef = doc(db, "users", userId);
            const userDocSnap = await getDoc(userDocRef);
            let postedByName = "Unknown";
            let postedByEmail = "N/A";

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              postedByName = userData.name || "Unknown";
              postedByEmail = userData.email || "N/A";
            }

            // Combine the research listing with user info
            matches.push({
              id: docSnap.id,
              title: data.title || "Untitled",
              summary: data.summary || "",
              researchArea: data.researchArea || "",
              keywords: data.keywords || [],
              institution: data.institution || "",
              department: data.department || "",
              postedByName,
              postedByEmail,
              methodology: data.methodology || "Not Specified",
              collaborationNeeds: data.collaborationNeeds || "Not Specified",
              estimatedCompletion: data.estimatedCompletion || "N/A",
              relatedPublicationLink: data.publicationLink || "#"
            });
          }
        }

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

  const handleExpand = (projectId) => {
    if (expandedProject === projectId) {
      setExpandedProject(null); // Collapse if already expanded
    } else {
      setExpandedProject(projectId); // Expand the project
    }
  };

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
    <div className="container">
      <h3 className="mb-4">Recommended Research Based on Your Expertise</h3>
      {recommendations.map((r) => (
        <div key={r.id} className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">{r.title}</h5>
            <p className="card-text"><strong>Lead Researcher:</strong> {r.postedByName}</p>
            <p className="card-text"><strong>Email:</strong> {r.postedByEmail}</p>
            <h6 className="mt-3">Project Summary</h6>
            <p className="card-text">{r.summary}</p>
            <h6>Research Area</h6>
            <p className="card-text">{r.researchArea}</p>
            <h6>Department</h6>
            <p className="card-text">{r.department}</p>
            <h6>Methodology</h6>
            <p className="card-text">{r.methodology}</p>
            <h6>Collaboration Needs</h6>
            <p className="card-text">{r.collaborationNeeds}</p>
            <h6>Estimated Completion</h6>
            <p className="card-text">{r.estimatedCompletion}</p>

            <button 
              className="btn btn-primary" 
              onClick={() => handleExpand(r.id)}>
              {expandedProject === r.id ? "Hide Details" : "View Publication"}
            </button>

            {expandedProject === r.id && (
              <div className="mt-4">
                <h5>Full Project Details</h5>
                <p><strong>Project Status:</strong> Active</p>
                <p><strong>Estimated Completion:</strong> {r.estimatedCompletion}</p>
                <p><strong>Research Area:</strong> {r.researchArea}</p>
                <p><strong>Methodology:</strong> {r.methodology}</p>
                <p><strong>Collaboration Needs:</strong> {r.collaborationNeeds}</p>
                <p><strong>Lead Researcher:</strong> {r.postedByName}</p>
                <p><strong>Email:</strong> {r.postedByEmail}</p>

              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
