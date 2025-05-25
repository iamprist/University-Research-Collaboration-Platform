import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from "@mui/material";
import { db } from "../config/firebaseConfig";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";

const ReviewersDialog = ({ open, onClose, projectId }) => {
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !projectId) return;
    setLoading(true);
    const fetchReviewers = async () => {
      try {
        // Find reviewRequests for this project
        const q = query(collection(db, "reviewRequests"), where("listingId", "==", projectId));
        const snapshot = await getDocs(q);
        const reviewerList = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let reviewerName = "Unknown";
          let reviewerEmail = "";
          try {
            const userDoc = await getDoc(doc(db, "users", data.reviewerId));
            if (userDoc.exists()) {
              reviewerName = userDoc.data().name || reviewerName;
              reviewerEmail = userDoc.data().email || "";
            }
          } catch {}
          return {
            id: docSnap.id,
            reviewerName,
            reviewerEmail,
            status: data.status,
          };
        }));
        setReviewers(reviewerList);
      } catch (e) {
        setReviewers([]);
      }
      setLoading(false);
    };
    fetchReviewers();
  }, [open, projectId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Reviewers</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : reviewers.length === 0 ? (
          <Typography>No reviewers found for this project.</Typography>
        ) : (
          <List>
            {reviewers.map((rev) => (
              <ListItem key={rev.id}>
                <ListItemText
                  primary={rev.reviewerName}
                  secondary={
                    <>
                      {rev.reviewerEmail && <span>{rev.reviewerEmail} — </span>}
                      Status: <b>{rev.status}</b>
                    </>
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

export default ReviewersDialog;