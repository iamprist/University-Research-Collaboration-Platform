import React, { useEffect, useState } from "react";
import { Button, Typography, Box, Stack, Card, CardContent, CardActions } from '@mui/material'
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Helmet } from "react-helmet";
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

// Mapping of shorthand tag codes to full, canonical names
const tagAliases = {
    PHYS: "Physics",
    CHEM: "Chemistry",
    BIO: "Biology",
    CS: "Computer Science",
    AI: "Artificial Intelligence",
    Other: "Other (please specify)",
  };

// Convert one tag string into its canonical form (lowercase)
function normalizeTag(tag) {
  const t = tag.trim().toLowerCase();
  for (const [alias, canonical] of Object.entries(tagAliases)) {
    if (alias.toLowerCase() === t) return canonical.toLowerCase();
  }
  return t; // fallback to cleaned string if no alias match
}

// Apply normalizeTag to each element of an array
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
  const [requestStatuses, setRequestStatuses] = useState({});
 
  
  const auth = getAuth();
  const db = getFirestore();

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // 1. Fetch recommendations
  useEffect(() => {
    async function fetchRecommendations() {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not logged in");

        const reviewerSnap = await getDoc(doc(db, "reviewers", user.uid));
        // Remove "Reviewer profile not found" error, just show nothing if not a reviewer
        if (!reviewerSnap.exists()) {
          setRecommendations([]);
          setLoading(false);
          return;
        }

        const tags = normalizeTags(reviewerSnap.data().expertiseTags || []);
        setExpertiseTags(tags);

        const listingsSnap = await getDocs(collection(db, "research-listings"));
        const matches = [];

        for (const snap of listingsSnap.docs) {
          const data = snap.data();
          const keywords = normalizeTags(data.keywords || []);
          const areaTag = data.researchArea ? normalizeTag(data.researchArea) : null;
          const overlap =
            tags.some((t) => keywords.includes(t)) ||
            (areaTag && tags.includes(areaTag));
          if (!overlap) continue;

          const posterSnap = await getDoc(doc(db, "users", data.userId));
          const posterData = posterSnap.exists() ? posterSnap.data() : {};

          matches.push({
            id: snap.id,
            researcherId: data.userId,
            title: data.title || "Untitled",
            summary: data.summary || "",
            researchArea: data.researchArea || "",
            institution: data.institution || "",
            postedByName: posterData.name || "Unknown",
            methodology: data.methodology || "Not Specified",
            collaborationNeeds: data.collaborationNeeds || "Not Specified",
            estimatedCompletion: data.estimatedCompletion || "N/A",
            publicationLink: data.publicationLink || "#",
          });
        }

        setRecommendations(matches);
      } catch (e) {
        console.error("Error fetching recommendations:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [auth, db]);

  // 2. Listen for outgoing reviewRequests
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(
      collection(db, "reviewRequests"),
      where("reviewerId", "==", user.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const statuses = {};
        snap.docs.forEach((d) => {
          const { listingId, status } = d.data();
          statuses[listingId] = status;
        });
        setRequestStatuses(statuses);
      },
      console.error
    );
    return () => unsub();
  }, [auth, db]);

  const handleExpand = (id) =>
    setExpandedProject((prev) => (prev === id ? null : id));

  // New function to handle review request and notification
  const handleRequestReviewAndNotify = async (project) => {
    try {
      const auth = getAuth();
      const reviewer = auth.currentUser;
      if (!reviewer) {
        setSnackbarMsg("You must be logged in.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      // 1. Create review request
      await addDoc(collection(db, "reviewRequests"), {
        listingId: project.id,
        reviewerId: reviewer.uid,
        researcherId: project.researcherId,
        status: "pending",
        requestedAt: serverTimestamp(),
      });

      // 2. Notify researcher
      await addDoc(collection(db, "users", project.researcherId, "messages"), {
        type: "review-request",
        title: "New Review Request",
        content: `${reviewer.displayName || "A reviewer"} requested to review your project "${project.title}".`,
        relatedId: project.id,
        read: false,
        timestamp: serverTimestamp(),
        senderId: reviewer.uid,
      });

      setSnackbarMsg("Review request sent and researcher notified!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error sending review request:", err);
      setSnackbarMsg("Failed to send request.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Move isReviewer state and effect to top-level
  const [isReviewer, setIsReviewer] = useState(undefined);

  useEffect(() => {
    async function checkReviewer() {
      const user = auth.currentUser;
      if (!user) {
        setIsReviewer(false);
        return;
      }
      const reviewerSnap = await getDoc(doc(db, "reviewers", user.uid));
      setIsReviewer(reviewerSnap.exists());
    }
    if (loading) {
      checkReviewer();
    }
  }, [auth, db, loading]);

  if (loading) {
    if (isReviewer === false) {
      return null;
    }
    if (isReviewer === undefined) {
      // Still checking, render nothing
      return null;
    }
    // Only show loading if reviewer exists
    return (
      <section aria-busy="true" style={{ padding: 40, textAlign: "center" }}>
        <progress />
        <p>Loading recommendations…</p>
      </section>
    );
  }

  if (error) {
    return (
      <aside
        role="alert"
        style={{
          maxWidth: 600,
          margin: "20px auto",
          color: "#842029",
          backgroundColor: "#f8d7da",
          padding: 20,
          borderRadius: 4,
        }}
      >
        {error}
      </aside>
    );
  }

  if (!expertiseTags.length) {
    // Don't render anything if no expertise tags
    return null;
  }

  if (!recommendations.length) {
    return (
      <section
        aria-live="polite"
        style={{ padding: 40, textAlign: "center" }}
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
          href="https://fonts.googleapis.com/css2?family=Open+Sans :wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <main style={{ backgroundColor: "#fff", color: "#000", fontFamily: '"Open Sans", sans-serif', padding: 20 }}>
        <section className="dashboard-content">
          <Typography
  variant="h5"
  sx={{
    fontWeight: 700,
    mb: 3,
    mt: 2,
    color: "var(--dark-blue)",
    letterSpacing: 0.2,
    textAlign: "left"
  }}
>
  Recommended Projects
</Typography>
          {recommendations.length === 0 ? (
            <p className="no-listings" style={{ fontSize: "0.95rem", textAlign: "left" }}>
              No research listings matched your expertise tags.
            </p>
          ) : (
            <Stack
              direction="row"
              spacing={2}
              sx={{
                width: "100%",
                overflowX: "auto",
                pb: 2,
                alignItems: "flex-start",
                '&::-webkit-scrollbar': { height: 8 },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#e3e8ee', borderRadius: 4 },
              }}
            >
              {recommendations.map((project) => {
                const status = requestStatuses[project.id];
                return (
                  <Card
                    key={project.id}
                    sx={{
                      borderRadius: 3,
                      boxShadow: 3,
                      border: "1px solid #e3e8ee",
                      minWidth: 320,
                      maxWidth: 420,
                      m: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      bgcolor: "#f9fafb"
                    }}
                  >
                    <CardContent sx={{ flex: 1, p: 2 }}>
                      <Typography variant="h6" sx={{ color: "var(--dark-blue)", fontWeight: 700, mb: 1 }}>
                        {project.title}
                      </Typography>
                      <Typography sx={{ mb: 1, color: "#222" }}>
                        {project.summary.length > 60
                          ? `${project.summary.substring(0, 60)}…`
                          : project.summary}
                      </Typography>
                      <Typography sx={{ color: "#7f8c8d", fontSize: 12, mb: 0.5 }}>
                        Researcher: {project.postedByName}
                      </Typography>
                      <Typography sx={{ color: "#7f8c8d", fontSize: 12, mb: 0.5 }}>
                        Institution: {project.institution}
                      </Typography>
                      <Typography sx={{ color: "#7f8c8d", fontSize: 12, mb: 0.5 }}>
                        Area: {project.researchArea}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ pt: 0 }}>
                      <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            bgcolor: 'var(--light-blue)',
                            color: 'var(--dark-blue)',
                            borderRadius: '1.5rem',
                            fontWeight: 600,
                            px: 2,
                            py: 0.5,
                            minWidth: 0,
                            boxShadow: '0 2px 10px rgba(100,204,197,0.08)',
                            textTransform: "none",
                            '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' },
                            flex: 1
                          }}
                          onClick={() => handleRequestReviewAndNotify(project)}
                          disabled={status === "pending" || status === "approved"}
                        >
                          Request to review
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            bgcolor: 'var(--light-blue)',
                            color: 'var(--dark-blue)',
                            borderRadius: '1.5rem',
                            fontWeight: 600,
                            px: 2,
                            py: 0.5,
                            minWidth: 0,
                            boxShadow: '0 2px 10px rgba(100,204,197,0.08)',
                            textTransform: "none",
                            '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' },
                            flex: 1
                          }}
                          onClick={() => handleExpand(project.id)}
                        >
                          {expandedProject === project.id ? "Show less" : "View details"}
                        </Button>
                      </Stack>
                    </CardActions>
                    {expandedProject === project.id && (
                      <Box sx={{ p: 2, borderTop: "1px solid #eee" }}>
                        <Typography sx={{ fontWeight: 600, mb: 1, fontSize: "0.95rem" }}>Methodology:</Typography>
                        <Typography sx={{ mb: 1, fontSize: "0.95rem" }}>{project.methodology}</Typography>
                        <Typography sx={{ fontWeight: 600, mb: 1, fontSize: "0.95rem" }}>Collaboration Needs:</Typography>
                        <Typography sx={{ mb: 1, fontSize: "0.95rem" }}>{project.collaborationNeeds}</Typography>
                        <Typography sx={{ fontWeight: 600, mb: 1, fontSize: "0.95rem" }}>Estimated Completion:</Typography>
                        <Typography sx={{ mb: 1, fontSize: "0.95rem" }}>{project.estimatedCompletion}</Typography>
                        <Typography sx={{ fontSize: "0.95rem" }}>
                          <a
                            href={project.publicationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Related Publication
                          </a>
                        </Typography>
                      </Box>
                    )}
                  </Card>
                );
              })}
            </Stack>
          )}
        </section>

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={4000}
            onClose={() => setSnackbarOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <MuiAlert
              onClose={() => setSnackbarOpen(false)}
              severity={snackbarSeverity}
              sx={{ width: '100%' }}
            >
              {snackbarMsg}
            </MuiAlert>
          </Snackbar>
      </main>
    </>
  );
};

