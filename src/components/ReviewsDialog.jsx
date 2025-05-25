import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Rating,
  CircularProgress,
  Box
} from "@mui/material";
import { db } from "../config/firebaseConfig";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";

const ReviewsDialog = ({ open, onClose, projectId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !projectId) return;
    setLoading(true);
    const fetchReviews = async () => {
      try {
        // Fetch all reviews for this project/listing
        const q = query(collection(db, "reviews"), where("listingId", "==", projectId));
        const snapshot = await getDocs(q);
        const reviewList = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let reviewerName = "Unknown";
          try {
            const userDoc = await getDoc(doc(db, "users", data.reviewerId));
            if (userDoc.exists()) {
              reviewerName = userDoc.data().name || reviewerName;
            }
          } catch {}
          return {
            id: docSnap.id,
            reviewerName,
            rating: data.rating,
            comment: data.comment,
          };
        }));
        setReviews(reviewList);
      } catch (e) {
        setReviews([]);
      }
      setLoading(false);
    };
    fetchReviews();
  }, [open, projectId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Project Reviews</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : reviews.length === 0 ? (
          <Typography>No reviews for this project yet.</Typography>
        ) : (
          <List>
            {reviews.map((rev) => (
              <ListItem key={rev.id} alignItems="flex-start">
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <b>{rev.reviewerName}</b>
                      <Rating value={rev.rating} readOnly size="small" />
                    </Box>
                  }
                  secondary={
                    <Typography sx={{ mt: 0.5, color: "#444" }}>
                      {rev.comment || <i>No comment provided.</i>}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReviewsDialog;