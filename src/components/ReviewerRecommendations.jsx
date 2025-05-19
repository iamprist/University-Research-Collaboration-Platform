import React, { useEffect, useState } from "react";
import { getFirestore, collection, doc, getDoc, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Helmet } from "react-helmet";

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
  const [expandedProject, setExpandedProject] = useState(null);

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

        const normalizedExpertiseTags = normalizeTags(reviewerData.expertiseTags);
        setExpertiseTags(normalizedExpertiseTags);

        const researchListingsCol = collection(db, "research-listings");
        const researchSnapshot = await getDocs(researchListingsCol);
        const matches = [];

        for (const docSnap of researchSnapshot.docs) {
          const data = docSnap.data();
          const userId = data.userId;

          const keywords = normalizeTags(data.keywords || []);
          const researchArea = data.researchArea ? normalizeTag(data.researchArea) : null;

          const hasOverlap =
            normalizedExpertiseTags.some((tag) => keywords.includes(tag)) ||
            (researchArea && normalizedExpertiseTags.includes(researchArea));

          if (hasOverlap) {
            const userDocRef = doc(db, "users", userId);
            const userDocSnap = await getDoc(userDocRef);
            let postedByName = "Unknown";
            let postedByEmail = "N/A";

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              postedByName = userData.name || "Unknown";
              postedByEmail = userData.email || "N/A";
            }

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
              relatedPublicationLink: data.publicationLink || "#",
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
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  if (loading) {
    return (
      <section
        aria-busy="true"
        style={{ padding: "40px", textAlign: "center" }}
      >
        <progress className="spinner-border text-primary" />
        <p style={{ marginTop: "15px" }}>Loading recommendations...</p>
      </section>
    );
  }

  if (error) {
    return (
      <aside
        role="alert"
        style={{ maxWidth: "600px", margin: "20px auto", color: "#842029", backgroundColor: "#f8d7da", padding: "20px", borderRadius: "4px" }}
      >
        {error}
      </aside>
    );
  }

  if (!expertiseTags.length) {
    return (
      <section
        aria-live="polite"
        style={{ padding: "40px", textAlign: "center" }}
      >
        <p>You have no expertise tags set in your profile, so no recommendations can be made.</p>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return (
      <section
        aria-live="polite"
        style={{ padding: "40px", textAlign: "center" }}
      >
        <p>
          No research listings matched your expertise tags:{" "}
          <strong>{expertiseTags.join(", ")}</strong>.
        </p>
      </section>
    );
  }

  return (
    <>
      <Helmet>
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <main
        style={{
          backgroundColor: "white",
          color: "black",
          fontFamily: '"Open Sans", sans-serif',
          padding: "20px",
          minHeight: "100vh",
        }}
      >
        <section>
          <header>
            <h2
              style={{
                fontWeight: 700,
                marginBottom: "30px",
                textAlign: "center",
                fontSize: "28px",
                color: "black",
              }}
            >
              Recommended Research Projects
            </h2>
          </header>

          <section
            aria-label="Your expertise tags"
            style={{ textAlign: "center", marginBottom: "30px" }}
          >
            <p style={{ fontSize: "16px", marginBottom: "20px" }}>
              <strong>Your expertise tags:</strong>
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {expertiseTags.map((tag) => (
                <li
                  key={tag}
                  style={{
                    display: "inline-block",
                    backgroundColor: "#e0e0e0",
                    padding: "5px 10px",
                    borderRadius: "15px",
                    margin: "5px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "black",
                  }}
                >
                  {tagAliases[tag.toUpperCase()] || tag}
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Project recommendations">
            {recommendations.map((project) => (
              <article
                key={project.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "20px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  backgroundColor: "white",
                  color: "black",
                  transition: "all 0.3s ease",
                  marginBottom: "30px",
                }}
              >
                <header>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      marginBottom: "15px",
                      color: "black",
                    }}
                  >
                    {project.title}
                  </h3>
                  <p style={{ marginBottom: "15px" }}>
                    <mark
                      style={{
                        backgroundColor: "#3498db",
                        color: "white",
                        padding: "3px 10px",
                        borderRadius: "4px",
                        fontSize: "14px",
                        display: "inline-block",
                      }}
                    >
                      {project.researchArea}
                    </mark>
                  </p>
                </header>

                <p
                  style={{
                    fontSize: "15px",
                    lineHeight: "1.6",
                    marginBottom: "15px",
                    color: "black",
                  }}
                >
                  {project.summary.length > 150
                    ? `${project.summary.substring(0, 150)}...`
                    : project.summary}
                </p>

                <dl style={{ marginBottom: "15px" }}>
                  <dt>
                    <strong style={{ color: "#7f8c8d" }}>Researcher:</strong>
                  </dt>
                  <dd style={{ marginLeft: 0 }}>{project.postedByName}</dd>
                  <dt>
                    <strong style={{ color: "#7f8c8d" }}>Institution:</strong>
                  </dt>
                  <dd style={{ marginLeft: 0 }}>{project.institution}</dd>
                </dl>

                <button
                  onClick={() => handleExpand(project.id)}
                  style={{
                    backgroundColor: "#3498db",
                    color: "white",
                    border: "none",
                    padding: "8px 15px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 600,
                    width: "100%",
                    transition: "background-color 0.3s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2980b9")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3498db")}
                >
                  {expandedProject === project.id ? "Show Less" : "View Details"}
                </button>

                {expandedProject === project.id && (
                  <section
                    aria-label="Project details"
                    style={{
                      marginTop: "20px",
                      paddingTop: "15px",
                      borderTop: "1px solid #ccc",
                      color: "black",
                    }}
                  >
                    <dl>
                      <dt><strong>Methodology:</strong></dt>
                      <dd>{project.methodology}</dd>
                      <dt><strong>Collaboration Needs:</strong></dt>
                      <dd>{project.collaborationNeeds}</dd>
                      <dt><strong>Estimated Completion:</strong></dt>
                      <dd>{project.estimatedCompletion}</dd>
                    </dl>
                    <p>
                      <a href={project.relatedPublicationLink} target="_blank" rel="noopener noreferrer">
                        Related Publication
                      </a>
                    </p>
                  </section>
                )}
              </article>
            ))}
          </section>
        </section>
      </main>
    </>
  );
}
