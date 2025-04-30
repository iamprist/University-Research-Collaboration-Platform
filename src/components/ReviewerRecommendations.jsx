import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../pages/Reviewer/authContext';

export default function ReviewerRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!currentUser?.uid) return;

      try {
        // Get reviewer's expertiseTags
        const reviewerRef = doc(db, 'reviewers', currentUser.uid);
        const reviewerSnap = await getDoc(reviewerRef);

        if (!reviewerSnap.exists()) {
          console.warn('Reviewer profile not found');
          return;
        }

        const { expertiseTags = [] } = reviewerSnap.data();
        const expertiseValues = expertiseTags.map(tag => tag?.value || tag);


        // Get all research listings
        const listingsRef = collection(db, 'research-listings');
        const listingsSnap = await getDocs(listingsRef);

        const matches = [];


        //
        console.log("Expertise Values:", expertiseValues);
        //


        listingsSnap.forEach(docSnap => {
          const data = docSnap.data();
          const rawTags = Array.isArray(data.tags) ? data.tags : [];
          const listingTags = rawTags.map(tag => tag?.value || tag);



          //
          console.log(`Research "${data.title}" tags:`, listingTags);
          //



          // Check if any tag matches
          const hasMatch = expertiseValues.some(val => listingTags.includes(val));
          if (hasMatch) {
            matches.push({
              id: docSnap.id,
              title: data.title,
              summary: data.summary,
              tags: data.tags || [],
              researchArea: data.researchArea || '',
            });
          }
        });

        setRecommendations(matches);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentUser]);

  if (loading) {
    return (
      <section className="mt-4 text-white">
        <p>Loading recommendations...</p>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return (
      <section className="mt-4 text-white">
        <p>No matching research found based on your expertise.</p>
      </section>
    );
  }

  return (
    <section className="mt-4">
      <h3 className="text-white mb-3">🔍 Recommended Research</h3>
      {recommendations.map((rec) => (
        <article 
          key={rec.id} 
          className="bg-light text-dark p-3 mb-3 rounded shadow-sm"
          aria-label={`Recommended research titled ${rec.title}`}
        >
          <h5 className="mb-2">{rec.title}</h5>
          <p className="small text-muted mb-1">{rec.researchArea}</p>
          <p>{rec.summary}</p>
          <div className="d-flex flex-wrap gap-2 mt-2">
            {rec.tags.map((tag, i) => (
              <span key={i} className="badge bg-primary">{tag.label}</span>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
