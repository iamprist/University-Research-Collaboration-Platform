import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ReactQuill from "react-quill";                   // Rich text editor
import "react-quill/dist/quill.snow.css";               // Editor styles
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";                           // Firestore functions
import { getAuth } from "firebase/auth";                // Authentication
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";                             // Storage functions

// Configuration for the ReactQuill toolbar
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "clean"],
  ],
};
const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "link",
];

export default function ReviewForm() {
  const { listingId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  const [project, setProject] = useState(state?.project || null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(3);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // load project if not passed
  useEffect(() => {
    if (project) return;
    getDoc(doc(db, "research-listings", listingId)).then((snap) => {
      if (snap.exists()) {
        setProject(snap.data());
      }
    });
  }, [db, listingId, project]);

  // load existing review
  useEffect(() => {
    const reviewRef = doc(db, "reviews", `${listingId}_${auth.currentUser.uid}`);
    getDoc(reviewRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setFeedback(data.feedback || "");
        setRating(data.rating || 3);
        if (data.resourceUrl) {
          setPdfUrl(data.resourceUrl);
        }
      }
    });
  }, [db, listingId, auth.currentUser.uid]);

  // handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      setPdfFile(null);
      alert("Please select a PDF file");
    }
  };

  // upload PDF to Firebase Storage
  const uploadPdf = async () => {
    if (!pdfFile) return "";
    setUploading(true);
    const fileRef = storageRef(storage, `review-resources/${listingId}_${auth.currentUser.uid}.pdf`);
    await uploadBytes(fileRef, pdfFile);
    const url = await getDownloadURL(fileRef);
    setPdfUrl(url);
    setUploading(false);
    return url;
  };

  // submit review and resource
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    let resourceUrl = pdfUrl;
    if (pdfFile) {
      resourceUrl = await uploadPdf();
    }
    await setDoc(
      doc(db, "reviews", `${listingId}_${auth.currentUser.uid}`),
      {
        listingId,
        reviewerId: auth.currentUser.uid,
        feedback,
        rating,
        resourceUrl: resourceUrl || "",
        createdAt: serverTimestamp(),
      }
    );
    navigate("/reviewer");
  };

  if (!project) {
    return <p>Loading project…</p>;
  }

  return (
    <main style={{ padding: "2rem", background: "#f0f0f0", minHeight: "100vh" }}>
      <article style={{
        maxWidth: "800px",
        margin: "0 auto",
        background: "#fff",
        borderRadius: "0.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}>
        <header style={{ background: "#2b579a", color: "#fff", padding: "1rem 1.5rem" }}>
          <h2 style={{ margin: 0 }}>Review: {project.title}</h2>
        </header>

        <section style={{ padding: "1.5rem" }}>
          <p style={{ color: "#555", lineHeight: 1.6 }}>
            {project.summary}
          </p>
        </section>

        <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
          <fieldset style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1.5rem" }}>
            <legend style={{ fontWeight: 600, padding: "0 0.5rem" }}>
              Your Feedback
            </legend>
            <ReactQuill
              theme="snow"
              modules={quillModules}
              formats={quillFormats}
              value={feedback}
              onChange={setFeedback}
              style={{ height: "200px" }}
            />
          </fieldset>

          <fieldset style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1.5rem" }}>
            <legend style={{ fontWeight: 600, padding: "0 0.5rem" }}>
              Rating (1–5)
            </legend>
            <input
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              style={{
                width: "4rem",
                padding: "0.5rem",
                fontSize: "1rem",
                border: "1px solid #ccc",
                borderRadius: "0.25rem",
              }}
            />
          </fieldset>

          <fieldset style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1.5rem" }}>
            <legend style={{ fontWeight: 600, padding: "0 0.5rem" }}>
              Attach Resource (PDF)
            </legend>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
            />
            {uploading && <p>Uploading PDF…</p>}
            {pdfUrl && (
              <p>
                Current resource:{" "}
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  Download PDF
                </a>
              </p>
            )}
          </fieldset>

          <footer style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "1rem"
          }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#e0e0e0",
                border: "1px solid #ccc",
                borderRadius: "0.25rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#0078d4",
                color: "#fff",
                border: "none",
                borderRadius: "0.25rem",
                cursor: saving || uploading ? "default" : "pointer",
              }}
            >
              {saving ? "Saving…" : "Submit Review"}
            </button>
          </footer>
        </form>
      </article>
    </main>
  );
}
