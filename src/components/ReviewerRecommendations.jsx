import React, { useEffect, useState } from "react";
import { TextField, Button, Paper, Typography, Box } from '@mui/material'
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
   const [allListings, setAllListings] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [showNoResults, setShowNoResults] = useState(false)
  const dropdownTimeout = React.useRef(null)

  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();

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

  // Fetch all research listings for search
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const q = collection(db, 'research-listings')
        const querySnapshot = await getDocs(q)
        const data = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const listing = { id: docSnap.id, ...docSnap.data() }
            try {
              const researcherDoc = await getDoc(doc(db, 'users', listing.userId))
              return {
                ...listing,
                researcherName: researcherDoc.exists() ? researcherDoc.data().name : 'Unknown Researcher'
              }
            } catch {
              return { ...listing, researcherName: 'Unknown Researcher' }
            }
          })
        )
        setAllListings(data)
      } catch (error) {
        console.error("Error fetching listings:", error)
      }
    }
    fetchListings()
  }, [db])

  // Search logic
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      setDropdownVisible(false)
      return
    }
    const searchTermLower = searchTerm.toLowerCase()
    const filtered = allListings.filter(item => {
      const title = item.title?.toLowerCase() || ''
      const researcherName = item.researcherName?.toLowerCase() || ''
      return title.includes(searchTermLower) || researcherName.includes(searchTermLower)
    })
    setSearchResults(filtered)
    setDropdownVisible(true)
    clearTimeout(dropdownTimeout.current)
    dropdownTimeout.current = setTimeout(() => {
      setDropdownVisible(false)
    }, 5000)
    setShowNoResults(filtered.length === 0)
  }

  const handleInputFocus = () => {
    setDropdownVisible(false)
    clearTimeout(dropdownTimeout.current)
  }
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
    setDropdownVisible(false)
    clearTimeout(dropdownTimeout.current)
  }
  const handleClear = () => {
    setSearchTerm('')
    setSearchResults([])
    setDropdownVisible(false)
  }
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

  // 4. Send a new review request
  const handleRequestReview = async (project) => {
    try {
      await addDoc(collection(db, "reviewRequests"), {
        listingId: project.id,
        reviewerId: auth.currentUser.uid,
        researcherId: project.researcherId,
        status: "pending",
        requestedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error sending review request:", err);
      alert("Failed to send request.");
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

      <main
        style={{
          backgroundColor: "#fff",
          color: "#000",
          fontFamily: '"Open Sans", sans-serif',
          padding: 20,
        }}
      >
        <section
        className="container"
        style={{ backgroundColor: 'white', color: 'black' }}
      >
        {/* --- Search Bar Section --- */}
        <Box sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
          <Paper 
            component="form"
            onSubmit={e => { e.preventDefault(); handleSearch() }}
            sx={{ 
              p: 1,
              display: 'flex',
              gap: 1,
              bgcolor: 'background.paper',
              position: 'relative'
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search research by title or researcher name..."
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '1.2rem',
                  borderColor: '#000'
                }
              }}
            />
            <Button 
              type="button"
              variant="contained"
              onClick={handleClear}
              sx={{
                bgcolor: '#F59E0B',
                color: '#fff',
                borderRadius: '1.5rem',
                minWidth: '100px',
                px: 3,
                '&:hover': { bgcolor: '#FBBF24' }
              }}
            >
              Clear
            </Button>
            <Button 
              type="button"
              variant="contained"
              onClick={handleSearch}
              sx={{
                bgcolor: '#10B981',
                color: '#fff',
                borderRadius: '1.5rem',
                minWidth: '100px',
                px: 3,
                '&:hover': { bgcolor: '#059669' }
              }}
            >
              Search
            </Button>
            {/* Search Dropdown */}
            {dropdownVisible && (
              <Paper sx={{
                position: 'absolute',
                top: '110%',
                left: 0,
                right: 0,
                zIndex: 999,
                bgcolor: 'background.paper',
                boxShadow: 3,
                maxHeight: 300,
                overflowY: 'auto'
              }}>
                {searchResults.length === 0 ? (
                  <Typography sx={{ p: 2 }}>
                    {showNoResults ? "No research listings found." : "Start typing to search"}
                  </Typography>
                ) : 
                  searchResults.map(item => (
                    <Box 
                      key={item.id}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => navigate(`/listing/${item.id}`)}
                    >
                      <Typography variant="subtitle1">{item.title}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        By: {item.researcherName}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {item.summary}
                      </Typography>
                    </Box>
                  ))}
              </Paper>
            )}
          </Paper>
        </Box>
        </section>

        <section
          aria-label="Your expertise tags"
          style={{ textAlign: "center", marginBottom: 30 }}
        >
          <p style={{ fontSize: 16, marginBottom: 20 }}>
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
                  borderRadius: 15,
                  margin: 5,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#000",
                }}
              >
                {tagAliases[tag.toUpperCase()] || tag}
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Project recommendations">
          {recommendations.map((project) => {
            const status = requestStatuses[project.id];
            const reviewed = reviewExists[project.id];

            return (
              <article
                key={project.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  padding: 20,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  backgroundColor: "#fff",
                  marginBottom: 30,
                }}
              >
                <header>
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 15,
                    }}
                  >
                    {project.title}
                  </h3>
                  <p style={{ marginBottom: 15 }}>
                    <mark
                      style={{
                        backgroundColor: "#3498db",
                        color: "#fff",
                        padding: "3px 10px",
                        borderRadius: 4,
                        fontSize: 14,
                      }}
                    >
                      {project.researchArea}
                    </mark>
                  </p>
                </header>

                <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 15 }}>
                  {project.summary.length > 150
                    ? `${project.summary.substring(0, 150)}…`
                    : project.summary}
                </p>

                <dl style={{ marginBottom: 15 }}>
                  <dt>
                    <strong style={{ color: "#7f8c8d" }}>Researcher:</strong>
                  </dt>
                  <dd style={{ marginLeft: 0 }}>{project.postedByName}</dd>
                  <dt>
                    <strong style={{ color: "#7f8c8d" }}>Institution:</strong>
                  </dt>
                  <dd style={{ marginLeft: 0 }}>{project.institution}</dd>
                </dl>

                {status == null && (
                  <button
                    onClick={() => handleRequestReview(project)}
                    style={{
                      marginRight: 10,
                      padding: "8px 15px",
                      backgroundColor: "#27ae60",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Request Review
                  </button>
                )}
                {status === "pending" && (
                  <button
                    onClick={() => handleRevokeReview(project.id)}
                    style={{
                      marginRight: 10,
                      padding: "8px 15px",
                      backgroundColor: "#c0392b",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Revoke Request
                  </button>
                )}
                {status === "accepted" && (
                  <button
                    onClick={() => handleReview(project)}
                    style={{
                      marginRight: 10,
                      padding: "8px 15px",
                      backgroundColor: "#2980b9",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {reviewed ? "Update Review" : "Start Review"}
                  </button>
                )}
                {status === "declined" && (
                  <span
                    style={{
                      color: "red",
                      fontWeight: 600,
                      marginRight: 10,
                    }}
                  >
                    Declined
                  </span>
                )}

                <button
                  onClick={() => handleExpand(project.id)}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "#3498db",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {expandedProject === project.id ? "Show Less" : "View Details"}
                </button>

                {expandedProject === project.id && (
                  <section
                    aria-label="Project details"
                    style={{
                      marginTop: 20,
                      paddingTop: 15,
                      borderTop: "1px solid #ccc",
                    }}
                  >
                    <dl>
                      <dt>
                        <strong>Methodology:</strong>
                      </dt>
                      <dd>{project.methodology}</dd>
                      <dt>
                        <strong>Collaboration Needs:</strong>
                      </dt>
                      <dd>{project.collaborationNeeds}</dd>
                      <dt>
                        <strong>Estimated Completion:</strong>
                      </dt>
                      <dd>{project.estimatedCompletion}</dd>
                    </dl>
                    <p>
                      <a
                        href={project.publicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Related Publication
                      </a>
                    </p>
                  </section>
                )}
              </article>
            );
          })}
        </section>
      </main>
    </>
  );
}
