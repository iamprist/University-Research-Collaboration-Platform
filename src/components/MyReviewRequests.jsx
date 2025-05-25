import React, { useEffect, useState } from "react";
import { db } from "../config/firebaseConfig";
import { getAuth } from "firebase/auth";
import { collection, query, where, onSnapshot, getDoc, doc, addDoc, serverTimestamp, getDocs, deleteDoc } from "firebase/firestore";
import { Typography, Button, TextField, Snackbar, Rating, Stack, Card, CardContent, CardActions, Box, IconButton } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { useNavigate } from "react-router-dom";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import "../pages/Researcher/ResearcherDashboard.css";



export default function MyReviewRequests() {
  const [requests, setRequests] = useState([]);
  const [reviews, setReviews] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", severity: "info" });
  const [collaborations, setCollaborations] = useState({});
  const [reviewsSubmitted, setReviewsSubmitted] = useState({});
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuReqId, setMenuReqId] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "reviewRequests"), where("reviewerId", "==", user.uid));
    const unsub = onSnapshot(q, async (snapshot) => {
      const reqs = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let projectTitle = "Unknown Project";
        try {
          const projectDoc = await getDoc(doc(db, "research-listings", data.listingId));
          if (projectDoc.exists()) projectTitle = projectDoc.data().title;
        } catch {}
        return { id: docSnap.id, ...data, projectTitle };
      }));
      // Sort: reviewed (accepted) first, then others
      reqs.sort((a, b) => {
        if (a.status === "accepted" && b.status !== "accepted") return -1;
        if (a.status !== "accepted" && b.status === "accepted") return 1;
        return 0;
      });
      setRequests(reqs);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Fetch collaborations for this reviewer
    const q = query(collection(db, "collaborations"), where("reviewerId", "==", user.uid));
    getDocs(q).then(snapshot => {
      const collabMap = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        // Use listingId as key for easy lookup
        collabMap[data.listingId] = { ...data, id: docSnap.id };
      });
      setCollaborations(collabMap);
    });
  }, [user]);

  // Fetch reviews submitted by this reviewer
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "reviews"), where("reviewerId", "==", user.uid));
    getDocs(q).then(snapshot => {
      const reviewMap = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        // Use listingId as key
        reviewMap[data.listingId] = true;
      });
      setReviewsSubmitted(reviewMap);
    });
  }, [user]);

  // Handle review submit
  const handleSubmitReview = async (req) => {
    try {
      await addDoc(collection(db, "reviews"), {
        listingId: req.listingId,
        reviewerId: user.uid,
        rating: reviews[req.id]?.rating || 0,
        comment: reviews[req.id]?.comment || "",
        createdAt: serverTimestamp(),
      });
      setReviewsSubmitted((prev) => ({
        ...prev,
        [req.listingId]: true,
      }));
      setReviews((prev) => ({
        ...prev,
        [req.id]: {
          ...prev[req.id],
          editing: false,
        }
      }));
      setSnackbar({ open: true, msg: "Review submitted!", severity: "success" });
    } catch (e) {
      setSnackbar({ open: true, msg: "Failed to submit review.", severity: "error" });
    }
  };

  useEffect(() => {
    if (!user) return;
    // For each accepted request, ensure a collaboration exists
    requests.forEach(async (req) => {
      if (req.status === "accepted" && !collaborations[req.listingId]) {
        // Check if already exists in Firestore (double check)
        const q = query(
          collection(db, "collaborations"),
          where("reviewerId", "==", user.uid),
          where("listingId", "==", req.listingId)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          // Create collaboration
          await addDoc(collection(db, "collaborations"), {
            listingId: req.listingId,
            reviewerId: user.uid,
            researcherId: req.researcherId, // Make sure this field exists in your reviewRequests
            createdAt: serverTimestamp(),
            chatId: `${req.listingId}_${user.uid}`,
            status: "active"
          });
        }
      }
    });
  }, [requests, collaborations, user]);

  const uniqueRequests = Array.from(new Map(requests.map(r => [r.id, r])).values());

  // Add edit and delete handlers
  const handleEditReview = (req) => {
    setMenuAnchor(null);
    // Populate the review form with existing review for editing
    setReviews((prev) => ({
      ...prev,
      [req.id]: {
        rating: reviews[req.id]?.rating || 0,
        comment: reviews[req.id]?.comment || "",
        editing: true,
      }
    }));
  };

  const handleDeleteReview = async (req) => {
    setMenuAnchor(null);
    // Find and delete the review document for this listing/reviewer
    const q = query(
      collection(db, "reviews"),
      where("reviewerId", "==", user.uid),
      where("listingId", "==", req.listingId)
    );
    const snap = await getDocs(q);
    snap.forEach(async (docSnap) => {
      await deleteDoc(doc(db, "reviews", docSnap.id));
    });
    setReviewsSubmitted((prev) => {
      const updated = { ...prev };
      delete updated[req.listingId];
      return updated;
    });
    setReviews((prev) => {
      const updated = { ...prev };
      delete updated[req.id];
      return updated;
    });
    setRequests((prev) => prev.filter(r => r.id !== req.id));
    setSnackbar({ open: true, msg: "Review deleted.", severity: "info" });
  };

  return (
    <section className="dashboard-content">
      <h3>My Review Requests</h3>
      {requests.length === 0 ? (
        <p className="no-listings">You have not requested to review any projects yet.</p>
      ) : (
        <>
          <Stack direction="row" spacing={2} sx={{ width: "100%", overflowX: "auto", pb: 2, '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#e3e8ee', borderRadius: 4 }, }}>
            {uniqueRequests.map((req) => (
              <Card
                key={req.id}
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
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 1, pt: 2, pb: 0 }}>
                  <IconButton
                    size="small"
                    onClick={e => {
                      setMenuAnchor(e.currentTarget);
                      setMenuReqId(req.id);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                <CardContent sx={{ flex: 1, pt: 0 }}>
                  <h4 style={{
                    color: "var(--dark-blue)",
                    fontWeight: 700,
                    fontSize: "1.2rem",
                    marginBottom: 8
                  }}>
                    {req.projectTitle}
                  </h4>
                  <Typography sx={{ mb: 1, color: "#222" }}>
                    Status: <strong>{req.status}</strong>
                  </Typography>
                  {req.status === "accepted" && (
                    <>
                      {reviewsSubmitted[req.listingId] && reviews[req.id] && !reviews[req.id]?.editing ? (
                        <Box sx={{ mb: 1 }}>
                          <Typography sx={{ color: "#222", fontWeight: 600, mb: 0.5 }}>Your review:</Typography>
                          <Rating
                            value={reviews[req.id]?.rating || 0}
                            readOnly
                            sx={{
                              color: "#FFD600",
                              '& .MuiRating-iconEmpty': { color: "#222" }
                            }}
                          />
                          <Typography sx={{ color: "#444", mt: 0.5, fontStyle: "italic" }}>
                            {reviews[req.id]?.comment || "No comment provided."}
                          </Typography>
                        </Box>
                      ) : (
                        <>
                          <Typography sx={{ color: "#222", mb: 1 }}>Leave your review:</Typography>
                          <Rating
                            value={reviews[req.id]?.rating || 0}
                            onChange={(_, value) =>
                              setReviews((prev) => ({
                                ...prev,
                                [req.id]: { ...prev[req.id], rating: value },
                              }))
                            }
                            sx={{
                              color: "#FFD600",
                              '& .MuiRating-iconEmpty': { color: "#222" }
                            }}
                          />
                          <TextField
                            label="Comment"
                            multiline
                            minRows={2}
                            fullWidth
                            sx={{ mt: 1, mb: 0.5, bgcolor: "#f8f9fb" }}
                            value={reviews[req.id]?.comment || ""}
                            onChange={(e) =>
                              setReviews((prev) => ({
                                ...prev,
                                [req.id]: { ...prev[req.id], comment: e.target.value },
                              }))
                            }
                          />
                          <Stack direction="row" spacing={2}>
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
                                textTransform: "none"
                              }}
                              onClick={() => handleSubmitReview(req)}
                            >
                              Submit review
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{
                                borderRadius: '1.5rem',
                                fontWeight: 600,
                                px: 2,
                                py: 0.5,
                                minWidth: 0,
                                textTransform: "none"
                              }}
                              onClick={() => setReviews((prev) => ({
                                ...prev,
                                [req.id]: { ...prev[req.id], editing: false }
                              }))}
                            >
                              Cancel
                            </Button>
                          </Stack>
                        </>
                      )}
                      {/* Show Go to Chat if collaboration exists */}
                     
                    </>
                  )}
                  {req.status === "pending" && (
                    <Typography sx={{ color: "#222" }}>Waiting for researcher approval...</Typography>
                  )}
                  {req.status === "declined" && (
                    <Typography sx={{ color: "#FF6B6B" }}>Request declined.</Typography>
                  )}
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
                      onClick={() => navigate(`/listing/${req.listingId}`)}
                    >
                      View details
                    </Button>
                    {collaborations[req.listingId] && (
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
                        onClick={() => navigate(`/collaboration/${collaborations[req.listingId].chatId || collaborations[req.listingId].id}`)}
                      >
                        Go to chat
                      </Button>
                    )}
                  </Stack>
                </CardActions>
              </Card>
            ))}
          </Stack>
          {/* 3-dot menu */}
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleEditReview(uniqueRequests.find(r => r.id === menuReqId))}>
              Edit review
            </MenuItem>
            <MenuItem onClick={() => handleDeleteReview(uniqueRequests.find(r => r.id === menuReqId))}>
              Delete review
            </MenuItem>
          </Menu>
        </>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.msg}
        </MuiAlert>
      </Snackbar>
    </section>
  );
}