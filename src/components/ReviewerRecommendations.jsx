import React, { useEffect, useState } from "react";
import { getFirestore, collection, doc, getDoc, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Helmet } from "react-helmet";
import { Box, Paper, Typography, Chip, Button, Collapse } from "@mui/material";

// Mapping of tag aliases to canonical names
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

export default function ReviewerRecommendations() {
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

  // Loading state UI
  if (loading) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Box className="spinner-border text-primary" sx={{ mb: 2 }} />
        <Typography sx={{ color: "#132238" }}>Loading recommendations...</Typography>
      </Box>
    );
  }

  // Error state UI
  if (error) {
    return (
      <Paper
        role="alert"
        sx={{
          maxWidth: 600,
          mx: "auto",
          my: 3,
          color: "#842029",
          bgcolor: "#fff",
          p: 3,
          borderRadius: 2,
          border: "1px solid #FECACA",
        }}
      >
        <Typography sx={{ color: "#EF4444" }}>{error}</Typography>
      </Paper>
    );
  }

  // No expertise tags UI
  if (!expertiseTags.length)
    return (
      <Paper sx={{ bgcolor: "#fff", color: "#132238", p: 3, borderRadius: 3, my: 3, textAlign: "center", border: "1px solid #e0e0e0" }}>
        <Typography>You have no expertise tags set in your profile, so no recommendations can be made.</Typography>
      </Paper>
    );

  // No recommendations UI
  if (recommendations.length === 0)
    return (
      <Paper sx={{ bgcolor: "#fff", color: "#132238", p: 3, borderRadius: 3, my: 3, textAlign: "center", border: "1px solid #e0e0e0" }}>
        <Typography>
          No research listings matched your expertise tags:{" "}
          <b>{expertiseTags.join(", ")}</b>.
        </Typography>
      </Paper>
    );

  // Render recommendations UI
  return (
    <>
      <Helmet>
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      <Box sx={{ fontFamily: '"Open Sans", sans-serif', minHeight: "100vh", p: 0 }}>
        <Paper
          sx={{
            bgcolor: "#fff",
            color: "#132238",
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            mb: 3,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="h5" sx={{ color: "#132238", fontWeight: 700, mb: 2, textAlign: "center" }}>
            Recommended Research Projects
          </Typography>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography sx={{ color: "#132238", fontSize: 16, mb: 1 }}>
              <b>Your expertise tags:</b>{" "}
              {expertiseTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tagAliases[tag.toUpperCase()] || tag}
                  sx={{
                    bgcolor: "#e0e0e0",
                    color: "#132238",
                    fontWeight: 600,
                    fontSize: 14,
                    mx: 0.5,
                    my: 0.5,
                  }}
                  size="small"
                />
              ))}
            </Typography>
          </Box>
          <Box>
            {recommendations.map((project) => (
              <Paper
                key={project.id}
                sx={{
                  bgcolor: "#f9fafb",
                  color: "#132238",
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  p: 3,
                  mb: 3,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                  transition: "all 0.3s",
                }}
              >
                <Typography variant="h6" sx={{ color: "#132238", fontWeight: 700, mb: 1 }}>
                  {project.title}
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Chip
                    label={project.researchArea}
                    sx={{
                      bgcolor: "#3498db",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 14,
                      mb: 1,
                    }}
                    size="small"
                  />
                </Box>
                <Typography sx={{ fontSize: 15, lineHeight: 1.6, mb: 2, color: "#132238" }}>
                  {project.summary.length > 150
                    ? `${project.summary.substring(0, 150)}...`
                    : project.summary}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ mb: 0.5, color: "#132238" }}>
                    <b style={{ color: "#132238" }}>Researcher:</b> {project.postedByName}
                  </Typography>
                  <Typography sx={{ mb: 0.5, color: "#132238" }}>
                    <b style={{ color: "#132238" }}>Institution:</b> {project.institution}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  sx={{
                bgcolor: 'var(--light-blue)',
                color: 'var(--dark-blue)',
                borderRadius: '1.5rem',
                fontWeight: 600,
                px: 3,
                py: 1.2,
                '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' },
                  }}
                  onClick={() => handleExpand(project.id)}
                >
                  {expandedProject === project.id ? "Show Less" : "View Details"}
                </Button>
                <Collapse in={expandedProject === project.id}>
                  <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #e0e0e0", color: "#132238" }}>
                    <Typography sx={{ mb: 1 }}>
                      <b>Methodology:</b> {project.methodology}
                    </Typography>
                    <Typography sx={{ mb: 1 }}>
                      <b>Collaboration Needs:</b> {project.collaborationNeeds}
                    </Typography>
                    <Typography sx={{ mb: 1 }}>
                      <b>Estimated Completion:</b> {project.estimatedCompletion}
                    </Typography>
                    <Typography sx={{ mb: 1 }}>
                      <a
                        href={project.relatedPublicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#3498db", textDecoration: "underline" }}
                      >
                        Related Publication
                      </a>
                    </Typography>
                  </Box>
                </Collapse>
              </Paper>
            ))}
          </Box>
        </Paper>
      </Box>
    </>
  );
}