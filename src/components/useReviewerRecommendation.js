// useReviewerRecommendation.js

import { useState, useEffect, useRef } from 'react';
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
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

// Tag alias mapping
const tagAliases = {
  PHYS: "Physics",
  CHEM: "Chemistry",
  BIO: "Biology",
  CS: "Computer Science",
  AI: "Artificial Intelligence",
  Other: "Other (please specify)",
};

// Normalize tag to canonical form
function normalizeTag(tag) {
  const t = tag.trim().toLowerCase();
  for (const [alias, canonical] of Object.entries(tagAliases)) {
    if (alias.toLowerCase() === t) return canonical.toLowerCase();
  }
  return t;
}

// Normalize array of tags
function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.map(normalizeTag);
}

export default function useReviewerRecommendation() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [expandedProject, setExpandedProject] = useState(null);
  const [requestStatuses, setRequestStatuses] = useState({});
  const [reviewExists, setReviewExists] = useState({});
  const [allListings, setAllListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const dropdownTimeout = useRef(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  // 1. Fetch recommendations based on user expertise
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

  // 2. Watch for review requests
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

  // 3. Fetch all research listings for search
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const q = collection(db, 'research-listings');
        const querySnapshot = await getDocs(q);

        const data = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const listing = { id: docSnap.id, ...docSnap.data() };
            try {
              const researcherDoc = await getDoc(doc(db, 'users', listing.userId));
              return {
                ...listing,
                researcherName: researcherDoc.exists() ? researcherDoc.data().name : 'Unknown Researcher'
              };
            } catch {
              return { ...listing, researcherName: 'Unknown Researcher' };
            }
          })
        );

        setAllListings(data);
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    };

    fetchListings();
  }, [db]);

  // 4. Watch for existing reviews
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

  // --- Handlers ---

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setDropdownVisible(false);
      return;
    }
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = allListings.filter(item => {
      const title = item.title?.toLowerCase() || '';
      const researcherName = item.researcherName?.toLowerCase() || '';
      return title.includes(searchTermLower) || researcherName.includes(searchTermLower);
    });
    setSearchResults(filtered);
    setDropdownVisible(true);
    clearTimeout(dropdownTimeout.current);
    dropdownTimeout.current = setTimeout(() => {
      setDropdownVisible(false);
    }, 5000);
    setShowNoResults(filtered.length === 0);
  };

  const handleInputFocus = () => {
    setDropdownVisible(false);
    clearTimeout(dropdownTimeout.current);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setDropdownVisible(false);
    clearTimeout(dropdownTimeout.current);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSearchResults([]);
    setDropdownVisible(false);
  };

  const handleExpand = (id) => setExpandedProject((prev) => (prev === id ? null : id));

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

  const handleReview = (project) => {
    navigate(`/review/${project.id}`, { state: { project } });
  };

  return {
    loading,
    error,
    expertiseTags,
    recommendations,
    expandedProject,
    requestStatuses,
    reviewExists,
    searchTerm,
    searchResults,
    dropdownVisible,
    showNoResults,
    handleSearch,
    handleInputFocus,
    handleInputChange,
    handleClear,
    handleExpand,
    handleRequestReview,
    handleRevokeReview,
    handleReview
  };
}