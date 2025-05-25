import React, { useEffect, useState } from "react";
import { Button, Typography, Box, Stack, Card, CardContent, CardActions } from '@mui/material'
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
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
  // …other aliases…
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
  const [reviewExists, setReviewExists] = useState({});
 
  
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();

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
        if (!reviewerSnap.exists()) throw new Error("Reviewer profile not found");

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

  

  
 
    
  
  // 3. Listen for existing reviews
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(
      collection(db, "reviews"),
      where("reviewerId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const exists = {};
      snap.docs.forEach((d) => {
        const { listingId } = d.data();
        exists[listingId] = true;
      });
      setReviewExists(exists);
    });
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

  // 5. Revoke a pending review request
  const handleRevokeReview = async (projectId) => {
    try {
      const q = query(
        collection(db, "reviewRequests"),
        where("reviewerId", "==", auth.currentUser.uid),
        where("listingId", "==", projectId),
        where("status", "==", "pending")
      );
      const snap = await getDocs(q);
      await Promise.all(
        snap.docs.map((d) => deleteDoc(doc(db, "reviewRequests", d.id)))
      );
    } catch (err) {
      console.error("Error revoking review request:", err);
      alert("Failed to revoke request.");
    }
  };

  // 6. Navigate to review form
  const handleReview = (project) => {
    navigate(`/review/${project.id}`, { state: { project } });
  };

 

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "reviewRequests"), where("reviewerId", "==", user.uid));
    const unsub = onSnapshot(q, async (snapshot) => {
      snapshot.docs.forEach(async (docSnap) => {
        
      });
    });
    return () => unsub();
  }, [auth, db]);
  

  if (loading) {
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
    return (
      <section
        aria-live="polite"
        style={{ padding: 40, textAlign: "center" }}
      >
        <p>
          You have no expertise tags set in your profile, so no recommendations
          can be made.
        </p>
      </section>
    );
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
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <main style={{ backgroundColor: "#fff", color: "#000", fontFamily: '"Open Sans", sans-serif', padding: 20 }}>
        

          {/* --- Recommendations Section --- */}
          <section className="dashboard-content">
  <h3>Recommended Projects</h3>
  {recommendations.length === 0 ? (
    <p className="no-listings">No research listings matched your expertise tags.</p>
  ) : (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        width: "100%",
        overflowX: "auto",
        pb: 2,
        '&::-webkit-scrollbar': { height: 8 },
        '&::-webkit-scrollbar-thumb': { bgcolor: '#e3e8ee', borderRadius: 4 },
      }}
    >
      {recommendations.map((project) => {
        const status = requestStatuses[project.id];
        const reviewed = reviewExists[project.id];
        return (
          <Card
            key={project.id}
            sx={{
              maxWidth: 350,
              minWidth: 280,
              bgcolor: "#fff",
              color: "#222",
              borderRadius: "1.2rem",
              boxShadow: "0 6px 24px rgba(30, 60, 90, 0.12), 0 1.5px 4px rgba(30, 60, 90, 0.10)",
              border: "1px solid #e3e8ee",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              m: 0,
              transition: "box-shadow 0.2s, transform 0.2s",
              '&:hover': {
                boxShadow: "0 12px 32px rgba(30, 60, 90, 0.18), 0 2px 8px rgba(30, 60, 90, 0.12)",
                transform: "translateY(-4px) scale(1.03)",
                borderColor: "#B1EDE8",
              },
            }}
          >
            <CardContent sx={{ flex: 1 }}>
              <h4 style={{
                color: "var(--dark-blue)",
                fontWeight: 700,
                fontSize: "1.2rem",
                marginBottom: 8
              }}>
                {project.title}
              </h4>
              <Typography sx={{ mb: 1, color: "#222" }}>
                {project.summary.length > 100
                  ? `${project.summary.substring(0, 100)}…`
                  : project.summary}
              </Typography>
              <Typography sx={{ color: "#7f8c8d", fontSize: 14, mb: 1 }}>
                Researcher: {project.postedByName}
              </Typography>
              <Typography sx={{ color: "#7f8c8d", fontSize: 14, mb: 1 }}>
                Institution: {project.institution}
              </Typography>
              <Typography sx={{ color: "#7f8c8d", fontSize: 14, mb: 1 }}>
                Area: {project.researchArea}
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: "space-between", pt: 0 }}>
              {status == null && (
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
                    '&:hover': { bgcolor: '#5AA9A3', color: 'var(--white)' },
                  }}
                  onClick={() => handleRequestReviewAndNotify(project)}
                >
                  Request Review
                </Button>
              )}
              {status === "pending" && (
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    bgcolor: '#c0392b',
                    color: '#fff',
                    borderRadius: '1.5rem',
                    fontWeight: 600,
                    px: 2,
                    py: 0.5,
                    minWidth: 0,
                    '&:hover': { bgcolor: '#a93226' },
                  }}
                  onClick={() => handleRevokeReview(project.id)}
                >
                  Revoke Request
                </Button>
              )}
              {status === "accepted" && (
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    bgcolor: '#2980b9',
                    color: '#fff',
                    borderRadius: '1.5rem',
                    fontWeight: 600,
                    px: 2,
                    py: 0.5,
                    minWidth: 0,
                    '&:hover': { bgcolor: '#21618c' },
                  }}
                  onClick={() => handleReview(project)}
                >
                  {reviewed ? "Update Review" : "Start Review"}
                </Button>
              )}
              {status === "declined" && (
                <Typography sx={{ color: "red", fontWeight: 600 }}>
                  Declined
                </Typography>
              )}
              <Button
                variant="outlined"
                size="small"
                sx={{
                  borderRadius: '1.5rem',
                  fontWeight: 600,
                  px: 2,
                  py: 0.5,
                  minWidth: 0,
                  color: 'var(--dark-blue)',
                  borderColor: 'var(--light-blue)',
                  '&:hover': { bgcolor: '#B1EDE8', borderColor: '#5AA9A3', color: 'var(--dark-blue)' },
                }}
                onClick={() => handleExpand(project.id)}
              >
                {expandedProject === project.id ? "Show Less" : "View Details"}
              </Button>
            </CardActions>
            {expandedProject === project.id && (
              <Box sx={{ p: 2, borderTop: "1px solid #eee" }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Methodology:</Typography>
                <Typography sx={{ mb: 1 }}>{project.methodology}</Typography>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Collaboration Needs:</Typography>
                <Typography sx={{ mb: 1 }}>{project.collaborationNeeds}</Typography>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Estimated Completion:</Typography>
                <Typography sx={{ mb: 1 }}>{project.estimatedCompletion}</Typography>
                <Typography>
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
}
