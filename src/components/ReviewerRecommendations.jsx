import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
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
        const reviewerRef = doc(db, 'reviewers', currentUser.uid);
        const reviewerSnap = await getDoc(reviewerRef);

        if (!reviewerSnap.exists()) {
          console.warn('Reviewer profile not found');
          return;
        }

        const { expertiseTags = [] } = reviewerSnap.data();
        const expertiseValues = expertiseTags.map(tag => tag?.value || tag);

        const listingsSnap = await getDocs(collection(db, 'research-listings'));

        const matches = [];

        listingsSnap.forEach(docSnap => {
          const data = docSnap.data();
          const rawTags = Array.isArray(data.tags) ? data.tags : [];
          const listingTags = rawTags.map(tag => tag?.value || tag);

          const hasMatch = expertiseValues.some(val => listingTags.includes(val));

          if (hasMatch) {
            matches.push({
              id: docSnap.id,
              title: data.title,
              summary: data.summary,
              collaboratorNeeds: data.collaboratorNeeds,
              createdAt: data.createdAt?.toDate().toLocaleString(),
              department: data.department,
              endDate: data.endDate,
              fundingInfo: data.fundingInfo,
              institution: data.institution,
              keywords: data.keywords,
              methodology: data.methodology,
              publicationLink: data.publicationLink,
              researchArea: data.researchArea,
              tags: rawTags,
              status: data.status,
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
      <section className="mt-5 d-flex flex-column align-items-center justify-content-center text-white">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading recommendations...</p>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return (
      <section className="mt-4 text-white text-center">
        <p>No matching research found based on your expertise.</p>
      </section>
    );
  }

  return (
    <section className="mt-4 px-3">
      <h3 className="text-white mb-3">Recommended Research</h3>

      <div className="row">
        {recommendations.map((rec) => (
          <div className="col-lg-4 col-md-6 col-sm-12" key={rec.id}>
            <article
              style={{
                backgroundColor: '#2F3C52',
                borderRadius: '1.25rem',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                padding: '1.5rem',
                margin: '1rem 0',
                color: '#FFFFFF',
                width: '100%',
                transition: 'transform 0.3s ease-in-out',
              }}
              className="recommendation-card"
              aria-label={`Recommended research titled ${rec.title}`}
            >
              <h5 style={{ fontWeight: '600', fontSize: '1.3rem', marginBottom: '1rem' }}>{rec.title}</h5>

              <div className="d-flex flex-wrap gap-2 mb-3">
                {rec.researchArea.split(',').map((area, i) => (
                  <span
                    key={i}
                    style={{
                      backgroundColor: '#415A77',
                      padding: '0.5rem 1rem',
                      borderRadius: '1rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {area.trim()}
                  </span>
                ))}
              </div>

              <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>{rec.summary}</p>
              <p><strong>Collaborator Needs:</strong> {rec.collaboratorNeeds}</p>
              <p><strong>Created At:</strong> {rec.createdAt}</p>
              <p><strong>Department:</strong> {rec.department}</p>
              <p><strong>End Date:</strong> {rec.endDate}</p>
              <p><strong>Funding Info:</strong> {rec.fundingInfo}</p>
              <p><strong>Institution:</strong> {rec.institution || 'Not Provided'}</p>
              <p><strong>Keywords:</strong> {rec.keywords}</p>
              <p><strong>Methodology:</strong> {rec.methodology}</p>
              <p>
                <strong>Publication Link:</strong>{' '}
                <a
                  href={rec.publicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#1E90FF',
                    textDecoration: 'none',
                    fontWeight: '500',
                  }}
                >
                  View Publication
                </a>
              </p>

              <div className="d-flex flex-wrap gap-2 mt-3">
                {rec.tags.map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      backgroundColor: '#009688',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '1.25rem',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      color: '#fff',
                    }}
                  >
                    {tag.label || tag.value || tag}
                  </span>
                ))}
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}
