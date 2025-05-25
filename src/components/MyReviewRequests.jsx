import React, { useEffect, useState } from "react";
import { db } from "../config/firebaseConfig";
import { getAuth } from "firebase/auth";
import { collection, query, where, onSnapshot, getDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { Typography, Button, TextField, Snackbar, Rating, Stack, Card, CardContent, CardActions } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { useNavigate } from "react-router-dom";

import "../pages/Researcher/ResearcherDashboard.css";



export default function MyReviewRequests() {
  const [requests, setRequests] = useState([]);
  const [reviews, setReviews] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", severity: "info" });

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
      setRequests(reqs);
    });
    return () => unsub();
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
      setSnackbar({ open: true, msg: "Review submitted!", severity: "success" });
    } catch (e) {
      setSnackbar({ open: true, msg: "Failed to submit review.", severity: "error" });
    }
  };

  const reviewExistsForRequest = (req) => {
    return requests.some(request => request.id === req.id && request.status === "accepted");
  };



  return (
    <section className="dashboard-content">
      <h3>My Review Requests</h3>
      {requests.length === 0 ? (
        <p className="no-listings">You have not requested to review any projects yet.</p>
      ) : (
        <>
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
            {requests.map((req) => (
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
                <CardContent sx={{ flex: 1 }}>
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
                    reviewExistsForRequest(req) ? (
                      <Typography sx={{ color: "#27ae60", mb: 1, fontWeight: 600 }}>
                        Review submitted. Thank you!
                      </Typography>
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
                          sx={{ mt: 1, bgcolor: "#f8f9fb" }}
                          value={reviews[req.id]?.comment || ""}
                          onChange={(e) =>
                            setReviews((prev) => ({
                              ...prev,
                              [req.id]: { ...prev[req.id], comment: e.target.value },
                            }))
                          }
                        />
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
                            mt: 1
                          }}
                          onClick={() => handleSubmitReview(req)}
                        >
                          Submit Review
                        </Button>
                      </>
                    )
                  )}
                  {req.status === "pending" && (
                    <Typography sx={{ color: "#222" }}>Waiting for researcher approval...</Typography>
                  )}
                  {req.status === "declined" && (
                    <Typography sx={{ color: "#FF6B6B" }}>Request declined.</Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: "space-between", pt: 0 }}>
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
                    onClick={() => navigate(`/listing/${req.listingId}`)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Stack>
          
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