/*import React, { useEffect, useState } from "react";
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
    if (expandedProject === projectId) {
      setExpandedProject(null);
    } else {
      setExpandedProject(projectId);
    }
  };

  if (loading) return (
    <div className="text-center" style={{ padding: '40px' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="sr-only">Loading...</span>
      </div>
      <p style={{ marginTop: '15px' }}>Loading recommendations...</p>
    </div>
  );

  if (error) return (
    <div className="alert alert-danger" style={{ maxWidth: '600px', margin: '20px auto' }}>
      {error}
    </div>
  );

  if (!expertiseTags.length)
    return (
      <div className="container py-4 text-center">
        <p>You have no expertise tags set in your profile, so no recommendations can be made.</p>
      </div>
    );

  if (recommendations.length === 0)
    return (
      <div className="container py-4 text-center">
        <p>
          No research listings matched your expertise tags: <b>{expertiseTags.join(", ")}</b>.
        </p>
      </div>
    );

  return (
    <>
      <Helmet>
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
      </Helmet>

      <div style={{
        backgroundColor: '#fff',
        color: '#333',
        fontFamily: '"Open Sans", sans-serif',
        padding: '20px',
        minHeight: '100vh'
      }}>
        <div className="container">
          <h2 style={{
            fontWeight: 700,
            marginBottom: '30px',
            textAlign: 'center',
            fontSize: '28px',
            color: '#2c3e50'
          }}>
            Recommended Research Projects
          </h2>

          <div className="row" style={{ marginBottom: '30px' }}>
            <div className="col-md-12 text-center">
              <p style={{ fontSize: '16px', marginBottom: '20px' }}>
                <strong>Your expertise tags:</strong> {expertiseTags.map((tag) => (
                  <span key={tag} style={{
                    display: 'inline-block',
                    backgroundColor: '#e0e0e0',
                    padding: '5px 10px',
                    borderRadius: '15px',
                    margin: '5px',
                    fontSize: '14px',
                    fontWeight: 600
                  }}>
                    {tagAliases[tag.toUpperCase()] || tag}
                  </span>
                ))}
              </p>
            </div>
          </div>

          <div className="row">
            {recommendations.map((project) => (
              <div key={project.id} className="col-md-4 col-sm-6" style={{ marginBottom: '30px' }}>
                <div style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '20px',
                  height: '100%',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    marginBottom: '15px',
                    color: '#2c3e50'
                  }}>
                    {project.title}
                  </h3>

                  <div style={{ marginBottom: '15px' }}>
                    <span style={{
                      backgroundColor: '#3498db',
                      color: 'white',
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      display: 'inline-block',
                      marginBottom: '10px'
                    }}>
                      {project.researchArea}
                    </span>
                  </div>

                  <p style={{
                    fontSize: '15px',
                    lineHeight: '1.6',
                    marginBottom: '15px'
                  }}>
                    {project.summary.length > 150 
                      ? `${project.summary.substring(0, 150)}...` 
                      : project.summary}
                  </p>

                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ marginBottom: '5px' }}>
                      <strong style={{ color: '#7f8c8d' }}>Researcher:</strong> {project.postedByName}
                    </p>
                    <p style={{ marginBottom: '5px' }}>
                      <strong style={{ color: '#7f8c8d' }}>Institution:</strong> {project.institution}
                    </p>
                  </div>

                  <button
                    onClick={() => handleExpand(project.id)}
                    style={{
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      padding: '8px 15px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      width: '100%',
                      transition: 'background-color 0.3s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
                  >
                    {expandedProject === project.id ? 'Show Less' : 'View Details'}
                  </button>

                  {expandedProject === project.id && (
                    <div style={{
                      marginTop: '20px',
                      paddingTop: '15px',
                      borderTop: '1px solid #eee'
                    }}>
                      <h4 style={{ fontSize: '18px', marginBottom: '10px' }}>Full Details</h4>
                      <p><strong>Methodology:</strong> {project.methodology}</p>
                      <p><strong>Collaboration Needs:</strong> {project.collaborationNeeds}</p>
                      <p><strong>Estimated Completion:</strong> {project.estimatedCompletion}</p>
                      <p><strong>Department:</strong> {project.department}</p>
                      <p><strong>Email:</strong> {project.postedByEmail}</p>
                      <p>
                        <strong>Keywords:</strong> {project.keywords.map((kw, idx) => (
                          <span key={idx} style={{
                            display: 'inline-block',
                            backgroundColor: '#e0e0e0',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            margin: '3px',
                            fontSize: '12px'
                          }}>
                            {kw}
                          </span>
                        ))}
                      </p>
                      <a 
                        href={project.relatedPublicationLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          color: '#3498db',
                          textDecoration: 'none',
                          fontWeight: 600,
                          display: 'inline-block',
                          marginTop: '10px'
                        }}
                      >
                        View Publication →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}*/
